import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getDriverApi } from '@/services/driverApi';
import {
  calculateRouteSummary,
  toDailySummary,
  type DriverRouteData,
  type DriverRouteVisit,
} from '@/lib/driverRoute';
import { getRouteStopLocalState } from '@/lib/offlineSync/store';
import type { OfflineMutationStatus, RouteStopLocalState } from '@/lib/offlineSync/types';

export interface UseTodayRouteResult {
  routeData: DriverRouteData | null;
  route: DriverRouteData['route'] | null;
  stops: DriverRouteData['stops'];
  summary: DriverRouteData['summary'] | null;
  dailySummary: DriverRouteData['dailySummary'] | null;
  loading: boolean;
  error: string | null;
  isEmpty: boolean;
  routeDate: string;
  refresh: () => Promise<void>;
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function isVisibleLocalState(status?: OfflineMutationStatus) {
  return status === 'pending' || status === 'syncing' || status === 'failed' || status === 'blocked' || status === 'conflict';
}

function mapLocalStatus(status: string): DriverRouteVisit['status'] {
  if (status === 'completed') return 'completed';
  if (status === 'skipped' || status === 'cancelled') return 'skipped';
  if (status === 'arrived' || status === 'in_progress') return 'in_progress';
  return 'pending';
}

async function applyLocalStopState(routeData: DriverRouteData, driverUserId: string): Promise<DriverRouteData> {
  const stops = await Promise.all(routeData.stops.map(async (stop) => {
    let localState: RouteStopLocalState | null = null;
    try {
      localState = await getRouteStopLocalState(stop.id);
    } catch {
      localState = null;
    }

    if (!localState || localState.userId !== driverUserId || !isVisibleLocalState(localState.syncStatus)) {
      return stop;
    }

    const status = mapLocalStatus(localState.status);
    const sourceStatus = localState.status as DriverRouteVisit['sourceStatus'];
    const completedAt = localState.completedAt ?? stop.completedAt;
    const collectedOilKg = localState.collectedOilKg ?? stop.collectedOilKg;

    return {
      ...stop,
      status,
      sourceStatus,
      completedAt,
      collectedOilKg,
      containersPicked: localState.containersPicked ?? stop.containersPicked,
      containersDropped: localState.containersDropped ?? stop.containersDropped,
      productsDelivered: localState.productsDelivered ?? stop.productsDelivered,
      localSyncStatus: localState.syncStatus,
      localSyncError: localState.lastError,
      uiVisit: {
        ...stop.uiVisit,
        status,
        completedAt: completedAt ?? stop.uiVisit.completedAt,
        collectedOilKg,
        localSyncStatus: localState.syncStatus,
        localSyncError: localState.lastError,
      },
      raw: {
        ...stop.raw,
        status: sourceStatus,
        completed_at: completedAt ?? stop.raw.completed_at,
        collected_oil_kg: collectedOilKg ?? stop.raw.collected_oil_kg,
      },
    } satisfies DriverRouteVisit;
  }));

  const summary = calculateRouteSummary(routeData.route, stops);
  return {
    ...routeData,
    stops,
    summary,
    dailySummary: toDailySummary(routeData.route, summary),
  };
}

export async function fetchDriverRouteForDate(
  driverUserId: string,
  routeDate: string,
  accessToken?: string,
): Promise<DriverRouteData | null> {
  const routeData = await getDriverApi().getRouteByDate({ driverUserId, accessToken }, routeDate);
  return routeData ? applyLocalStopState(routeData, driverUserId) : null;
}

export function useTodayRoute(routeDate = todayIsoDate()): UseTodayRouteResult {
  const { user, session } = useAuth();
  const [routeData, setRouteData] = useState<DriverRouteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setRouteData(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const nextRoute = await fetchDriverRouteForDate(user.id, routeDate, session?.access_token);
      setRouteData(nextRoute);
    } catch (err) {
      setRouteData(null);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [routeDate, session?.access_token, user]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      await refresh();
      if (cancelled) return;
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [refresh]);

  return {
    routeData,
    route: routeData?.route ?? null,
    stops: routeData?.stops ?? [],
    summary: routeData?.summary ?? null,
    dailySummary: routeData?.dailySummary ?? null,
    loading,
    error,
    isEmpty: !loading && !error && !routeData,
    routeDate,
    refresh,
  };
}
