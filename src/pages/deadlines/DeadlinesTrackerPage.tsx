import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Bell,
  BellRing,
  Filter,
  Scale,
  FileText,
  Building,
  ExternalLink,
  ShieldAlert,
  Check,
  RotateCcw,
  Info,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import {
  useLiveData,
  listCases,
  getDatabase,
  addCaseEvent,
  markCaseDeadlineComplete,
  unmarkCaseDeadlineComplete,
} from '../../lib/db/index.ts';
import { CaseRecord, CaseEventRecord } from '../../types/database.ts';
import { computeAllDeadlines, DeadlineItem, DeadlineStatus } from '../../lib/deadlines/index.ts';
import { useI18n, formatDateTime, formatDate } from '../../i18n/index.ts';
import { useToast } from '../../components/ui/Toast.tsx';
import {
  Button,
  Badge,
  Card,
  Tabs,
  BottomSheet,
  EmptyState,
  Skeleton,
} from '../../components/ui/index.ts';

export const DeadlinesTrackerPage: React.FC = () => {
  const navigate = useNavigate();
  const { t, language } = useI18n();
  const { success, error, info } = useToast();

  // Active Tab state
  const [activeTab, setActiveTab] = useState<'overdue' | 'due_soon' | 'upcoming' | 'completed'>('overdue');
  const [selectedCaseFilter, setSelectedCaseFilter] = useState<string>('all');
  const [sortByDueAsc, setSortByDueAsc] = useState<boolean>(true);

  // BottomSheet modal state for selected deadline
  const [selectedItem, setSelectedItem] = useState<DeadlineItem | null>(null);
  const [completionDateTime, setCompletionDateTime] = useState<string>('');
  const [completionNote, setCompletionNote] = useState<string>('');
  const [logCaseEventCheck, setLogCaseEventCheck] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Notification state
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(() => {
    return typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default';
  });
  const [notifiedRuleIds, setNotifiedRuleIds] = useState<Set<string>>(new Set());

  // Live timer: re-evaluates deadlines every 60 seconds (1 minute)
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // 1 minute
    return () => clearInterval(interval);
  }, []);

  // Fetch Cases with live updates
  const { data: cases = [], loading: loadingCases } = useLiveData<CaseRecord[]>(
    () => listCases('all'),
    ['cases']
  );

  // Fetch all Case Events to feed into deadline trigger engine
  const { data: allEvents = [], loading: loadingEvents } = useLiveData<CaseEventRecord[]>(
    async () => {
      const db = await getDatabase();
      return db.getAll('caseEvents');
    },
    ['caseEvents']
  );

  // Group events by caseId
  const eventsByCase = useMemo(() => {
    const map: Record<string, CaseEventRecord[]> = {};
    for (const ev of allEvents) {
      if (!map[ev.caseId]) map[ev.caseId] = [];
      map[ev.caseId].push(ev);
    }
    return map;
  }, [allEvents]);

  // Compute all deadlines dynamically using engine
  const allDeadlines = useMemo<DeadlineItem[]>(() => {
    if (cases.length === 0) return [];
    return computeAllDeadlines(cases, eventsByCase, currentTime);
  }, [cases, eventsByCase, currentTime]);

  // Tab counts
  const overdueItems = useMemo(
    () => allDeadlines.filter((d) => d.status === 'overdue'),
    [allDeadlines]
  );
  const dueSoonItems = useMemo(
    () => allDeadlines.filter((d) => d.status === 'due_soon'),
    [allDeadlines]
  );
  const upcomingItems = useMemo(
    () => allDeadlines.filter((d) => d.status === 'upcoming'),
    [allDeadlines]
  );
  const completedItems = useMemo(
    () => allDeadlines.filter((d) => d.status === 'completed'),
    [allDeadlines]
  );

  // Automatically select the most urgent tab if overdue or due_soon exist on first render
  useEffect(() => {
    if (overdueItems.length > 0) {
      setActiveTab('overdue');
    } else if (dueSoonItems.length > 0) {
      setActiveTab('due_soon');
    } else if (upcomingItems.length > 0) {
      setActiveTab('upcoming');
    }
  }, [overdueItems.length, dueSoonItems.length, upcomingItems.length]);

  // Filtered by active tab and selected case
  const displayedItems = useMemo(() => {
    let list: DeadlineItem[] = [];
    if (activeTab === 'overdue') list = overdueItems;
    else if (activeTab === 'due_soon') list = dueSoonItems;
    else if (activeTab === 'upcoming') list = upcomingItems;
    else if (activeTab === 'completed') list = completedItems;

    if (selectedCaseFilter !== 'all') {
      list = list.filter((item) => item.caseId === selectedCaseFilter);
    }

    return [...list].sort((a, b) => {
      const timeA = new Date(a.dueAt).getTime();
      const timeB = new Date(b.dueAt).getTime();
      return sortByDueAsc ? timeA - timeB : timeB - timeA;
    });
  }, [
    activeTab,
    overdueItems,
    dueSoonItems,
    upcomingItems,
    completedItems,
    selectedCaseFilter,
    sortByDueAsc,
  ]);

  // In-App local notification checker (runs every minute while app is open)
  useEffect(() => {
    if (notificationPermission !== 'granted') return;

    // Check items due in <= 2 hours (and > 0) that haven't been notified this session
    const urgentItems = dueSoonItems.filter(
      (item) => item.hoursRemaining <= 2 && item.hoursRemaining > 0 && !notifiedRuleIds.has(`${item.caseId}_${item.ruleId}`)
    );

    urgentItems.forEach((item) => {
      const title = `Nyay Saathi • FIR ${item.firNo} Statutory Reminder`;
      const body = `${language === 'mr' ? item.label_mr : item.label_en} due in ${Math.round(item.hoursRemaining * 60)} minutes.`;
      try {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
        });
        setNotifiedRuleIds((prev) => new Set(prev).add(`${item.caseId}_${item.ruleId}`));
      } catch (err) {
        console.warn('Notification execution failed:', err);
      }
    });
  }, [dueSoonItems, notificationPermission, notifiedRuleIds, language]);

  // Request browser notification permission
  const handleRequestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      info(language === 'mr' ? 'या ब्राउझरमध्ये सूचना समर्थित नाहीत.' : 'Notifications not supported in this browser.');
      return;
    }

    try {
      const perm = await Notification.requestPermission();
      setNotificationPermission(perm);
      if (perm === 'granted') {
        success(language === 'mr' ? 'ॲप-मधील सूचना सक्रिय करण्यात आल्या.' : 'In-app statutory reminders enabled.');
      } else if (perm === 'denied') {
        info(language === 'mr' ? 'सूचनांची परवानगी नाकारली गेली.' : 'Notification permission was denied.');
      }
    } catch (err) {
      console.error('Failed to request notifications:', err);
    }
  };

  // Open BottomSheet details for a specific deadline
  const handleOpenDetail = (item: DeadlineItem) => {
    setSelectedItem(item);
    setCompletionDateTime(new Date().toISOString().slice(0, 16));
    setCompletionNote('');
    setLogCaseEventCheck(true);
  };

  // Handle Mark Done confirmation
  const handleConfirmMarkDone = async () => {
    if (!selectedItem) return;
    setIsSubmitting(true);
    try {
      const finalCompletedIso = completionDateTime
        ? new Date(completionDateTime).toISOString()
        : new Date().toISOString();

      let eventId: string | undefined = undefined;

      // Also log as case event if checked
      if (logCaseEventCheck) {
        const eventType = selectedItem.canCompleteWithEvent?.eventType || 'custom';
        const defaultNote =
          language === 'mr'
            ? selectedItem.canCompleteWithEvent?.suggestedNote_mr || `${selectedItem.label_mr} पूर्ण केले`
            : selectedItem.canCompleteWithEvent?.suggestedNote_en || `${selectedItem.label_en} completed`;

        const noteText = completionNote.trim() ? `${defaultNote} - ${completionNote.trim()}` : defaultNote;

        const newEvent = await addCaseEvent({
          caseId: selectedItem.caseId,
          type: eventType,
          dateTime: finalCompletedIso,
          note: noteText,
        });
        eventId = newEvent.id;
      }

      await markCaseDeadlineComplete(
        selectedItem.caseId,
        selectedItem.ruleId,
        finalCompletedIso,
        completionNote.trim() || undefined,
        eventId
      );

      success(
        language === 'mr'
          ? 'वैधानिक मुदत यशस्वीरीत्या पूर्ण नोंदवली.'
          : 'Statutory deadline marked completed.'
      );
      setSelectedItem(null);
    } catch (err) {
      console.error('Failed to mark deadline complete:', err);
      error(language === 'mr' ? 'नोंदवताना त्रुटी आली.' : 'Failed to update compliance record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Revert to Pending
  const handleConfirmRevert = async () => {
    if (!selectedItem) return;
    setIsSubmitting(true);
    try {
      await unmarkCaseDeadlineComplete(selectedItem.caseId, selectedItem.ruleId);
      info(
        language === 'mr'
          ? 'मुदत प्रलंबित स्थितीत परत केली.'
          : 'Deadline reverted to pending state.'
      );
      setSelectedItem(null);
    } catch (err) {
      console.error('Failed to revert deadline:', err);
      error(language === 'mr' ? 'बदल करताना त्रुटी आली.' : 'Failed to revert deadline status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabsList = [
    {
      id: 'overdue',
      label: t('deadlinesTracker.tabOverdue'),
      count: overdueItems.length,
      badgeVariant: overdueItems.length > 0 ? ('danger' as const) : ('neutral' as const),
    },
    {
      id: 'due_soon',
      label: t('deadlinesTracker.tabDueSoon'),
      count: dueSoonItems.length,
      badgeVariant: dueSoonItems.length > 0 ? ('warning' as const) : ('neutral' as const),
    },
    {
      id: 'upcoming',
      label: t('deadlinesTracker.tabUpcoming'),
      count: upcomingItems.length,
      badgeVariant: 'neutral' as const,
    },
    {
      id: 'completed',
      label: t('deadlinesTracker.tabCompleted'),
      count: completedItems.length,
      badgeVariant: completedItems.length > 0 ? ('success' as const) : ('neutral' as const),
    },
  ];

  if (loadingCases || loadingEvents) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-6 px-4">
        <Skeleton className="w-full h-24 rounded-2xl" />
        <Skeleton className="w-full h-14 rounded-2xl" />
        <Skeleton className="w-full h-80 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="min-w-0 max-w-5xl mx-auto space-y-6 pb-24 px-4 sm:px-6 pt-2">
      {/* 1. HEADER & LEGAL DISCLAIMER NOTE */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-saffron/15 text-saffron border border-saffron/30">
                <Clock className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {t('deadlinesTracker.title')}
              </h1>
            </div>
            <p className="text-xs text-muted mt-1">
              {t('deadlinesTracker.subtitle')}
            </p>
          </div>

          {/* Local in-app notifications permission prompt */}
          <div className="flex items-center gap-2">
            {notificationPermission === 'granted' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/50 border border-emerald-700/60 text-xs font-semibold text-emerald-300">
                <BellRing className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t('deadlinesTracker.notificationsEnabled')}</span>
              </span>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                icon={<Bell className="w-3.5 h-3.5" />}
                onClick={handleRequestNotificationPermission}
              >
                {t('deadlinesTracker.enableNotificationsBtn')}
              </Button>
            )}
          </div>
        </div>

        {/* Clear Mandatory Note on Screen */}
        <div className="p-3.5 rounded-xl bg-navy-800/80 border border-navy-700 flex items-start gap-3 text-xs text-slate-300">
          <Info className="w-4 h-4 text-saffron shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold text-white">
              {language === 'mr' ? 'वैधानिक मुदत सूचना:' : 'Statutory Notice:'}
            </span>{' '}
            <span>{t('deadlinesTracker.disclaimerNote')}</span>
            <div className="text-[11px] text-muted pt-0.5">
              {t('deadlinesTracker.notificationsExplainer')}
            </div>
          </div>
        </div>
      </div>

      {/* 2. STATS & SUMMARY STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-danger/10 border border-danger/30 space-y-1">
          <div className="text-[11px] font-bold text-danger-light uppercase tracking-wider">
            {t('deadlinesTracker.tabOverdue')}
          </div>
          <div className="text-xl sm:text-2xl font-mono font-black text-danger">
            {overdueItems.length}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-saffron/10 border border-saffron/30 space-y-1">
          <div className="text-[11px] font-bold text-saffron uppercase tracking-wider">
            {t('deadlinesTracker.tabDueSoon')}
          </div>
          <div className="text-xl sm:text-2xl font-mono font-black text-saffron">
            {dueSoonItems.length}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-navy-800 border border-navy-700 space-y-1">
          <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
            {t('deadlinesTracker.tabUpcoming')}
          </div>
          <div className="text-xl sm:text-2xl font-mono font-black text-white">
            {upcomingItems.length}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/50 space-y-1">
          <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
            {t('deadlinesTracker.tabCompleted')}
          </div>
          <div className="text-xl sm:text-2xl font-mono font-black text-emerald-400">
            {completedItems.length}
          </div>
        </div>
      </div>

      {/* 3. CONTROLS: TABS, CASE FILTER & SORT */}
      <div className="space-y-4">
        {/* Navigation Tabs */}
        <Tabs
          tabs={tabsList}
          activeTab={activeTab}
          onChange={(id) => setActiveTab(id as typeof activeTab)}
          variant="pill"
        />

        {/* Filter by Case & Sort Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted shrink-0" />
            <select
              value={selectedCaseFilter}
              onChange={(e) => setSelectedCaseFilter(e.target.value)}
              className="bg-navy-800 border border-navy-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-hidden focus:border-saffron cursor-pointer"
            >
              <option value="all">{t('deadlinesTracker.filterAllCases')}</option>
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  FIR {c.firNo} ({c.policeStation}) - {c.caseNo}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => setSortByDueAsc((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-navy-800 hover:bg-navy-700 border border-navy-700 text-xs text-slate-300 hover:text-white transition-colors"
          >
            <span>{t('deadlinesTracker.sortByDue')}</span>
            <span className="font-mono text-saffron">
              {sortByDueAsc ? '↑ Earliest' : '↓ Latest'}
            </span>
          </button>
        </div>
      </div>

      {/* 4. DEADLINE ITEMS LIST */}
      <div className="space-y-3">
        {displayedItems.length === 0 ? (
          <EmptyState
            icon={
              activeTab === 'overdue' ? (
                <ShieldCheck className="w-12 h-12 text-emerald-400" />
              ) : (
                <Clock className="w-12 h-12 text-muted" />
              )
            }
            title={t('deadlinesTracker.noDeadlinesInTab')}
            description={t('deadlinesTracker.noDeadlinesDesc')}
          />
        ) : (
          displayedItems.map((item) => {
            // Urgency color coding: red overdue, saffron due soon, white upcoming, green completed
            const isOverdue = item.status === 'overdue';
            const isDueSoon = item.status === 'due_soon';
            const isCompleted = item.status === 'completed';

            const borderClass = isOverdue
              ? 'border-l-4 border-l-danger border-navy-700 bg-navy-800/90 hover:bg-navy-800'
              : isDueSoon
              ? 'border-l-4 border-l-saffron border-navy-700 bg-navy-800/90 hover:bg-navy-800'
              : isCompleted
              ? 'border-l-4 border-l-emerald-500 border-navy-700/60 bg-navy-900/60 opacity-90'
              : 'border-l-4 border-l-slate-400 border-navy-700 bg-navy-800/90 hover:bg-navy-800';

            const countdownText =
              language === 'mr' ? item.remainingTimeText_mr : item.remainingTimeText_en;

            return (
              <Card
                key={`${item.caseId}_${item.ruleId}`}
                onClick={() => handleOpenDetail(item)}
                className={`p-4 sm:p-5 transition-all cursor-pointer rounded-2xl shadow-xs ${borderClass}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Left: Case & Offence Meta, Rule Label, Legal Ref */}
                  <div className="space-y-2 min-w-0 flex-1">
                    {/* Top Case Identification Strip */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-bold text-white">
                        FIR {item.firNo}
                      </span>
                      <span className="text-muted">•</span>
                      <span className="text-slate-300">
                        {item.caseNo}
                      </span>
                      <span className="text-muted">•</span>
                      <span className="text-muted">
                        {item.policeStation}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-navy-900 border border-saffron/30 text-[11px] font-mono text-saffron font-bold">
                        BNS {item.bnsSection}
                      </span>
                    </div>

                    {/* Deadline Title / Label */}
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                        <span>{language === 'mr' ? item.label_mr : item.label_en}</span>
                      </h3>
                      <p className="text-xs text-slate-300 truncate max-w-xl">
                        {language === 'mr' ? item.legalRef.summary_mr : item.legalRef.summary_en}
                      </p>
                    </div>

                    {/* Legal Provision & Limitation Chips */}
                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      <span className="px-2 py-0.5 rounded-md bg-navy-900 border border-navy-600 text-[11px] font-mono font-semibold text-slate-200">
                        {item.legalRef.act} {item.legalRef.section}
                        {item.legalRef.subSection ? `(${item.legalRef.subSection})` : ''}
                      </span>

                      <span className="text-xs text-muted flex items-center gap-1 font-mono">
                        <Calendar className="w-3.5 h-3.5 text-muted" />
                        <span>{t('deadlinesTracker.dueAtLabel')}:</span>{' '}
                        <span className="text-white font-medium">
                          {formatDateTime(item.dueAt)}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Right: Urgency Countdown & Action Indicator */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-navy-700/60">
                    {/* Countdown Badge */}
                    <div className="flex items-center gap-1.5">
                      {isOverdue && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-danger/20 border border-danger/40 text-danger-light text-xs font-mono font-bold animate-pulse">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>{countdownText}</span>
                        </span>
                      )}

                      {isDueSoon && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-saffron/20 border border-saffron/40 text-saffron text-xs font-mono font-bold">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{countdownText}</span>
                        </span>
                      )}

                      {!isOverdue && !isDueSoon && !isCompleted && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-navy-900 border border-navy-600 text-slate-200 text-xs font-mono font-medium">
                          <Clock className="w-3.5 h-3.5 text-muted" />
                          <span>{countdownText}</span>
                        </span>
                      )}

                      {isCompleted && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-950/60 border border-emerald-700/60 text-emerald-300 text-xs font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{t('deadlinesTracker.tabCompleted')}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-xs text-saffron font-semibold sm:mt-1">
                      <span>{isCompleted ? 'View' : t('deadlinesTracker.markDoneBtn')}</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* 5. BOTTOM SHEET: DETAILS & MARK COMPLIANCE */}
      <BottomSheet
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title={
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-saffron shrink-0" />
            <span className="font-bold text-white text-base">
              {selectedItem ? (language === 'mr' ? selectedItem.label_mr : selectedItem.label_en) : ''}
            </span>
          </div>
        }
      >
        {selectedItem && (
          <div className="space-y-5 p-1">
            {/* Case & Offence Summary Strip */}
            <div className="p-3.5 rounded-2xl bg-navy-900 border border-navy-700 flex items-center justify-between gap-3">
              <div className="space-y-0.5 min-w-0">
                <div className="text-xs font-bold text-white">
                  FIR {selectedItem.firNo} • Case {selectedItem.caseNo}
                </div>
                <div className="text-[11px] text-muted truncate">
                  {selectedItem.policeStation} • {selectedItem.offenceTitle_en} (BNS {selectedItem.bnsSection})
                </div>
              </div>

              <Button
                variant="secondary"
                size="sm"
                icon={<ExternalLink className="w-3.5 h-3.5" />}
                onClick={() => navigate(`/cases/${selectedItem.caseId}`)}
              >
                {t('deadlinesTracker.openCaseFileBtn')}
              </Button>
            </div>

            {/* Statutory Rationale & Explanation Card */}
            <div className="p-4 rounded-2xl bg-navy-900 border border-navy-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-saffron flex items-center gap-1.5 uppercase tracking-wider">
                  <Scale className="w-4 h-4 text-saffron" />
                  <span>{t('deadlinesTracker.statutoryRationale')}</span>
                </span>
                <Badge variant="warning" size="sm">
                  {t('deadlinesTracker.seedRuleBadge')}
                </Badge>
              </div>

              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                {language === 'mr' ? selectedItem.legalRef.summary_mr : selectedItem.legalRef.summary_en}
              </p>

              <div className="pt-2 border-t border-navy-700/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-mono text-saffron font-bold">
                  {selectedItem.legalRef.act} Section {selectedItem.legalRef.section}
                  {selectedItem.legalRef.subSection ? `(${selectedItem.legalRef.subSection})` : ''}
                </span>
                <span className="text-muted">
                  {language === 'mr' ? selectedItem.legalRef.title_mr : selectedItem.legalRef.title_en}
                </span>
              </div>
            </div>

            {/* Time Clocks Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-navy-900 border border-navy-700 space-y-1">
                <div className="text-muted font-medium">
                  {t('deadlinesTracker.triggeredOnLabel')}
                </div>
                <div className="font-semibold text-white">
                  {formatDateTime(selectedItem.triggerDateTime)}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-navy-900 border border-navy-700 space-y-1">
                <div className="text-muted font-medium">
                  {t('deadlinesTracker.dueAtLabel')}
                </div>
                <div className="font-semibold text-white">
                  {formatDateTime(selectedItem.dueAt)}
                </div>
              </div>
            </div>

            {/* Compliance Form or Status */}
            {selectedItem.status === 'completed' ? (
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-700/60 space-y-3">
                <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>
                    {t('deadlinesTracker.completedAt', {
                      time: formatDateTime(selectedItem.completedAt || selectedItem.dueAt),
                    })}
                  </span>
                </div>

                {selectedItem.completedNote && (
                  <p className="text-xs text-slate-300">
                    <span className="text-muted">Note:</span> {selectedItem.completedNote}
                  </p>
                )}

                <Button
                  variant="secondary"
                  size="sm"
                  icon={<RotateCcw className="w-3.5 h-3.5" />}
                  loading={isSubmitting}
                  onClick={handleConfirmRevert}
                >
                  {t('deadlinesTracker.revertToPendingBtn')}
                </Button>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-navy-900 border border-navy-700 space-y-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>{t('deadlinesTracker.markDoneTitle')}</span>
                </h4>

                <p className="text-xs text-muted leading-relaxed">
                  {t('deadlinesTracker.markDoneDesc')}
                </p>

                {/* Completion Date Time Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    {t('deadlinesTracker.completionDateLabel')}
                  </label>
                  <input
                    type="datetime-local"
                    value={completionDateTime}
                    onChange={(e) => setCompletionDateTime(e.target.value)}
                    className="w-full bg-navy-800 border border-navy-600 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-saffron"
                  />
                </div>

                {/* Optional Note / Case Diary GD Ref */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    {t('deadlinesTracker.completionNoteLabel')}
                  </label>
                  <input
                    type="text"
                    value={completionNote}
                    onChange={(e) => setCompletionNote(e.target.value)}
                    placeholder="e.g. Produced before JMFC Court 2, GD entry #42"
                    className="w-full bg-navy-800 border border-navy-600 rounded-xl px-3 py-2 text-xs text-white placeholder-muted focus:outline-hidden focus:border-saffron"
                  />
                </div>

                {/* Checkbox: Also log case event */}
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-200">
                  <input
                    type="checkbox"
                    checked={logCaseEventCheck}
                    onChange={(e) => setLogCaseEventCheck(e.target.checked)}
                    className="w-4 h-4 rounded text-saffron bg-navy-800 border-navy-600 focus:ring-0 cursor-pointer"
                  />
                  <span>{t('deadlinesTracker.logEventOption')}</span>
                </label>

                {/* Action Button */}
                <Button
                  variant="primary"
                  size="md"
                  icon={<Check className="w-4 h-4" />}
                  loading={isSubmitting}
                  onClick={handleConfirmMarkDone}
                  className="w-full"
                >
                  {t('deadlinesTracker.save')}
                </Button>
              </div>
            )}
          </div>
        )}
      </BottomSheet>
    </div>
  );
};
