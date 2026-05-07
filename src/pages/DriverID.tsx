import { motion } from 'framer-motion';
import { Phone, MapPin, Truck, ChevronRight } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import AppLayout from '@/components/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import logoApp from '@/assets/logo-app.png';
import logoCompany from '@/assets/logo-company.png';
import driverPhoto from '@/assets/driver-photo.jpg';

const DriverID = () => {
  const { t } = useLanguage();
  const { profile } = useAuth();
  const navigate = useNavigate();

  const company = {
    name: 'German Waste Management GmbH',
    shortName: 'GWM GmbH',
    address: 'Industriestraße 42, 30163 Hannover',
    phone: '+49 511 98765-0',
  };

  const driver = {
    name: profile?.full_name || 'Max Mustermann',
    id: 'GWM-2024-0147',
    phone: profile?.phone || '015560150217',
    licensePlate: profile?.license_plate || 'H-GW 1042',
    hireDate: '01.03.2024',
  };

  return (
    <AppLayout>
      <AppHeader title={t('driverID.title')} showBack />

      <div className="px-4 py-6 pb-28 flex flex-col items-center">
        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-sm bg-card rounded-3xl border border-border shadow-xl overflow-hidden"
        >
          {/* Top brand area */}
          <div className="bg-gradient-brand px-6 pt-6 pb-4 text-center text-primary-foreground">
            <img src={logoApp} alt="Recycle Solution" className="w-16 h-16 mx-auto mb-2 drop-shadow-lg" />
            <h2 className="text-lg font-extrabold tracking-tight">RECYCLE <span className="text-secondary">SOLUTION</span></h2>
            <p className="text-[10px] opacity-70 font-medium tracking-widest mt-0.5">By G.W.M</p>
          </div>

          {/* Driver photo + info */}
          <div className="px-6 pt-5 pb-4 flex flex-col items-center">
            {/* Avatar with green ring */}
            <div className="relative mb-4">
              <div className="w-28 h-28 rounded-full border-[3px] border-primary p-1">
                <img
                  src={driverPhoto}
                  alt={driver.name}
                  className="w-full h-full rounded-full object-cover"
                  loading="lazy"
                  width={512}
                  height={512}
                />
              </div>
            </div>

            {/* Name */}
            <h3 className="text-xl font-extrabold text-foreground text-center">{driver.name}</h3>
            <p className="text-sm text-muted-foreground mt-0.5">{driver.phone}</p>

            {/* Signature area */}
            <div className="mt-4 w-full">
              <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 text-center">
                <p className="text-xs font-semibold text-primary">{t('driverID.signature')}</p>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-dashed border-border mx-6" />

          {/* German-style license plate */}
          <div className="px-6 py-4">
            <div className="flex items-center mx-auto max-w-[260px] h-12 rounded-lg border-2 border-foreground overflow-hidden bg-white">
              {/* EU blue strip */}
              <div className="h-full w-10 bg-[hsl(220,80%,40%)] flex flex-col items-center justify-center gap-0.5 flex-shrink-0">
                <span className="text-[10px] text-white">★★★</span>
                <span className="text-sm font-extrabold text-white leading-none">D</span>
              </div>
              {/* Plate text */}
              <div className="flex-1 flex items-center justify-center px-3">
                <span className="text-xl font-extrabold text-foreground tracking-[0.15em] font-mono">{driver.licensePlate}</span>
              </div>
            </div>
          </div>

          {/* Bottom info */}
          <div className="px-6 pb-5 space-y-3">
            <div className="flex items-center justify-center">
              <img src={logoCompany} alt="GWM" className="w-8 h-8 object-contain" />
            </div>
            <div className="text-center space-y-0.5">
              <p className="text-[10px] text-muted-foreground">{t('driverID.officialId')}: <span className="font-semibold text-foreground">{driver.id}</span></p>
              <p className="text-[10px] text-muted-foreground">{t('driverID.hireDate')}: <span className="font-semibold text-foreground">{driver.hireDate}</span></p>
              <p className="text-[10px] text-muted-foreground font-medium">{company.name}</p>
            </div>
          </div>
        </motion.div>

        {/* Link to Tourenübersicht */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={() => navigate('/tour-overview')}
          className="w-full max-w-sm mt-4 flex items-center gap-3 bg-card border border-border rounded-2xl px-4 py-3.5 shadow-card hover:bg-muted/30 transition-colors text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-foreground">{t('driverID.tourOverview')}</p>
            <p className="text-[10px] text-muted-foreground">{t('driverID.tourOverviewSub')}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
        </motion.button>

        {/* Company contact */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="w-full max-w-sm mt-3 flex items-center justify-center gap-4 text-[10px] text-muted-foreground"
        >
          <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{company.phone}</span>
          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />Hannover</span>
        </motion.div>

        <p className="text-[9px] text-muted-foreground/50 mt-3 text-center max-w-xs">
          {t('driverID.footer')}
        </p>
      </div>
    </AppLayout>
  );
};

export default DriverID;
