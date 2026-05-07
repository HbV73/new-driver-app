import { Wifi, WifiOff, RefreshCw, CloudUpload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnlineSync } from '@/hooks/useOnlineSync';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';

/**
 * Compact status pill: shows offline state + pending sync count.
 * Visible only when offline OR when there are pending items.
 */
const OfflineIndicator = () => {
  const { online, pending, syncing, flush } = useOnlineSync();
  const { t } = useLanguage();

  const visible = !online || pending > 0;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
            online
              ? 'bg-amber-500/10 text-amber-600 border-amber-500/30'
              : 'bg-destructive/10 text-destructive border-destructive/30'
          }`}
        >
          {online ? (
            <CloudUpload className="w-3.5 h-3.5" />
          ) : (
            <WifiOff className="w-3.5 h-3.5" />
          )}
          <span>
            {online
              ? `${pending} ${t('offline.pending')}`
              : t('offline.offline')}
          </span>
          {online && pending > 0 && (
            <Button
              size="sm"
              variant="ghost"
              className="h-5 px-1.5 -mr-1"
              onClick={() => void flush()}
              disabled={syncing}
            >
              <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineIndicator;
