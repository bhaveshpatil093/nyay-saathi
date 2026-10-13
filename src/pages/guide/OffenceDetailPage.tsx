import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldAlert,
  AlertTriangle,
  Scale,
  Clock,
  Star,
  Info,
  CheckCircle2,
  FolderPlus,
  PlayCircle,
  Video,
  FileText,
  ChevronRight,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import { OFFENCES_DATA } from '../../data/offences.ts';
import {
  ActiveCaseFacts,
  GeneratedStep,
  ProcedurePhase,
  Offence,
} from '../../data/types.ts';
import { generateChecklist } from '../../lib/procedure/generate.ts';
import {
  useLiveData,
  listCases,
  saveChecklistRun,
  listBookmarks,
  toggleBookmark,
} from '../../lib/db/index.ts';
import { CaseRecord } from '../../types/database.ts';
import { useI18n } from '../../i18n/index.ts';
import { useToast } from '../../components/ui/Toast.tsx';
import { DisclaimerBanner } from '../../components/ui/DisclaimerBanner.tsx';
import { Card } from '../../components/ui/Card.tsx';
import { Badge } from '../../components/ui/Badge.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { Switch } from '../../components/ui/Switch.tsx';
import { Accordion, AccordionItemData } from '../../components/ui/Accordion.tsx';
import { BottomSheet } from '../../components/ui/BottomSheet.tsx';
import { Modal } from '../../components/ui/Modal.tsx';
import { EmptyState } from '../../components/ui/EmptyState.tsx';

const PHASE_TITLES: Record<ProcedurePhase, { en: string; mr: string }> = {
  Registration: { en: '1. Registration & FIR', mr: '१. नोंदणी व एफआयआर' },
  Investigation: { en: '2. Spot & Investigation', mr: '२. घटनास्थळ व प्राथमिक तपास' },
  Arrest: { en: '3. Arrest & Custody', mr: '३. अटक व कोठडी प्रक्रिया' },
  SearchSeizure: { en: '4. Search & Seizure (Sec 105)', mr: '४. झडती व जप्ती (कलम १०५)' },
  Evidence: { en: '5. Evidence & Forensic (Sec 63)', mr: '५. पुरावा व फॉरेन्सिक (कलम ६३)' },
  Medical: { en: '6. Medical Examination', mr: '६. वैद्यकीय तपासणी' },
  Statements: { en: '7. Statements & Witness', mr: '७. जबाब व साक्षीदार' },
  Cyber: { en: '8. Cybercrime & Financial Freeze', mr: '८. सायबर व आर्थिक गोठवणे' },
  VictimRights: { en: '9. Victim Rights & Protection', mr: '९. पीडित हक्क व संरक्षण' },
  Chargesheet: { en: '10. Final Report / Chargesheet', mr: '१०. अंतिम अहवाल / दोषारोपपत्र' },
};

const PHASE_ORDER: ProcedurePhase[] = [
  'Registration',
  'Investigation',
  'Arrest',
  'SearchSeizure',
  'Evidence',
  'Medical',
  'Statements',
  'Cyber',
  'VictimRights',
  'Chargesheet',
];

