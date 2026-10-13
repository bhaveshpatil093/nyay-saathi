import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Search,
  Star,
  ChevronRight,
  ShieldAlert,
  Scale,
  Clock,
  Sparkles,
  Filter,
} from 'lucide-react';
import { OFFENCES_DATA } from '../../data/offences.ts';
import { Offence } from '../../data/types.ts';
import { useLiveData, listBookmarks, toggleBookmark } from '../../lib/db/index.ts';
import { useI18n } from '../../i18n/index.ts';
import { useToast } from '../../components/ui/Toast.tsx';
import { SearchBar } from '../../components/ui/SearchBar.tsx';
import { Chip } from '../../components/ui/Chip.tsx';
import { Badge } from '../../components/ui/Badge.tsx';
import { Card } from '../../components/ui/Card.tsx';
import { EmptyState } from '../../components/ui/EmptyState.tsx';
import { Button } from '../../components/ui/Button.tsx';

type CategoryFilter =
  | 'All'
  | 'Property'
  | 'Financial'
  | 'Person'
  | 'Women and Child'
  | 'Cyber'
  | 'Road'
  | 'Other'
  | 'Bookmarked';

export const OffencePickerPage: React.FC = () => {
  const { t, language } = useI18n();
  const navigate = useNavigate();
  const { info } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('All');

  // Bookmarks live state
  const { data: bookmarks } = useLiveData(
    () => listBookmarks('offence'),
    ['bookmarks'],
    []
  );

  const bookmarkedSet = useMemo(() => {
    return new Set(bookmarks?.map((b) => b.refId) || []);
  }, [bookmarks]);

  // Handle bookmark toggle
  const handleToggleBookmark = async (e: React.MouseEvent, offenceId: string) => {
    e.stopPropagation();
    try {
      const added = await toggleBookmark('offence', offenceId);
      info(
        added
          ? t('procedureGuide.bookmarkedToastAdded')
          : t('procedureGuide.bookmarkedToastRemoved')
      );
    } catch {
      // ignore
    }
  };

  // Filtered offences
  const filteredOffences = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return OFFENCES_DATA.filter((offence) => {
      // Category filter
      if (selectedCategory === 'Bookmarked') {
        if (!bookmarkedSet.has(offence.id)) return false;
      } else if (selectedCategory !== 'All') {
        if (offence.category !== selectedCategory) return false;
      }

      // Search match
      if (!query) return true;

      const titleEnMatch = offence.title_en.toLowerCase().includes(query);
      const titleMrMatch = offence.title_mr.toLowerCase().includes(query);
      const bnsMatch = offence.bnsSection.toLowerCase().includes(query);
      const ipcMatch = (offence.oldIpcSection || '').toLowerCase().includes(query);
      const tagsMatch = offence.tags.some((tag) => tag.toLowerCase().includes(query));
      const descEnMatch = offence.description_en.toLowerCase().includes(query);
      const descMrMatch = offence.description_mr.toLowerCase().includes(query);

      return (
        titleEnMatch ||
        titleMrMatch ||
        bnsMatch ||
        ipcMatch ||
        tagsMatch ||
        descEnMatch ||
        descMrMatch
      );
    });
  }, [searchQuery, selectedCategory, bookmarkedSet]);

  const categories: { key: CategoryFilter; label: string; count: number }[] = [
    {
      key: 'All',
      label: t('procedureGuide.catAll'),
      count: OFFENCES_DATA.length,
    },
    {
      key: 'Bookmarked',
      label: t('procedureGuide.bookmarkedFilter'),
      count: bookmarkedSet.size,
    },
    {
      key: 'Property',
      label: t('procedureGuide.catProperty'),
      count: OFFENCES_DATA.filter((o) => o.category === 'Property').length,
    },
    {
      key: 'Financial',
      label: t('procedureGuide.catFinancial'),
      count: OFFENCES_DATA.filter((o) => o.category === 'Financial').length,
    },
    {
      key: 'Person',
      label: t('procedureGuide.catPerson'),
      count: OFFENCES_DATA.filter((o) => o.category === 'Person').length,
    },
    {
      key: 'Women and Child',
      label: t('procedureGuide.catWomenAndChild'),
      count: OFFENCES_DATA.filter((o) => o.category === 'Women and Child').length,
    },
    {
      key: 'Cyber',
      label: t('procedureGuide.catCyber'),
      count: OFFENCES_DATA.filter((o) => o.category === 'Cyber').length,
    },
    {
      key: 'Road',
      label: t('procedureGuide.catRoad'),
      count: OFFENCES_DATA.filter((o) => o.category === 'Road').length,
    },
    {
      key: 'Other',
      label: t('procedureGuide.catOther'),
      count: OFFENCES_DATA.filter((o) => o.category === 'Other').length,
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 space-y-6 pb-24 w-full animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-navy-700 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-saffron/10 text-saffron border border-saffron/20">
              <BookOpen className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {t('procedureGuide.title')}
            </h1>
          </div>
          <p className="mt-1 text-sm text-navy-200 max-w-2xl">
            {t('procedureGuide.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-navy-300 bg-navy-800/80 px-3 py-1.5 rounded-xl border border-navy-700/60 self-start sm:self-auto">
          <Sparkles className="w-3.5 h-3.5 text-saffron" />
          <span>
            {t('procedureGuide.totalOffencesCount', {
              count: OFFENCES_DATA.length,
            })}
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="w-full">
        <SearchBar
          value={searchQuery}
          onValueChange={setSearchQuery}
          placeholder={t('procedureGuide.searchPlaceholder')}
        />
      </div>

      {/* Category Chips Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none no-scrollbar">
        <div className="flex items-center gap-1.5 pr-2 border-r border-navy-700 text-xs text-navy-400 shrink-0">
          <Filter className="w-3.5 h-3.5" />
        </div>
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.key;
          const isBm = cat.key === 'Bookmarked';
          return (
            <Chip
              key={cat.key}
              selected={isSelected}
              onClick={() => setSelectedCategory(cat.key)}
              className="shrink-0 font-medium"
            >
              <span className="flex items-center gap-1.5">
                {isBm && (
                  <Star
                    className={`w-3.5 h-3.5 ${
                      isSelected || cat.count > 0 ? 'fill-amber-400 text-amber-400' : ''
                    }`}
                  />
                )}
                <span>{cat.label}</span>
                <span
                  className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                    isSelected
                      ? 'bg-saffron-dark text-white'
                      : 'bg-navy-700/80 text-navy-300'
                  }`}
                >
                  {cat.count}
                </span>
              </span>
            </Chip>
          );
        })}
      </div>

      {/* Results Header / Counter */}
      <div className="flex items-center justify-between text-xs text-navy-300 px-1">
        <span>
          {language === 'mr'
            ? `${filteredOffences.length} गुन्हे आढळले`
            : `Showing ${filteredOffences.length} of ${OFFENCES_DATA.length} offences`}
        </span>
        {(searchQuery || selectedCategory !== 'All') && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
            }}
            className="text-saffron hover:underline focus:outline-hidden"
          >
            {t('procedureGuide.clearFilters')}
          </button>
        )}
      </div>

      {/* Offences List */}
      {filteredOffences.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="w-12 h-12 text-navy-400" />}
          title={t('procedureGuide.noOffencesFound')}
          description={t('procedureGuide.noOffencesFoundDesc')}
          actionLabel={t('procedureGuide.clearFilters')}
          onAction={() => {
            setSearchQuery('');
            setSelectedCategory('All');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredOffences.map((offence) => {
            const isBookmarked = bookmarkedSet.has(offence.id);
            const primaryTitle =
              language === 'mr' ? offence.title_mr : offence.title_en;
            const secondaryTitle =
              language === 'mr' ? offence.title_en : offence.title_mr;
            const description =
              language === 'mr' ? offence.description_mr : offence.description_en;

            const punishmentText =
              offence.maxPunishmentYears >= 99
                ? t('procedureGuide.lifePunishment')
                : t('procedureGuide.maxPunishment', {
                    years: offence.maxPunishmentYears,
                  });

            return (
              <Card
                key={offence.id}
                onClick={() => navigate(`/guide/${offence.id}`)}
                className="group relative flex flex-col justify-between border-navy-700/80 hover:border-saffron/50 cursor-pointer transition-all duration-200"
              >
                <div>
                  {/* Top Header: BNS Section & Bookmark button */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-sm text-saffron bg-saffron/10 px-2 py-0.5 rounded-md border border-saffron/20">
                        {offence.bnsSection}
                      </span>
                      <span className="text-xs text-navy-300 font-medium">
                        {language === 'mr'
                          ? `(पूर्वीचे ${offence.oldIpcSection || ''})`
                          : `(was ${offence.oldIpcSection || ''})`}
                      </span>
                    </div>

                    {/* Bookmark Star Button */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleBookmark(e, offence.id)}
                      aria-label="Bookmark offence"
                      className={`p-2 rounded-xl border transition-all ${
                        isBookmarked
                          ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 shadow-xs'
                          : 'bg-navy-800/80 border-navy-700 text-navy-400 hover:text-amber-400 hover:border-navy-600'
                      }`}
                    >
                      <Star
                        className={`w-4 h-4 ${
                          isBookmarked ? 'fill-amber-400 text-amber-400' : ''
                        }`}
                      />
                    </button>
                  </div>

                  {/* Title */}
                  <div className="mb-2.5">
                    <h3 className="text-lg font-bold text-white group-hover:text-saffron transition-colors leading-snug">
                      {primaryTitle}
                    </h3>
                    <p className="text-xs text-navy-300 font-medium">
                      {secondaryTitle}
                    </p>
                  </div>

                  {/* Badges strip: Cognizable, Punishment, Pending Review */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <Badge
                      variant={offence.cognizable ? 'success' : 'neutral'}
                      size="sm"
                    >
                      {offence.cognizable
                        ? t('procedureGuide.cognizableBadge')
                        : t('procedureGuide.nonCognizableBadge')}
                    </Badge>

                    <Badge variant="neutral" size="sm" className="text-navy-200">
                      <Clock className="w-3 h-3 mr-1 text-navy-400" />
                      {punishmentText}
                    </Badge>

                    <Badge
                      variant="pendingReview"
                      size="sm"
                    >
                      <ShieldAlert className="w-3 h-3 mr-1 text-amber-400" />
                      {t('procedureGuide.pendingReview')}
                    </Badge>
                  </div>

                  {/* Excerpt */}
                  <p className="text-xs text-navy-200 line-clamp-2 leading-relaxed mb-4">
                    {description}
                  </p>
                </div>

                {/* Footer with Category and Arrow */}
                <div className="pt-3 border-t border-navy-700/60 flex items-center justify-between text-xs text-navy-400">
                  <div className="flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-navy-400" />
                    <span>{offence.category}</span>
                  </div>

                  <span className="flex items-center gap-1 text-saffron group-hover:translate-x-0.5 transition-transform font-medium">
                    <span>{language === 'mr' ? 'मार्गदर्शक पहा' : 'View Guide'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
