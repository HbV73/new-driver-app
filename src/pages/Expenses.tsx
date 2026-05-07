import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fuel, Plus, Camera, Download, Calendar, Droplets, Wrench, Lightbulb, Battery, Wind, Droplet, CircleDot, Disc, Package, Upload, Check, X, Sparkles, AlertTriangle } from 'lucide-react';
import { MiscExpensesTab } from '@/components/MiscExpensesTab';
import DamageReportsList from '@/components/DamageReportsList';
import AppHeader from '@/components/AppHeader';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FuelReceipt } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { getDriverApi, type DriverExpense } from '@/services/driverApi';
import { toast } from 'sonner';

interface VehicleExpense {
  id: string;
  date: string;
  category: string;
  categoryKey: string;
  description: string;
  amount: number;
  hasPhoto: boolean;
}

const VEHICLE_CATEGORIES = [
  { key: 'light', icon: Lightbulb, color: 'text-warning', bg: 'bg-warning/10' },
  { key: 'battery', icon: Battery, color: 'text-primary', bg: 'bg-primary/10' },
  { key: 'wiper', icon: Wind, color: 'text-secondary', bg: 'bg-secondary/10' },
  { key: 'washer', icon: Droplet, color: 'text-primary', bg: 'bg-primary/10' },
  { key: 'tire', icon: CircleDot, color: 'text-foreground', bg: 'bg-muted' },
  { key: 'oil', icon: Droplets, color: 'text-warning', bg: 'bg-warning/10' },
  { key: 'brake', icon: Disc, color: 'text-destructive', bg: 'bg-destructive/10' },
  { key: 'other', icon: Package, color: 'text-muted-foreground', bg: 'bg-muted' },
] as const;

