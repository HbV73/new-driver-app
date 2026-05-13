import type {
  DriverApi,
  DriverApiContext,
  DriverApiResult,
  DriverInventory,
  DriverMessage,
  ProofOfCollectionInput,
  SubmitExpenseInput,
  UpdateStopStatusInput,
} from './types';
import {
  normalizeRoute,
  type DriverRouteStopRow,
  type DriverRouteWithStopsRow,
} from '@/lib/driverRoute';
import { getSecure } from '@/lib/security/secureStorage';

const baseUrl = import.meta.env.VITE_DRIVER_API_BASE_URL;

function notImplemented(operation: string): never {
  throw new Error(
    `REST Driver API adapter is selected but ${operation} is not implemented yet. ` +
      `Set VITE_DRIVER_API_PROVIDER=supabase until the backend is available.`,
  );
}

function ensureBaseUrl() {
  if (!baseUrl) {
    throw new Error('VITE_DRIVER_API_BASE_URL is required when VITE_DRIVER_API_PROVIDER=rest.');
  }
}

type ApiEnvelope<T> = {
  status?: boolean;
  message?: string;
  data?: T;
  code?: number;
};

type BackendVisit = {
  id: number;
  driver_id?: number | null;
  customer_id?: number | null;
  scheduled_date: string;
  status: string;
  notes?: string | null;
  route_stop_index?: number | null;
  has_execution?: boolean;
  created_at?: string | null;
  updated_at?: string | null;
};

const REST_ACCESS_TOKEN_KEY = 'rs_rest_access_token';
const latestProofByUserId = new Map<string, {
  id: string;
  notes?: string;
  netWeightKg?: number;
  signaturePath?: string | null;
  photoPaths?: string[];
  at: number;
}>();

function trimSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

function mapVisitStatusToStopStatus(status: string): DriverRouteStopRow['status'] {
  switch (status) {
    case 'completed':
      return 'completed';
    case 'in_progress':
      return 'in_progress';
    case 'arrived':
      return 'arrived';
    case 'failed':
    case 'no_show':
      return 'skipped';
    case 'cancelled':
      return 'cancelled';
    case 'assigned':
    default:
      return 'pending';
  }
}

function toRouteStop(visit: BackendVisit, order: number): DriverRouteStopRow {
  const stopId = String(visit.id);
  const status = mapVisitStatusToStopStatus(visit.status);
  const scheduledDate = visit.scheduled_date;
  return {
    id: stopId,
    route_id: `rest-route-${scheduledDate}`,
    stop_order: visit.route_stop_index ?? order + 1,
    status,
    stop_type: 'customer_visit',
    visit_source: 'scheduled',
    external_ref: String(visit.id),
    customer_name: `Customer #${visit.customer_id ?? visit.id}`,
    customer_ref: visit.customer_id ? String(visit.customer_id) : null,
    customer_tier: null,
    address: '',
    contact_person: null,
    contact_phone: null,
    contract_price: null,
    lat: null,
    lng: null,
    scheduled_time: null,
    planned_arrival_at: null,
    planned_departure_at: null,
    arrived_at: status === 'arrived' ? visit.updated_at ?? null : null,
    service_started_at: status === 'in_progress' ? visit.updated_at ?? null : null,
    departed_at: status === 'completed' ? visit.updated_at ?? null : null,
    completed_at: status === 'completed' ? visit.updated_at ?? null : null,
    skipped_at: status === 'skipped' ? visit.updated_at ?? null : null,
    skip_reason: status === 'skipped' ? visit.notes ?? 'backend_visit_not_completed' : null,
    estimated_oil_kg: null,
    minimum_oil_kg: null,
    collected_oil_kg: null,
    proof_of_collection_id: null,
    bank_update_required: false,
    customer_notes: visit.notes ?? null,
    admin_notes: null,
    containers_expected: [],
    containers_picked: [],
    containers_dropped: [],
    products_expected: [],
    products_delivered: [],
    created_at: visit.created_at ?? null,
    updated_at: visit.updated_at ?? null,
  } as DriverRouteStopRow;
}

async function resolveAccessToken(context: DriverApiContext): Promise<string> {
  if (context.accessToken) return context.accessToken;
  const stored = await getSecure(REST_ACCESS_TOKEN_KEY);
  if (stored) return stored;
  throw new Error('REST provider requires access token in DriverApiContext.');
}

async function dataUrlToBlob(dataUrl: string): Promise<{ blob: Blob; mimeType: string; extension: string }> {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const mimeType = blob.type || dataUrl.match(/^data:([^;]+)/)?.[1] || 'image/png';
  const extension = mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'png';
  return { blob, mimeType, extension };
}