export const OffenceDetailPage: React.FC = () => {
  const { offenceId } = useParams<{ offenceId: string }>();
  const navigate = useNavigate();
  const { t, language } = useI18n();
  const { info, success, error } = useToast();

  // Find offence
  const offence: Offence | undefined = useMemo(() => {
    return OFFENCES_DATA.find((o) => o.id === offenceId);
  }, [offenceId]);

  // Bookmarks
  const { data: bookmarks } = useLiveData(
    () => listBookmarks('offence'),
    ['bookmarks'],
    []
  );
  const { data: stepBookmarks } = useLiveData(
    () => listBookmarks('step'),
    ['bookmarks'],
    []
  );
  const isBookmarked = useMemo(() => {
    return bookmarks?.some((b) => b.refId === offenceId) || false;
  }, [bookmarks, offenceId]);

  const bookmarkedStepSet = useMemo(() => {
    return new Set(stepBookmarks?.map((b) => b.refId) || []);
  }, [stepBookmarks]);

  const handleToggleStepBookmark = async (e: React.MouseEvent, stepId: string) => {
    e.stopPropagation();
    try {
      const added = await toggleBookmark('step', stepId);
      info(
        added
          ? t('procedureGuide.bookmarkedToastAdded')
          : t('procedureGuide.bookmarkedToastRemoved')
      );
    } catch {
      // ignore
    }
  };

  // Open cases for "Use for a case"
  const { data: cases } = useLiveData<CaseRecord[]>(
    () => listCases('open'),
    ['cases'],
    []
  );

  // Questionnaire state pre-filled from offence defaults
  const [womanVictim, setWomanVictim] = useState(false);
  const [childVictim, setChildVictim] = useState(false);
  const [arrestMade, setArrestMade] = useState(false);
  const [searchConducted, setSearchConducted] = useState(false);
  const [electronicEvidence, setElectronicEvidence] = useState(false);

  // BottomSheet info dialog for a specific step
  const [selectedStepForInfo, setSelectedStepForInfo] = useState<GeneratedStep | null>(null);

  // Case picker modal state
  const [isCasePickerOpen, setIsCasePickerOpen] = useState(false);
  const [isSavingRun, setIsSavingRun] = useState(false);

  // Pre-fill state when offence loads or changes
  useEffect(() => {
    if (offence) {
      setWomanVictim(Boolean(offence.factsDefaults.womanVictim));
      setChildVictim(Boolean(offence.factsDefaults.childVictim));
      setArrestMade(Boolean(offence.factsDefaults.arrestLikely));
      setSearchConducted(Boolean(offence.factsDefaults.searchLikely));
      setElectronicEvidence(Boolean(offence.factsDefaults.electronicEvidenceLikely));
    }
  }, [offence]);

  // Handle bookmark toggle
  const handleToggleBookmark = async () => {
    if (!offence) return;
    try {
      const added = await toggleBookmark('offence', offence.id);
      info(
        added
          ? t('procedureGuide.bookmarkedToastAdded')
          : t('procedureGuide.bookmarkedToastRemoved')
      );
    } catch {
      // ignore
    }
  };

  // Compile active facts for rule engine
  const activeFacts: ActiveCaseFacts = useMemo(() => {
    if (!offence) {
      return {
        cognizable: true,
        womanVictim: false,
        childVictim: false,
        arrestMade: false,
        searchConducted: false,
        seizureMade: false,
        electronicEvidence: false,
        rapeCase: false,
        injuryOrDeath: false,
        maxPunishmentYears: 3,
      };
    }

    const isRape =
      offence.category === 'Women and Child' &&
      (offence.id.includes('rape') || offence.title_en.toLowerCase().includes('rape'));

    const isDeathOrInjury =
      offence.id.includes('murder') ||
      offence.id.includes('death') ||
      offence.id.includes('homicide') ||
      offence.title_en.toLowerCase().includes('death');

    const isCyber =
      offence.category === 'Cyber' ||
      offence.id.includes('cyber') ||
      offence.id.includes('it_act') ||
      offence.id.includes('identity_theft');

    return {
      cognizable: offence.cognizable,
      womanVictim,
      childVictim,
      arrestMade,
      searchConducted,
      seizureMade: searchConducted, // Seizure accompanies search
      electronicEvidence,
      rapeCase: isRape,
      injuryOrDeath: isDeathOrInjury,
      cyberFraud: isCyber,
      maxPunishmentYears: offence.maxPunishmentYears,
    };
  }, [offence, womanVictim, childVictim, arrestMade, searchConducted, electronicEvidence]);

  // Generate applicable procedural steps via procedure engine
  const generatedSteps: GeneratedStep[] = useMemo(() => {
    if (!offence) return [];
    return generateChecklist(offence, activeFacts);
  }, [offence, activeFacts]);

  // Group steps by Phase for Accordion display
  const phaseGroups = useMemo(() => {
    const map = new Map<ProcedurePhase, GeneratedStep[]>();
    for (const phase of PHASE_ORDER) {
      map.set(phase, []);
    }
    for (const step of generatedSteps) {
      const list = map.get(step.phase) || [];
      list.push(step);
      map.set(step.phase, list);
    }
    return map;
  }, [generatedSteps]);

  // Start Standalone Checklist Run
  const handleStartStandaloneChecklist = async () => {
    if (!offence) return;
    setIsSavingRun(true);
    try {
      const run = await saveChecklistRun({
        caseId: '',
        offenceId: offence.id,
        steps: generatedSteps.map((s) => ({
          stepId: s.id,
          done: false,
        })),
      });
      success(
        language === 'mr'
          ? 'स्वतंत्र चेकलिस्ट सुरू करण्यात आली.'
          : 'Standalone checklist initialized.'
      );
      navigate(`/checklist/${run.id}`);
    } catch {
      error(
        language === 'mr'
          ? 'चेकलिस्ट जतन करताना त्रुटी आली.'
          : 'Failed to create checklist run.'
      );
    } finally {
      setIsSavingRun(false);
    }
  };

  // Attach Checklist Run to an Existing Case
  const handleAttachToCase = async (targetCaseId: string) => {
    if (!offence) return;
    setIsSavingRun(true);
    try {
      const run = await saveChecklistRun({
        caseId: targetCaseId,
        offenceId: offence.id,
        steps: generatedSteps.map((s) => ({
          stepId: s.id,
          done: false,
        })),
      });
      setIsCasePickerOpen(false);
      success(
        language === 'mr'
          ? 'चेकलिस्ट प्रकरणाशी जोडली गेली!'
          : 'Checklist attached to case successfully!'
      );
      navigate(`/cases/${targetCaseId}?tab=checklist`);
    } catch {
      error(
        language === 'mr'
          ? 'चेकलिस्ट जोडताना त्रुटी आली.'
          : 'Failed to attach checklist to case.'
      );
    } finally {
      setIsSavingRun(false);
    }
  };

  // If offence not found
  if (!offence) {
    return (
      <div className="py-12 space-y-4 max-w-lg mx-auto text-center">
        <EmptyState
          icon={<AlertTriangle className="w-12 h-12 text-warning" />}
          title={
            language === 'mr'
              ? 'गुन्हा सापडला नाही'
              : 'Offence Not Found'
          }
          description={
            language === 'mr'
              ? 'विनंती केलेला गुन्हा सूचीमध्ये उपलब्ध नाही.'
              : 'The requested offence could not be found in the statutory database.'
          }
          actionLabel={language === 'mr' ? 'मार्गदर्शकावर परत जा' : 'Back to Guide'}
          onAction={() => navigate('/guide')}
        />
      </div>
    );
  }

  const primaryTitle = language === 'mr' ? offence.title_mr : offence.title_en;
  const secondaryTitle = language === 'mr' ? offence.title_en : offence.title_mr;
  const description =
    language === 'mr' ? offence.description_mr : offence.description_en;
  const watchOutTips =
    language === 'mr' ? offence.watchOut_mr : offence.watchOut_en;

  const punishmentText =
    offence.maxPunishmentYears >= 99
      ? t('procedureGuide.lifePunishment')
      : t('procedureGuide.maxPunishment', {
          years: offence.maxPunishmentYears,
        });

  // Prepare Accordion items for non-empty phases
  const accordionItems: AccordionItemData[] = PHASE_ORDER.filter((phase) => {
    const list = phaseGroups.get(phase);
    return list && list.length > 0;
  }).map((phase, idx) => {
    const stepsInPhase = phaseGroups.get(phase) || [];
    const phaseTitle =
      language === 'mr'
        ? PHASE_TITLES[phase].mr
        : PHASE_TITLES[phase].en;

    return {
      id: phase,
      defaultOpen: idx === 0, // open first phase by default
      title: phaseTitle,
      badge: (
        <Badge variant="neutral" size="sm">
          {language === 'mr'
            ? `${stepsInPhase.length} पायऱ्या`
            : `${stepsInPhase.length} steps`}
        </Badge>
      ),
      content: (
        <div className="divide-y divide-navy-700/60">
          {stepsInPhase.map((step) => {
            const stepText = language === 'mr' ? step.text_mr : step.text_en;
            return (
              <div
                key={step.id}
                className="py-3 px-1 flex items-start justify-between gap-3 group hover:bg-navy-700/30 rounded-xl transition-colors"
              >
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-navy-800 text-navy-200 border border-navy-700">
                      {step.mandatory
                        ? t('procedureGuide.mandatoryBadge')
                        : t('procedureGuide.discretionaryBadge')}
                    </span>

                    {/* Legal reference chips */}
                    {step.legalRefs.map((ref, rIdx) => (
                      <span
                        key={rIdx}
                        className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-md bg-saffron/10 text-saffron border border-saffron/20"
                      >
                        {ref.act} {ref.section}
                        {ref.subSection ? `(${ref.subSection})` : ''}
                      </span>
                    ))}

                    {step.needsEvidence && (
                      <span className="text-[11px] flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20">
                        <Video className="w-3 h-3" />
                        <span>Sec 105 A/V</span>
                      </span>
                    )}
                  </div>

                  {/* Step descriptive text */}
                  <p className="text-sm text-white font-normal leading-relaxed">
                    {stepText}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {/* Step Bookmark Star Button */}
                  <button
                    type="button"
                    onClick={(e) => handleToggleStepBookmark(e, step.id)}
                    title={bookmarkedStepSet.has(step.id) ? 'Remove bookmark' : 'Bookmark step'}
                    aria-label="Bookmark step"
                    className={`p-2 rounded-xl transition-colors ${
                      bookmarkedStepSet.has(step.id)
                        ? 'text-saffron bg-saffron/10 border border-saffron/30'
                        : 'text-navy-400 hover:text-saffron hover:bg-navy-600/60 border border-transparent hover:border-navy-600'
                    }`}
                  >
                    <Star
                      className={`w-4 h-4 ${
                        bookmarkedStepSet.has(step.id) ? 'fill-saffron text-saffron' : ''
                      }`}
                    />
                  </button>

                  {/* 'i' Info button to open why it matters BottomSheet */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedStepForInfo(step);
                    }}
                    title={t('procedureGuide.whyItMatters')}
                    aria-label="View legal rationale"
                    className="p-2 rounded-xl text-navy-400 hover:text-saffron hover:bg-navy-600/60 border border-transparent hover:border-navy-600 transition-colors"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ),
    };
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 space-y-6 pb-24 w-full animate-in fade-in duration-200">
      {/* 1. Mandatory DisclaimerBanner at top of this page */}
      <DisclaimerBanner type="legal" />

      {/* Back to Guide Link */}
      <div>
        <Link
          to="/guide"
          className="inline-flex items-center gap-1.5 text-xs text-navy-300 hover:text-saffron transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>
            {language === 'mr' ? 'सर्व गुन्ह्यांच्या यादीवर परत' : 'All Offences Guide'}
          </span>
        </Link>
      </div>

      {/* 2. Header with title, BNS section, old IPC section, description */}
      <div className="bg-navy-800/80 border border-navy-700 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-mono font-bold text-sm text-saffron bg-saffron/15 px-2.5 py-1 rounded-lg border border-saffron/30">
                {offence.bnsSection}
              </span>
              <span className="text-xs text-navy-300 font-medium">
                {language === 'mr'
                  ? `(पूर्वीचे ${offence.oldIpcSection})`
                  : `(was ${offence.oldIpcSection})`}
              </span>
              <span className="text-xs text-navy-400 font-normal">
                • {offence.category}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-snug">
              {primaryTitle}
            </h1>
            <p className="text-sm text-navy-300 font-medium">{secondaryTitle}</p>
          </div>

          {/* Bookmark Button */}
          <button
            type="button"
            onClick={handleToggleBookmark}
            aria-label="Bookmark offence"
            className={`p-2.5 rounded-xl border transition-all ${
              isBookmarked
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 shadow-xs'
                : 'bg-navy-700/80 border-navy-600 text-navy-400 hover:text-amber-400 hover:border-navy-500'
            }`}
          >
            <Star
              className={`w-5 h-5 ${
                isBookmarked ? 'fill-amber-400 text-amber-400' : ''
              }`}
            />
          </button>
        </div>

        {/* Badges strip */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Badge
            variant={offence.cognizable ? 'success' : 'neutral'}
            size="md"
          >
            {offence.cognizable
              ? t('procedureGuide.cognizableBadge')
              : t('procedureGuide.nonCognizableBadge')}
          </Badge>

          <Badge variant="neutral" size="md" className="text-navy-200">
            <Clock className="w-3.5 h-3.5 mr-1 text-navy-400" />
            {punishmentText}
          </Badge>

          <Badge
            variant="pendingReview"
            size="md"
          >
            <ShieldAlert className="w-3.5 h-3.5 mr-1 text-amber-400" />
            {t('procedureGuide.pendingReview')}
          </Badge>
        </div>

        {/* Detailed Description */}
        <p className="text-sm text-navy-200 leading-relaxed pt-2 border-t border-navy-700/60">
          {description}
        </p>
      </div>

      {/* 3. Watch out tips as a saffron-bordered card */}
      <div className="border border-saffron/40 bg-saffron/5 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-saffron">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <h2 className="text-base font-bold text-saffron">
            {t('procedureGuide.watchOutTitle')}
          </h2>
        </div>

        <ul className="space-y-2.5 pl-1">
          {watchOutTips.map((tip, idx) => (
            <li
              key={idx}
              className="flex items-start gap-2.5 text-xs sm:text-sm text-navy-100 leading-relaxed"
            >
              <span className="w-5 h-5 rounded-full bg-saffron/20 text-saffron text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 4. QUESTIONNAIRE: Answer a few questions to get your checklist */}
      <div className="bg-navy-800/80 border border-navy-700 rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-navy-700/80 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-saffron" />
              <span>{t('procedureGuide.questionnaireTitle')}</span>
            </h2>
            <p className="text-xs sm:text-sm text-navy-300 mt-0.5">
              {t('procedureGuide.questionnaireSubtitle')}
            </p>
          </div>

          {/* Live Counter Badge */}
          <div className="self-start sm:self-auto px-3.5 py-1.5 rounded-full bg-saffron/15 border border-saffron/30 text-saffron font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-saffron" />
            <span>
              {t('procedureGuide.stepsApplyCount', {
                count: generatedSteps.length,
              })}
            </span>
          </div>
        </div>

        {/* Short Switch questions with plain-language help text */}
        <div className="space-y-4">
          {/* Q1: Woman Victim */}
          <div className="p-3.5 rounded-xl bg-navy-900/40 border border-navy-700/60 hover:border-navy-600 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-white block cursor-pointer">
                  {t('procedureGuide.qWomanVictim')}
                </label>
                <p className="text-xs text-navy-300 leading-relaxed">
                  {t('procedureGuide.qWomanVictimHelp')}
                </p>
              </div>
              <Switch checked={womanVictim} onChange={setWomanVictim} />
            </div>
          </div>

          {/* Q2: Child Victim */}
          <div className="p-3.5 rounded-xl bg-navy-900/40 border border-navy-700/60 hover:border-navy-600 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-white block cursor-pointer">
                  {t('procedureGuide.qChildVictim')}
                </label>
                <p className="text-xs text-navy-300 leading-relaxed">
                  {t('procedureGuide.qChildVictimHelp')}
                </p>
              </div>
              <Switch checked={childVictim} onChange={setChildVictim} />
            </div>
          </div>

          {/* Q3: Arrest Planned or Made */}
          <div className="p-3.5 rounded-xl bg-navy-900/40 border border-navy-700/60 hover:border-navy-600 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-white block cursor-pointer">
                  {t('procedureGuide.qArrest')}
                </label>
                <p className="text-xs text-navy-300 leading-relaxed">
                  {t('procedureGuide.qArrestHelp')}
                </p>
              </div>
              <Switch checked={arrestMade} onChange={setArrestMade} />
            </div>
          </div>

          {/* Q4: Will you search or seize */}
          <div className="p-3.5 rounded-xl bg-navy-900/40 border border-navy-700/60 hover:border-navy-600 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-white block cursor-pointer">
                  {t('procedureGuide.qSearch')}
                </label>
                <p className="text-xs text-navy-300 leading-relaxed">
                  {t('procedureGuide.qSearchHelp')}
                </p>
              </div>
              <Switch checked={searchConducted} onChange={setSearchConducted} />
            </div>
          </div>

          {/* Q5: Electronic Evidence Involved */}
          <div className="p-3.5 rounded-xl bg-navy-900/40 border border-navy-700/60 hover:border-navy-600 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-white block cursor-pointer">
                  {t('procedureGuide.qElectronic')}
                </label>
                <p className="text-xs text-navy-300 leading-relaxed">
                  {t('procedureGuide.qElectronicHelp')}
                </p>
              </div>
              <Switch
                checked={electronicEvidence}
                onChange={setElectronicEvidence}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 5. PREVIEW: generated steps grouped by phase in Accordions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="text-lg font-bold text-white">
              {t('procedureGuide.applicableStepsTitle')}
            </h3>
            <p className="text-xs text-navy-300">
              {t('procedureGuide.applicableStepsSubtitle')}
            </p>
          </div>
          <span className="text-xs text-navy-400 font-mono">
            {generatedSteps.length} {language === 'mr' ? 'पायऱ्या' : 'steps'}
          </span>
        </div>

        {accordionItems.length === 0 ? (
          <div className="p-6 text-center text-navy-400 bg-navy-800/40 border border-navy-700 rounded-2xl">
            {language === 'mr'
              ? 'निवडलेल्या निकषांनुसार कोणतीही पायरी लागू होत नाही.'
              : 'No steps triggered by current fact selections.'}
          </div>
        ) : (
          <Accordion items={accordionItems} allowMultiple />
        )}
      </div>

      {/* 6. Sticky / Bottom Action Bar: Start checklist & Use for a case */}
      <div className="sticky bottom-4 z-20 bg-navy-900/95 backdrop-blur-md border border-navy-700/90 rounded-2xl p-4 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-navy-300">
          <Scale className="w-4 h-4 text-saffron shrink-0" />
          <span>
            {language === 'mr'
              ? `${generatedSteps.length} वैधानिक पायऱ्यांसह चेकलिस्ट तयार करण्यास तयार`
              : `Ready to initiate procedural run with ${generatedSteps.length} statutory steps`}
          </span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Start Standalone Checklist */}
          <Button
            variant="secondary"
            size="md"
            className="flex-1 sm:flex-initial"
            loading={isSavingRun}
            onClick={handleStartStandaloneChecklist}
          >
            <PlayCircle className="w-4 h-4 mr-2 text-saffron" />
            <span>{t('procedureGuide.startChecklistBtn')}</span>
          </Button>

          {/* Use for a Case */}
          <Button
            variant="primary"
            size="md"
            className="flex-1 sm:flex-initial"
            onClick={() => setIsCasePickerOpen(true)}
          >
            <FolderPlus className="w-4 h-4 mr-2" />
            <span>{t('procedureGuide.useForCaseBtn')}</span>
          </Button>
        </div>
      </div>

      {/* BottomSheet: "Why It Matters" info dialog */}
      <BottomSheet
        isOpen={Boolean(selectedStepForInfo)}
        onClose={() => setSelectedStepForInfo(null)}
        title={
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-saffron" />
            <span className="text-base font-bold text-white">
              {t('procedureGuide.whyItMatters')}
            </span>
          </div>
        }
      >
        {selectedStepForInfo && (
          <div className="space-y-4 px-1 py-2 text-sm">
            {/* Step full text */}
            <div className="p-3.5 rounded-xl bg-navy-800/80 border border-navy-700/80">
              <span className="text-xs text-navy-300 font-semibold block mb-1">
                {language === 'mr' ? 'वैधानिक पायरी:' : 'Statutory Mandate:'}
              </span>
              <p className="text-white font-medium leading-relaxed">
                {language === 'mr'
                  ? selectedStepForInfo.text_mr
                  : selectedStepForInfo.text_en}
              </p>
            </div>

            {/* Why It Matters */}
            <div className="space-y-1.5">
              <h4 className="text-xs uppercase tracking-wider font-bold text-saffron">
                {t('procedureGuide.whyItMatters')}
              </h4>
              <p className="text-navy-100 bg-navy-800/40 p-3 rounded-xl border border-navy-700/60 leading-relaxed">
                {language === 'mr'
                  ? selectedStepForInfo.why_mr
                  : selectedStepForInfo.why_en}
              </p>
            </div>

            {/* Why Included */}
            <div className="space-y-1.5">
              <h4 className="text-xs uppercase tracking-wider font-bold text-navy-300">
                {t('procedureGuide.inclusionReason')}
              </h4>
              <p className="text-navy-200 bg-navy-800/40 p-3 rounded-xl border border-navy-700/60 text-xs leading-relaxed">
                {language === 'mr'
                  ? selectedStepForInfo.inclusionReason_mr
                  : selectedStepForInfo.inclusionReason_en}
              </p>
            </div>

            {/* Legal References */}
            <div className="space-y-2">
              <h4 className="text-xs uppercase tracking-wider font-bold text-navy-300">
                {language === 'mr' ? 'कायदेशीर संदर्भ:' : 'Statutory Provisions:'}
              </h4>
              <div className="space-y-2">
                {selectedStepForInfo.legalRefs.map((ref, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-navy-800/60 border border-navy-700/80 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-mono font-bold text-saffron">
                      <span>
                        {ref.act} Sec {ref.section}
                        {ref.subSection ? `(${ref.subSection})` : ''}
                      </span>
                      <span className="text-[10px] text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                        {t('procedureGuide.unverifiedStatus')}
                      </span>
                    </div>
                    <p className="text-white font-medium">
                      {language === 'mr' ? ref.title_mr : ref.title_en}
                    </p>
                    <p className="text-navy-300">
                      {language === 'mr' ? ref.summary_mr : ref.summary_en}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Verified legal status card */}
            <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-center justify-between text-xs">
              <span className="text-navy-200 font-medium">
                {t('procedureGuide.verifiedLegalStatus')}
              </span>
              <span className="text-amber-300 font-bold">
                {t('procedureGuide.unverifiedStatus')}
              </span>
            </div>
          </div>
        )}
      </BottomSheet>

      {/* Modal: "Use for a Case" - pick existing case or new case */}
      <Modal
        isOpen={isCasePickerOpen}
        onClose={() => setIsCasePickerOpen(false)}
        title={t('procedureGuide.selectCaseDialogTitle')}
        maxWidth="lg"
      >
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-navy-200">
            {t('procedureGuide.selectCaseDialogDesc')}
          </p>

          {/* List of open cases */}
          {cases && cases.length > 0 ? (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {cases.map((c) => (
                <div
                  key={c.id}
                  onClick={() => handleAttachToCase(c.id)}
                  className="p-3 rounded-xl bg-navy-800 border border-navy-700 hover:border-saffron/60 hover:bg-navy-700/60 cursor-pointer transition-all flex items-center justify-between gap-3 group"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white text-sm group-hover:text-saffron transition-colors">
                        FIR: {c.firNo}
                      </span>
                      <span className="text-xs text-navy-400 font-mono">
                        ({c.caseNo})
                      </span>
                    </div>
                    <p className="text-xs text-navy-300 truncate mt-0.5">
                      {c.complainantName ? `${c.complainantName} • ` : ''}
                      {c.summary || 'Open Investigation'}
                    </p>
                  </div>

                  <span className="text-xs text-saffron flex items-center gap-1 font-medium shrink-0 group-hover:translate-x-0.5 transition-transform">
                    <span>{t('procedureGuide.attachChoice')}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-navy-800/40 border border-navy-700 text-center text-xs text-navy-300">
              {t('procedureGuide.noOpenCases')}
            </div>
          )}

          {/* Create new case instead button */}
          <div className="pt-2 border-t border-navy-700/60 flex flex-col gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="w-full justify-center"
              onClick={() => {
                setIsCasePickerOpen(false);
                navigate(`/cases/new?offenceId=${offence.id}`);
              }}
            >
              <FolderPlus className="w-4 h-4 mr-1.5 text-saffron" />
              <span>{t('procedureGuide.createNewCasePrompt')}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-center"
              onClick={() => setIsCasePickerOpen(false)}
            >
              {t('procedureGuide.cancel')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
