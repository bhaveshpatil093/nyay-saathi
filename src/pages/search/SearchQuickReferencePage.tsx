import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Search,
  BookOpen,
  ArrowRightLeft,
  Bookmark,
  Printer,
  X,
  History,
  Trash2,
  ExternalLink,
  Shield,
  FileText,
  AlertTriangle,
  Scale,
  Briefcase,
  Camera,
  CheckCircle2,
  Layers,
  ChevronRight,
  Filter,
  Sparkles,
  ArrowRight,
  Star,
  Share2,
  Download,
  Info,
} from 'lucide-react';
import { OFFENCES_DATA } from '../../data/offences.ts';
import { GENERAL_PROCEDURE_STEPS } from '../../data/steps.ts';
import { CITIZEN_RIGHTS_DATA, CitizenRightItem } from '../../data/rights.ts';
import { CONSTABLE_QUICK_CARDS, QuickCardItem } from '../../data/quickCards.ts';
import {
  globalSearch,
  SearchResultItem,
  SearchResultType,
} from '../../lib/search/searchEngine.ts';
import { HighlightMatch } from '../../components/search/HighlightMatch.tsx';
import {
  useLiveData,
  listCases,
  listAllEvidence,
  listBookmarks,
  toggleBookmark,
} from '../../lib/db/index.ts';
import { useI18n } from '../../i18n/index.ts';
import { useApp } from '../../context/AppContext.tsx';
import { useToast } from '../../components/ui/Toast.tsx';
import { DisclaimerBanner } from '../../components/ui/DisclaimerBanner.tsx';
import { exportPdf, printDocument } from '../../lib/pdf/index.ts';
import { Offence, ProcedureStep } from '../../data/types.ts';
import { BookmarkRecord, BookmarkKind } from '../../types/database.ts';

const RECENT_SEARCHES_KEY = 'nyay_saathi_recent_searches_v1';
const MAX_RECENT_SEARCHES = 8;