async function requestJson<T>(
  context: DriverApiContext,
  path: string,
  init?: { method?: 'GET' | 'POST' | 'PATCH'; body?: Record<string, unknown> },
): Promise<T> {
  ensureBaseUrl();
  const accessToken = await resolveAccessToken(context);

  const response = await fetch(`${trimSlash(baseUrl!)}/${path.replace(/^\/+/, '')}`, {
    method: init?.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: init?.body ? JSON.stringify(init.body) : undefined,
  });

  const body = (await response.json().catch(() => ({}))) as ApiEnvelope<T>;
  if (!response.ok || body.status === false) {
    const message = typeof body.message === 'string' ? body.message : `Request failed (${response.status})`;
    throw new Error(message);
  }
  return body.data as T;
}

async function uploadVisitMedia(
  context: DriverApiContext,
  visitId: number,
  dataUrl: string,
  stage: 'completion' | 'collection' | 'arrival',
  filenamePrefix: string,
): Promise<string | null> {
  ensureBaseUrl();
  const accessToken = await resolveAccessToken(context);
  const { blob, mimeType, extension } = await dataUrlToBlob(dataUrl);
  const file = new File([blob], `${filenamePrefix}.${extension}`, { type: mimeType });
  const form = new FormData();
  form.append('file', file);

  const response = await fetch(
    `${trimSlash(baseUrl!)}/api/v1/visits/${visitId}/media/upload?stage=${stage}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: form,
    },
  );

  const body = (await response.json().catch(() => ({}))) as ApiEnvelope<{ storage_path?: string }>;
  if (!response.ok || body.status === false) {
    return null;
  }
  return body.data?.storage_path ?? null;
}

async function fetchRouteByDate(context: DriverApiContext, routeDate: string) {
  const encodedDate = encodeURIComponent(routeDate);
  const routeDay = await requestJson<{ id: number | null; driver_id: number; scheduled_date: string; stops: Array<{ visit_id: number | null; stop_index: number }> }>(
    context,
    `api/v1/visits/route-day?driver_id=${encodeURIComponent(context.driverUserId)}&scheduled_date=${encodedDate}`,
  );

  const visitsPayload = await requestJson<{ items?: BackendVisit[] }>(
    context,
    `api/v1/visits?date_from=${encodedDate}&date_to=${encodedDate}&per_page=200&page=1`,
  );

  const visits = Array.isArray(visitsPayload?.items) ? visitsPayload.items : [];
  if (!routeDay?.id && visits.length === 0) return null;

  const byVisitId = new Map<number, BackendVisit>();
  visits.forEach((visit) => byVisitId.set(visit.id, visit));

  const orderedVisits: BackendVisit[] = [];
  const usedVisitIds = new Set<number>();

  for (const stop of routeDay?.stops ?? []) {
    if (!stop.visit_id) continue;
    const visit = byVisitId.get(stop.visit_id);
    if (!visit) continue;
    orderedVisits.push({ ...visit, route_stop_index: stop.stop_index });
    usedVisitIds.add(visit.id);
  }

  visits
    .filter((visit) => !usedVisitIds.has(visit.id))
    .sort((a, b) => (a.route_stop_index ?? 9999) - (b.route_stop_index ?? 9999))
    .forEach((visit) => orderedVisits.push(visit));

  const stops = orderedVisits.map((visit, index) => toRouteStop(visit, index));
  const route: DriverRouteWithStopsRow = {
    id: `rest-route-${routeDate}`,
    driver_user_id: String(context.driverUserId),
    route_date: routeDate,
    route_code: `REST-${routeDate}`,
    status: 'dispatched',
    planned_start_at: routeDate,
    planned_end_at: routeDate,
    start_address: null,
    start_lat: null,
    start_lng: null,
    end_address: null,
    estimated_total_oil_kg: null,
    collected_total_oil_kg: null,
    created_at: null,
    updated_at: null,
    driver_route_stops: stops,
  } as DriverRouteWithStopsRow;

  return normalizeRoute(route);
}

export const restDriverApi: DriverApi = {
  async getTodayRoute(context: DriverApiContext) {
    const today = new Date().toISOString().slice(0, 10);
    return fetchRouteByDate(context, today);
  },

  async getRouteByDate(context: DriverApiContext, routeDate: string) {
    return fetchRouteByDate(context, routeDate);
  },

  async updateStopStatus(context: DriverApiContext, input: UpdateStopStatusInput): Promise<DriverApiResult> {
    const visitId = Number.parseInt(String(input.stopId), 10);
    if (!Number.isFinite(visitId) || visitId <= 0) {
      throw new Error(`Invalid stop/visit id for REST backend: ${input.stopId}`);
    }

    const ensureStarted = async () => {
      try {
        await requestJson(context, `api/v1/visits/${visitId}/start`, { method: 'POST' });
      } catch (error) {
        const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
        // If already in_progress/terminal, backend may reject start with 409; continue.
        if (message.includes('requires status=assigned') || message.includes('409')) return;
        throw error;
      }
    };

    if (input.status === 'arrived' || input.status === 'in_progress') {
      await ensureStarted();
      return { ok: true };
    }

    if (input.status === 'completed') {
      await ensureStarted();
      const proof = latestProofByUserId.get(context.driverUserId);
      await requestJson(context, `api/v1/visits/${visitId}/complete`, {
        method: 'POST',
        body: {
          outcome: 'collected',
          collection_amount_kg: input.collectedOilKg ?? proof?.netWeightKg ?? null,
          payment_type: 'none',
          driver_note: input.driverNotes ?? proof?.notes ?? '',
          customer_signature_url: input.proofOfCollectionId ?? proof?.id ?? null,
        },
      });
      return { ok: true, proofOfCollectionId: input.proofOfCollectionId ?? proof?.id };
    }

    if (input.status === 'skipped') {
      await ensureStarted();
      const reason = (input.skipReason ?? '').toLowerCase();
      const isNoShow = reason.includes('no_show') || reason.includes('nnv') || reason.includes('not_home') || reason.includes('absent');
      if (isNoShow) {
        await requestJson(context, `api/v1/visits/${visitId}/no-show`, {
          method: 'POST',
          body: { driver_note: input.driverNotes ?? input.skipReason ?? '' },
        });
      } else {
        await requestJson(context, `api/v1/visits/${visitId}/fail`, {
          method: 'POST',
          body: {
            outcome_note: input.skipReason ?? 'failed_visit',
            driver_note: input.driverNotes ?? '',
          },
        });
      }
      return { ok: true };
    }

    if (input.status === 'pending') return { ok: true };

    return notImplemented(`updateStopStatus(${input.status})`);
  },

  async submitProofOfCollection(input: ProofOfCollectionInput): Promise<DriverApiResult> {
    const clientProofId = input.clientProofId ?? `proof_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const context: DriverApiContext = { driverUserId: input.userId };
    const visitId = Number.parseInt(String(input.visitRef ?? ''), 10);
    let signaturePath: string | null = null;
    const photoPaths: string[] = [];

    if (Number.isFinite(visitId) && visitId > 0) {
      if (input.signatureDataUrl) {
        signaturePath = await uploadVisitMedia(
          context,
          visitId,
          input.signatureDataUrl,
          'completion',
          `signature_${clientProofId}`,
        );
      }
      for (const [index, dataUrl] of (input.photoDataUrls ?? []).entries()) {
        const path = await uploadVisitMedia(
          context,
          visitId,
          dataUrl,
          'collection',
          `proof_${clientProofId}_${index}`,
        );
        if (path) photoPaths.push(path);
      }
    }

    latestProofByUserId.set(input.userId, {
      id: signaturePath ?? clientProofId,
      notes: input.notes,
      netWeightKg: input.netWeightKg,
      signaturePath,
      photoPaths,
      at: Date.now(),
    });

    return {
      ok: true,
      queued: false,
      id: signaturePath ?? clientProofId,
      proofOfCollectionId: signaturePath ?? clientProofId,
      clientProofId,
      clientMutationId: input.clientMutationId,
    };
  },

  async getInventory(_context: DriverApiContext): Promise<DriverInventory | null> {
    ensureBaseUrl();
    return notImplemented('getInventory');
  },

  async getMessages(_context: DriverApiContext): Promise<DriverMessage[]> {
    ensureBaseUrl();
    return notImplemented('getMessages');
  },

  async markMessageRead(_context: DriverApiContext, _messageId: string): Promise<DriverApiResult> {
    ensureBaseUrl();
    return notImplemented('markMessageRead');
  },

  async sendMessageReply(_context: DriverApiContext, _messageText: string): Promise<DriverApiResult> {
    ensureBaseUrl();
    return notImplemented('sendMessageReply');
  },

  async getExpenses(_context: DriverApiContext) {
    ensureBaseUrl();
    return notImplemented('getExpenses');
  },

  async submitExpense(_context: DriverApiContext, _input: SubmitExpenseInput): Promise<DriverApiResult> {
    ensureBaseUrl();
    return notImplemented('submitExpense');
  },

  async getLeaveRequests(_context: DriverApiContext) {
    ensureBaseUrl();
    return notImplemented('getLeaveRequests');
  },

  async submitLeaveRequest(_context: DriverApiContext, _input) {
    ensureBaseUrl();
    return notImplemented('submitLeaveRequest');
  },

  async getDriverPerformance(_context: DriverApiContext) {
    ensureBaseUrl();
    return notImplemented('getDriverPerformance');
  },

  async getFahrernachweis(_context: DriverApiContext) {
    ensureBaseUrl();
    return notImplemented('getFahrernachweis');
  },
};
