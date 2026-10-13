import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  useLiveData,
  listCases,
  listAllChecklistRuns,
} from '../../lib/db/index.ts';
import { CaseRecord, ChecklistRunRecord } from '../../types/database.ts';
import { SAMPLE_OFFENCES } from '../../data/offences.ts';
import { calculateCaseDeadlines } from '../../lib/procedure/deadlines.ts';
import { useI18n, formatDate } from '../../i18n/index.ts';
import {
  SearchBar,
  Chip,
  Badge,
  ProgressRing,
  Button,
  EmptyState,
  Skeleton,
} from '../../components/ui/index.ts';
import {
  Plus,
  Briefcase,
  AlertCircle,
  Clock,
  ArrowUpDown,
  FileText,
  User,
  Users,
  Calendar,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

export const CasesListPage: React.FC = () => {
  const { t, language } = useI18n();
  const navigate = useNavigate();

  // Search, filter & sort states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'chargesheeted' | 'closed' | 'sample'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'deadline'>('newest');

  // Live data subscriptions
  const { data: cases, loading: casesLoading } = useLiveData<CaseRecord[]>(
    () => listCases('all'),
    ['cases'],
    []
  );

  const { data: allChecklistRuns } = useLiveData<ChecklistRunRecord[]>(
    () => listAllChecklistRuns(),
    ['checklistRuns'],
    []
  );

  // Map latest checklist progress by caseId
  const checklistProgressMap = useMemo(() => {
    const map = new Map<string, number>();
    if (!allChecklistRuns) return map;

    for (const run of allChecklistRuns) {
      if (!run.steps || run.steps.length === 0) {
        map.set(run.caseId, 0);
        continue;
      }
      const doneCount = run.steps.filter((s) => s.done).length;
      const pct = Math.round((doneCount / run.steps.length) * 100);
      // Store the highest or latest progress
      const existing = map.get(run.caseId) ?? 0;
      map.set(run.caseId, Math.max(existing, pct));
    }
    return map;
  }, [allChecklistRuns]);

  // Pre-calculate overdue status and nearest deadline for all cases
  const caseDeadlineInfo = useMemo(() => {
    if (!cases) return { overdueMap: new Map<string, boolean>(), minHoursMap: new Map<string, number>() };
    const deadlines = calculateCaseDeadlines(cases);
    const overdueMap = new Map<string, boolean>();
    const minHoursMap = new Map<string, number>();

    for (const d of deadlines) {
      if (d.isOverdue) {
        overdueMap.set(d.caseId, true);
      }
      const currentMin = minHoursMap.get(d.caseId);
      if (currentMin === undefined || d.hoursRemaining < currentMin) {
        minHoursMap.set(d.caseId, d.hoursRemaining);
      }
    }
    return { overdueMap, minHoursMap };
  }, [cases]);

  // Filtered and sorted cases
  const filteredCases = useMemo(() => {
    if (!cases) return [];

    let list = cases.filter((c) => {
      // Status filter
      if (statusFilter === 'sample') {
        if (!c.isSample) return false;
      } else if (statusFilter !== 'all') {
        if (c.status !== statusFilter) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const caseNo = (c.caseNo || '').toLowerCase();
        const firNo = (c.firNo || '').toLowerCase();
        const complainant = (c.complainantName || '').toLowerCase();
        const accused = (c.accusedNames || []).join(' ').toLowerCase();
        const station = (c.policeStation || '').toLowerCase();

        // Check matching offence titles
        const offences = (c.offenceIds || []).map((id) => {
          const off = SAMPLE_OFFENCES.find((o) => o.id === id);
          return off ? `${off.title_en} ${off.title_mr} ${off.bnsSection} ${off.oldIpcSection}` : '';
        }).join(' ').toLowerCase();

        const matches =
          caseNo.includes(q) ||
          firNo.includes(q) ||
          complainant.includes(q) ||
          accused.includes(q) ||
          station.includes(q) ||
          offences.includes(q);

        if (!matches) return false;
      }

      return true;
    });

    // Sorting
    list = [...list].sort((a, b) => {
      if (sortBy === 'deadline') {
        const hoursA = caseDeadlineInfo.minHoursMap.get(a.id) ?? 999999;
        const hoursB = caseDeadlineInfo.minHoursMap.get(b.id) ?? 999999;
        return hoursA - hoursB;
      }
      // 'newest' default
      const dateA = new Date(a.firDateTime || a.createdAt).getTime();
      const dateB = new Date(b.firDateTime || b.createdAt).getTime();
      return dateB - dateA;
    });

    return list;
  }, [cases, statusFilter, searchQuery, sortBy, caseDeadlineInfo]);

  // Counts for filter chips
  const counts = useMemo(() => {
    if (!cases) return { all: 0, open: 0, chargesheeted: 0, closed: 0, sample: 0 };
    return {
      all: cases.length,
      open: cases.filter((c) => c.status === 'open').length,
      chargesheeted: cases.filter((c) => c.status === 'chargesheeted').length,
      closed: cases.filter((c) => c.status === 'closed').length,
      sample: cases.filter((c) => c.isSample).length,
    };
  }, [cases]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 space-y-6 pb-24 w-full">
      {/* Page Title & Register Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {t('casesManager.title')}
            </h1>
            <Badge variant="neutral" size="md">
              {cases?.length ?? 0}
            </Badge>
          </div>
          <p className="text-sm text-muted mt-1">
            {t('pages.cases.subtitle')}
          </p>
        </div>

        <Button
          variant="primary"
          icon={<Plus className="w-5 h-5" />}
          onClick={() => navigate('/cases/new')}
          className="self-start sm:self-auto shadow-md"
        >
          {t('casesManager.registerNewCase')}
        </Button>
      </div>

      {/* Search and Sort Toolbar */}
      <div className="bg-navy-800/80 border border-navy-700 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <SearchBar
              value={searchQuery}
              onValueChange={setSearchQuery}
              placeholder={t('casesManager.searchPlaceholder')}
            />
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <span className="text-xs text-muted font-medium flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>{language === 'mr' ? 'क्रमवारी:' : 'Sort:'}</span>
            </span>
            <div className="inline-flex rounded-xl bg-navy-900 border border-navy-700 p-0.5">
              <button
                type="button"
                onClick={() => setSortBy('newest')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  sortBy === 'newest'
                    ? 'bg-saffron text-navy-900 font-semibold shadow-xs'
                    : 'text-muted hover:text-white'
                }`}
              >
                {t('casesManager.sortNewest')}
              </button>
              <button
                type="button"
                onClick={() => setSortBy('deadline')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                  sortBy === 'deadline'
                    ? 'bg-saffron text-navy-900 font-semibold shadow-xs'
                    : 'text-muted hover:text-white'
                }`}
              >
                <Clock className="w-3 h-3" />
                <span>{t('casesManager.sortDeadline')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
          <Chip
            selected={statusFilter === 'all'}
            onClick={() => setStatusFilter('all')}
          >
            {t('casesManager.filterAll')} ({counts.all})
          </Chip>
          <Chip
            selected={statusFilter === 'open'}
            onClick={() => setStatusFilter('open')}
          >
            {t('casesManager.filterOpen')} ({counts.open})
          </Chip>
          <Chip
            selected={statusFilter === 'chargesheeted'}
            onClick={() => setStatusFilter('chargesheeted')}
          >
            {t('casesManager.filterChargesheeted')} ({counts.chargesheeted})
          </Chip>
          <Chip
            selected={statusFilter === 'closed'}
            onClick={() => setStatusFilter('closed')}
          >
            {t('casesManager.filterClosed')} ({counts.closed})
          </Chip>
          {counts.sample > 0 && (
            <Chip
              selected={statusFilter === 'sample'}
              onClick={() => setStatusFilter('sample')}
            >
              {t('casesManager.filterSample')} ({counts.sample})
            </Chip>
          )}
        </div>
      </div>

      {/* Loading State */}
      {casesLoading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-navy-800 border border-navy-700 rounded-2xl p-5 space-y-3">
              <div className="flex justify-between items-center">
                <Skeleton className="w-40 h-6" />
                <Skeleton className="w-20 h-6" />
              </div>
              <Skeleton className="w-3/4 h-4" />
              <div className="flex gap-2">
                <Skeleton className="w-24 h-7" />
                <Skeleton className="w-20 h-7" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State - No Cases registered at all */}
      {!casesLoading && cases && cases.length === 0 && (
        <EmptyState
          icon={<Briefcase className="w-12 h-12 text-saffron/80" />}
          title={t('casesManager.emptyTitle')}
          description={t('casesManager.emptyDesc')}
          actionLabel={t('casesManager.createFirstCase')}
          onAction={() => navigate('/cases/new')}
        />
      )}

      {/* Empty State - Filter or Search returned 0 */}
      {!casesLoading && cases && cases.length > 0 && filteredCases.length === 0 && (
        <EmptyState
          icon={<AlertCircle className="w-12 h-12 text-muted" />}
          title={t('casesManager.noCasesFound')}
          description={t('casesManager.noCasesFoundDesc')}
          actionLabel={t('casesManager.clearFilters')}
          onAction={() => {
            setSearchQuery('');
            setStatusFilter('all');
          }}
        />
      )}

      {/* Cases List */}
      {!casesLoading && filteredCases.length > 0 && (
        <div className="space-y-3.5">
          {filteredCases.map((c) => {
            const hasOverdue = caseDeadlineInfo.overdueMap.get(c.id) || false;
            const progress = checklistProgressMap.get(c.id) ?? 0;

            // Offence titles
            const offenceDetails = (c.offenceIds || []).map((id) => {
              const off = SAMPLE_OFFENCES.find((o) => o.id === id);
              return {
                id,
                title: language === 'mr' ? off?.title_mr || off?.title_en || id : off?.title_en || id,
                bnsSection: off?.bnsSection || '',
                oldIpc: off?.oldIpcSection || '',
              };
            });

            const primaryOffence = offenceDetails[0];
            const extraOffencesCount = offenceDetails.length - 1;

            return (
              <div
                key={c.id}
                onClick={() => navigate(`/cases/${c.id}`)}
                className="group relative bg-navy-800 hover:bg-navy-750 border border-navy-700 hover:border-saffron/40 rounded-2xl p-4 sm:p-5 transition-all shadow-sm hover:shadow-md cursor-pointer select-none"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Left: Identifiers, FIR & Accused */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Red overdue alert indicator */}
                      {hasOverdue && (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-danger/20 border border-danger/40 text-danger animate-pulse"
                          title={t('casesManager.overdueBadge')}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-danger"></span>
                          <span>{t('casesManager.overdueBadge')}</span>
                        </span>
                      )}

                      {/* FIR Number */}
                      <span className="font-bold text-base sm:text-lg text-white group-hover:text-saffron transition-colors">
                        FIR: {c.firNo}
                      </span>

                      {/* Case Diary Number */}
                      {c.caseNo && c.caseNo !== c.firNo && (
                        <span className="text-xs font-mono text-muted bg-navy-900/80 px-2 py-0.5 rounded-md border border-navy-700">
                          {c.caseNo}
                        </span>
                      )}

                      {/* Status Badge */}
                      {c.status === 'open' && (
                        <Badge variant="warning" size="sm">
                          {t('casesManager.statusOpen')}
                        </Badge>
                      )}
                      {c.status === 'chargesheeted' && (
                        <Badge variant="info" size="sm">
                          {t('casesManager.statusChargesheeted')}
                        </Badge>
                      )}
                      {c.status === 'closed' && (
                        <Badge variant="neutral" size="sm">
                          {t('casesManager.statusClosed')}
                        </Badge>
                      )}

                      {/* Sample Flag */}
                      {c.isSample && (
                        <Badge variant="neutral" size="sm">
                          {language === 'mr' ? 'नमुना' : 'Sample'}
                        </Badge>
                      )}
                    </div>

                    {/* Primary Offence and Sections */}
                    <div className="flex flex-wrap items-center gap-1.5 text-sm pt-0.5">
                      {primaryOffence ? (
                        <>
                          <span className="font-semibold text-slate-200">
                            {primaryOffence.title}
                          </span>
                          {primaryOffence.bnsSection && (
                            <span className="text-xs font-mono px-2 py-0.5 rounded bg-saffron/15 text-saffron border border-saffron/30">
                              {primaryOffence.bnsSection}
                            </span>
                          )}
                          {extraOffencesCount > 0 && (
                            <span className="text-xs text-muted bg-navy-700 px-1.5 py-0.5 rounded">
                              +{extraOffencesCount} {language === 'mr' ? 'इतर' : 'more'}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-muted text-xs">
                          {language === 'mr' ? 'गुन्हा वर्गवारी नमूद नाही' : 'No offences specified'}
                        </span>
                      )}
                    </div>

                    {/* Parties and Date Meta */}
                    <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-muted pt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-muted shrink-0" />
                        <span>{formatDate(c.firDateTime || c.createdAt)}</span>
                      </span>

                      {c.complainantName && (
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-muted shrink-0" />
                          <span className="truncate max-w-[140px]">
                            {c.complainantName}
                          </span>
                        </span>
                      )}

                      {c.accusedNames && c.accusedNames.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-muted shrink-0" />
                          <span>
                            {c.accusedNames.length === 1
                              ? c.accusedNames[0]
                              : `${c.accusedNames[0]} (+${c.accusedNames.length - 1})`}
                          </span>
                        </span>
                      )}

                      {c.policeStation && (
                        <span className="hidden md:inline-block">
                          • {c.policeStation}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Progress Ring & Navigation Affordance */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-navy-700/60 shrink-0">
                    <div className="flex items-center gap-2.5">
                      <ProgressRing
                        value={progress}
                        size={46}
                        strokeWidth={4.5}
                        color={progress === 100 ? 'green' : 'saffron'}
                      />
                      <div className="flex flex-col text-left">
                        <span className="text-xs font-semibold text-slate-200">
                          {progress}%
                        </span>
                        <span className="text-[10px] text-muted uppercase tracking-wider">
                          {language === 'mr' ? 'तपासणी' : 'Checklist'}
                        </span>
                      </div>
                    </div>

                    <ChevronRight className="w-5 h-5 text-muted group-hover:text-saffron group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Action Button (FAB) */}
      <div className="fixed bottom-20 sm:bottom-8 right-6 z-30">
        <button
          type="button"
          onClick={() => navigate('/cases/new')}
          className="flex items-center gap-2.5 px-5 py-3.5 rounded-full bg-saffron text-navy-900 font-bold shadow-xl shadow-saffron/20 hover:bg-saffron-hover hover:scale-105 active:scale-95 transition-all select-none border-2 border-white/20"
          aria-label={t('casesManager.registerNewCase')}
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span className="text-sm font-extrabold tracking-wide">
            {t('casesManager.registerNewCase')}
          </span>
        </button>
      </div>
    </div>
  );
};
