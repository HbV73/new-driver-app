import { Lock, Unlock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDayLock } from '@/hooks/useDayLock';

interface Props {
  logDate: string;
}

export default function DayLockBanner({ logDate }: Props) {
  const { lock, isLocked } = useDayLock(logDate);

  if (!isLocked) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3 p-3 mb-3 rounded-lg bg-destructive/10 border border-destructive/30"
    >
      <Lock className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-destructive">
          Tag wurde vom Admin gesperrt
        </div>
        {lock?.reason && (
          <p className="text-sm text-muted-foreground mt-0.5">{lock.reason}</p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          Du kannst diesen Tag nicht mehr bearbeiten. Bei Fragen wende dich an
          deinen Disponenten.
        </p>
      </div>
    </motion.div>
  );
}

/** Helper hook export */
export { useDayLock };
