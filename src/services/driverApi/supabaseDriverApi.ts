import { supabase } from '@/integrations/supabase/client';
import { sendPlatformEvent } from '@/lib/platformSync';
import { awardPointsForVisit } from '@/hooks/usePerformance';
import { locationService } from '@/services/device/location';
import {
  createClientId,
  enqueueMutation,
  putMedia,
  upsertRouteStopLocalState,
} from '@/lib/offlineSync/store';
import {
  normalizeRoute,
  type DriverRouteWithStopsRow,
} from '@/lib/driverRoute';
import type {
  DriverApi,
  DriverApiContext,
  DriverApiResult,
  DriverExpense,
  DriverInventory,
  DriverMessage,
  DriverPerformanceData,
  FahrernachweisDayLog,
  ProofOfCollectionInput,
  SubmitExpenseInput,
  UpdateStopStatusInput,
} from './types';

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

const latestProofByUserId = new Map<string, { clientProofId: string; clientMutationId: string; at: number }>();

function shouldQueueForNetwork(error?: unknown): boolean {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return true;
  const message = error instanceof Error ? error.message : String(error ?? '');
  const normalized = message.toLowerCase();
  return [
    'failed to fetch',
    'networkerror',
    'network error',
    'network request failed',
    'load failed',
    'timeout',
    'connection',
    'offline',
  ].some((needle) => normalized.includes(needle));
}

