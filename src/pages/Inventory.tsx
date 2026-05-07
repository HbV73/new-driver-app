import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Droplets, ShoppingBag, Truck, TrendingUp, Recycle, Package } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import AppLayout from '@/components/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { getDriverApi, type DriverInventory } from '@/services/driverApi';

const Inventory = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [inv, setInv] = useState<DriverInventory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    if (!user) {
      setLoading(false);
      setInv(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      setInv(await getDriverApi().getInventory({ driverUserId: user.id }));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setInv(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, [user]);

  const totalOilKg = inv?.totalOilKg ?? 0;
  const truckCapacityKg = inv?.truckCapacityKg ?? 0;
  const oilPercent = truckCapacityKg > 0 ? Math.round((totalOilKg / truckCapacityKg) * 100) : 0;
  const remaining = Math.max(0, truckCapacityKg - totalOilKg);

  const containers = [
    { label: t('inventory.bin'), empty: inv?.emptyBins ?? 0, full: inv?.fullBins ?? 0, icon: Recycle, gradient: 'from-primary/15 to-primary/5' },
    { label: t('inventory.barrel60'), empty: inv?.emptyBarrels60 ?? 0, full: inv?.fullBarrels60 ?? 0, icon: Droplets, gradient: 'from-secondary/15 to-secondary/5' },
    { label: t('inventory.barrel30'), empty: inv?.emptyBarrels30 ?? 0, full: inv?.fullBarrels30 ?? 0, icon: Droplets, gradient: 'from-primary/15 to-primary/5' },
  ];

  const barColor = oilPercent >= 90 ? 'bg-destructive' : oilPercent >= 75 ? 'bg-warning' : 'bg-primary';

  return (
    <AppLayout>
      <AppHeader title={t('inventory.title')} showMenu />

      <div className="px-4 pt-3 pb-6 space-y-5">
        {(loading || error || !inv) && (
          <div className="bg-card rounded-2xl border border-border/40 p-5 text-center">
            {loading && (
              <>
                <p className="text-sm font-bold text-foreground">Inventar wird geladen</p>
                <p className="text-xs text-muted-foreground mt-1">Fahrzeugbestand wird geladen.</p>
              </>
            )}
            {error && (
              <>
                <p className="text-sm font-bold text-destructive">Inventar konnte nicht geladen werden</p>
                <p className="text-xs text-muted-foreground mt-1">{error}</p>
                <button onClick={() => void refresh()} className="mt-3 text-xs font-semibold text-primary">Erneut versuchen</button>
              </>
            )}
            {!loading && !error && !inv && (
              <>
                <p className="text-sm font-bold text-foreground">Inventar noch nicht verbunden</p>
                <p className="text-xs text-muted-foreground mt-1">Fahrzeugbestand braucht noch ein Backend-Inventar.</p>
              </>
            )}
          </div>
        )}

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl border border-border/40 overflow-hidden">
          <div className="px-5 pt-5 pb-3 flex items-center gap-4">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', damping: 15 }} className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/12 to-primary/4 border border-primary/10 flex items-center justify-center shrink-0">
              <Truck className="w-8 h-8 text-primary" />
            </motion.div>

            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between">
                <h2 className="text-base font-bold text-foreground">{t('inventory.oilTank')}</h2>
                <span className="text-xl font-extrabold text-primary tabular-nums">{oilPercent}%</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {totalOilKg} / {truckCapacityKg} kg
              </p>
            </div>
          </div>

          <div className="px-5 pb-4">
            <div className="h-3 bg-muted/80 rounded-full overflow-hidden relative">
              <motion.div className={`h-full ${barColor} rounded-full`} initial={{ width: 0 }} animate={{ width: `${oilPercent}%` }} transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }} />
              <div className="absolute top-0 left-[75%] w-px h-full bg-foreground/15" />
              <div className="absolute top-0 left-[90%] w-px h-full bg-destructive/25" />
            </div>

            <div className="flex items-center justify-between mt-2">
              <p className="text-[10px] text-muted-foreground">
                {t('inventory.capacityLeft').replace('{amount}', String(remaining))}
              </p>
              <div className="flex items-center gap-1 text-[10px] text-primary font-semibold">
                <TrendingUp className="w-3 h-3" />
                <span>{totalOilKg} kg</span>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2.5 px-0.5 flex items-center gap-1.5">
            <Package className="w-3 h-3" />
            {t('inventory.containers')}
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {containers.map((c, i) => {
              const Icon = c.icon;
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 + i * 0.05 }} className={`bg-gradient-to-b ${c.gradient} rounded-2xl border border-border/30 p-3 text-center`}>
                  <div className="w-10 h-10 rounded-xl bg-card/80 border border-border/20 flex items-center justify-center mx-auto shadow-sm">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-[11px] font-semibold text-foreground mt-2 leading-tight">{c.label}</p>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <div className="text-center">
                      <p className="text-base font-extrabold text-primary leading-none">{c.empty}</p>
                      <p className="text-[8px] text-muted-foreground font-medium mt-0.5">{t('inventory.empty')}</p>
                    </div>
                    <div className="w-px h-6 bg-border/50" />
                    <div className="text-center">
                      <p className="text-base font-extrabold text-secondary leading-none">{c.full}</p>
                      <p className="text-[8px] text-muted-foreground font-medium mt-0.5">{t('inventory.full')}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
          <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2.5 px-0.5 flex items-center gap-1.5">
            <ShoppingBag className="w-3 h-3" />
            {t('inventory.productsOnTruck')}
          </h3>
          <div className="bg-card rounded-2xl border border-border/40 overflow-hidden divide-y divide-border/30">
            {(inv?.products ?? []).length === 0 && (
              <div className="px-4 py-6 text-center text-xs text-muted-foreground">Keine Produktbestände verbunden.</div>
            )}
            {(inv?.products ?? []).map((item, i) => (
              <motion.div key={item.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.04 }} className="flex items-center gap-3 px-4 py-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-secondary/12 to-secondary/4 border border-secondary/10 flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-4.5 h-4.5 text-secondary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-foreground truncate">{item.name}</p>
                  <p className="text-[10px] text-muted-foreground">{item.unit ?? 'Stueck'}</p>
                </div>
                <div className="bg-primary/6 border border-primary/10 px-2.5 py-0.5 rounded-lg">
                  <span className="text-sm font-extrabold text-primary tabular-nums">{item.quantity}x</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default Inventory;
