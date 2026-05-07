import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { sendPlatformEvent } from '@/lib/platformSync';
import { enqueueSupabaseInsert, putFileMedia, shouldQueueForOffline } from '@/lib/offlineSync/workflowQueue';

export type SignaturePurpose =
  | 'fresh_food_delivery'
  | 'oil_collection'
  | 'bin_handover'
  | 'damage_acknowledgement'
  | 'other';

export interface DeliverySignature {
  id: string;
  user_id: string;
  visit_ref: string | null;
  customer_name: string;
  purpose: SignaturePurpose;
  signer_name: string;
  signer_role: string | null;
  signature_data: string;
  items_summary: Array<{ label: string; qty?: number; price_eur?: number }>;
  total_amount_eur: number | null;
  notes: string | null;
  gps_lat: number | null;
  gps_lng: number | null;
  signed_at: string;
  created_at: string;
}

export interface DeliverySignatureInput {
  visit_ref?: string | null;
  customer_name: string;
  purpose: SignaturePurpose;
  signer_name: string;
  signer_role?: string;
  signature_data: string;
  items_summary?: Array<{ label: string; qty?: number; price_eur?: number }>;
  total_amount_eur?: number | null;
  notes?: string;
  gps_lat?: number | null;
  gps_lng?: number | null;
}

const today = () => new Date().toISOString().slice(0, 10);

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl);
  return response.blob();
}

export function useDeliverySignatures(visitRef?: string | null) {
  const [items, setItems] = useState<DeliverySignature[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setItems([]); setLoading(false); return; }
    let q = supabase.from('delivery_signatures').select('*').eq('user_id', user.id).order('signed_at', { ascending: false }).limit(50);
    if (visitRef) q = q.eq('visit_ref', visitRef);
    const { data } = await q;
    setItems((data ?? []) as unknown as DeliverySignature[]);
    setLoading(false);
  }, [visitRef]);

  useEffect(() => { void load(); }, [load]);

  const create = useCallback(async (input: DeliverySignatureInput) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('not authenticated');
    const row = {
      user_id: user.id,
      visit_ref: input.visit_ref ?? null,
      customer_name: input.customer_name,
      purpose: input.purpose,
      signer_name: input.signer_name,
      signer_role: input.signer_role ?? '',
      signature_data: input.signature_data,
      items_summary: input.items_summary ?? [],
      total_amount_eur: input.total_amount_eur ?? null,
      notes: input.notes ?? '',
      gps_lat: input.gps_lat ?? null,
      gps_lng: input.gps_lng ?? null,
    };
    const queueSignature = async () => {
      const workflowId = `delivery_signature_${Date.now()}`;
      const media = await putFileMedia({
        userId: user.id,
        file: await dataUrlToBlob(input.signature_data),
        kind: 'signature',
        workflowId,
        clientMediaId: `${workflowId}_signature`,
      });
      const mutation = await enqueueSupabaseInsert({
        userId: user.id,
        workflowType: 'deliverySignature',
        entityType: 'deliverySignature',
        table: 'delivery_signatures',
        remotePayload: { ...row, signature_data: null },
        mediaBindings: [{ mediaId: media.id, targetField: 'signature_data' }],
      });
      await load();
      return { id: mutation.entityId, ...row, signed_at: new Date().toISOString(), created_at: new Date().toISOString() } as unknown as DeliverySignature;
    };

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return queueSignature();
    }

    let data: unknown = null;
    try {
      const result = await supabase.from('delivery_signatures').insert(row as never).select().single();
      if (result.error) throw result.error;
      data = result.data;
    } catch (error) {
      if (!shouldQueueForOffline(error)) throw error;
      return queueSignature();
    }
    void sendPlatformEvent('delivery_signature', today(), { id: (data as { id: string }).id, ...row });
    await load();
    return data as unknown as DeliverySignature;
  }, [load]);

  return { items, loading, create, reload: load };
}
