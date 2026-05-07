export type VisitSource = 'scheduled' | 'called' | 'auto_planned' | 'prospect';

export interface Visit {
  id: number;
  customerName: string;
  address: string;
  contactPerson: string;
  phone: string;
  contractPrice: number;
  estimatedOilAmount: number;
  minOilCollected: number;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  visitSource: VisitSource;
  bankUpdateRequired?: boolean;
  note?: string;
  order: number;
  scheduledTime?: string;
  completedAt?: string;
  collectedOilKg?: number;
  localSyncStatus?: 'pending' | 'syncing' | 'failed' | 'synced' | 'blocked' | 'conflict';
  localSyncError?: string;
  feedback?: VisitFeedback;
}

export interface VisitFeedback {
  photos: string[];
  voiceNote?: string;
  text?: string;
  sentAt?: string;
  readByDispatcher?: boolean;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  oldPrice?: number;
  unit: string;
  image?: string;
}

export interface Container {
  type: 'bin' | 'barrel_60' | 'barrel_30';
  label: string;
  count: number;
}

export interface TruckInventory {
  emptyBins: number;
  fullBins: number;
  emptyBarrels60: number;
  fullBarrels60: number;
  emptyBarrels30: number;
  fullBarrels30: number;
  products: { product: Product; quantity: number }[];
  totalOilKg: number;
  truckCapacityKg: number;
}

export interface DailySummary {
  date: string;
  totalVisits: number;
  completedVisits: number;
  totalContainers: number;
  totalProducts: number;
  estimatedOilKg: number;
  collectedOilKg: number;
  cashCollected: number;
  startTime?: string;
  estimatedEndTime?: string;
}

export interface DriverStats {
  totalOilCollectedKg: number;
  totalVisitsCompleted: number;
  currentStreak: number;
  bestStreak: number;
  badges: Badge[];
  weeklyData: WeeklyData[];
  rank: number;
  totalDrivers: number;
  points: number;
  level: number;
  levelProgress: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedDate?: string;
}

export interface WeeklyData {
  day: string;
  oilKg: number;
  visits: number;
}

export interface RouteStop {
  id: number;
  visit: Visit;
  lat: number;
  lng: number;
  eta: string;
  distance: string;
}

export interface WorkTimeEntry {
  id: string;
  date: string;
  startTime: string;
  endTime?: string;
  breakMinutes: number;
  totalKm: number;
  startKm: number;
  endKm?: number;
  status: 'active' | 'completed';
}

export interface FuelReceipt {
  id: string;
  date: string;
  type: 'diesel' | 'adblue';
  amount: number;
  liters: number;
  station: string;
  receiptPhoto?: string;
}

export interface DispatcherMessage {
  id: string;
  text: string;
  sender: 'driver' | 'dispatcher';
  timestamp: string;
  read: boolean;
  type: 'text' | 'photo' | 'voice';
  mediaUrl?: string;
  visitId?: number;
}

export interface LeaveRequest {
  id: string;
  type: 'vacation' | 'sick' | 'hourly';
  startDate: string;
  endDate: string;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  documentUploaded: boolean;
  documentUrl?: string;
  managerNote?: string;
  documentDeadline?: string;
  startTime?: string;
  endTime?: string;
}

export interface WeatherForecast {
  time: string;
  temp: number;
  condition: 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'stormy' | 'foggy';
  windKmh: number;
  icon: string;
}

export interface SafetyTip {
  id: string;
  title: string;
  message: string;
  icon: string;
  type: 'maintenance' | 'speed' | 'weather' | 'general';
  priority: 'low' | 'medium' | 'high';
}
