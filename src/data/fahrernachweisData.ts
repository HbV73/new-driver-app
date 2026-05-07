export type DayStatus = 'worked' | 'sick' | 'vacation' | 'rest_day' | 'training';
export type OperationType = 'collection' | 'delivery' | 'inspection';
export type StopType = 'customer_visit' | 'warehouse' | 'home' | 'break' | 'suspicious' | 'transit';

export interface VisitLog {
  customerName: string;
  arrivalTime: string;
  departureTime: string;
  operationType: OperationType;
  stopType: StopType;
}

export interface DayLog {
  date: string;
  status: DayStatus;
  workStart?: string;
  workEnd?: string;
  totalWorkMinutes: number;
  driveMinutes: number;
  breakMinutes: number;
  warehouseMinutes: number;
  drivenKm: number;
  visits: VisitLog[];
  notes?: string;
  dailyHash?: string;
  editCount?: number;
}

// Work rules that can be configured
export interface WorkRules {
  maxDailyWorkMinutes: number;      // default 600 (10h)
  minBreakAfterMinutes: number;     // default 360 (6h) -> must take 30min
  requiredBreakMinutes: number;     // default 45
  maxDriveMinutes: number;          // default 540 (9h)
  geofenceRadiusMeters: number;     // default 100
  gpsJitterThresholdMeters: number; // default 20
}

export const DEFAULT_WORK_RULES: WorkRules = {
  maxDailyWorkMinutes: 600,
  minBreakAfterMinutes: 360,
  requiredBreakMinutes: 45,
  maxDriveMinutes: 540,
  geofenceRadiusMeters: 100,
  gpsJitterThresholdMeters: 20,
};

export function getWorkRules(): WorkRules {
  try {
    const saved = localStorage.getItem('fn-work-rules');
    if (saved) return { ...DEFAULT_WORK_RULES, ...JSON.parse(saved) };
  } catch {}
  return DEFAULT_WORK_RULES;
}

export function saveWorkRules(rules: WorkRules) {
  localStorage.setItem('fn-work-rules', JSON.stringify(rules));
}

// Simple hash for tamper detection
export function computeDayHash(log: DayLog): string {
  const data = `${log.date}|${log.status}|${log.workStart || ''}|${log.workEnd || ''}|${log.totalWorkMinutes}|${log.driveMinutes}|${log.breakMinutes}|${log.drivenKm}|${log.visits.length}`;
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36).padStart(8, '0');
}

// Offline cache
const CACHE_KEY = 'fn-offline-cache';

export function cacheLogsOffline(logs: DayLog[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      timestamp: Date.now(),
      logs,
    }));
  } catch {}
}

export function getOfflineLogs(): { logs: DayLog[]; timestamp: number } | null {
  try {
    const data = localStorage.getItem(CACHE_KEY);
    if (data) return JSON.parse(data);
  } catch {}
  return null;
}

const statusOptions: DayStatus[] = ['worked', 'worked', 'worked', 'worked', 'worked', 'rest_day', 'rest_day'];

const mockCustomers = [
  'Nice2meatyou – Grill & Lounge',
  'Happy Menü',
  'Bäckerei Ariana',
  'Urfa Lahmacun & Pide',
  'Sanku Maots\'ai',
  'Döner König',
  'Asia Palace',
];

const stopTypes: StopType[] = ['customer_visit', 'warehouse', 'transit', 'break', 'customer_visit', 'customer_visit'];

export function generateMock28Days(): DayLog[] {
  const logs: DayLog[] = [];
  const today = new Date();

  for (let i = 0; i < 29; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dayOfWeek = d.getDay();
    const dateStr = d.toISOString().split('T')[0];

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      const log: DayLog = {
        date: dateStr,
        status: 'rest_day',
        totalWorkMinutes: 0,
        driveMinutes: 0,
        breakMinutes: 0,
        warehouseMinutes: 0,
        drivenKm: 0,
        visits: [],
      };
      log.dailyHash = computeDayHash(log);
      logs.push(log);
      continue;
    }

    if (i === 7) {
      const log: DayLog = {
        date: dateStr,
        status: 'sick',
        totalWorkMinutes: 0,
        driveMinutes: 0,
        breakMinutes: 0,
        warehouseMinutes: 0,
        drivenKm: 0,
        visits: [],
      };
      log.dailyHash = computeDayHash(log);
      logs.push(log);
      continue;
    }

    if (i === 14) {
      const log: DayLog = {
        date: dateStr,
        status: 'vacation',
        totalWorkMinutes: 0,
        driveMinutes: 0,
        breakMinutes: 0,
        warehouseMinutes: 0,
        drivenKm: 0,
        visits: [],
      };
      log.dailyHash = computeDayHash(log);
      logs.push(log);
      continue;
    }

    const visitCount = 5 + Math.floor(Math.random() * 3);
    const visits: VisitLog[] = [];
    let hour = 8;
    let min = 0;

    // Add warehouse start
    visits.push({
      customerName: 'Lager Hannover',
      arrivalTime: '07:00',
      departureTime: '07:25',
      operationType: 'inspection',
      stopType: 'warehouse',
    });

    for (let v = 0; v < visitCount; v++) {
      const arrH = hour;
      const arrM = min;
      const duration = 15 + Math.floor(Math.random() * 20);
      min += duration;
      if (min >= 60) { hour++; min -= 60; }
      const depH = hour;
      const depM = min;
      min += 10 + Math.floor(Math.random() * 15);
      if (min >= 60) { hour++; min -= 60; }

      visits.push({
        customerName: mockCustomers[v % mockCustomers.length],
        arrivalTime: `${String(arrH).padStart(2, '0')}:${String(arrM).padStart(2, '0')}`,
        departureTime: `${String(depH).padStart(2, '0')}:${String(depM).padStart(2, '0')}`,
        operationType: 'collection',
        stopType: stopTypes[v % stopTypes.length],
      });
    }

    // Add break
    visits.push({
      customerName: 'Pause',
      arrivalTime: '12:00',
      departureTime: '12:45',
      operationType: 'inspection',
      stopType: 'break',
    });

    const totalWork = 420 + Math.floor(Math.random() * 120);
    const driveMin = 120 + Math.floor(Math.random() * 60);
    const breakMin = 45 + Math.floor(Math.random() * 15);
    const warehouseMin = 20 + Math.floor(Math.random() * 20);
    const km = 60 + Math.floor(Math.random() * 40);

    const log: DayLog = {
      date: dateStr,
      status: 'worked',
      workStart: `0${7 + Math.floor(Math.random() * 2)}:00`,
      workEnd: `${15 + Math.floor(Math.random() * 2)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
      totalWorkMinutes: totalWork,
      driveMinutes: driveMin,
      breakMinutes: breakMin,
      warehouseMinutes: warehouseMin,
      drivenKm: km,
      visits,
      notes: i === 3 ? 'Stau auf A2, 30 Min. Verspätung' : (i === 5 ? 'Kunde nicht anwesend bei Stop 3' : ''),
      editCount: 0,
    };
    log.dailyHash = computeDayHash(log);
    logs.push(log);
  }

  return logs;
}
