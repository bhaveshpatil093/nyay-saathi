import React, { useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  useLiveData,
  listCases,
  listAllEvidence,
  listAllChecklistRuns,
  getProfile,
  getDatabase,
  seedSampleStationData,
} from '../lib/db/index.ts';
import { useToast } from '../components/ui/Toast.tsx';
import { computeAllDeadlines, DeadlineItem } from '../lib/deadlines/index.ts';
import { CaseEventRecord } from '../types/database.ts';
import { SAMPLE_OFFENCES } from '../data/offences.ts';
import { POLICE_RANKS, MAHARASHTRA_DISTRICTS } from '../data/districts.ts';
import { useI18n } from '../i18n/index.ts';
import { useApp } from '../context/AppContext.tsx';
import { PWAInstallBanner } from '../components/pwa/PWAInstallBanner.tsx';
import {

  Card,
  SectionTitle,
  Button,
  Badge,
  ListItem,
  ProgressRing,
  Skeleton,
  EmptyState,
} from '../components/ui/index.ts';
import {
  Briefcase,
  BookOpen,
  Camera,
  ShieldCheck,
  FileText,
  Search,
  Plus,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  MapPin,
  ChevronRight,
  FolderOpen,
  Layers,
  ArrowRight,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { useDemo } from '../context/DemoContext.tsx';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { startDemo } = useDemo();
  const { language, t, formatDate, formatNumber } = useI18n();
  const { profile: contextProfile } = useApp();
  const { success: toastSuccess, error: toastError } = useToast();

  const handleSeedSample = async () => {
    try {
      const res = await seedSampleStationData();
      toastSuccess(
        language === 'mr' ? 'नमुना डेटा लोड केला' : 'Sample Data Loaded',
        language === 'mr' ? `${res.casesCount} प्रकरणे व पुरावे जोडले.` : `Loaded ${res.casesCount} sample cases.`
      );
    } catch (err) {
      toastError('Failed to load sample data', String(err));
    }
  };

  // 1. Live Data Subscriptions
  const { data: dbProfile, loading: loadingProfile } = useLiveData(
    () => getProfile(),
    ['profile']
  );

  const { data: cases = [], loading: loadingCases } = useLiveData(
    () => listCases('all'),
    ['cases']
  );

  const { data: allEvidence = [], loading: loadingEvidence } = useLiveData(
    () => listAllEvidence(),
    ['evidence']
  );

  const { data: allChecklistRuns = [], loading: loadingRuns } = useLiveData(
    () => listAllChecklistRuns(),
    ['checklistRuns']
  );

  const { data: allCaseEvents = [] } = useLiveData<CaseEventRecord[]>(
    async () => {
      const db = await getDatabase();
      return db.getAll('caseEvents');
    },
    ['caseEvents']
  );

  const isLoading = loadingCases || loadingEvidence || loadingRuns;

  // Active officer profile (fall back to context or defaults)
  const officerName = dbProfile?.name || contextProfile?.fullName || '';
  const officerRank = dbProfile?.rank || contextProfile?.rank || '';
  const officerStation = dbProfile?.station || contextProfile?.stationName || '';
  const officerDistrict = dbProfile?.district || contextProfile?.district || '';

  // Bilingual rank label lookup
  const rankLabel = useMemo(() => {
    if (!officerRank) return '';
    const match = POLICE_RANKS.find((r) => r.value === officerRank);
    if (!match) return officerRank.toUpperCase();
    return language === 'mr' ? match.labelMr : match.labelEn;
  }, [officerRank, language]);

  // Bilingual district label lookup
  const districtLabel = useMemo(() => {
    if (!officerDistrict) return '';
    const match = MAHARASHTRA_DISTRICTS.find((d) => d.value === officerDistrict);
    if (!match) return officerDistrict;
    return language === 'mr' ? match.labelMr : match.labelEn;
  }, [officerDistrict, language]);

  // Greeting title text
  const greetingText = useMemo(() => {
    if (officerName) {
      return t('home.greeting', {
        rank: rankLabel || '',
        name: officerName,
      });
    }
    return t('home.greetingDefault');
  }, [officerName, rankLabel, t]);

  // Formatted current date
  const todayFormatted = useMemo(() => {
    return formatDate(new Date(), {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, [formatDate]);

  // Group events by caseId
  const eventsByCase = useMemo(() => {
    const map: Record<string, CaseEventRecord[]> = {};
    for (const ev of allCaseEvents) {
      if (!map[ev.caseId]) map[ev.caseId] = [];
      map[ev.caseId].push(ev);
    }
    return map;
  }, [allCaseEvents]);

  // 2. Deadline Calculations for active cases
  const calculatedDeadlines = useMemo<DeadlineItem[]>(() => {
    if (cases.length === 0) return [];
    return computeAllDeadlines(cases, eventsByCase);
  }, [cases, eventsByCase]);

  // Count overdue and due within 24 hours
  const overdueCount = useMemo(
    () => calculatedDeadlines.filter((d) => d.status === 'overdue').length,
    [calculatedDeadlines]
  );

  const dueSoon24hCount = useMemo(
    () => calculatedDeadlines.filter((d) => d.status === 'due_soon').length,
    [calculatedDeadlines]
  );

  const deadlinesDueThisWeekCount = useMemo(
    () =>
      calculatedDeadlines.filter(
        (d) => d.status !== 'completed' && d.hoursRemaining <= 24 * 7
      ).length,
    [calculatedDeadlines]
  );

  // 3. Stats
  const openCasesCount = useMemo(
    () => cases.filter((c) => c.status === 'open').length,
    [cases]
  );

  // Checklists in progress (has at least 1 step pending)
  const inProgressChecklistsCount = useMemo(() => {
    if (allChecklistRuns.length === 0) return 0;
    return allChecklistRuns.filter((run) => {
      const totalSteps = run.steps.length;
      if (totalSteps === 0) return false;
      const doneSteps = run.steps.filter((s) => s.done).length;
      return doneSteps < totalSteps;
    }).length;
  }, [allChecklistRuns]);

  // Map checklist runs by caseId for quick lookup
  const checklistMap = useMemo(() => {
    const map = new Map<string, { total: number; completed: number; percent: number }>();
    for (const run of allChecklistRuns) {
      const total = run.steps.length;
      const completed = run.steps.filter((s) => s.done).length;
      const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
      map.set(run.caseId, { total, completed, percent });
    }
    return map;
  }, [allChecklistRuns]);

  // 4. Recent Items (last 3 cases and last 3 evidence)
  const recentCases = useMemo(() => {
    return [...cases].reverse().slice(0, 3);
  }, [cases]);

  const recentEvidence = useMemo(() => {
    return [...allEvidence].reverse().slice(0, 3);
  }, [allEvidence]);

  // Check if completely empty state
  const isBrandNewUser = !isLoading && cases.length === 0 && allEvidence.length === 0;

  return (
    <div className="flex-1 flex flex-col p-3.5 sm:p-6 gap-6 text-white max-w-5xl mx-auto w-full pb-12">
      {/* PWA Install Prompt Banner (dismissible) */}
      <PWAInstallBanner variant="banner" />

      {/* 1. Greeting Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy-800 to-navy-900 border border-navy-600/80 p-4 sm:p-5 shadow-lg">

        {loadingProfile ? (
          <div className="flex flex-col gap-2.5">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-snug">
                  {greetingText}
                </h1>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-300 mt-1 flex-wrap">
                  <span className="flex items-center gap-1 font-medium text-slate-200">
                    <MapPin className="w-3.5 h-3.5 text-saffron shrink-0" />
                    <span>{officerStation || t('home.policeStationFallback')}</span>
                  </span>
                  {districtLabel && (
                    <>
                      <span className="text-navy-500">•</span>
                      <span className="text-slate-300">{districtLabel}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Date with subtle calendar icon & Start 2-min demo button */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted mt-3 pt-2 border-t border-navy-700/60">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-muted shrink-0" />
                <span>{todayFormatted}</span>
              </div>

              <button
                type="button"
                onClick={startDemo}
                className="px-3 py-1.5 rounded-xl bg-saffron text-navy-900 font-bold text-xs hover:bg-amber-400 transition-all flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
                title="Walk through the 7-step pitch demo"
              >
                <Sparkles className="w-3.5 h-3.5 text-navy-950" />
                <span>{language === 'mr' ? '२-मिनिटांचे प्रात्यक्षिक' : 'Start 2-minute demo'}</span>
              </button>
            </div>

            {/* Small Saffron Accent Line */}
            <div className="mt-2.5 h-1 w-12 rounded-full bg-saffron shadow-xs shadow-saffron/40" />
          </div>
        )}
      </div>

      {/* 2. Alert Strip (Red for overdue, Saffron for due in 24h) */}
      {(overdueCount > 0 || dueSoon24hCount > 0) && (
        <div
          role="alert"
          className={`flex items-center justify-between gap-3 p-3.5 rounded-xl border transition-all animate-fadeIn ${
            overdueCount > 0
              ? 'bg-danger/15 border-danger/40 text-danger-light'
              : 'bg-saffron/15 border-saffron/40 text-saffron'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {overdueCount > 0 ? (
              <ShieldAlert className="w-5 h-5 text-danger shrink-0 animate-pulse" />
            ) : (
              <Clock className="w-5 h-5 text-saffron shrink-0" />
            )}
            <div className="text-xs sm:text-sm font-semibold truncate leading-tight">
              {overdueCount > 0
                ? overdueCount === 1
                  ? t('home.alertOverdue', { count: formatNumber(overdueCount) })
                  : t('home.alertOverduePlural', { count: formatNumber(overdueCount) })
                : dueSoon24hCount === 1
                ? t('home.alertDueSoon', { count: formatNumber(dueSoon24hCount) })
                : t('home.alertDueSoonPlural', { count: formatNumber(dueSoon24hCount) })}
            </div>
          </div>

          <Button
            size="sm"
            variant={overdueCount > 0 ? 'danger' : 'secondary'}
            onClick={() => navigate('/deadlines')}
            className="shrink-0 text-xs py-1.5 px-3 whitespace-nowrap"
          >
            {t('home.viewDeadlines')}
          </Button>
        </div>
      )}

      {/* 3. Quick Actions Grid (2 columns, large tiles with icons) */}
      <div className="flex flex-col gap-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted px-0.5">
          {t('home.quickActions')}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
          {/* Action 1: New Case */}
          <button
            type="button"
            onClick={() => navigate('/cases/new')}
            className="flex flex-col items-start p-3.5 rounded-xl border border-navy-600 bg-navy-700/80 hover:bg-navy-600 active:scale-[0.98] transition-all text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron"
          >
            <div className="w-10 h-10 rounded-xl bg-saffron/20 border border-saffron/30 flex items-center justify-center text-saffron mb-2.5 group-hover:scale-105 transition-transform">
              <Plus className="w-5 h-5" />
            </div>
            <span className="font-bold text-sm text-white group-hover:text-saffron transition-colors leading-tight">
              {t('home.actionNewCase')}
            </span>
            <span className="text-[11px] text-muted mt-0.5 line-clamp-1 leading-tight">
              {t('home.actionNewCaseDesc')}
            </span>
          </button>

          {/* Action 2: Procedure Guide */}
          <button
            type="button"
            onClick={() => navigate('/guide')}
            className="flex flex-col items-start p-3.5 rounded-xl border border-navy-600 bg-navy-700/80 hover:bg-navy-600 active:scale-[0.98] transition-all text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron"
          >
            <div className="w-10 h-10 rounded-xl bg-navy-600/80 border border-navy-500/50 flex items-center justify-center text-saffron mb-2.5 group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="font-bold text-sm text-white group-hover:text-saffron transition-colors leading-tight">
              {t('home.actionGuide')}
            </span>
            <span className="text-[11px] text-muted mt-0.5 line-clamp-1 leading-tight">
              {t('home.actionGuideDesc')}
            </span>
          </button>

          {/* Action 3: Add Evidence */}
          <button
            type="button"
            onClick={() => navigate('/evidence/new')}
            className="flex flex-col items-start p-3.5 rounded-xl border border-navy-600 bg-navy-700/80 hover:bg-navy-600 active:scale-[0.98] transition-all text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron"
          >
            <div className="w-10 h-10 rounded-xl bg-navy-600/80 border border-navy-500/50 flex items-center justify-center text-india-green-light mb-2.5 group-hover:scale-105 transition-transform">
              <Camera className="w-5 h-5" />
            </div>
            <span className="font-bold text-sm text-white group-hover:text-saffron transition-colors leading-tight">
              {t('home.actionAddEvidence')}
            </span>
            <span className="text-[11px] text-muted mt-0.5 line-clamp-1 leading-tight">
              {t('home.actionAddEvidenceDesc')}
            </span>
          </button>

          {/* Action 4: Verify File */}
          <button
            type="button"
            onClick={() => navigate('/verify')}
            className="flex flex-col items-start p-3.5 rounded-xl border border-navy-600 bg-navy-700/80 hover:bg-navy-600 active:scale-[0.98] transition-all text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron"
          >
            <div className="w-10 h-10 rounded-xl bg-navy-600/80 border border-navy-500/50 flex items-center justify-center text-saffron mb-2.5 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="font-bold text-sm text-white group-hover:text-saffron transition-colors leading-tight">
              {t('home.actionVerify')}
            </span>
            <span className="text-[11px] text-muted mt-0.5 line-clamp-1 leading-tight">
              {t('home.actionVerifyDesc')}
            </span>
          </button>

          {/* Action 5: Documents */}
          <button
            type="button"
            onClick={() => navigate('/documents')}
            className="flex flex-col items-start p-3.5 rounded-xl border border-navy-600 bg-navy-700/80 hover:bg-navy-600 active:scale-[0.98] transition-all text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron"
          >
            <div className="w-10 h-10 rounded-xl bg-navy-600/80 border border-navy-500/50 flex items-center justify-center text-blue-400 mb-2.5 group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <span className="font-bold text-sm text-white group-hover:text-saffron transition-colors leading-tight">
              {t('home.actionDocuments')}
            </span>
            <span className="text-[11px] text-muted mt-0.5 line-clamp-1 leading-tight">
              {t('home.actionDocumentsDesc')}
            </span>
          </button>

          {/* Action 6: Search Law */}
          <button
            type="button"
            onClick={() => navigate('/search')}
            className="flex flex-col items-start p-3.5 rounded-xl border border-navy-600 bg-navy-700/80 hover:bg-navy-600 active:scale-[0.98] transition-all text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron"
          >
            <div className="w-10 h-10 rounded-xl bg-navy-600/80 border border-navy-500/50 flex items-center justify-center text-purple-400 mb-2.5 group-hover:scale-105 transition-transform">
              <Search className="w-5 h-5" />
            </div>
            <span className="font-bold text-sm text-white group-hover:text-saffron transition-colors leading-tight">
              {t('home.actionSearchLaw')}
            </span>
            <span className="text-[11px] text-muted mt-0.5 line-clamp-1 leading-tight">
              {t('home.actionSearchLawDesc')}
            </span>
          </button>
        </div>
      </div>

      {/* 4. Summary Tiles (Live read from IndexedDB) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Open Cases */}
        <div
          onClick={() => navigate('/cases')}
          className="p-3.5 rounded-xl border border-navy-600/70 bg-navy-800/80 hover:bg-navy-700/80 cursor-pointer transition-colors flex flex-col justify-between min-h-[92px]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted font-medium">{t('home.statOpenCases')}</span>
            <Briefcase className="w-4 h-4 text-saffron shrink-0" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-white">
            {isLoading ? <Skeleton className="h-7 w-12" /> : formatNumber(openCasesCount)}
          </div>
        </div>

        {/* Evidence Items */}
        <div
          onClick={() => navigate('/evidence')}
          className="p-3.5 rounded-xl border border-navy-600/70 bg-navy-800/80 hover:bg-navy-700/80 cursor-pointer transition-colors flex flex-col justify-between min-h-[92px]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted font-medium">{t('home.statEvidenceItems')}</span>
            <Camera className="w-4 h-4 text-india-green shrink-0" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-white">
            {isLoading ? <Skeleton className="h-7 w-12" /> : formatNumber(allEvidence.length)}
          </div>
        </div>

        {/* Checklists in Progress */}
        <div
          onClick={() => navigate('/guide')}
          className="p-3.5 rounded-xl border border-navy-600/70 bg-navy-800/80 hover:bg-navy-700/80 cursor-pointer transition-colors flex flex-col justify-between min-h-[92px]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted font-medium">{t('home.statChecklists')}</span>
            <Layers className="w-4 h-4 text-blue-400 shrink-0" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-white">
            {isLoading ? <Skeleton className="h-7 w-12" /> : formatNumber(inProgressChecklistsCount)}
          </div>
        </div>

        {/* Deadlines Due This Week */}
        <div
          onClick={() => navigate('/deadlines')}
          className="p-3.5 rounded-xl border border-navy-600/70 bg-navy-800/80 hover:bg-navy-700/80 cursor-pointer transition-colors flex flex-col justify-between min-h-[92px]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted font-medium">{t('home.statDeadlinesThisWeek')}</span>
            <Clock className={`w-4 h-4 shrink-0 ${deadlinesDueThisWeekCount > 0 ? 'text-danger' : 'text-saffron'}`} />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-white">
            {isLoading ? (
              <Skeleton className="h-7 w-12" />
            ) : (
              <span className={deadlinesDueThisWeekCount > 0 ? 'text-danger-light' : 'text-white'}>
                {formatNumber(deadlinesDueThisWeekCount)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 5. Empty State for Brand New User OR Recent Sections */}
      {isBrandNewUser ? (
        <div className="rounded-2xl border border-dashed border-navy-600 bg-navy-800/50 p-6 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-saffron/15 border border-saffron/30 flex items-center justify-center text-saffron mb-3">
            <FolderOpen className="w-7 h-7" />
          </div>
          <h2 className="text-base font-bold text-white">{t('home.emptyTitle')}</h2>
          <p className="text-xs text-muted max-w-sm mt-1.5 leading-relaxed">
            {t('home.emptyDesc')}
          </p>

          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('/cases/new')}
            className="mt-4 w-full sm:w-auto"
            icon={<Plus className="w-4 h-4" />}
          >
            {t('home.createFirstCase')}
          </Button>

          {/* Start 2-minute demo button */}
          <button
            type="button"
            onClick={startDemo}
            className="mt-3 px-4 py-2 rounded-xl bg-saffron/20 border border-saffron/50 text-saffron font-bold text-xs hover:bg-saffron hover:text-navy-900 transition-all flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            <span>{language === 'mr' ? '२-मिनिटांचे प्रात्यक्षिक सुरू करा' : 'Start 2-minute demo'}</span>
          </button>

          {/* Sample Data link */}
          <div className="mt-3 text-xs text-muted flex items-center gap-1.5">
            <span>{t('home.loadSampleData')}:</span>
            <button
              type="button"
              onClick={handleSeedSample}
              className="text-xs text-saffron underline hover:text-amber-300 font-medium cursor-pointer"
            >
              {language === 'mr' ? 'नमुना ठाणे डेटा लोड करा' : 'Load Demo Caseload'}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 5. Recent Cases (Last 3) */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between px-0.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                {t('home.recentCases')}
              </span>
              <button
                type="button"
                onClick={() => navigate('/cases')}
                className="text-xs text-saffron hover:underline flex items-center gap-1 font-medium focus-visible:outline-none"
              >
                <span>{t('home.viewAllCases')}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {loadingCases ? (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : recentCases.length === 0 ? (
              <div className="p-4 rounded-xl border border-navy-600 bg-navy-800/60 text-xs text-muted text-center">
                {t('home.noRecentCases')}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {recentCases.map((c) => {
                  const primaryOffenceId = c.offenceIds?.[0];
                  const offence = SAMPLE_OFFENCES.find((o) => o.id === primaryOffenceId);
                  const offenceTitle = offence
                    ? language === 'mr'
                      ? offence.title_mr
                      : offence.title_en
                    : c.provisions?.[0]?.section
                    ? `BNS ${c.provisions[0].section}`
                    : c.caseNo;

                  const checklistStats = checklistMap.get(c.id) || { percent: 0 };

                  return (
                    <ListItem
                      key={c.id}
                      onClick={() => navigate(`/cases/${c.id}`)}
                      icon={<Briefcase className="w-5 h-5 text-saffron" />}
                      title={
                        <div className="flex items-center gap-2">
                          <span className="truncate">{offenceTitle}</span>
                          <span className="text-xs font-mono font-normal text-muted">
                            ({c.firNo || c.caseNo})
                          </span>
                        </div>
                      }
                      subtitle={
                        <div className="flex items-center gap-2 text-xs text-muted">
                          <span>{formatDate(c.firDateTime || c.createdAt)}</span>
                          <span>•</span>
                          <span>{c.policeStation || officerStation || 'Station PS'}</span>
                        </div>
                      }
                      trailing={
                        <div
                          className="flex items-center gap-2"
                          title={t('home.progressTooltip', {
                            percent: formatNumber(checklistStats.percent),
                          })}
                        >
                          <ProgressRing
                            value={checklistStats.percent}
                            size={36}
                            strokeWidth={3.5}
                            color={checklistStats.percent === 100 ? 'green' : 'saffron'}
                          >
                            <span className="text-[10px] font-mono text-white">
                              {checklistStats.percent}%
                            </span>
                          </ProgressRing>
                        </div>
                      }
                      showChevron
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* 6. Recent Evidence (Last 3) */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between px-0.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                {t('home.recentEvidence')}
              </span>
              <button
                type="button"
                onClick={() => navigate('/evidence')}
                className="text-xs text-saffron hover:underline flex items-center gap-1 font-medium focus-visible:outline-none"
              >
                <span>{t('home.viewAllEvidence')}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {loadingEvidence ? (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : recentEvidence.length === 0 ? (
              <div className="p-4 rounded-xl border border-navy-600 bg-navy-800/60 text-xs text-muted text-center">
                {t('home.noRecentEvidence')}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {recentEvidence.map((ev) => (
                  <ListItem
                    key={ev.id}
                    onClick={() => navigate(`/evidence/${ev.id}`)}
                    icon={<Camera className="w-5 h-5 text-india-green" />}
                    title={
                      <div className="flex items-center gap-2">
                        <span className="truncate">{ev.fileName}</span>
                      </div>
                    }
                    subtitle={
                      <div className="flex items-center gap-2 text-xs text-muted">
                        <span className="font-mono text-saffron font-medium">
                          {ev.exhibitNo}
                        </span>
                        <span>•</span>
                        <span>{formatDate(ev.loggedAt)}</span>
                      </div>
                    }
                    trailing={
                      <Badge variant="success" className="text-[10px] px-2 py-0.5 whitespace-nowrap">
                        <CheckCircle2 className="w-3 h-3 mr-1 inline" />
                        {t('home.hashRecordedBadge')}
                      </Badge>
                    }
                    showChevron
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 7. Footer Card: Disclaimer Text and Legal Review Note */}
      <div className="mt-2 rounded-xl bg-navy-900/90 border border-navy-700/80 p-3.5 flex flex-col gap-2 text-xs text-muted">
        <div className="flex items-center gap-1.5 font-semibold text-slate-300">
          <Badge variant="warning" className="text-[10px] px-1.5 py-0.2">
            {t('common.pendingReview')}
          </Badge>
          <span>•</span>
          <span>{t('common.tagline')}</span>
        </div>
        <p className="text-[11px] leading-relaxed text-slate-400">
          {t('common.decisionSupport')}
        </p>
      </div>
    </div>
  );
};