export const SearchQuickReferencePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { language, t } = useI18n();
  const { isOnline } = useApp();
  const { info, success } = useToast();

  // Active Tab: 'search' | 'map' | 'cards' | 'bookmarks'
  const currentTab = (searchParams.get('tab') as string) || 'search';

  const setTab = (tab: string) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('tab', tab);
    setSearchParams(nextParams, { replace: true });
  };

  // 1. Search Bar state
  const initialQuery = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [searchExecutionTimeMs, setSearchExecutionTimeMs] = useState<number | null>(null);

  // Initialize search engine once with static dataset
  useEffect(() => {
    globalSearch.initialize(OFFENCES_DATA, GENERAL_PROCEDURE_STEPS, CITIZEN_RIGHTS_DATA);
  }, []);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  const saveRecentSearch = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) return;
    try {
      setRecentSearches((prev) => {
        const updated = [trimmed, ...prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase())].slice(
          0,
          MAX_RECENT_SEARCHES
        );
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
        return updated;
      });
    } catch {
      // ignore
    }
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {
      // ignore
    }
  };

  // Sync URL query
  const handleQueryChange = (q: string) => {
    setSearchQuery(q);
    const nextParams = new URLSearchParams(searchParams);
    if (q.trim()) {
      nextParams.set('q', q);
    } else {
      nextParams.delete('q');
    }
    setSearchParams(nextParams, { replace: true });
  };

  // 2. Live Data for Cases, Evidence & Bookmarks
  const { data: cases = [] } = useLiveData(() => listCases('all'), ['cases']);
  const { data: allEvidence = [] } = useLiveData(() => listAllEvidence(), ['evidence']);
  const { data: allBookmarks = [] } = useLiveData(() => listBookmarks(), ['bookmarks']);

  // 3. Compute Search Results
  const searchResults = useMemo(() => {
    const start = performance.now();
    const results = globalSearch.search(searchQuery, cases, allEvidence, language);
    const duration = performance.now() - start;
    setSearchExecutionTimeMs(Math.round(duration * 10) / 10);
    return results;
  }, [searchQuery, cases, allEvidence, language]);

  // Save recent search upon enter or delay
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) return;
    const timer = setTimeout(() => {
      saveRecentSearch(searchQuery);
    }, 1200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 4. Tab 2: IPC to BNS Quick Map State
  const [mapQuery, setMapQuery] = useState('');
  const [mapSelectedLetter, setMapSelectedLetter] = useState<string>('ALL');

  // Alphabet jump list
  const alphabetLetters = useMemo(() => {
    return ['ALL', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];
  }, []);

  const filteredMapOffences = useMemo(() => {
    const q = mapQuery.trim().toLowerCase();

    return OFFENCES_DATA.filter((off) => {
      // Letter filter
      if (mapSelectedLetter !== 'ALL') {
        const firstLetter = off.title_en.charAt(0).toUpperCase();
        if (firstLetter !== mapSelectedLetter) return false;
      }

      if (!q) return true;

      // Extract numbers for bidirectional search
      const bnsClean = off.bnsSection.toLowerCase().replace(/[^0-9]/g, '');
      const ipcClean = (off.oldIpcSection || '').toLowerCase().replace(/[^0-9]/g, '');
      const queryClean = q.replace(/[^0-9]/g, '');

      const matchNumber =
        queryClean.length > 0 &&
        (bnsClean.includes(queryClean) || ipcClean.includes(queryClean));

      const matchText =
        off.title_en.toLowerCase().includes(q) ||
        off.title_mr.toLowerCase().includes(q) ||
        off.bnsSection.toLowerCase().includes(q) ||
        (off.oldIpcSection || '').toLowerCase().includes(q) ||
        off.tags.some((t) => t.toLowerCase().includes(q));

      return matchNumber || matchText;
    }).sort((a, b) => a.title_en.localeCompare(b.title_en));
  }, [mapQuery, mapSelectedLetter]);

  // 5. Tab 3: Quick Cards Print Handler
  const quickCardsPrintRef = useRef<HTMLDivElement>(null);
  const [selectedQuickCardId, setSelectedQuickCardId] = useState<string>(CONSTABLE_QUICK_CARDS[0].id);

  const handlePrintCard = () => {
    printDocument();
  };

  const handleExportCardPdf = async (card: QuickCardItem) => {
    const printEl = document.getElementById(`quick-card-print-${card.id}`);
    if (printEl) {
      await exportPdf(
        printEl,
        `NyaySaathi_QuickCard_${card.id}_${language === 'mr' ? 'MR' : 'EN'}.pdf`
      );
      success(language === 'mr' ? 'पीडीएफ तयार झाली' : 'Quick card PDF exported');
    }
  };

  // 6. Tab 4: Bookmarks Management
  const bookmarkedOffences = useMemo(() => {
    const offenceBmIds = new Set(
      allBookmarks.filter((b) => b.kind === 'offence').map((b) => b.refId)
    );
    return OFFENCES_DATA.filter((o) => offenceBmIds.has(o.id));
  }, [allBookmarks]);

  const bookmarkedSteps = useMemo(() => {
    const stepBmIds = new Set(
      allBookmarks.filter((b) => b.kind === 'step').map((b) => b.refId)
    );
    return GENERAL_PROCEDURE_STEPS.filter((s) => stepBmIds.has(s.id));
  }, [allBookmarks]);

  const bookmarkedRights = useMemo(() => {
    const rightBmIds = new Set(
      allBookmarks.filter((b) => b.kind === 'right').map((b) => b.refId)
    );
    return CITIZEN_RIGHTS_DATA.filter((r) => rightBmIds.has(r.id));
  }, [allBookmarks]);

  const handleRemoveBookmark = async (kind: BookmarkKind, refId: string) => {
    try {
      await toggleBookmark(kind, refId);
      info(
        language === 'mr' ? 'बुकमार्क काढण्यात आला' : 'Removed from bookmarks'
      );
    } catch {
      // ignore
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 space-y-6 pb-24 w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-navy-700/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-saffron/10 text-saffron border border-saffron/20">
              <Search className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">
                {language === 'mr' ? 'ग्लोबल शोध आणि त्वरित संदर्भ' : 'Global Search & Quick Reference'}
              </h1>
              <p className="text-xs text-navy-300 mt-0.5">
                {language === 'mr'
                  ? 'गुन्हे, बीएनएस कलमे, जुने आयपीसी, कार्यपद्धती पायऱ्या, नागरिक हक्क आणि स्वतःची प्रकरणे'
                  : 'Instant offline lookup across offences, sections, procedures, citizen rights & station cases'}
              </p>
            </div>
          </div>
        </div>

        {/* Offline Badge & Performance Indicator */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {language === 'mr' ? '१००% ऑफलाइन उपलब्ध' : '100% Offline Local Index'}
          </span>
          {searchExecutionTimeMs !== null && searchQuery.trim() && (
            <span className="text-[11px] font-mono text-navy-400 bg-navy-800/80 px-2 py-0.5 rounded border border-navy-700">
              {searchExecutionTimeMs} ms
            </span>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-navy-800">
        <button
          type="button"
          onClick={() => setTab('search')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
            currentTab === 'search'
              ? 'bg-saffron text-navy-950 shadow-lg shadow-saffron/20 font-black'
              : 'text-navy-300 hover:text-white hover:bg-navy-800/80'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>{language === 'mr' ? '१. ग्लोबल शोध' : '1. Global Search'}</span>
          {searchResults.totalCount > 0 && searchQuery && (
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                currentTab === 'search'
                  ? 'bg-navy-900 text-saffron'
                  : 'bg-navy-700 text-navy-200'
              }`}
            >
              {searchResults.totalCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setTab('map')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
            currentTab === 'map'
              ? 'bg-saffron text-navy-950 shadow-lg shadow-saffron/20 font-black'
              : 'text-navy-300 hover:text-white hover:bg-navy-800/80'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>{language === 'mr' ? '२. IPC ⇄ BNS मॅप' : '2. IPC to BNS Map'}</span>
        </button>

        <button
          type="button"
          onClick={() => setTab('cards')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
            currentTab === 'cards'
              ? 'bg-saffron text-navy-950 shadow-lg shadow-saffron/20 font-black'
              : 'text-navy-300 hover:text-white hover:bg-navy-800/80'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>{language === 'mr' ? '३. कॉन्स्टेबल क्विक कार्ड्स' : '3. Constable Quick Cards'}</span>
          <span className="text-[10px] bg-navy-700 text-navy-200 px-1.5 py-0.5 rounded-full">
            5
          </span>
        </button>

        <button
          type="button"
          onClick={() => setTab('bookmarks')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
            currentTab === 'bookmarks'
              ? 'bg-saffron text-navy-950 shadow-lg shadow-saffron/20 font-black'
              : 'text-navy-300 hover:text-white hover:bg-navy-800/80'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          <span>{language === 'mr' ? '४. बुकमार्क्स' : '4. Bookmarks'}</span>
          {allBookmarks.length > 0 && (
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                currentTab === 'bookmarks'
                  ? 'bg-navy-900 text-saffron'
                  : 'bg-navy-700 text-navy-200'
              }`}
            >
              {allBookmarks.length}
            </span>
          )}
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: GLOBAL SEARCH                                           */}
      {/* ============================================================== */}
      {currentTab === 'search' && (
        <div className="space-y-6">
          {/* Search Input Bar */}
          <div className="relative">
            <div className="relative flex items-center">
              <Search className="w-6 h-6 absolute left-4 text-saffron pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleQueryChange(e.target.value)}
                placeholder={
                  language === 'mr'
                    ? 'शोधा: उदा. BNS 303, चोरी, IPC 379, झडती, एफआयआर, केस क्रमांक...'
                    : 'Search sections, IPC/BNS, theft, arrest, zero FIR, case no, accused, evidence...'
                }
                autoFocus
                className="w-full pl-13 pr-12 py-4 bg-navy-900/90 border-2 border-navy-600 focus:border-saffron rounded-2xl text-base text-white placeholder-navy-400 focus:outline-none shadow-xl transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => handleQueryChange('')}
                  className="absolute right-4 p-1.5 text-navy-400 hover:text-white hover:bg-navy-700 rounded-lg transition-colors"
                  aria-label="Clear search"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Recent Searches Pills */}
            {recentSearches.length > 0 && !searchQuery && (
              <div className="mt-3 p-3 bg-navy-900/40 rounded-xl border border-navy-800 space-y-2">
                <div className="flex items-center justify-between text-xs text-navy-400">
                  <div className="flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-saffron" />
                    <span className="font-semibold">
                      {language === 'mr' ? 'अलीकडील शोध:' : 'Recent searches:'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={clearRecentSearches}
                    className="text-navy-400 hover:text-rose-400 transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>{language === 'mr' ? 'साफ करा' : 'Clear all'}</span>
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((recent, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleQueryChange(recent)}
                      className="px-3 py-1 bg-navy-800 hover:bg-navy-700 text-xs text-navy-200 hover:text-white rounded-lg border border-navy-700 transition-colors flex items-center gap-1.5"
                    >
                      <span>{recent}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Search Results Display */}
          {searchQuery.trim() ? (
            <div className="space-y-6">
              {/* Result summary banner */}
              <div className="flex items-center justify-between text-xs text-navy-400 px-1">
                <span>
                  {language === 'mr'
                    ? `‘${searchQuery}’ साठी एकूण ${searchResults.totalCount} निकाल सापडले`
                    : `Found ${searchResults.totalCount} results for "${searchQuery}"`}
                </span>
                {searchExecutionTimeMs !== null && (
                  <span className="font-mono text-saffron">
                    {searchExecutionTimeMs} ms
                  </span>
                )}
              </div>

              {searchResults.totalCount === 0 ? (
                <div className="p-10 rounded-2xl bg-navy-900/40 border border-navy-800 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-navy-800 flex items-center justify-center mx-auto text-navy-400">
                    <Search className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-white">
                    {language === 'mr' ? 'कोणतेही निकाल सापडले नाहीत' : 'No results found'}
                  </h3>
                  <p className="text-xs text-navy-400 max-w-md mx-auto">
                    {language === 'mr'
                      ? 'कृपया वेगळा शब्द, बीएनएस कलम क्रमांक (उदा. 303, 103) किंवा गुन्ह्याचे नाव वापरून शोधा.'
                      : 'Try searching by section number (e.g. 303, 105), IPC section (e.g. 379), offence keyword or case number.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Group 1: Offences */}
                  {searchResults.offences.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-navy-800 pb-2">
                        <div className="flex items-center gap-2">
                          <Scale className="w-4 h-4 text-saffron" />
                          <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                            {language === 'mr' ? 'गुन्हे व बीएनएस कलमे' : 'Offences & BNS Sections'}
                          </h3>
                        </div>
                        <span className="text-xs font-mono font-bold text-saffron bg-saffron/10 px-2 py-0.5 rounded-full border border-saffron/20">
                          {searchResults.offences.length}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {searchResults.offences.map((item) => (
                          <Link
                            key={item.id}
                            to={item.url}
                            className="p-4 rounded-xl bg-navy-900/60 hover:bg-navy-850 border border-navy-700 hover:border-saffron/50 transition-all group flex flex-col justify-between"
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="font-bold text-white group-hover:text-saffron transition-colors text-base">
                                  <HighlightMatch text={item.title} query={searchQuery} />
                                </h4>
                                <span className="text-[11px] font-mono font-black px-2 py-0.5 rounded bg-saffron/10 text-saffron border border-saffron/30 shrink-0">
                                  <HighlightMatch text={item.legalChip || ''} query={searchQuery} />
                                </span>
                              </div>
                              <p className="text-xs text-navy-300">
                                <HighlightMatch text={item.subtitle} query={searchQuery} />
                              </p>
                            </div>
                            <div className="mt-3 pt-2.5 border-t border-navy-800/80 flex items-center justify-between text-xs text-navy-400">
                              <span className="text-[11px] px-1.5 py-0.5 rounded bg-navy-800 text-navy-300">
                                Old: <HighlightMatch text={item.badge || ''} query={searchQuery} />
                              </span>
                              <span className="flex items-center gap-1 text-saffron font-medium group-hover:translate-x-0.5 transition-transform">
                                <span>{language === 'mr' ? 'मार्गदर्शक पहा' : 'View Guide'}</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Group 2: Procedure Steps */}
                  {searchResults.steps.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-navy-800 pb-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-blue-400" />
                          <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                            {language === 'mr' ? 'वैधानिक कार्यपद्धती पायऱ्या' : 'Statutory Procedure Steps'}
                          </h3>
                        </div>
                        <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                          {searchResults.steps.length}
                        </span>
                      </div>
                      <div className="space-y-2.5">
                        {searchResults.steps.map((item) => (
                          <Link
                            key={item.id}
                            to={item.url}
                            className="p-3.5 rounded-xl bg-navy-900/60 hover:bg-navy-850 border border-navy-700/80 hover:border-blue-500/50 transition-all group block space-y-1.5"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/30">
                                  <HighlightMatch text={item.legalChip || ''} query={searchQuery} />
                                </span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-navy-800 text-navy-300">
                                  {item.badge}
                                </span>
                              </div>
                              <span className="text-xs text-blue-400 font-medium group-hover:translate-x-0.5 transition-transform shrink-0 flex items-center gap-1">
                                <span>{language === 'mr' ? 'तपशील' : 'Details'}</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </span>
                            </div>
                            <p className="text-sm font-medium text-white leading-snug">
                              <HighlightMatch text={item.title} query={searchQuery} />
                            </p>
                            <p className="text-xs text-navy-300 line-clamp-1">
                              <HighlightMatch text={item.subtitle} query={searchQuery} />
                            </p>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Group 3: Citizen Rights */}
                  {searchResults.rights.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-navy-800 pb-2">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-emerald-400" />
                          <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                            {language === 'mr' ? 'नागरिक अधिकार व कायदेशीर तरतुदी' : 'Citizen Rights & Protections'}
                          </h3>
                        </div>
                        <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          {searchResults.rights.length}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {searchResults.rights.map((item) => (
                          <Link
                            key={item.id}
                            to={item.url}
                            className="p-4 rounded-xl bg-navy-900/60 hover:bg-navy-850 border border-navy-700/80 hover:border-emerald-500/50 transition-all group flex flex-col justify-between"
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="font-bold text-white group-hover:text-emerald-400 transition-colors text-sm">
                                  <HighlightMatch text={item.title} query={searchQuery} />
                                </h4>
                                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 shrink-0">
                                  <HighlightMatch text={item.legalChip || ''} query={searchQuery} />
                                </span>
                              </div>
                              <p className="text-xs text-navy-300 line-clamp-2">
                                <HighlightMatch text={item.subtitle} query={searchQuery} />
                              </p>
                            </div>
                            <div className="mt-3 pt-2 flex items-center justify-end text-xs text-emerald-400 font-medium">
                              <span>{language === 'mr' ? 'नागरिक कक्षात पहा' : 'View in Citizen Mode'}</span>
                              <ChevronRight className="w-3.5 h-3.5 ml-1" />
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Group 4: Officer's Own Cases */}
                  {searchResults.cases.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-navy-800 pb-2">
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-purple-400" />
                          <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                            {language === 'mr' ? 'ठाणे गुन्हे व प्रकरणे' : 'Station Registered Cases'}
                          </h3>
                        </div>
                        <span className="text-xs font-mono font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                          {searchResults.cases.length}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {searchResults.cases.map((item) => (
                          <Link
                            key={item.id}
                            to={item.url}
                            className="p-3.5 rounded-xl bg-navy-900/60 hover:bg-navy-850 border border-navy-700/80 hover:border-purple-500/50 transition-all group flex items-center justify-between gap-4"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white text-sm group-hover:text-purple-400 transition-colors">
                                  <HighlightMatch text={item.title} query={searchQuery} />
                                </span>
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-navy-800 text-purple-300">
                                  {item.badge}
                                </span>
                              </div>
                              <p className="text-xs text-navy-300">
                                <HighlightMatch text={item.subtitle} query={searchQuery} />
                              </p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-navy-400 group-hover:text-purple-400 shrink-0" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Group 5: Evidence Vault */}
                  {searchResults.evidence.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-navy-800 pb-2">
                        <div className="flex items-center gap-2">
                          <Camera className="w-4 h-4 text-amber-400" />
                          <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                            {language === 'mr' ? 'डिजिटल पुरावा व मुद्देमाल' : 'Digital Evidence & Vault'}
                          </h3>
                        </div>
                        <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                          {searchResults.evidence.length}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {searchResults.evidence.map((item) => (
                          <Link
                            key={item.id}
                            to={item.url}
                            className="p-3.5 rounded-xl bg-navy-900/60 hover:bg-navy-850 border border-navy-700/80 hover:border-amber-500/50 transition-all group flex items-center justify-between gap-4"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white text-sm group-hover:text-amber-400 transition-colors">
                                  <HighlightMatch text={item.title} query={searchQuery} />
                                </span>
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                                  {item.legalChip}
                                </span>
                              </div>
                              <p className="text-xs text-navy-300">
                                <HighlightMatch text={item.subtitle} query={searchQuery} />
                              </p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-navy-400 group-hover:text-amber-400 shrink-0" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Empty state when no query typed */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
              <div
                onClick={() => setTab('map')}
                className="cursor-pointer p-4 rounded-xl bg-navy-900/40 border border-navy-800 hover:border-saffron/40 transition-all space-y-2"
              >
                <div className="w-9 h-9 rounded-lg bg-saffron/10 text-saffron flex items-center justify-center">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-white text-sm">
                  {language === 'mr' ? 'IPC ⇄ BNS मॅप' : 'IPC to BNS Converter'}
                </h4>
                <p className="text-xs text-navy-400">
                  {language === 'mr'
                    ? 'उदा. 379 टाईप करा आणि BNS 303(2) पहा.'
                    : 'Type 379 to see BNS 303(2), or type 303 to see IPC 379.'}
                </p>
              </div>

              <div
                onClick={() => setTab('cards')}
                className="cursor-pointer p-4 rounded-xl bg-navy-900/40 border border-navy-800 hover:border-blue-500/40 transition-all space-y-2"
              >
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-white text-sm">
                  {language === 'mr' ? 'क्विक कार्ड्स' : 'Constable Quick Cards'}
                </h4>
                <p className="text-xs text-navy-400">
                  {language === 'mr'
                    ? '५ मुख्य घटनांचे सारांश कार्ड्स व प्रिंट.'
                    : 'One-screen 5-7 point cards for FIR, Arrest, Search & Seizure.'}
                </p>
              </div>

              <div
                onClick={() => handleQueryChange('BNS 105')}
                className="cursor-pointer p-4 rounded-xl bg-navy-900/40 border border-navy-800 hover:border-emerald-500/40 transition-all space-y-2"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <Camera className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-white text-sm">
                  {language === 'mr' ? 'झडती व चित्रीकरण' : 'Audio-Video Mandate'}
                </h4>
                <p className="text-xs text-navy-400">
                  {language === 'mr'
                    ? 'BNSS १०५ आणि १०३ अंतर्गत नियम शोधा.'
                    : 'Instant lookup for search, seizure and videography protocols.'}
                </p>
              </div>

              <div
                onClick={() => setTab('bookmarks')}
                className="cursor-pointer p-4 rounded-xl bg-navy-900/40 border border-navy-800 hover:border-purple-500/40 transition-all space-y-2"
              >
                <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                  <Star className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-white text-sm">
                  {language === 'mr' ? 'जतन केलेले बुकमार्क्स' : 'Saved Bookmarks'}
                </h4>
                <p className="text-xs text-navy-400">
                  {language === 'mr'
                    ? 'महत्त्वाची कलमे, पायऱ्या आणि हक्क त्वरित पहा.'
                    : 'Access your starred offences, procedural steps, and rights.'}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: IPC TO BNS QUICK MAP                                    */}
      {/* ============================================================== */}
      {currentTab === 'map' && (
        <div className="space-y-6">
          <DisclaimerBanner type="legal" />

          {/* Quick Notice */}
          <div className="p-3.5 rounded-xl bg-navy-900/60 border border-navy-700/80 flex items-start gap-3 text-xs text-navy-300">
            <Info className="w-4 h-4 text-saffron shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white">
                {language === 'mr' ? 'महत्त्वाची सूचना:' : 'Notice:'}
              </span>{' '}
              {language === 'mr'
                ? 'या प्रोटोटाइपमध्ये सध्या प्रमुख २५ गुन्हे समाविष्ट आहेत; सर्व नोंदी कायदेशीर पुनरावलोकनाधीन (pending legal review) आहेत.'
                : 'Only the standard offences in this prototype are included; all entries pending legal review. Both old IPC and new BNS numbers are searchable in both directions.'}
            </div>
          </div>

          {/* Search Bar for Map */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-saffron" />
              <input
                type="text"
                value={mapQuery}
                onChange={(e) => setMapQuery(e.target.value)}
                placeholder={
                  language === 'mr'
                    ? 'कलम क्रमांक किंवा नाव टाईप करा (उदा. 379, 303, चोरी, Murder)...'
                    : 'Type IPC or BNS section (e.g. 379, 303, theft, hurt)...'
                }
                className="w-full pl-11 pr-4 py-2.5 bg-navy-900 border border-navy-700 focus:border-saffron rounded-xl text-sm text-white placeholder-navy-400 focus:outline-none"
              />
              {mapQuery && (
                <button
                  type="button"
                  onClick={() => setMapQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick Stats */}
            <div className="text-xs text-navy-300 bg-navy-900/60 px-3 py-2.5 rounded-xl border border-navy-700 font-mono shrink-0">
              {filteredMapOffences.length} {language === 'mr' ? 'गुन्हे' : 'offences'}
            </div>
          </div>

          {/* A to Z Jump Bar */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-xs">
            <span className="text-navy-400 font-bold mr-1 shrink-0">
              {language === 'mr' ? 'वर्णक्रमानुसार:' : 'A to Z:'}
            </span>
            {alphabetLetters.map((letter) => (
              <button
                key={letter}
                type="button"
                onClick={() => setMapSelectedLetter(letter)}
                className={`px-2 py-1 rounded font-bold transition-colors shrink-0 ${
                  mapSelectedLetter === letter
                    ? 'bg-saffron text-navy-950 font-black'
                    : 'bg-navy-800 text-navy-300 hover:bg-navy-700 hover:text-white'
                }`}
              >
                {letter}
              </button>
            ))}
          </div>

          {/* Mapping Table */}
          <div className="overflow-x-auto rounded-2xl border border-navy-700 bg-navy-900/60 shadow-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-navy-700 bg-navy-800/80 text-navy-300 font-semibold uppercase tracking-wider">
                  <th className="p-3.5">
                    {language === 'mr' ? 'जुने IPC कलम' : 'Old IPC Section'}
                  </th>
                  <th className="p-3.5">
                    {language === 'mr' ? 'नवीन BNS कलम' : 'New BNS Section'}
                  </th>
                  <th className="p-3.5">
                    {language === 'mr' ? 'गुन्ह्याचे नाव (English / मराठी)' : 'Offence Name'}
                  </th>
                  <th className="p-3.5">
                    {language === 'mr' ? 'स्वरूप' : 'Cognizability'}
                  </th>
                  <th className="p-3.5">
                    {language === 'mr' ? 'कमाल शिक्षा' : 'Max Punishment'}
                  </th>
                  <th className="p-3.5 text-right">
                    {language === 'mr' ? 'कृती' : 'Action'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-800">
                {filteredMapOffences.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-navy-400">
                      {language === 'mr'
                        ? 'कोणताही जुळणारा गुन्हा आढळला नाही.'
                        : 'No offences match your search criteria.'}
                    </td>
                  </tr>
                ) : (
                  filteredMapOffences.map((off) => (
                    <tr
                      key={off.id}
                      className="hover:bg-navy-800/40 transition-colors group cursor-pointer"
                      onClick={() => navigate(`/guide/${off.id}`)}
                    >
                      {/* Old IPC */}
                      <td className="p-3.5 font-mono font-bold text-amber-300 whitespace-nowrap">
                        <HighlightMatch text={off.oldIpcSection || '—'} query={mapQuery} />
                      </td>

                      {/* New BNS */}
                      <td className="p-3.5 font-mono font-black text-saffron whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-saffron/10 border border-saffron/20 inline-block">
                          <HighlightMatch text={off.bnsSection} query={mapQuery} />
                        </span>
                      </td>

                      {/* Name */}
                      <td className="p-3.5 space-y-0.5">
                        <div className="font-bold text-white group-hover:text-saffron transition-colors">
                          <HighlightMatch text={off.title_en} query={mapQuery} />
                        </div>
                        <div className="text-navy-300 text-[11px]">
                          <HighlightMatch text={off.title_mr} query={mapQuery} />
                        </div>
                      </td>

                      {/* Cognizable */}
                      <td className="p-3.5 whitespace-nowrap">
                        {off.cognizable ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {language === 'mr' ? 'दखलपात्र' : 'Cognizable'}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-navy-700 text-navy-300 border border-navy-600">
                            {language === 'mr' ? 'अदखलपात्र' : 'Non-Cognizable'}
                          </span>
                        )}
                      </td>

                      {/* Max punishment */}
                      <td className="p-3.5 whitespace-nowrap text-navy-200 font-medium">
                        {off.maxPunishmentYears >= 99
                          ? (language === 'mr' ? 'आजीवन कारावास / फाशी' : 'Life / Capital')
                          : `${off.maxPunishmentYears} ${language === 'mr' ? 'वर्षे' : 'years'}`}
                      </td>

                      {/* Action */}
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/guide/${off.id}`);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-navy-800 hover:bg-saffron hover:text-navy-950 text-navy-200 transition-colors inline-flex items-center gap-1 font-bold text-[11px]"
                        >
                          <span>{language === 'mr' ? 'पहा' : 'Guide'}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: CONSTABLE QUICK CARDS                                    */}
      {/* ============================================================== */}
      {currentTab === 'cards' && (
        <div className="space-y-6">
          <DisclaimerBanner type="legal" />

          {/* Quick situation selector pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {CONSTABLE_QUICK_CARDS.map((card) => (
              <button
                key={card.id}
                type="button"
                onClick={() => setSelectedQuickCardId(card.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                  selectedQuickCardId === card.id
                    ? 'bg-saffron text-navy-950 border-saffron shadow-md font-black'
                    : 'bg-navy-900/80 text-navy-300 border-navy-700 hover:text-white hover:bg-navy-800'
                }`}
              >
                {language === 'mr' ? card.title_mr.split('(')[0] : card.situation}
              </button>
            ))}
          </div>

          {/* Render All Quick Cards with Print Buttons */}
          <div className="space-y-8">
            {CONSTABLE_QUICK_CARDS.filter(
              (c) => !selectedQuickCardId || c.id === selectedQuickCardId
            ).map((card) => (
              <div
                key={card.id}
                className="rounded-2xl bg-navy-900/80 border-2 border-navy-700 p-6 shadow-2xl space-y-6"
              >
                {/* Printable container with ID */}
                <div id={`quick-card-print-${card.id}`} className="space-y-6 p-2 bg-transparent text-white">
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-navy-700 pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${card.color}`}>
                          {language === 'mr' ? card.badge_mr : card.badge_en}
                        </span>
                        <span className="text-xs text-navy-400 font-mono">
                          Format Pending Legal Review
                        </span>
                      </div>
                      <h2 className="text-2xl font-black text-white tracking-tight">
                        {language === 'mr' ? card.title_mr : card.title_en}
                      </h2>
                      <p className="text-sm text-navy-300">
                        {language === 'mr' ? card.subtitle_mr : card.subtitle_en}
                      </p>
                    </div>

                    {/* Action buttons (hidden in print) */}
                    <div className="flex items-center gap-2 no-print shrink-0">
                      <button
                        type="button"
                        onClick={() => handleExportCardPdf(card)}
                        className="px-3 py-1.5 rounded-xl bg-navy-800 hover:bg-navy-700 border border-navy-600 text-xs text-white font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5 text-saffron" />
                        <span>{language === 'mr' ? 'PDF जतन करा' : 'PDF'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePrintCard()}
                        className="px-3 py-1.5 rounded-xl bg-saffron hover:bg-saffron-light text-navy-950 text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>{language === 'mr' ? 'प्रिंट करा (A4)' : 'Print (A4)'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Statutory Warning Box */}
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-200">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      {language === 'mr' ? card.statutoryWarning_mr : card.statutoryWarning_en}
                    </p>
                  </div>

                  {/* 5-7 Key Points with Legal Chips */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-black uppercase tracking-wider text-saffron">
                      {language === 'mr'
                        ? 'अनिवार्य वैधानिक मार्गदर्शक मुद्दे:'
                        : 'Statutory Points & Legal References:'}
                    </h3>

                    <div className="grid grid-cols-1 gap-2.5">
                      {card.points.map((pt) => (
                        <div
                          key={pt.num}
                          className="p-3.5 rounded-xl bg-navy-800/70 border border-navy-700 flex items-start gap-3 text-sm"
                        >
                          <span className="w-6 h-6 rounded-full bg-saffron text-navy-950 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                            {pt.num}
                          </span>
                          <div className="flex-1 space-y-1">
                            <p className="text-white font-medium leading-relaxed">
                              {language === 'mr' ? pt.text_mr : pt.text_en}
                            </p>
                          </div>
                          <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-navy-900 text-saffron border border-saffron/30 whitespace-nowrap shrink-0">
                            {pt.legalChip}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Card Footer in Print */}
                  <div className="pt-4 border-t border-navy-700/60 flex items-center justify-between text-[11px] text-navy-400">
                    <span>Nyay Saathi • Maharashtra Police Assistant Prototype</span>
                    <span>All procedural points pending formal legal review</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: BOOKMARKS                                               */}
      {/* ============================================================== */}
      {currentTab === 'bookmarks' && (
        <div className="space-y-6">
          <DisclaimerBanner type="legal" />

          {/* Bookmarks Summary */}
          <div className="flex items-center justify-between border-b border-navy-800 pb-3">
            <div>
              <h2 className="text-lg font-bold text-white">
                {language === 'mr' ? 'बुकमार्क केलेल्या नोंदी' : 'Bookmarked References'}
              </h2>
              <p className="text-xs text-navy-400">
                {language === 'mr'
                  ? 'गुन्हे, वैधानिक पायऱ्या आणि नागरिक हक्क येथे जतन केलेले आहेत.'
                  : 'Quick access to starred offences, procedural steps, and citizen rights.'}
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-saffron bg-saffron/10 px-2.5 py-1 rounded-full border border-saffron/20">
              {allBookmarks.length} {language === 'mr' ? 'बुकमार्क्स' : 'saved'}
            </span>
          </div>

          {allBookmarks.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-navy-900/40 border border-navy-800 space-y-3">
              <Star className="w-12 h-12 text-navy-500 mx-auto" />
              <h3 className="text-base font-bold text-white">
                {language === 'mr' ? 'कोणतेही बुकमार्क जतन केलेले नाहीत' : 'No Bookmarks Saved'}
              </h3>
              <p className="text-xs text-navy-400 max-w-sm mx-auto">
                {language === 'mr'
                  ? 'कोणत्याही गुन्ह्यावरील किंवा कार्यपद्धती पायरीवरील स्टार (★) चिन्हावर टॅप करून येथे जतन करा.'
                  : 'Tap the star icon on any offence card or procedure step to add it to your quick bookmarks.'}
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/guide')}
                  className="px-4 py-2 bg-saffron text-navy-950 font-bold text-xs rounded-xl hover:bg-saffron-light transition-colors"
                >
                  {language === 'mr' ? 'गुन्हे मार्गदर्शक उघडा' : 'Browse Procedure Guide'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* 1. Bookmarked Offences */}
              {bookmarkedOffences.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-saffron" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                      {language === 'mr' ? 'गुन्हे' : 'Bookmarked Offences'} ({bookmarkedOffences.length})
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {bookmarkedOffences.map((off) => (
                      <div
                        key={off.id}
                        className="p-4 rounded-xl bg-navy-900/60 border border-navy-700/80 hover:border-saffron/50 transition-all flex items-start justify-between gap-3 group"
                      >
                        <div
                          className="space-y-1 flex-1 cursor-pointer"
                          onClick={() => navigate(`/guide/${off.id}`)}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white group-hover:text-saffron transition-colors text-sm">
                              {language === 'mr' ? off.title_mr : off.title_en}
                            </span>
                            <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-saffron/10 text-saffron border border-saffron/20">
                              {off.bnsSection}
                            </span>
                          </div>
                          <p className="text-xs text-navy-300">
                            Old: {off.oldIpcSection} • {off.cognizable ? 'Cognizable' : 'Non-Cognizable'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveBookmark('offence', off.id)}
                          className="p-1.5 text-navy-400 hover:text-rose-400 hover:bg-navy-800 rounded-lg transition-colors shrink-0"
                          title="Remove bookmark"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Bookmarked Procedure Steps */}
              {bookmarkedSteps.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-400" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                      {language === 'mr' ? 'कार्यपद्धती पायऱ्या' : 'Bookmarked Steps'} ({bookmarkedSteps.length})
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {bookmarkedSteps.map((step) => (
                      <div
                        key={step.id}
                        className="p-3.5 rounded-xl bg-navy-900/60 border border-navy-700/80 flex items-start justify-between gap-3"
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                              {step.legalRefs[0]
                                ? `${step.legalRefs[0].act} ${step.legalRefs[0].section}`
                                : 'Step'}
                            </span>
                            <span className="text-xs text-navy-400">{step.phase}</span>
                          </div>
                          <p className="text-sm text-white font-medium">
                            {language === 'mr' ? step.text_mr : step.text_en}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveBookmark('step', step.id)}
                          className="p-1.5 text-navy-400 hover:text-rose-400 hover:bg-navy-800 rounded-lg transition-colors shrink-0"
                          title="Remove bookmark"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Bookmarked Citizen Rights */}
              {bookmarkedRights.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                      {language === 'mr' ? 'नागरिक हक्क' : 'Bookmarked Rights'} ({bookmarkedRights.length})
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {bookmarkedRights.map((right) => (
                      <div
                        key={right.id}
                        className="p-4 rounded-xl bg-navy-900/60 border border-navy-700/80 hover:border-emerald-500/50 transition-all flex items-start justify-between gap-3 group"
                      >
                        <div
                          className="space-y-1 flex-1 cursor-pointer"
                          onClick={() => navigate(right.route)}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white group-hover:text-emerald-400 transition-colors text-sm">
                              {language === 'mr' ? right.title_mr : right.title_en}
                            </span>
                            <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                              {right.legalRef}
                            </span>
                          </div>
                          <p className="text-xs text-navy-300 line-clamp-2">
                            {language === 'mr' ? right.summary_mr : right.summary_en}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveBookmark('right', right.id)}
                          className="p-1.5 text-navy-400 hover:text-rose-400 hover:bg-navy-800 rounded-lg transition-colors shrink-0"
                          title="Remove bookmark"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
