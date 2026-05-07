import { supabase } from '@/integrations/supabase/client';
import { sendPlatformEvent } from './platformSync';
import { createClientId } from './offlineSync/store';
import { enqueueSupabaseInsert, putFileMedia, shouldQueueForOffline } from './offlineSync/workflowQueue';

export type MiscCategory =
  | 'cleaning' | 'tools' | 'parking' | 'toll'
  | 'carwash' | 'food' | 'office' | 'safety' | 'other';

export type MiscStatus = 'pending' | 'approved' | 'rejected' | 'reimbursed';

export interface MiscExpense {
  id: string;
  user_id: string;
  expense_date: string;
  category: MiscCategory;
  description: string;
  amount: number;
  vat_percent: number;
  vendor: string;
  payment_method: string;
  receipt_photo_url: string | null;
  has_receipt: boolean;
  status: MiscStatus;
  admin_note: string;
  notes: string;
  created_at: string;
}

export interface CreateMiscExpenseInput {
  userId: string;
  category: MiscCategory;
  description: string;
  amount: number;
  vendor?: string;
  paymentMethod?: string;
  vatPercent?: number;
  hasReceipt?: boolean;
  receiptPhotoUrl?: string | null;
  receiptFile?: File | Blob | null;
  notes?: string;
  expenseDate?: string;
}

export async function createMiscExpense(input: CreateMiscExpenseInput) {
  const payload = {
    user_id: input.userId,
    expense_date: input.expenseDate ?? new Date().toISOString().slice(0, 10),
    category: input.category,
    description: input.description,
    amount: input.amount,
    vat_percent: input.vatPercent ?? 19,
    vendor: input.vendor ?? '',
    payment_method: input.paymentMethod ?? 'cash',
    has_receipt: input.hasReceipt ?? false,
    receipt_photo_url: input.receiptPhotoUrl ?? null,
    notes: input.notes ?? '',
    status: 'pending' as MiscStatus,
  };

  const queueExpense = async (error?: unknown) => {
    const clientExpenseId = createClientId('misc_expense');
    const mediaBindings: Array<{ mediaId: string; targetField: string; mode?: 'replace' | 'appendArray' }> = [];
    let remotePayload: Record<string, unknown> = {
      ...payload,
      has_receipt: payload.has_receipt || !!input.receiptFile,
    };

    if (input.receiptFile) {
      const media = await putFileMedia({
        userId: input.userId,
        file: input.receiptFile,
        kind: 'receipt',
        workflowId: clientExpenseId,
        clientMediaId: `${clientExpenseId}_receipt`,
        metadata: {
          category: input.category,
          amount: input.amount,
          description: input.description,
        },
      });
      mediaBindings.push({ mediaId: media.id, targetField: 'receipt_photo_url' });
      remotePayload = { ...remotePayload, receipt_photo_url: null };
    }

    const mutation = await enqueueSupabaseInsert({
      userId: input.userId,
      workflowType: 'expense',
      entityType: 'miscExpense',
      table: 'misc_expenses',
      entityId: clientExpenseId,
      remotePayload,
      mediaBindings,
    });

    return {
      synced: false,
      queued: true,
      id: mutation.entityId,
      error: error instanceof Error ? error.message : undefined,
    };
  };

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return queueExpense();
  }

  if (input.receiptFile && !payload.receipt_photo_url) {
    payload.receipt_photo_url = await uploadReceiptPhoto(input.userId, input.receiptFile);
    if (!payload.receipt_photo_url) {
      return queueExpense(new Error('Receipt upload failed'));
    }
    payload.has_receipt = true;
  }

  let result;
  try {
    const insert = await supabase
      .from('misc_expenses')
      .insert(payload as never)
      .select('id')
      .single();
    if (insert.error) throw insert.error;
    result = { synced: true, queued: false, id: (insert.data as { id?: string } | null)?.id };
  } catch (error) {
    if (!shouldQueueForOffline(error)) throw error;
    result = await queueExpense(error);
  }

  if (result.synced) {
    void sendPlatformEvent('misc_expense_added', payload.expense_date, {
      category: input.category,
      amount: input.amount,
      description: input.description,
      vendor: input.vendor,
      has_receipt: input.hasReceipt,
    });
  }

  return result;
}

export async function listMiscExpenses(userId: string, limit = 50): Promise<MiscExpense[]> {
  const { data, error } = await supabase
    .from('misc_expenses')
    .select('*')
    .eq('user_id', userId)
    .order('expense_date', { ascending: false })
    .limit(limit);
  if (error) {
    console.warn('[miscExpenses] list failed', error);
    return [];
  }
  return (data ?? []) as MiscExpense[];
}

export async function uploadReceiptPhoto(userId: string, file: File | Blob): Promise<string | null> {
  const ext = file instanceof File ? file.name.split('.').pop() ?? 'jpg' : file.type.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg';
  const path = `${userId}/misc-receipts/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('compliance-media').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) {
    console.warn('[miscExpenses] upload failed', error);
    return null;
  }
  return path;
}
