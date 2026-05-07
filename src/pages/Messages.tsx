import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Camera, Mic, Check, CheckCheck } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import AppLayout from '@/components/AppLayout';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { getDriverApi, type DriverMessage } from '@/services/driverApi';
import { toast } from 'sonner';

const Messages = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [messages, setMessages] = useState<DriverMessage[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const refresh = async () => {
    if (!user) {
      setMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const nextMessages = await getDriverApi().getMessages({ driverUserId: user.id });
      setMessages(nextMessages);
      await Promise.all(
        nextMessages
          .filter((message) => !message.read && message.sender !== 'driver')
          .map((message) => getDriverApi().markMessageRead({ driverUserId: user.id }, message.id).catch(() => undefined)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, [user]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  const handleSend = async () => {
    if (!newMsg.trim() || !user) return;

    try {
      const result = await getDriverApi().sendMessageReply({ driverUserId: user.id }, newMsg.trim());
      if (result.unsupported || !result.ok) {
        toast.info('Antworten sind noch nicht mit dem Backend verbunden.');
        return;
      }
      setNewMsg('');
      void refresh();
    } catch {
      toast.info('Antworten sind noch nicht mit dem Backend verbunden.');
    }
  };

  return (
    <AppLayout>
      <AppHeader title={t('messages.title')} showBack rightContent={
        <span className="text-xs opacity-80">{t('messages.dispatch')}</span>
      } />

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 pt-4 pb-2 space-y-3" style={{ maxHeight: 'calc(100vh - 180px)' }}>
        {(loading || error || messages.length === 0) && (
          <div className="bg-card rounded-2xl border border-border p-5 text-center">
            {loading && (
              <>
                <p className="text-sm font-bold text-foreground">Nachrichten werden geladen</p>
                <p className="text-xs text-muted-foreground mt-1">Dispatcher-Nachrichten werden geladen.</p>
              </>
            )}
            {error && (
              <>
                <p className="text-sm font-bold text-destructive">Nachrichten konnten nicht geladen werden</p>
                <p className="text-xs text-muted-foreground mt-1">{error}</p>
                <button onClick={() => void refresh()} className="mt-3 text-xs font-semibold text-primary">Erneut versuchen</button>
              </>
            )}
            {!loading && !error && messages.length === 0 && (
              <>
                <p className="text-sm font-bold text-foreground">Keine Nachrichten</p>
                <p className="text-xs text-muted-foreground mt-1">Neue Dispatcher-Nachrichten erscheinen hier.</p>
              </>
            )}
          </div>
        )}

        {messages.map((msg, i) => {
          const isDriver = msg.sender === 'driver';
          return (
            <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className={`flex ${isDriver ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 ${isDriver ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-card border border-border text-foreground rounded-bl-md'}`}>
                <p className="text-sm">{msg.text}</p>
                <div className={`flex items-center justify-end gap-1 mt-1 ${isDriver ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                  <span className="text-[10px]">{new Date(msg.timestamp).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</span>
                  {isDriver && (msg.read ? <CheckCheck className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />)}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="sticky bottom-20 bg-card/95 backdrop-blur-md border-t border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            disabled
            title="Foto-Nachrichten sind noch nicht verbunden"
            aria-label="Foto-Nachrichten noch nicht verbunden"
            className="p-2 rounded-full opacity-40 cursor-not-allowed"
          >
            <Camera className="w-5 h-5 text-muted-foreground" />
          </button>
          <button
            disabled
            title="Sprachnachrichten sind noch nicht verbunden"
            aria-label="Sprachnachrichten noch nicht verbunden"
            className="p-2 rounded-full opacity-40 cursor-not-allowed"
          >
            <Mic className="w-5 h-5 text-muted-foreground" />
          </button>
          <Input placeholder={t('messages.placeholder')} value={newMsg} onChange={(e) => setNewMsg(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && void handleSend()} className="flex-1 rounded-full" />
          <button onClick={() => void handleSend()} disabled={!newMsg.trim()} className="p-2.5 rounded-full bg-primary text-primary-foreground disabled:opacity-40 transition-opacity">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </AppLayout>
  );
};

export default Messages;
