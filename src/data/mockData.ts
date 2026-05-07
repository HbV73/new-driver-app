import { Visit, Product, Container, DailySummary, DriverStats, RouteStop, Badge, WeeklyData, TruckInventory, WorkTimeEntry, FuelReceipt, DispatcherMessage } from '@/types';

// Customer container inventory — how many company containers each customer currently has
export const customerContainerInventory: Record<number, { containerId: string; type: string }[]> = {
  976: [
    { containerId: 'BIN-276', type: '240L Tonne' },
    { containerId: 'BIN-342', type: '240L Tonne' },
    { containerId: 'BIN-118', type: '240L Tonne' },
  ],
  452: [
    { containerId: 'BIN-501', type: '240L Tonne' },
    { containerId: 'BRL-060', type: '60L Fass' },
  ],
  378: [
    { containerId: 'BIN-220', type: '240L Tonne' },
  ],
  407: [
    { containerId: 'BIN-415', type: '240L Tonne' },
    { containerId: 'BIN-416', type: '240L Tonne' },
  ],
  794: [
    { containerId: 'BRL-033', type: '60L Fass' },
    { containerId: 'BRL-034', type: '60L Fass' },
    { containerId: 'BIN-600', type: '240L Tonne' },
  ],
};

export const mockVisits: Visit[] = [
  {
    id: 976,
    customerName: "Nice2meatyou – Grill & Lounge",
    address: "Waldweg 19, Hannover",
    contactPerson: "Yvonne Seddig",
    phone: "+49 511 1234567",
    contractPrice: 60,
    estimatedOilAmount: 50,
    minOilCollected: 50,
    status: 'completed',
    visitSource: 'scheduled',
    note: "276 und 342 gehört einem Chef",
    order: 1,
    scheduledTime: "08:30",
    completedAt: "08:52",
    collectedOilKg: 48,
  },
  {
    id: 452,
    customerName: "Happy Menü",
    address: "Schierholzstraße 12, Hannover",
    contactPerson: "Kherhat Adil Edo",
    phone: "+49 511 2345678",
    contractPrice: 60,
    estimatedOilAmount: 27,
    minOilCollected: 34,
    status: 'completed',
    visitSource: 'called',
    note: "Sie rufen an, wann immer es voll ist.",
    order: 2,
    scheduledTime: "09:15",
    completedAt: "09:38",
    collectedOilKg: 30,
  },
  {
    id: 378,
    customerName: "Bäckerei Ariana",
    address: "Engelbosteler Damm 27, Hannover",
    contactPerson: "Latif Grami",
    phone: "+49 511 3456789",
    contractPrice: 60,
    estimatedOilAmount: 4,
    minOilCollected: 34,
    status: 'in_progress',
    visitSource: 'auto_planned',
    bankUpdateRequired: true,
    note: "wenig Öl, Bitte die richtige E-Mail einholen",
    order: 3,
    scheduledTime: "10:00",
  },
  {
    id: 407,
    customerName: "Urfa Lahmacun & Pide",
    address: "Vahrenwalder Str. 58, Hannover",
    contactPerson: "Elif Güzel",
    phone: "+49 511 4567890",
    contractPrice: 60,
    estimatedOilAmount: 15,
    minOilCollected: 20,
    status: 'pending',
    visitSource: 'scheduled',
    bankUpdateRequired: true,
    order: 4,
    scheduledTime: "10:45",
  },
  {
    id: 794,
    customerName: "Sanku Maots'ai",
    address: "Kleine Burg 15, Hannover",
    contactPerson: "Jia Wu",
    phone: "+49 511 5678901",
    contractPrice: 60,
    estimatedOilAmount: 30,
    minOilCollected: 25,
    status: 'pending',
    visitSource: 'auto_planned',
    order: 5,
    scheduledTime: "11:30",
  },
  {
    id: 615,
    customerName: "Döner König",
    address: "Lister Meile 42, Hannover",
    contactPerson: "Mehmet Yilmaz",
    phone: "+49 511 6789012",
    contractPrice: 60,
    estimatedOilAmount: 20,
    minOilCollected: 18,
    status: 'pending',
    visitSource: 'prospect',
    order: 6,
    scheduledTime: "12:15",
  },
  {
    id: 823,
    customerName: "Asia Palace",
    address: "Georgstraße 8, Hannover",
    contactPerson: "Li Chen",
    phone: "+49 511 7890123",
    contractPrice: 60,
    estimatedOilAmount: 35,
    minOilCollected: 30,
    status: 'pending',
    visitSource: 'called',
    order: 7,
    scheduledTime: "13:00",
  },
];

export const mockProducts: Product[] = [
  { id: 1, name: "Remia Frittierfett long life 10 l", price: 22.49, unit: "Stück" },
  { id: 2, name: "Remia Salat Mayonnaise 10 kg", price: 18.99, unit: "Stück" },
  { id: 3, name: "Remia Tomaten Ketchup 10 kg", price: 15.99, unit: "Stück" },
  { id: 4, name: "Remia Frittierfett Maximum 10 l", price: 22.99, unit: "Stück" },
  { id: 5, name: "Remia Tomaten Ketchup Sticks (200 x 15ml)", price: 9.99, unit: "Box" },
];

export const mockContainers: Container[] = [
  { type: 'bin', label: 'Mülltonne', count: 3 },
  { type: 'barrel_60', label: 'Fass 60 KG', count: 0 },
  { type: 'barrel_30', label: 'Fass 30 KG', count: 1 },
];

