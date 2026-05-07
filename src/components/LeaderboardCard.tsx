import { motion } from 'framer-motion';
import { Trophy, Flame, Star, Medal } from 'lucide-react';
import { useLeaderboard } from '@/hooks/usePerformance';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';

const RANK_STYLE = [
  'bg-warning/15 text-warning border-warning/30',     // 1st
  'bg-muted text-foreground border-border',           // 2nd
  'bg-secondary/15 text-secondary border-secondary/30', // 3rd
];

export function LeaderboardCard() {
  const { t } = useLanguage();
  const { rows, loading } = useLeaderboard(10);
  const [myId, setMyId] = useState<string | null>(null);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => setMyId(data.user?.id ?? null));
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border border-border/40 p-4 space-y-3"
    >
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl bg-warning/15 flex items-center justify-center">
          <Trophy className="w-4 h-4 text-warning" />
        </div>
        <h3 className="text-sm font-bold text-foreground flex-1">{t('leaderboard.title')}</h3>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[0,1,2].map(i => <div key={i} className="h-12 bg-muted/40 rounded-xl animate-pulse" />)}
        </div>
      ) : rows.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">{t('leaderboard.empty')}</p>
      ) : (
        <div className="space-y-1.5">
          {rows.map((row, idx) => {
            const isMe = row.user_id === myId;
            const rankCls = idx < 3 ? RANK_STYLE[idx] : 'bg-muted/40 text-muted-foreground border-border/40';
            return (
              <div
                key={row.id}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl border transition-all ${
                  isMe ? 'bg-primary/10 border-primary/30 ring-1 ring-primary/20' : 'bg-card border-border/30'
                }`}
              >
                <div className={`w-7 h-7 rounded-lg border flex items-center justify-center text-[11px] font-bold ${rankCls}`}>
                  {idx < 3 ? <Medal className="w-3.5 h-3.5" /> : idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-foreground truncate">
                    {row.driver_name ?? '—'} {isMe && <span className="text-[9px] text-primary">({t('leaderboard.you')})</span>}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-0.5"><Star className="w-2.5 h-2.5" />Lv {row.level}</span>
                    <span className="flex items-center gap-0.5"><Flame className="w-2.5 h-2.5 text-destructive" />{row.current_streak_days}d</span>
                  </div>
                </div>
                <p className="text-sm font-bold text-foreground">{row.total_points.toLocaleString()}</p>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