const Expenses = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'fuel' | 'vehicle' | 'misc' | 'damage'>('fuel');
  const [miscTotal, setMiscTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fuel state
  const [receipts, setReceipts] = useState<FuelReceipt[]>([]);
  const [showFuelForm, setShowFuelForm] = useState(false);
  const [newType, setNewType] = useState<'diesel' | 'adblue'>('diesel');
  const [newAmount, setNewAmount] = useState('');
  const [newLiters, setNewLiters] = useState('');
  const [newStation, setNewStation] = useState('');

  // Vehicle expense state
  const [vehicleExpenses, setVehicleExpenses] = useState<VehicleExpense[]>([]);
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [vCategory, setVCategory] = useState('light');
  const [vDescription, setVDescription] = useState('');
  const [vAmount, setVAmount] = useState('');
  const [vHasPhoto, setVHasPhoto] = useState(false);

  const refresh = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await getDriverApi().getExpenses({ driverUserId: user.id });
      setReceipts(data.fuel);
      setVehicleExpenses(data.vehicle.map((expense: DriverExpense) => ({
        id: expense.id,
        date: expense.date,
        category: expense.category,
        categoryKey: expense.category,
        description: expense.description,
        amount: expense.amount,
        hasPhoto: Boolean(expense.hasReceipt),
      })));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, [user]);

  const handleAddFuel = () => {
    if (!newAmount || !newLiters) return;
    toast.info('Kraftstoffbelege sind noch nicht mit dem Backend verbunden.');
  };

  const handleAddVehicle = () => {
    if (!vAmount) return;
    toast.info('Fahrzeugkosten sind noch nicht mit dem Backend verbunden.');
  };

  const totalDiesel = receipts.filter(r => r.type === 'diesel').reduce((s, r) => s + r.amount, 0);
  const totalAdblue = receipts.filter(r => r.type === 'adblue').reduce((s, r) => s + r.amount, 0);
  const totalVehicle = vehicleExpenses.reduce((s, e) => s + e.amount, 0);

  const getCatIcon = (key: string) => {
    const cat = VEHICLE_CATEGORIES.find(c => c.key === key);
    return cat || VEHICLE_CATEGORIES[VEHICLE_CATEGORIES.length - 1];
  };

  return (
    <AppLayout>
      <AppHeader title={t('expenses.title')} showBack />

      <div className="px-4 pt-3 pb-6 space-y-4">
        {(loading || error) && (
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            {loading && <p className="text-sm font-bold text-foreground">Kosten werden geladen</p>}
            {error && (
              <>
                <p className="text-sm font-bold text-destructive">Kosten konnten nicht geladen werden</p>
                <p className="text-xs text-muted-foreground mt-1">{error}</p>
                <button onClick={() => void refresh()} className="mt-3 text-xs font-semibold text-primary">Erneut versuchen</button>
              </>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-muted/60 rounded-xl p-1">
          {(['fuel', 'vehicle', 'misc', 'damage'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg text-[11px] font-semibold transition-all ${
                activeTab === tab
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground'
              }`}
            >
              {tab === 'fuel' ? (
                <span className="flex items-center justify-center gap-1">
                  <Fuel className="w-3.5 h-3.5" /> {t('expenses.fuelTab')}
                </span>
              ) : tab === 'vehicle' ? (
                <span className="flex items-center justify-center gap-1">
                  <Wrench className="w-3.5 h-3.5" /> {t('expenses.vehicleTab')}
                </span>
              ) : tab === 'misc' ? (
                <span className="flex items-center justify-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> {t('expenses.miscTab')}
                </span>
              ) : (
                <span className="flex items-center justify-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Schaden
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Summary cards */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-4 gap-2"
        >
          <div className="bg-card rounded-xl border border-border/40 p-3 text-center">
            <Fuel className="w-4 h-4 text-warning mx-auto mb-1" />
            <p className="text-[9px] text-muted-foreground">Diesel</p>
            <p className="text-sm font-bold text-foreground">{totalDiesel.toFixed(0)} €</p>
          </div>
          <div className="bg-card rounded-xl border border-border/40 p-3 text-center">
            <Droplets className="w-4 h-4 text-primary mx-auto mb-1" />
            <p className="text-[9px] text-muted-foreground">AdBlue</p>
            <p className="text-sm font-bold text-foreground">{totalAdblue.toFixed(0)} €</p>
          </div>
          <div className="bg-card rounded-xl border border-border/40 p-3 text-center">
            <Wrench className="w-4 h-4 text-secondary mx-auto mb-1" />
            <p className="text-[9px] text-muted-foreground">{t('expenses.vehicleTab')}</p>
            <p className="text-sm font-bold text-foreground">{totalVehicle.toFixed(0)} €</p>
          </div>
          <div className="bg-card rounded-xl border border-border/40 p-3 text-center">
            <Sparkles className="w-4 h-4 text-primary mx-auto mb-1" />
            <p className="text-[9px] text-muted-foreground">{t('expenses.miscTab')}</p>
            <p className="text-sm font-bold text-foreground">{miscTotal.toFixed(0)} €</p>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {activeTab === 'damage' ? (
            <motion.div key="damage" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
              <DamageReportsList />
            </motion.div>
          ) : activeTab === 'misc' ? (
            <MiscExpensesTab key="misc" onTotalChange={setMiscTotal} />
          ) : activeTab === 'fuel' ? (
            <motion.div
              key="fuel"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-4"
            >
              <Button onClick={() => setShowFuelForm(!showFuelForm)} className="w-full bg-gradient-brand hover:opacity-90 rounded-xl h-11">
                <Plus className="w-4 h-4 mr-2" /> {t('expenses.newReceipt')}
              </Button>

              <AnimatePresence>
                {showFuelForm && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-card rounded-xl border border-border p-4 space-y-3 overflow-hidden">
                    <div className="flex gap-2">
                      {(['diesel', 'adblue'] as const).map(type => (
                        <button key={type} onClick={() => setNewType(type)} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${newType === type ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                          {type === 'diesel' ? 'Diesel' : 'AdBlue'}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">{t('expenses.amount')}</label>
                        <Input type="number" placeholder="0.00" value={newAmount} onChange={e => setNewAmount(e.target.value)} />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">{t('expenses.liters')}</label>
                        <Input type="number" placeholder="0.0" value={newLiters} onChange={e => setNewLiters(e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">{t('expenses.station')}</label>
                      <Input placeholder="z.B. Shell" value={newStation} onChange={e => setNewStation(e.target.value)} />
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1"><Camera className="w-4 h-4 mr-2" />{t('expenses.photo')}</Button>
                      <Button onClick={handleAddFuel} className="flex-1 bg-primary">{t('expenses.save')}</Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 px-0.5">{t('expenses.recentReceipts')}</h3>
                <div className="bg-card rounded-xl border border-border/40 overflow-hidden divide-y divide-border/30">
                  {receipts.map((r) => (
                    <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${r.type === 'diesel' ? 'bg-warning/10' : 'bg-primary/10'}`}>
                        {r.type === 'diesel' ? <Fuel className="w-4 h-4 text-warning" /> : <Droplets className="w-4 h-4 text-primary" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold text-foreground">{r.station}</p>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Calendar className="w-2.5 h-2.5" />{r.date} · {r.liters} L</p>
                      </div>
                      <p className="text-sm font-bold text-foreground">{r.amount.toFixed(2)} €</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="vehicle"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-4"
            >
              <Button onClick={() => setShowVehicleForm(!showVehicleForm)} className="w-full bg-gradient-brand hover:opacity-90 rounded-xl h-11">
                <Plus className="w-4 h-4 mr-2" /> {t('expenses.newVehicleExpense')}
              </Button>

              <AnimatePresence>
                {showVehicleForm && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-card rounded-xl border border-border p-4 space-y-3 overflow-hidden">
                    {/* Category grid */}
                    <div>
                      <label className="text-xs text-muted-foreground mb-2 block">{t('expenses.category')}</label>
                      <div className="grid grid-cols-4 gap-1.5">
                        {VEHICLE_CATEGORIES.map(cat => {
                          const Icon = cat.icon;
                          const isActive = vCategory === cat.key;
                          return (
                            <button
                              key={cat.key}
                              onClick={() => setVCategory(cat.key)}
                              className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-center transition-all ${
                                isActive ? 'bg-primary/10 border border-primary/30 ring-1 ring-primary/20' : 'bg-muted/50 border border-transparent'
                              }`}
                            >
                              <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : cat.color}`} />
                              <span className={`text-[9px] font-medium leading-tight ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                                {t(`expenses.cat.${cat.key}` as any)}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">{t('expenses.description')}</label>
                      <Input placeholder={t('expenses.descPlaceholder')} value={vDescription} onChange={e => setVDescription(e.target.value)} />
                    </div>

                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">{t('expenses.amount')}</label>
                      <Input type="number" placeholder="0.00" value={vAmount} onChange={e => setVAmount(e.target.value)} />
                    </div>

                    {/* Photo upload */}
                    <button
                      onClick={() => { setVHasPhoto(!vHasPhoto); if (!vHasPhoto) toast.info(t('expenses.photoUploaded'), { icon: '📸' }); }}
                      className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed transition-all ${
                        vHasPhoto
                          ? 'border-primary/40 bg-primary/5 text-primary'
                          : 'border-border text-muted-foreground hover:border-primary/30'
                      }`}
                    >
                      {vHasPhoto ? (
                        <><Check className="w-4 h-4" /> <span className="text-xs font-medium">{t('expenses.photoUploaded')}</span></>
                      ) : (
                        <><Upload className="w-4 h-4" /> <span className="text-xs font-medium">{t('expenses.uploadReceipt')}</span></>
                      )}
                    </button>

                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1" onClick={() => setShowVehicleForm(false)}>
                        <X className="w-4 h-4 mr-1" /> {t('cancel')}
                      </Button>
                      <Button onClick={handleAddVehicle} className="flex-1 bg-primary">{t('expenses.save')}</Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Vehicle expenses list */}
              <div>
                <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 px-0.5">{t('expenses.recentVehicle')}</h3>
                {vehicleExpenses.length === 0 ? (
                  <div className="bg-card rounded-xl border border-border/40 p-6 text-center">
                    <Wrench className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">{t('expenses.noVehicleExpenses')}</p>
                  </div>
                ) : (
                  <div className="bg-card rounded-xl border border-border/40 overflow-hidden divide-y divide-border/30">
                    {vehicleExpenses.map((e) => {
                      const cat = getCatIcon(e.categoryKey);
                      const Icon = cat.icon;
                      return (
                        <motion.div
                          key={e.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center gap-3 px-4 py-3"
                        >
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${cat.bg}`}>
                            <Icon className={`w-4 h-4 ${cat.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-[12px] font-semibold text-foreground truncate">{e.category}</p>
                              {e.hasPhoto && (
                                <span className="text-[8px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">📸</span>
                              )}
                            </div>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {e.description && `${e.description} · `}
                              <span className="inline-flex items-center gap-0.5"><Calendar className="w-2.5 h-2.5" />{e.date}</span>
                            </p>
                          </div>
                          <p className="text-sm font-bold text-foreground">{e.amount.toFixed(2)} €</p>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Button variant="outline" className="w-full rounded-xl"><Download className="w-4 h-4 mr-2" />{t('expenses.exportAll')}</Button>
      </div>
    </AppLayout>
  );
};

export default Expenses;
