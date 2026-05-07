import type { DriverRouteData, DriverRouteStopRow } from '@/lib/driverRoute';
import type { DriverStats, FuelReceipt, LeaveRequest } from '@/types';

export interface DriverApiContext {
  driverUserId: string;
  accessToken?: string;
}

export interface DriverApiResult {
  ok: boolean;
  queued?: boolean;
  id?: string;
  proofOfCollectionId?: string;
  clientMutationId?: string;
  clientProofId?: string;
  clientStopCompletionId?: string;
  queuedMutationId?: string;
  error?: string;
  unsupported?: boolean;
}

export interface UpdateStopStatusInput {
  clientMutationId?: string;
  clientStopCompletionId?: string;
  clientProofId?: string;
  stopId: string;
  routeId?: string;
  status: DriverRouteStopRow['status'];
  arrivedAt?: string | null;
  serviceStartedAt?: string | null;
  departedAt?: string | null;
  completedAt?: string | null;
  skippedAt?: string | null;
  skipReason?: string | null;
  driverNotes?: string | null;
  collectedOilKg?: number | null;
  proofOfCollectionId?: string | null;
  containersPicked?: Array<Record<string, unknown>>;
  containersDropped?: Array<Record<string, unknown>>;
  productsDelivered?: Array<Record<string, unknown>>;
}

export interface ProofOfCollectionInput {
  clientMutationId?: string;
  clientProofId?: string;
  userId: string;
  activityLogId?: string | null;
  visitRef?: string;
  customerName: string;
  netWeightKg: number;
  grossWeightKg?: number;
  tareWeightKg?: number;
  signatureDataUrl?: string | null;
  signerName?: string;
  photoDataUrls?: string[];
  containersPicked?: Array<Record<string, unknown>>;
  containersDropped?: Array<Record<string, unknown>>;
  notes?: string;
}

export interface DriverInventory {
  truckId?: string;
  emptyBins?: number;
  fullBins?: number;
  emptyBarrels60?: number;
  fullBarrels60?: number;
  emptyBarrels30?: number;
  fullBarrels30?: number;
  totalOilKg?: number;
  truckCapacityKg?: number;
  products?: Array<{
    id: string | number;
    name: string;
    quantity: number;
    unit?: string;
  }>;
}

export interface DriverMessage {
  id: string;
  text: string;
  sender: 'driver' | 'dispatcher' | 'system';
  timestamp: string;
  read: boolean;
  type?: 'text' | 'photo' | 'voice';
  mediaUrl?: string;
  visitId?: string | number;
}

export interface DriverExpense {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  status?: string;
  vendor?: string;
  paymentMethod?: string;
  hasReceipt?: boolean;
}

export interface SubmitExpenseInput {
  userId: string;
  category: string;
  amount: number;
  currency?: string;
  description?: string;
  receiptPhoto?: File | Blob | string | null;
  occurredAt?: string;
}

export interface DriverPerformanceData {
  stats: DriverStats | null;
  workLogs: Array<{
    date: string;
    day: string;
    start?: string;
    end?: string;
    breakMin: number;
    regularH: number;
    overtimeH: number;
    km: number;
    loginTime?: string;
  }>;
  periodData: Record<'week' | 'month' | 'year', { labels: string[]; oilKg: number[]; visits: number[] }>;
  monthlyVisitSuccess: Record<string, { assigned: number; completed: number; skipped: number }>;
  yearlyVisitSuccess: Record<string, { assigned: number; completed: number; skipped: number; overtimeH: number; regularH: number }>;
}

export interface FahrernachweisDayLog {
  date: string;
  status?: string;
  workStart?: string | null;
  workEnd?: string | null;
  breakMinutes?: number | null;
  driveMinutes?: number | null;
  totalWorkMinutes?: number | null;
  drivenKm?: number | null;
  startKm?: number | null;
  endKm?: number | null;
  notes?: string | null;
}

export interface DriverApi {
  getTodayRoute(context: DriverApiContext): Promise<DriverRouteData | null>;
  getRouteByDate(context: DriverApiContext, routeDate: string): Promise<DriverRouteData | null>;
  updateStopStatus(context: DriverApiContext, input: UpdateStopStatusInput): Promise<DriverApiResult>;
  submitProofOfCollection(input: ProofOfCollectionInput): Promise<DriverApiResult>;
  getInventory(context: DriverApiContext): Promise<DriverInventory | null>;
  getMessages(context: DriverApiContext): Promise<DriverMessage[]>;
  markMessageRead(context: DriverApiContext, messageId: string): Promise<DriverApiResult>;
  sendMessageReply(context: DriverApiContext, messageText: string): Promise<DriverApiResult>;
  getExpenses(context: DriverApiContext): Promise<{ fuel: FuelReceipt[]; vehicle: DriverExpense[]; misc: DriverExpense[] }>;
  submitExpense(context: DriverApiContext, input: SubmitExpenseInput): Promise<DriverApiResult>;
  getLeaveRequests(context: DriverApiContext): Promise<LeaveRequest[]>;
  submitLeaveRequest(context: DriverApiContext, input: Omit<LeaveRequest, 'id' | 'status' | 'createdAt' | 'documentUploaded'>): Promise<DriverApiResult>;
  getDriverPerformance(context: DriverApiContext): Promise<DriverPerformanceData>;
  getFahrernachweis(context: DriverApiContext): Promise<FahrernachweisDayLog[]>;
}
