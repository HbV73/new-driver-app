import { restDriverApi } from './restDriverApi';
import { supabaseDriverApi } from './supabaseDriverApi';
import type { DriverApi } from './types';

export type DriverApiProvider = 'supabase' | 'rest';

function configuredProvider(): DriverApiProvider {
  const provider = import.meta.env.VITE_DRIVER_API_PROVIDER ?? 'supabase';
  return provider === 'rest' ? 'rest' : 'supabase';
}

export function getDriverApi(): DriverApi {
  return configuredProvider() === 'rest' ? restDriverApi : supabaseDriverApi;
}

export const driverApiProvider = configuredProvider();

export type {
  DriverApi,
  DriverApiContext,
  DriverApiResult,
  DriverInventory,
  DriverMessage,
  ProofOfCollectionInput,
  SubmitExpenseInput,
  UpdateStopStatusInput,
} from './types';
