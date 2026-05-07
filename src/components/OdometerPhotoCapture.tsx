import { useState } from 'react';
import { Camera, CheckCircle2, MapPin, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { cameraService, getCameraFailure } from '@/services/device/camera';
import { locationService } from '@/services/device/location';
import { enqueueMediaOnlyUpload, putFileMedia, shouldQueueForOffline } from '@/lib/offlineSync/workflowQueue';

interface CapturedPhoto {
  url: string;
  lat: number | null;
  lng: number | null;
  takenAt: string;
}

interface Props {
  label: string;
  hint?: string;
  folder: string; // e.g. "odometer" or "fuel"
  value?: string | null;
  onCaptured: (p: CapturedPhoto) => void;
  onClear?: () => void;
}

const getLocation = (): Promise<{ lat: number; lng: number } | null> =>
  locationService.getCurrentLocation({ enableHighAccuracy: true, timeout: 5000 }).then((location) => {
    if (!location) return null;
    return { lat: location.latitude, lng: location.longitude };
  });

const OdometerPhotoCapture = ({ label, hint, folder, value, onCaptured, onClear }: Props) => {
  const { t } = useLanguage();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value ?? null);

  const handleCapture = async () => {
    setUploading(true);
    try {
      const photo = await cameraService.capturePhoto({ filenamePrefix: folder });
      const file = await cameraService.toFile(photo, `${folder}-${Date.now()}`);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error('Auth error'); return; }

      const loc = await getLocation();
      const ext = photo.format || file.name.split('.').pop() || 'jpg';
      const path = `${user.id}/${folder}/${Date.now()}.${ext}`;
      const queuePhoto = async (error?: unknown) => {
        const workflowId = `${folder}_photo_${Date.now()}`;
        const media = await putFileMedia({
          userId: user.id,
          file,
          kind: 'photo',
          workflowId,
          clientMediaId: `${workflowId}_media`,
          metadata: { folder, label, lat: loc?.lat ?? null, lng: loc?.lng ?? null },
        });
        await enqueueMediaOnlyUpload({
          userId: user.id,
          workflowType: 'odometerPhoto',
          mediaIds: [media.id],
          entityId: workflowId,
          metadata: { folder, label, queuedBecause: error instanceof Error ? error.message : undefined },
        });
        const offlineUrl = photo.webPath ?? photo.uri ?? `offline-media:${media.id}`;
        setPreview(offlineUrl);
        onCaptured({
          url: `offline-media:${media.id}`,
          lat: loc?.lat ?? null,
          lng: loc?.lng ?? null,
          takenAt: new Date().toISOString(),
        });
        toast.success('Foto offline gespeichert');
      };

      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        await queuePhoto();
        return;
      }

      try {
        const { error: upErr } = await supabase.storage
          .from('compliance-media')
          .upload(path, file, { contentType: file.type, upsert: false });
        if (upErr) throw upErr;
        const { data: signed } = await supabase.storage
          .from('compliance-media')
          .createSignedUrl(path, 60 * 60 * 24 * 365);
        const url = signed?.signedUrl || path;
        setPreview(url);
        onCaptured({
          url,
          lat: loc?.lat ?? null,
          lng: loc?.lng ?? null,
          takenAt: new Date().toISOString(),
        });
        toast.success(t('photo.captured') || 'Foto gespeichert');
      } catch (error) {
        if (!shouldQueueForOffline(error)) throw error;
        await queuePhoto(error);
      }
    } catch (e) {
      const failure = getCameraFailure(e);
      if (failure.reason !== 'cancelled') {
        toast.error(failure.message);
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{label}</p>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
        {preview && (
          <div className="flex items-center gap-1 text-xs text-emerald-600">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <MapPin className="w-3.5 h-3.5" />
          </div>
        )}
      </div>

      {preview ? (
        <div className="relative">
          <img src={preview} alt={label} className="w-full max-h-48 object-cover rounded-lg" />
          {onClear && (
            <button
              onClick={() => { setPreview(null); onClear(); }}
              className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1"
              type="button"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-full h-12"
          disabled={uploading}
          onClick={handleCapture}
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Camera className="w-4 h-4 mr-2" />
          )}
          {uploading ? (t('photo.uploading') || 'Laedt hoch...') : (t('photo.take') || 'Foto aufnehmen')}
        </Button>
      )}
    </div>
  );
};

export default OdometerPhotoCapture;
