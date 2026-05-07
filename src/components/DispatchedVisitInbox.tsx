import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Phone, Check, X, AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDispatchedVisits } from '@/hooks/useDispatchedVisits';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

const priorityColors: Record<string, string> = {
  urgent: 'bg-destructive text-destructive-foreground',
  high: 'bg-orange-500 text-white',
  normal: 'bg-primary/20 text-primary',
  low: 'bg-muted text-muted-foreground',
};

export default function DispatchedVisitInbox() {
  const { visits, accept, reject } = useDispatchedVisits();
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  const pending = visits.filter((v) => v.status === 'pending');
  if (pending.length === 0) return null;

  return (
    <>
      <Card className="p-4 mb-4 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/30">
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle className="w-5 h-5 text-primary animate-pulse" />
          <h3 className="font-semibold">Neue Aufträge vom Disponenten</h3>
          <Badge variant="secondary" className="ml-auto">
            {pending.length}
          </Badge>
        </div>

        <AnimatePresence>
          {pending.map((v) => (
            <motion.div
              key={v.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="bg-card rounded-lg p-3 mb-2 border"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{v.customer_name}</span>
                    <Badge className={priorityColors[v.priority]}>
                      {v.priority}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                    <MapPin className="w-3 h-3" />
                    {v.address}
                  </div>
                  {v.contact_phone && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Phone className="w-3 h-3" />
                      {v.contact_phone}
                    </div>
                  )}
                  {v.scheduled_at && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Clock className="w-3 h-3" />
                      {new Date(v.scheduled_at).toLocaleString('de-DE')}
                    </div>
                  )}
                  {v.notes && <p className="text-xs mt-1">{v.notes}</p>}
                </div>
              </div>

              <div className="flex gap-2 mt-2">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => void accept(v.id)}
                >
                  <Check className="w-4 h-4 mr-1" />
                  Annehmen
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setRejectingId(v.id);
                    setReason('');
                  }}
                >
                  <X className="w-4 h-4 mr-1" />
                  Ablehnen
                </Button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </Card>

      <Dialog open={!!rejectingId} onOpenChange={(o) => !o && setRejectingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Auftrag ablehnen</DialogTitle>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Grund für Ablehnung (Pflicht)"
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectingId(null)}>
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              disabled={reason.trim().length < 3}
              onClick={() => {
                if (rejectingId) {
                  void reject(rejectingId, reason.trim());
                  setRejectingId(null);
                }
              }}
            >
              Ablehnen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