export const mockDailySummary: DailySummary = {
  date: new Date().toISOString().split('T')[0],
  totalVisits: 7,
  completedVisits: 2,
  totalContainers: 24,
  totalProducts: 18,
  estimatedOilKg: 181,
  collectedOilKg: 78,
  cashCollected: 120,
  startTime: "08:00",
  estimatedEndTime: "14:30",
};

export const mockBadges: Badge[] = [
  { id: 'first_100', name: '100 kg Club', description: '100 kg Öl an einem Tag gesammelt', icon: '🏅', earned: true, earnedDate: '2026-03-20' },
  { id: 'streak_7', name: '7-Tage Streak', description: '7 Tage ohne Probleme', icon: '🔥', earned: true, earnedDate: '2026-03-18' },
  { id: 'speed_demon', name: 'Blitzschnell', description: 'Alle Besuche vor 12:00 erledigt', icon: '⚡', earned: true, earnedDate: '2026-03-15' },
  { id: 'first_1000', name: '1000 kg Legend', description: '1000 kg Öl in einem Monat', icon: '🏆', earned: false },
  { id: 'perfect_week', name: 'Perfekte Woche', description: 'Keine übersprungenen Besuche', icon: '⭐', earned: false },
  { id: 'top_driver', name: 'Top Fahrer', description: '#1 im Ranking', icon: '👑', earned: false },
];

export const mockWeeklyData: WeeklyData[] = [
  { day: 'Mo', oilKg: 145, visits: 12 },
  { day: 'Di', oilKg: 178, visits: 14 },
  { day: 'Mi', oilKg: 132, visits: 11 },
  { day: 'Do', oilKg: 195, visits: 15 },
  { day: 'Fr', oilKg: 160, visits: 13 },
  { day: 'Sa', oilKg: 78, visits: 7 },
  { day: 'So', oilKg: 0, visits: 0 },
];

export const mockDriverStats: DriverStats = {
  totalOilCollectedKg: 4280,
  totalVisitsCompleted: 342,
  currentStreak: 12,
  bestStreak: 21,
  badges: mockBadges,
  weeklyData: mockWeeklyData,
  rank: 3,
  totalDrivers: 12,
  points: 8450,
  level: 7,
  levelProgress: 0.65,
};

// Fixed coordinates for consistent route display
const visitCoords: [number, number][] = [
  [52.3895, 9.7180], // Nice2meatyou – Waldweg
  [52.3820, 9.7350], // Happy Menü – Schierholzstraße
  [52.3780, 9.7280], // Bäckerei Ariana – Engelbosteler Damm
  [52.3830, 9.7450], // Urfa Lahmacun – Vahrenwalder Str.
  [52.3710, 9.7320], // Sanku Maots'ai – Kleine Burg
  [52.3760, 9.7400], // Döner König – Lister Meile
  [52.3740, 9.7250], // Asia Palace – Georgstraße
];

// Warehouse / depot starting point
export const warehouseLocation = {
  lat: 52.3950,
  lng: 9.7100,
  label: 'Lager – Recycle Solution',
  address: 'Industrieweg 5, Hannover',
};

export const mockRouteStops: RouteStop[] = mockVisits.map((visit, i) => ({
  id: i + 1,
  visit,
  lat: visitCoords[i][0],
  lng: visitCoords[i][1],
  eta: visit.scheduledTime || '',
  distance: `${[3.2, 2.1, 1.8, 4.5, 3.7, 2.4, 2.8][i]} km`,
}));

export const mockTruckInventory: TruckInventory = {
  emptyBins: 12,
  fullBins: 4,
  emptyBarrels60: 3,
  fullBarrels60: 1,
  emptyBarrels30: 5,
  fullBarrels30: 2,
  products: [
    { product: mockProducts[0], quantity: 8 },
    { product: mockProducts[1], quantity: 4 },
    { product: mockProducts[2], quantity: 6 },
  ],
  totalOilKg: 78,
  truckCapacityKg: 1000,
};

export const mockWorkTime: WorkTimeEntry = {
  id: 'wt-001',
  date: new Date().toISOString().split('T')[0],
  startTime: '',
  breakMinutes: 0,
  totalKm: 0,
  startKm: 0,
  status: 'active',
};

export const mockFuelReceipts: FuelReceipt[] = [
  { id: 'fr-1', date: '2026-03-24', type: 'diesel', amount: 85.40, liters: 52.3, station: 'Shell Vahrenwalder Str.' },
  { id: 'fr-2', date: '2026-03-22', type: 'adblue', amount: 12.50, liters: 10.0, station: 'Aral Podbielskistraße' },
  { id: 'fr-3', date: '2026-03-20', type: 'diesel', amount: 92.10, liters: 56.8, station: 'Total Marienstraße' },
];

export const mockMessages: DispatcherMessage[] = [
  { id: 'm1', text: 'Guten Morgen! Heute 7 Besuche. Kunde #378 hat wenig Öl, bitte trotzdem anfahren.', sender: 'dispatcher', timestamp: '08:02', read: true, type: 'text' },
  { id: 'm2', text: 'Verstanden, bin unterwegs!', sender: 'driver', timestamp: '08:05', read: true, type: 'text' },
  { id: 'm3', text: 'Kunde #976 hat zusätzlich 2 Fässer bereitgestellt.', sender: 'dispatcher', timestamp: '08:45', read: true, type: 'text' },
  { id: 'm4', text: 'Danke, habe ich mitgenommen.', sender: 'driver', timestamp: '09:00', read: true, type: 'text' },
  { id: 'm5', text: 'Wie sieht es bei Happy Menü aus?', sender: 'dispatcher', timestamp: '09:20', read: false, type: 'text' },
];
