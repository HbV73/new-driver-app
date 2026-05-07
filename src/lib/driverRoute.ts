import type { Tables } from '@/integrations/supabase/types';
import type { DailySummary, Visit, VisitSource } from '@/types';
import type { OfflineMutationStatus } from '@/lib/offlineSync/types';

export type DriverRouteRow = Tables<'driver_routes'>;
export type DriverRouteStopRow = Tables<'driver_route_stops'>;

export type DriverRouteWithStopsRow = DriverRouteRow & {
  driver_route_stops?: DriverRouteStopRow[] | null;
};

export type DriverVisitStatus = Visit['status'];

export interface DriverRouteVisit {
  id: string;
  routeId: string;
  uiId: number;
  stopOrder: number;
  status: DriverVisitStatus;
  sourceStatus: DriverRouteStopRow['status'];
  stopType: DriverRouteStopRow['stop_type'];
  visitSource: DriverRouteStopRow['visit_source'];
  customerName: string;
  customerRef?: string;
  customerTier?: string;
  address: string;
  contactPerson: string;
  phone: string;
  contractPrice: number;
  estimatedOilAmount: number;
  minOilCollected: number;
  collectedOilKg?: number;
  scheduledTime?: string;
  plannedArrivalAt?: string;
  plannedDepartureAt?: string;
  arrivedAt?: string;
  serviceStartedAt?: string;
  departedAt?: string;
  completedAt?: string;
  skippedAt?: string;
  skipReason?: string;
  lat?: number;
  lng?: number;
  bankUpdateRequired: boolean;
  note?: string;
  containersExpected: unknown[];
  containersPicked: unknown[];
  containersDropped: unknown[];
  productsExpected: unknown[];
  productsDelivered: unknown[];
  localSyncStatus?: OfflineMutationStatus;
  localSyncError?: string;
  uiVisit: Visit;
  raw: DriverRouteStopRow;
}

export interface DriverRouteSummary {
  date: string;
  routeCode: string;
  totalStops: number;
  completedStops: number;
  pendingStops: number;
  skippedStops: number;
  cancelledStops: number;
  estimatedOilKg: number;
  collectedOilKg: number;
  expectedContainers: number;
  pickedContainers: number;
  droppedContainers: number;
  expectedProducts: number;
  deliveredProducts: number;
  progressPercent: number;
  startTime?: string;
  estimatedEndTime?: string;
}

export interface DriverRouteData {
  route: DriverRouteRow;
  stops: DriverRouteVisit[];
  summary: DriverRouteSummary;
  dailySummary: DailySummary;
}

function toArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function toRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function toNumber(value: number | string | null | undefined, fallback = 0): number {
  if (value == null) return fallback;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toOptionalNumber(value: number | string | null | undefined): number | undefined {
  if (value == null) return undefined;
  const n = toNumber(value, Number.NaN);
  return Number.isFinite(n) ? n : undefined;
}

function quantityFromItem(item: unknown): number {
  const record = toRecord(item);
  if (!record) return 1;

  for (const key of ['qty', 'quantity', 'count', 'amount', 'delivered_qty', 'picked_qty', 'dropped_qty']) {
    const value = record[key];
    const quantity = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN;
    if (Number.isFinite(quantity) && quantity > 0) return quantity;
  }

  return 1;
}

function countItems(items: unknown[]): number {
  return items.reduce((sum, item) => sum + quantityFromItem(item), 0);
}

function toTime(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  if (/^\d{2}:\d{2}/.test(value)) return value.slice(0, 5);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

function mapStopStatus(status: DriverRouteStopRow['status']): DriverVisitStatus {
  if (status === 'completed') return 'completed';
  if (status === 'skipped' || status === 'cancelled') return 'skipped';
  if (status === 'arrived' || status === 'in_progress') return 'in_progress';
  return 'pending';
}

function mapVisitSource(source: DriverRouteStopRow['visit_source']): VisitSource {
  if (source === 'called' || source === 'auto_planned' || source === 'prospect' || source === 'scheduled') {
    return source;
  }
  if (source === 'dispatch_addon') return 'called';
  return 'scheduled';
}

function isCustomerStop(stop: DriverRouteVisit): boolean {
  return stop.stopType === 'customer_visit';
}

export function normalizeRouteStop(stop: DriverRouteStopRow): DriverRouteVisit {
  const status = mapStopStatus(stop.status);
  const scheduledTime = toTime(stop.scheduled_time) ?? toTime(stop.planned_arrival_at);
  const completedAt = toTime(stop.completed_at) ?? toTime(stop.departed_at);
  const estimatedOilAmount = toNumber(stop.estimated_oil_kg);
  const collectedOilKg = toOptionalNumber(stop.collected_oil_kg);
  const minOilCollected = toNumber(stop.minimum_oil_kg);
  const uiId = Number.parseInt(stop.external_ref ?? '', 10) || stop.stop_order;

  const uiVisit: Visit = {
    id: uiId,
    customerName: stop.customer_name,
    address: stop.address,
    contactPerson: stop.contact_person ?? '',
    phone: stop.contact_phone ?? '',
    contractPrice: toNumber(stop.contract_price),
    estimatedOilAmount,
    minOilCollected,
    status,
    visitSource: mapVisitSource(stop.visit_source),
    bankUpdateRequired: stop.bank_update_required,
    note: stop.customer_notes || stop.admin_notes || undefined,
    order: stop.stop_order,
    scheduledTime,
    completedAt,
    collectedOilKg,
  };

  return {
    id: stop.id,
    routeId: stop.route_id,
    uiId,
    stopOrder: stop.stop_order,
    status,
    sourceStatus: stop.status,
    stopType: stop.stop_type,
    visitSource: stop.visit_source,
    customerName: stop.customer_name,
    customerRef: stop.customer_ref ?? undefined,
    customerTier: stop.customer_tier ?? undefined,
    address: stop.address,
    contactPerson: stop.contact_person ?? '',
    phone: stop.contact_phone ?? '',
    contractPrice: toNumber(stop.contract_price),
    estimatedOilAmount,
    minOilCollected,
    collectedOilKg,
    scheduledTime,
    plannedArrivalAt: stop.planned_arrival_at ?? undefined,
    plannedDepartureAt: stop.planned_departure_at ?? undefined,
    arrivedAt: stop.arrived_at ?? undefined,
    serviceStartedAt: stop.service_started_at ?? undefined,
    departedAt: stop.departed_at ?? undefined,
    completedAt: stop.completed_at ?? undefined,
    skippedAt: stop.skipped_at ?? undefined,
    skipReason: stop.skip_reason ?? undefined,
    lat: stop.lat ?? undefined,
    lng: stop.lng ?? undefined,
    bankUpdateRequired: stop.bank_update_required,
    note: stop.customer_notes || stop.admin_notes || undefined,
    containersExpected: toArray(stop.containers_expected),
    containersPicked: toArray(stop.containers_picked),
    containersDropped: toArray(stop.containers_dropped),
    productsExpected: toArray(stop.products_expected),
    productsDelivered: toArray(stop.products_delivered),
    uiVisit,
    raw: stop,
  };
}

export function calculateRouteSummary(route: DriverRouteRow, stops: DriverRouteVisit[]): DriverRouteSummary {
  const customerStops = stops.filter(isCustomerStop);
  const totalStops = customerStops.length;
  const completedStops = customerStops.filter((stop) => stop.status === 'completed').length;
  const skippedStops = customerStops.filter((stop) => stop.sourceStatus === 'skipped').length;
  const cancelledStops = customerStops.filter((stop) => stop.sourceStatus === 'cancelled').length;
  const pendingStops = customerStops.filter((stop) => (
    stop.status === 'pending' || stop.status === 'in_progress'
  ) && stop.sourceStatus !== 'cancelled').length;
  const estimatedOilKg = customerStops.reduce((sum, stop) => sum + stop.estimatedOilAmount, 0);
  const collectedOilKg = customerStops.reduce((sum, stop) => sum + (stop.collectedOilKg ?? 0), 0);
  const expectedContainers = customerStops.reduce((sum, stop) => sum + countItems(stop.containersExpected), 0);
  const pickedContainers = customerStops.reduce((sum, stop) => sum + countItems(stop.containersPicked), 0);
  const droppedContainers = customerStops.reduce((sum, stop) => sum + countItems(stop.containersDropped), 0);
  const expectedProducts = customerStops.reduce((sum, stop) => sum + countItems(stop.productsExpected), 0);
  const deliveredProducts = customerStops.reduce((sum, stop) => sum + countItems(stop.productsDelivered), 0);
  const resolvedStops = completedStops + skippedStops + cancelledStops;
  const progressPercent = totalStops === 0 ? 0 : Math.round((resolvedStops / totalStops) * 100);

  return {
    date: route.route_date,
    routeCode: route.route_code,
    totalStops,
    completedStops,
    pendingStops,
    skippedStops,
    cancelledStops,
    estimatedOilKg,
    collectedOilKg,
    expectedContainers,
    pickedContainers,
    droppedContainers,
    expectedProducts,
    deliveredProducts,
    progressPercent,
    startTime: toTime(route.planned_start_at),
    estimatedEndTime: toTime(route.planned_end_at),
  };
}

export function toDailySummary(route: DriverRouteRow, summary: DriverRouteSummary): DailySummary {
  return {
    date: summary.date,
    totalVisits: summary.totalStops,
    completedVisits: summary.completedStops,
    totalContainers: summary.expectedContainers,
    totalProducts: summary.expectedProducts,
    estimatedOilKg: summary.estimatedOilKg || toNumber(route.estimated_total_oil_kg),
    collectedOilKg: summary.collectedOilKg || toNumber(route.collected_total_oil_kg),
    cashCollected: 0,
    startTime: summary.startTime,
    estimatedEndTime: summary.estimatedEndTime,
  };
}

export function normalizeRoute(row: DriverRouteWithStopsRow): DriverRouteData {
  const stops = [...(row.driver_route_stops ?? [])]
    .sort((a, b) => a.stop_order - b.stop_order)
    .map(normalizeRouteStop);
  const { driver_route_stops: _stops, ...route } = row;
  const summary = calculateRouteSummary(route, stops);

  return {
    route,
    stops,
    summary,
    dailySummary: toDailySummary(route, summary),
  };
}