async function uploadDataUrl(userId: string, prefix: string, dataUrl: string): Promise<string | null> {
  try {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const ext = blob.type.split('/')[1] ?? 'png';
    const path = `${userId}/poc/${Date.now()}-${prefix}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('compliance-media').upload(path, blob, {
      contentType: blob.type,
      upsert: false,
    });
    if (error) return null;
    return path;
  } catch {
    return null;
  }
}

async function dataUrlToBlob(dataUrl: string): Promise<{ blob: Blob; mimeType: string; format: string }> {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const mimeType = blob.type || dataUrl.match(/^data:([^;]+)/)?.[1] || 'image/png';
  const format = mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'png';
  return { blob, mimeType, format };
}

export const supabaseDriverApi: DriverApi = {
  async getTodayRoute(context) {
    return this.getRouteByDate(context, todayIsoDate());
  },

  async getRouteByDate(context: DriverApiContext, routeDate: string) {
    const { data, error } = await supabase
      .from('driver_routes')
      .select('*, driver_route_stops(*)')
      .eq('driver_user_id', context.driverUserId)
      .eq('route_date', routeDate)
      .neq('status', 'cancelled')
      .order('planned_start_at', { ascending: true, nullsFirst: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return normalizeRoute(data as DriverRouteWithStopsRow);
  },

  async updateStopStatus(context: DriverApiContext, input: UpdateStopStatusInput): Promise<DriverApiResult> {
    const {
      clientMutationId = createClientId('stop_mutation'),
      clientStopCompletionId = createClientId('stop_completion'),
      stopId,
      routeId,
      status,
      arrivedAt,
      serviceStartedAt,
      departedAt,
      completedAt,
      skippedAt,
      skipReason,
      driverNotes,
      collectedOilKg,
      proofOfCollectionId,
      containersPicked,
      containersDropped,
      productsDelivered,
    } = input;
    const latestProof = latestProofByUserId.get(context.driverUserId);
    const clientProofId = input.clientProofId
      ?? (proofOfCollectionId ? undefined : latestProof?.clientProofId);

    const patch = {
      status,
      arrived_at: arrivedAt,
      service_started_at: serviceStartedAt,
      departed_at: departedAt,
      completed_at: completedAt,
      skipped_at: skippedAt,
      skip_reason: skipReason,
      driver_notes: driverNotes,
      collected_oil_kg: collectedOilKg,
      proof_of_collection_id: proofOfCollectionId,
      containers_picked: containersPicked,
      containers_dropped: containersDropped,
      products_delivered: productsDelivered,
    };

    Object.keys(patch).forEach((key) => {
      if (patch[key as keyof typeof patch] === undefined) {
        delete patch[key as keyof typeof patch];
      }
    });

    const queueStopStatus = async (error?: unknown): Promise<DriverApiResult> => {
      const mutation = await enqueueMutation({
        userId: context.driverUserId,
        provider: 'supabase',
        workflowType: 'stopStatusUpdate',
        operation: 'update',
        entityType: 'driverRouteStop',
        entityId: stopId,
        clientMutationId,
        payload: {
          stopId,
          routeId,
          patch,
          input: {
            ...input,
            clientMutationId,
            clientStopCompletionId,
            clientProofId,
          },
        },
        dependencies: clientProofId
          ? [{ clientMutationId: latestProof?.clientMutationId, entityType: 'proofOfCollection', reason: 'route stop completion depends on queued proof' }]
          : [],
      });

      await upsertRouteStopLocalState({
        stopId,
        routeId,
        userId: context.driverUserId,
        status,
        syncStatus: 'pending',
        proofClientId: clientProofId,
        proofOfCollectionId,
        completionClientId: clientStopCompletionId,
        completedAt,
        collectedOilKg,
        containersPicked,
        containersDropped,
        productsDelivered,
        metadata: {
          skipReason,
          driverNotes,
        },
        lastMutationId: mutation.id,
        lastError: error instanceof Error ? error.message : error ? String(error) : undefined,
      });

      return {
        ok: true,
        queued: true,
        clientMutationId,
        clientStopCompletionId,
        clientProofId,
        proofOfCollectionId: proofOfCollectionId ?? undefined,
        queuedMutationId: mutation.id,
        error: error instanceof Error ? error.message : error ? String(error) : undefined,
      };
    };

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return queueStopStatus();
    }

    try {
      const { error } = await supabase
        .from('driver_route_stops')
        .update(patch as never)
        .eq('id', stopId);

      if (error) throw error;
      return { ok: true, queued: false, clientMutationId, clientStopCompletionId, clientProofId, proofOfCollectionId: proofOfCollectionId ?? undefined };
    } catch (error) {
      if (shouldQueueForNetwork(error)) {
        return queueStopStatus(error);
      }
      throw error;
    }
  },

  async submitProofOfCollection(input: ProofOfCollectionInput): Promise<DriverApiResult> {
    const clientMutationId = input.clientMutationId ?? createClientId('proof_mutation');
    const clientProofId = input.clientProofId ?? createClientId('proof');
    const today = new Date().toISOString().split('T')[0];
    let signaturePath: string | null = null;
    let photoPaths: string[] = [];

    if (navigator.onLine) {
      if (input.signatureDataUrl) {
        signaturePath = await uploadDataUrl(input.userId, 'sig', input.signatureDataUrl);
      }
      if (input.photoDataUrls?.length) {
        const uploads = await Promise.all(
          input.photoDataUrls.map((d, i) => uploadDataUrl(input.userId, `photo-${i}`, d)),
        );
        photoPaths = uploads.filter((p): p is string => !!p);
      }
    }

    const pos = await locationService.getCurrentLocation({
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 30_000,
    });

    const payload = {
      user_id: input.userId,
      activity_log_id: input.activityLogId ?? null,
      visit_ref: input.visitRef ?? null,
      customer_name: input.customerName,
      net_weight_kg: input.netWeightKg,
      gross_weight_kg: input.grossWeightKg ?? null,
      tare_weight_kg: input.tareWeightKg ?? null,
      signature_data: signaturePath ?? input.signatureDataUrl ?? null,
      signer_name: input.signerName ?? null,
      photo_urls: photoPaths,
      gps_lat: pos?.latitude ?? null,
      gps_lng: pos?.longitude ?? null,
      gps_accuracy_m: pos?.accuracy ?? null,
      containers_picked: input.containersPicked ?? [],
      containers_dropped: input.containersDropped ?? [],
      notes: input.notes ?? '',
      collected_at: new Date().toISOString(),
    };

    let proofOfCollectionId: string | undefined;

    const queueProof = async (error?: unknown): Promise<DriverApiResult> => {
      const mediaIds: string[] = [];
      const queuedPayload = {
        ...payload,
        signature_data: signaturePath,
        photo_urls: photoPaths,
      };

      if (input.signatureDataUrl) {
        const { blob, mimeType, format } = await dataUrlToBlob(input.signatureDataUrl);
        const media = await putMedia({
          userId: input.userId,
          kind: 'signature',
          workflowId: clientProofId,
          clientMediaId: `${clientProofId}_signature`,
          blob,
          mimeType,
          format,
          sizeBytes: blob.size,
          capturedAt: new Date().toISOString(),
          metadata: { proofClientId: clientProofId },
        });
        mediaIds.push(media.id);
      }

      if (input.photoDataUrls?.length) {
        const mediaRecords = await Promise.all(
          input.photoDataUrls.map(async (dataUrl, index) => {
            const { blob, mimeType, format } = await dataUrlToBlob(dataUrl);
            return putMedia({
              userId: input.userId,
              kind: 'photo',
              workflowId: clientProofId,
              clientMediaId: `${clientProofId}_photo_${index}`,
              blob,
              mimeType,
              format,
              sizeBytes: blob.size,
              capturedAt: new Date().toISOString(),
              metadata: { proofClientId: clientProofId, index },
            });
          }),
        );
        mediaIds.push(...mediaRecords.map((media) => media.id));
      }

      const mutation = await enqueueMutation({
        userId: input.userId,
        provider: 'supabase',
        workflowType: 'proofOfCollection',
        operation: 'create',
        entityType: 'proofOfCollection',
        entityId: clientProofId,
        clientMutationId,
        mediaIds,
        payload: {
          clientProofId,
          remotePayload: queuedPayload,
          input: {
            ...input,
            signatureDataUrl: input.signatureDataUrl ? '__offline_media__' : input.signatureDataUrl,
            photoDataUrls: input.photoDataUrls?.length ? ['__offline_media__'] : input.photoDataUrls,
            clientMutationId,
            clientProofId,
          },
        },
      });

      latestProofByUserId.set(input.userId, { clientProofId, clientMutationId, at: Date.now() });

      return {
        ok: true,
        queued: true,
        clientMutationId,
        clientProofId,
        queuedMutationId: mutation.id,
        error: error instanceof Error ? error.message : error ? String(error) : undefined,
      };
    };

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      void sendPlatformEvent('incident_report', today, {
        kind: 'proof_of_collection',
        customer_name: input.customerName,
        net_weight_kg: input.netWeightKg,
        has_signature: !!payload.signature_data,
        photo_count: photoPaths.length,
        gps: pos ? { lat: pos.latitude, lng: pos.longitude } : null,
        queued: true,
        client_proof_id: clientProofId,
      }).catch(() => undefined);
      return queueProof();
    }

    try {
        const { data, error } = await supabase
          .from('proof_of_collection')
          .insert(payload as never)
          .select('id')
          .single();

        if (error) throw error;
        proofOfCollectionId = data?.id;
      } catch (error) {
        if (shouldQueueForNetwork(error)) {
          void sendPlatformEvent('incident_report', today, {
            kind: 'proof_of_collection',
            customer_name: input.customerName,
            net_weight_kg: input.netWeightKg,
            has_signature: !!payload.signature_data,
            photo_count: photoPaths.length,
            gps: pos ? { lat: pos.latitude, lng: pos.longitude } : null,
            queued: true,
            client_proof_id: clientProofId,
          }).catch(() => undefined);
          return queueProof(error);
        }
        throw error;
      }

    void sendPlatformEvent('incident_report', today, {
      kind: 'proof_of_collection',
      customer_name: input.customerName,
      net_weight_kg: input.netWeightKg,
      has_signature: !!payload.signature_data,
      photo_count: photoPaths.length,
      gps: pos ? { lat: pos.latitude, lng: pos.longitude } : null,
      client_proof_id: clientProofId,
    }).catch(() => undefined);

    void awardPointsForVisit(input.userId, {
      oilKg: input.netWeightKg || 0,
      onTime: true,
    }).catch(() => undefined);

    return {
      ok: true,
      queued: false,
      id: proofOfCollectionId,
      proofOfCollectionId,
      clientMutationId,
      clientProofId,
    };
  },

  async getInventory(_context: DriverApiContext): Promise<DriverInventory | null> {
    return null;
  },

  async getMessages(context: DriverApiContext): Promise<DriverMessage[]> {
    const { data, error } = await supabase
      .from('driver_notifications')
      .select('*')
      .eq('user_id', context.driverUserId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    return (data ?? []).map((row) => ({
      id: row.id,
      text: row.title ?? row.body ?? '',
      sender: row.kind === 'system' ? 'system' : 'dispatcher',
      timestamp: row.created_at,
      read: Boolean(row.read),
      type: 'text',
    }));
  },

  async markMessageRead(context: DriverApiContext, messageId: string): Promise<DriverApiResult> {
    const { error } = await supabase
      .from('driver_notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('id', messageId)
      .eq('user_id', context.driverUserId);

    if (error) throw error;
    return { ok: true };
  },

  async sendMessageReply(_context: DriverApiContext, _messageText: string): Promise<DriverApiResult> {
    return { ok: false, unsupported: true };
  },

  async getExpenses(context: DriverApiContext): Promise<{ fuel: []; vehicle: DriverExpense[]; misc: DriverExpense[] }> {
    const { data, error } = await supabase
      .from('misc_expenses')
      .select('*')
      .eq('user_id', context.driverUserId)
      .order('expense_date', { ascending: false })
      .limit(100);

    if (error) throw error;

    const misc = (data ?? []).map((row): DriverExpense => ({
      id: row.id,
      date: row.expense_date,
      category: row.category,
      description: row.description,
      amount: Number(row.amount),
      status: row.status,
      vendor: row.vendor ?? undefined,
      paymentMethod: row.payment_method ?? undefined,
      hasReceipt: row.has_receipt,
    }));

    return { fuel: [], vehicle: [], misc };
  },

  async submitExpense(context: DriverApiContext, input: SubmitExpenseInput): Promise<DriverApiResult> {
    const { error } = await supabase
      .from('misc_expenses')
      .insert({
        user_id: context.driverUserId,
        category: input.category,
        amount: input.amount,
        currency: input.currency ?? 'EUR',
        description: input.description ?? null,
        occurred_at: input.occurredAt ?? new Date().toISOString(),
      } as never);

    if (error) throw error;
    return { ok: true };
  },

  async getLeaveRequests(_context: DriverApiContext) {
    return [];
  },

  async submitLeaveRequest(_context: DriverApiContext, _input) {
    return { ok: false, unsupported: true };
  },

  async getDriverPerformance(context: DriverApiContext): Promise<DriverPerformanceData> {
    const [performanceResult, routesResult, activityResult] = await Promise.all([
      supabase
        .from('driver_performance')
        .select('*')
        .eq('user_id', context.driverUserId)
        .maybeSingle(),
      supabase
        .from('driver_routes')
        .select('route_date, estimated_total_oil_kg, collected_total_oil_kg, driver_route_stops(status, collected_oil_kg)')
        .eq('driver_user_id', context.driverUserId)
        .order('route_date', { ascending: false })
        .limit(90),
      supabase
        .from('driver_activity_logs')
        .select('*')
        .eq('user_id', context.driverUserId)
        .order('log_date', { ascending: false })
        .limit(28),
    ]);

    if (performanceResult.error) throw performanceResult.error;
    if (routesResult.error) throw routesResult.error;
    if (activityResult.error) throw activityResult.error;

    const perf = performanceResult.data;
    const stats = perf
      ? {
          totalOilCollectedKg: Number(perf.total_oil_kg ?? 0),
          totalVisitsCompleted: Number(perf.total_visits ?? 0),
          currentStreak: Number(perf.current_streak_days ?? 0),
          bestStreak: Number(perf.best_streak_days ?? 0),
          badges: Array.isArray(perf.badges) ? perf.badges as never : [],
          weeklyData: [],
          rank: 0,
          totalDrivers: 0,
          points: Number(perf.total_points ?? 0),
          level: Number(perf.level ?? 1),
          levelProgress: Math.min(1, (Number(perf.total_points ?? 0) % 1000) / 1000),
        }
      : null;

    const routes = routesResult.data ?? [];
    const weekLabels = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
    const week = { labels: weekLabels, oilKg: Array(7).fill(0), visits: Array(7).fill(0) };
    const month = { labels: ['W1', 'W2', 'W3', 'W4'], oilKg: Array(4).fill(0), visits: Array(4).fill(0) };
    const year = { labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'], oilKg: Array(12).fill(0), visits: Array(12).fill(0) };

    const now = new Date();
    routes.forEach((route) => {
      const date = new Date(route.route_date);
      const oil = Number(route.collected_total_oil_kg ?? route.estimated_total_oil_kg ?? 0);
      const stops = Array.isArray(route.driver_route_stops) ? route.driver_route_stops : [];
      const completed = stops.filter((stop) => stop.status === 'completed').length;

      if ((now.getTime() - date.getTime()) / 86_400_000 < 7) {
        const day = (date.getDay() + 6) % 7;
        week.oilKg[day] += oil;
        week.visits[day] += completed;
      }
      if (date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()) {
        const bucket = Math.min(3, Math.floor((date.getDate() - 1) / 7));
        month.oilKg[bucket] += oil;
        month.visits[bucket] += completed;
      }
      if (date.getFullYear() === now.getFullYear()) {
        year.oilKg[date.getMonth()] += oil;
        year.visits[date.getMonth()] += completed;
      }
    });

    const workLogs = (activityResult.data ?? []).map((row) => {
      const date = new Date(row.log_date);
      const regularMinutes = Math.min(row.total_work_minutes ?? 0, 8 * 60);
      const overtimeMinutes = Math.max(0, (row.total_work_minutes ?? 0) - 8 * 60);
      return {
        date: date.toLocaleDateString('de-DE'),
        day: date.toLocaleDateString('de-DE', { weekday: 'short' }),
        start: row.work_start?.slice(0, 5),
        end: row.work_end?.slice(0, 5),
        breakMin: row.break_minutes ?? 0,
        regularH: Math.round((regularMinutes / 60) * 100) / 100,
        overtimeH: Math.round((overtimeMinutes / 60) * 100) / 100,
        km: Number(row.driven_km ?? 0),
        loginTime: row.work_start?.slice(0, 5),
      };
    });

    return {
      stats,
      workLogs,
      periodData: { week, month, year },
      monthlyVisitSuccess: {},
      yearlyVisitSuccess: {},
    };
  },

  async getFahrernachweis(context: DriverApiContext): Promise<FahrernachweisDayLog[]> {
    const { data, error } = await supabase
      .from('driver_activity_logs')
      .select('*')
      .eq('user_id', context.driverUserId)
      .order('log_date', { ascending: false })
      .limit(28);

    if (error) throw error;

    return (data ?? []).map((row) => ({
      date: row.log_date,
      status: row.status,
      workStart: row.work_start,
      workEnd: row.work_end,
      breakMinutes: row.break_minutes,
      driveMinutes: row.drive_minutes,
      totalWorkMinutes: row.total_work_minutes,
      drivenKm: row.driven_km,
      startKm: row.start_km,
      endKm: row.end_km,
      notes: row.notes,
    }));
  },
};
