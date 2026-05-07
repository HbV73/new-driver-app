import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarDays, Plus, Thermometer, Upload, Clock, CheckCircle2,
  XCircle, AlertTriangle, FileText, ChevronDown, ChevronUp
} from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LeaveRequest } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { getDriverApi } from '@/services/driverApi';


const LeaveRequests = () => {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const de = lang === 'de';

  const statusConfig = {
    pending: { label: t('leave.pending'), color: 'bg-warning/10 text-warning', icon: Clock },
    approved: { label: t('leave.approved'), color: 'bg-primary/10 text-primary', icon: CheckCircle2 },
    rejected: { label: t('leave.rejected'), color: 'bg-destructive/10 text-destructive', icon: XCircle },
  };

  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<'vacation' | 'sick' | 'hourly'>('vacation');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const today = new Date();
  const minVacationDate = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000)
    .toISOString().split('T')[0];

  const refresh = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      setLeaves(await getDriverApi().getLeaveRequests({ driverUserId: user.id }));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setLeaves([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, [user]);

  const handleSubmit = async () => {
    if (formType === 'hourly') {
      if (!startDate || !startTime || !endTime) return;
    } else {
      if (!startDate || !endDate) return;
    }

    if (formType === 'vacation') {
      const start = new Date(startDate);
      const twoWeeksFromNow = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
      if (start < twoWeeksFromNow) {
        return;
      }
    }

    if (!user) return;
    const result = await getDriverApi().submitLeaveRequest(
      { driverUserId: user.id },
      {
        type: formType,
        startDate,
        endDate: formType === 'hourly' ? startDate : endDate,
        reason: reason || undefined,
        startTime: formType === 'hourly' ? startTime : undefined,
        endTime: formType === 'hourly' ? endTime : undefined,
        documentDeadline: formType === 'sick'
          ? new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          : undefined,
      },
    );

    if (result.unsupported || !result.ok) {
      setError(de ? 'Urlaubsanträge sind noch nicht mit dem Backend verbunden.' : 'Leave requests are not connected yet.');
      return;
    }

    void refresh();
    setShowForm(false);
    setStartDate('');
    setEndDate('');
    setReason('');
    setStartTime('');
    setEndTime('');
  };

  const sickLeavesWithoutDoc = leaves.filter(
    l => l.type === 'sick' && !l.documentUploaded && l.status !== 'rejected'
  );

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString(de ? 'de-DE' : 'en-US', { day: '2-digit', month: '2-digit', year: '2-digit' });

  return (
    <AppLayout>
      <AppHeader title={t('leave.title')} showBack />

      <div className="px-4 pt-4 pb-4 space-y-5">
        {(loading || error || leaves.length === 0) && (
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            {loading && <p className="text-sm font-bold text-foreground">Anträge werden geladen</p>}
            {error && (
              <>
                <p className="text-sm font-bold text-destructive">{error}</p>
                <button onClick={() => void refresh()} className="mt-3 text-xs font-semibold text-primary">Erneut versuchen</button>
              </>
            )}
            {!loading && !error && leaves.length === 0 && (
              <>
                <p className="text-sm font-bold text-foreground">Keine Anträge</p>
                <p className="text-xs text-muted-foreground mt-1">Urlaubs- und Krankmeldungen sind backendseitig noch nicht verbunden.</p>
              </>
            )}
          </div>
        )}

        {/* Warning: missing sick leave documents */}
        {sickLeavesWithoutDoc.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-start gap-3"
          >
            <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-destructive">{t('leave.docMissing')}</p>
              <p className="text-xs text-destructive/80 mt-0.5">
                {t('leave.docMissingSub')}
              </p>
              <Button
                size="sm"
                variant="outline"
                disabled
                className="mt-2 border-destructive/30 text-destructive opacity-60 cursor-not-allowed"
              >
                <Upload className="w-3.5 h-3.5 mr-1" />
                {t('leave.uploadNow')} (noch nicht verbunden)
              </Button>
            </div>
          </motion.div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-card rounded-xl border border-border p-3 text-center">
            <CalendarDays className="w-4 h-4 mx-auto text-primary mb-1" />
            <p className="text-lg font-bold text-foreground">
              {leaves.filter(l => l.type === 'vacation' && l.status === 'approved').length}
            </p>
            <p className="text-[10px] text-muted-foreground">{t('leave.statVacation')}</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-3 text-center">
            <Clock className="w-4 h-4 mx-auto text-secondary mb-1" />
            <p className="text-lg font-bold text-foreground">
              {leaves.filter(l => l.type === 'hourly').length}
            </p>
            <p className="text-[10px] text-muted-foreground">{t('leave.statHours')}</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-3 text-center">
            <Clock className="w-4 h-4 mx-auto text-warning mb-1" />
            <p className="text-lg font-bold text-foreground">
              {leaves.filter(l => l.status === 'pending').length}
            </p>
            <p className="text-[10px] text-muted-foreground">{t('leave.statOpen')}</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-3 text-center">
            <Thermometer className="w-4 h-4 mx-auto text-destructive mb-1" />
            <p className="text-lg font-bold text-foreground">
              {leaves.filter(l => l.type === 'sick').length}
            </p>
            <p className="text-[10px] text-muted-foreground">{t('leave.statSick')}</p>
          </div>
        </div>

        {/* New request button */}
        <Button
          onClick={() => setShowForm(!showForm)}
          className="w-full bg-gradient-brand hover:opacity-90"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('leave.newRequest')}
        </Button>

        {/* Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-card rounded-xl border border-border p-4 space-y-4 overflow-hidden"
            >
              {/* Type selector */}
              <div className="flex gap-2">
                <button
                  onClick={() => setFormType('vacation')}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    formType === 'vacation'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {t('leave.vacation')}
                </button>
                <button
                  onClick={() => setFormType('sick')}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    formType === 'sick'
                      ? 'bg-destructive text-destructive-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {t('leave.statSick')}
                </button>
                <button
                  onClick={() => setFormType('hourly')}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    formType === 'hourly'
                      ? 'bg-secondary text-secondary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {t('leave.hourly')}
                </button>
              </div>

              {/* Info box */}
              {formType === 'vacation' ? (
                <div className="bg-primary/5 rounded-lg px-3 py-2 text-xs text-primary">
                  Info: {t('leave.vacationNotice')}
                </div>
              ) : formType === 'sick' ? (
                <div className="bg-destructive/5 rounded-lg px-3 py-2 text-xs text-destructive">
                  Info: {t('leave.sickNotice')}
                </div>
              ) : (
                <div className="bg-secondary/10 rounded-lg px-3 py-2 text-xs text-secondary-foreground">
                  Info: {t('leave.hourlyInfo')}
                </div>
              )}

              {/* Date & time fields */}
              {formType === 'hourly' ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">{t('leave.date')}</label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      min={today.toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">{t('leave.fromTime')}</label>
                      <Input
                        type="time"
                        value={startTime}
                        onChange={e => setStartTime(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">{t('leave.toTime')}</label>
                      <Input
                        type="time"
                        value={endTime}
                        onChange={e => setEndTime(e.target.value)}
                      />
                    </div>
                  </div>
                  {startTime && endTime && (
                    <div className="bg-secondary/10 rounded-lg px-3 py-2 text-xs text-foreground font-medium">
                      {t('leave.duration')}: {(() => {
                        const [sh, sm] = startTime.split(':').map(Number);
                        const [eh, em] = endTime.split(':').map(Number);
                        const diff = (eh * 60 + em) - (sh * 60 + sm);
                        if (diff <= 0) return '-';
                        const h = Math.floor(diff / 60);
                        const m = diff % 60;
                        return `${h > 0 ? `${h} ${t('leave.hours')}` : ''} ${m > 0 ? `${m} ${t('leave.mins')}` : ''}`.trim();
                      })()}
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">{t('leave.from')}</label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      min={formType === 'vacation' ? minVacationDate : today.toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">{t('leave.to')}</label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      min={startDate || (formType === 'vacation' ? minVacationDate : today.toISOString().split('T')[0])}
                    />
                  </div>
                </div>
              )}

              {/* Reason */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  {t('leave.reason')} {formType === 'vacation' ? t('leave.optional') : ''}
                </label>
                <Input
                  placeholder={formType === 'vacation' ? t('leave.reasonPlaceholderVacation') : t('leave.reasonPlaceholderSick')}
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                />
              </div>

              {/* Sick leave: upload */}
              {formType === 'sick' && (
                <Button variant="outline" disabled className="w-full opacity-60 cursor-not-allowed">
                  <Upload className="w-4 h-4 mr-2" />
                  {t('leave.uploadCert')} (noch nicht verbunden)
                </Button>
              )}

              <Button onClick={handleSubmit} className="w-full bg-primary">
                {t('leave.submit')}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Leave list */}
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
            {t('leave.myRequests')}
          </h3>
          <div className="space-y-2">
            {leaves.map((leave) => {
              const sc = statusConfig[leave.status];
              const StatusIcon = sc.icon;
              const isExpanded = expandedId === leave.id;

              return (
                <motion.div
                  key={leave.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card rounded-xl border border-border overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : leave.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                      leave.type === 'vacation' ? 'bg-primary/10' : leave.type === 'hourly' ? 'bg-secondary/10' : 'bg-destructive/10'
                    }`}>
                      {leave.type === 'vacation' ? 'U' : leave.type === 'hourly' ? 'H' : 'K'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">
                          {leave.type === 'vacation' ? t('leave.vacation') : leave.type === 'hourly' ? t('leave.hourly') : t('leave.sickLabel')}
                        </p>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${sc.color}`}>
                          {sc.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {leave.type === 'hourly' && leave.startTime && leave.endTime
                          ? `${formatDate(leave.startDate)} - ${leave.startTime} - ${leave.endTime}`
                          : `${formatDate(leave.startDate)} - ${formatDate(leave.endDate)}`
                        }
                      </p>
                    </div>
                    {leave.type === 'sick' && !leave.documentUploaded && (
                      <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
                    )}
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-3 space-y-2 border-t border-border pt-3">
                          {leave.reason && (
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">{t('leave.reason')}</span>
                              <span className="text-foreground">{leave.reason}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">{t('leave.requestedOn')}</span>
                            <span className="text-foreground">{formatDate(leave.createdAt)}</span>
                          </div>
                          {leave.managerNote && (
                            <div className="bg-muted/50 rounded-lg px-3 py-2 text-xs text-foreground">
                              {leave.managerNote}
                            </div>
                          )}
                          {leave.type === 'sick' && !leave.documentUploaded && (
                            <Button size="sm" variant="outline" disabled className="w-full border-destructive/30 text-destructive opacity-60 cursor-not-allowed">
                              <Upload className="w-3.5 h-3.5 mr-1" />
                              {t('leave.uploadCert')} (noch nicht verbunden)
                            </Button>
                          )}
                          {leave.type === 'sick' && leave.documentUploaded && (
                            <div className="flex items-center gap-2 text-xs text-primary">
                              <FileText className="w-3.5 h-3.5" />
                              <span>{t('leave.docUploaded')}</span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default LeaveRequests;
