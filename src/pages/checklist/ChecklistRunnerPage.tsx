import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  CheckSquare,
  ArrowLeft,
  Share2,
  RotateCw,
  Info,
  Paperclip,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  X,
  Plus,
  ExternalLink,
  ShieldCheck,
  Layers,
  Sparkles,
  AlertCircle,
  HardDrive,
  Search,
} from 'lucide-react';
import {
  getChecklistRun,
  saveChecklistRun,
  getCase,
  listEvidenceByCase,
  useLiveData,
} from '../../lib/db/index.ts';
import {
  ChecklistRunRecord,
  ChecklistStepState,
  CaseRecord,
  EvidenceRecord,
} from '../../types/database.ts';
import { OFFENCES_DATA } from '../../data/offences.ts';
import { GENERAL_PROCEDURE_STEPS } from '../../data/steps.ts';
import {
  ProcedurePhase,
  ProcedureStep,
  GeneratedStep,
  Offence,
  ActiveCaseFacts,
} from '../../data/types.ts';
import { generateChecklist } from '../../lib/procedure/generate.ts';
import { calculateCaseDeadlines } from '../../lib/procedure/deadlines.ts';
import { useI18n, formatDateTime } from '../../i18n/index.ts';
import { useToast } from '../../components/ui/Toast.tsx';
import {
  Button,
  Badge,
  Card,
  ProgressRing,
  ConfirmDialog,
  BottomSheet,
  Modal,
  EmptyState,
  Skeleton,
} from '../../components/ui/index.ts';

// Standard ordered procedure phases matching ProcedurePhase
const PHASES_ORDER: ProcedurePhase[] = [
  'Registration',
  'Investigation',
  'SearchSeizure',
  'Arrest',
  'Evidence',
  'Statements',
  'Medical',
  'Chargesheet',
  'VictimRights',
  'Cyber',
];

interface ResolvedStepItem {
  state: ChecklistStepState;
  def: GeneratedStep;
  deadlineNotice?: {
    label: string;
    targetIso: string;
    isOverdue: boolean;
    hoursRemaining: number;
    severity: 'info' | 'warning' | 'danger';
  };
}

export const ChecklistRunnerPage: React.FC = () => {
  const { runId } = useParams<{ runId: string }>();
  const navigate = useNavigate();
  const { t, language } = useI18n();
  const { success, error, info } = useToast();

  // Load run record with live updates
  const { data: run, loading: runLoading } = useLiveData<ChecklistRunRecord | null>(
    () => (runId ? getChecklistRun(runId) : Promise.resolve(null)),
    ['checklistRuns'],
    [runId]
  );

  // Load associated case with live updates
  const { data: currentCase } = useLiveData<CaseRecord | null>(
    () => (run?.caseId ? getCase(run.caseId) : Promise.resolve(null)),
    ['cases'],
    [run?.caseId]
  );

  // Load case evidence with live updates
  const { data: caseEvidenceData } = useLiveData<EvidenceRecord[]>(
    () => (run?.caseId ? listEvidenceByCase(run.caseId) : Promise.resolve([])),
    ['evidence'],
    [run?.caseId]
  );

  const caseEvidence = useMemo(() => caseEvidenceData || [], [caseEvidenceData]);

  // UI state
  const [filter, setFilter] = useState<'all' | 'pending' | 'done' | 'mandatory'>('all');
  const [collapsedPhases, setCollapsedPhases] = useState<Record<string, boolean>>({});
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});
  const [isScrolled, setIsScrolled] = useState<boolean>(false);

  // Modals & BottomSheets state
  const [selectedWhyStep, setSelectedWhyStep] = useState<GeneratedStep | null>(null);
  const [attachEvidenceStepId, setAttachEvidenceStepId] = useState<string | null>(null);
  const [uncheckTarget, setUncheckTarget] = useState<{ stepId: string; stepTitle: string } | null>(null);
  const [markAllTarget, setMarkAllTarget] = useState<{ phase: ProcedurePhase; stepIds: string[] } | null>(null);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState<boolean>(false);

  // Track window scroll for sticky progress bar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 140);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Look up primary offence definition
  const offence = useMemo<Offence | null>(() => {
    if (!run) return null;
    return OFFENCES_DATA.find((o) => o.id === run.offenceId) || OFFENCES_DATA[0];
  }, [run]);

  // Deadlines for current case
  const caseDeadlines = useMemo(() => {
    if (!currentCase) return [];
    return calculateCaseDeadlines([currentCase]);
  }, [currentCase]);

  // Map of all possible step definitions
  const allStepDefsMap = useMemo(() => {
    const map = new Map<string, ProcedureStep>();
    GENERAL_PROCEDURE_STEPS.forEach((step) => map.set(step.id, step));
    return map;
  }, []);

  // Build robust effective case facts
  const effectiveFacts = useMemo<ActiveCaseFacts>(() => {
    if (!offence) {
      return {
        cognizable: true,
        womanVictim: false,
        childVictim: false,
        arrestMade: false,
        searchConducted: false,
        electronicEvidence: false,
        seizureMade: false,
        rapeCase: false,
        injuryOrDeath: false,
        maxPunishmentYears: 3,
      };
    }

    const defaults = offence.factsDefaults || {};
    return {
      cognizable: Boolean(offence.cognizable),
      womanVictim: Boolean(currentCase?.facts?.womanVictim ?? defaults.womanVictim ?? false),
      childVictim: Boolean(currentCase?.facts?.childVictim ?? defaults.childVictim ?? false),
      arrestMade: Boolean(currentCase?.facts?.arrestMade ?? defaults.arrestLikely ?? false),
      searchConducted: Boolean(currentCase?.facts?.searchConducted ?? defaults.searchLikely ?? false),
      electronicEvidence: Boolean(currentCase?.facts?.electronicEvidence ?? defaults.electronicEvidenceLikely ?? false),
      seizureMade: Boolean(currentCase?.facts?.seizureMade ?? defaults.searchLikely ?? false),
      rapeCase: Boolean(currentCase?.facts?.rapeCase ?? defaults.rapeCase ?? false),
      injuryOrDeath: Boolean(currentCase?.facts?.injuryOrDeath ?? defaults.injuryOrDeath ?? false),
      cyberFraud: Boolean(currentCase?.facts?.cyberFraud ?? defaults.cyberLikely ?? false),
      isEFIR: Boolean(currentCase?.facts?.isEFIR ?? false),
      maxPunishmentYears: offence.maxPunishmentYears,
      ...(currentCase?.facts || {}),
    };
  }, [offence, currentCase]);

  // Resolve steps into unified items with definition & state
  const resolvedSteps = useMemo<ResolvedStepItem[]>(() => {
    if (!run || !offence) return [];

    // Build generated catalog for accurate inclusion reasons
    const fullGeneratedCatalog = generateChecklist(offence, effectiveFacts, []);
    const generatedMap = new Map<string, GeneratedStep>();
    fullGeneratedCatalog.forEach((step) => generatedMap.set(step.id, step));

    return run.steps.map((stepState) => {
      const generated = generatedMap.get(stepState.stepId);
      const rawDef = allStepDefsMap.get(stepState.stepId);

      const def: GeneratedStep = generated || {
        ...(rawDef || {
          id: stepState.stepId,
          phase: 'Investigation',
          text_en: stepState.stepId,
          text_mr: stepState.stepId,
          why_en: 'Mandatory standard investigation procedure under BNSS 2023.',
          why_mr: 'BNSS २०२३ अंतर्गत मानक तपास कार्यपद्धती.',
          legalRefs: [],
          mandatory: true,
          needsEvidence: false,
          verified: false,
        }),
        inclusionReason_en: 'Triggered by case facts and offence classification.',
        inclusionReason_mr: 'गुन्ह्याची वैशिष्ट्ये आणि प्रकरणातील वस्तुस्थितीनुसार लागू.',
      };

      // Check if any active deadline corresponds to this step
      let deadlineNotice: ResolvedStepItem['deadlineNotice'] = undefined;
      const matchingDeadline = caseDeadlines.find((dl) => {
        if (def.id.includes('efir') && dl.ruleId === 'deadline_efir_signature') return true;
        if (def.id.includes('prelim') && dl.ruleId === 'deadline_preliminary_enquiry') return true;
        if (def.id.includes('magistrate_24h') && dl.ruleId === 'deadline_magistrate_production_24h') return true;
        if ((def.id.includes('search_video') || def.id.includes('seizure')) && dl.ruleId === 'deadline_seizure_video_transmission_24h') return true;
        if (def.id.includes('rape_medical') && dl.ruleId === 'deadline_rape_medical_report_7d') return true;
        if ((def.id.includes('chargesheet') || def.id.includes('police_report')) && (dl.ruleId.includes('chargesheet') || dl.ruleId.includes('bail'))) return true;
        if (def.id.includes('progress_update') && dl.ruleId === 'deadline_victim_progress_update_90d') return true;
        return false;
      });

      if (matchingDeadline) {
        deadlineNotice = {
          label: language === 'mr' ? matchingDeadline.label_mr : matchingDeadline.label_en,
          targetIso: matchingDeadline.targetDateTime,
          isOverdue: matchingDeadline.isOverdue,
          hoursRemaining: matchingDeadline.hoursRemaining,
          severity: matchingDeadline.severity,
        };
      }

      return {
        state: stepState,
        def,
        deadlineNotice,
      };
    });
  }, [run, offence, effectiveFacts, allStepDefsMap, caseDeadlines, language]);

  // Overall statistics
  const stats = useMemo(() => {
    const total = resolvedSteps.length;
    const done = resolvedSteps.filter((s) => s.state.done).length;
    const remaining = total - done;
    const mandatoryTotal = resolvedSteps.filter((s) => s.def.mandatory).length;
    const mandatoryDone = resolvedSteps.filter((s) => s.def.mandatory && s.state.done).length;
    const mandatoryRemaining = mandatoryTotal - mandatoryDone;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;

    return {
      total,
      done,
      remaining,
      mandatoryTotal,
      mandatoryDone,
      mandatoryRemaining,
      percent,
      allMandatoryDone: mandatoryTotal > 0 && mandatoryRemaining === 0,
    };
  }, [resolvedSteps]);

  // Filtered steps
  const filteredSteps = useMemo(() => {
    return resolvedSteps.filter((item) => {
      if (filter === 'pending') return !item.state.done;
      if (filter === 'done') return item.state.done;
      if (filter === 'mandatory') return item.def.mandatory && !item.state.done;
      return true;
    });
  }, [resolvedSteps, filter]);

  // Group steps by procedure phase
  const groupedSteps = useMemo(() => {
    const groups: {
      phase: ProcedurePhase;
      items: ResolvedStepItem[];
      totalInPhase: number;
      doneInPhase: number;
    }[] = [];

    PHASES_ORDER.forEach((phase) => {
      const allInPhase = resolvedSteps.filter((s) => s.def.phase === phase);
      const itemsMatchingFilter = filteredSteps.filter((s) => s.def.phase === phase);

      if (allInPhase.length > 0) {
        const doneInPhase = allInPhase.filter((s) => s.state.done).length;
        groups.push({
          phase,
          items: itemsMatchingFilter,
          totalInPhase: allInPhase.length,
          doneInPhase,
        });
      }
    });

    return groups;
  }, [resolvedSteps, filteredSteps]);

  // Phase translation helper
  const getPhaseTitle = (phase: ProcedurePhase): string => {
    const map: Record<ProcedurePhase, { en: string; mr: string }> = {
      Registration: { en: 'Registration & Initial Cognizance', mr: 'नोंदणी व सुरुवातीची दखल' },
      Investigation: { en: 'Investigation & Scene Inspection', mr: 'तपास व घटनास्थळ पाहणी' },
      SearchSeizure: { en: 'Search & Seizure Operations', mr: 'झडती व जप्ती कारवाई' },
      Arrest: { en: 'Arrest & Magistrate Production', mr: 'अटक व दंडाधिकारी हजर' },
      Evidence: { en: 'Digital & Forensic Evidence Vault', mr: 'डिजिटल व फॉरेन्सिक पुरावे' },
      Statements: { en: 'Witness & Victim Statements', mr: 'साक्षीदार व पीडित जबाब' },
      Medical: { en: 'Medical Examination', mr: 'वैद्यकीय तपासणी' },
      Chargesheet: { en: 'Final Report & Chargesheet', mr: 'अंतिम अहवाल व दोषारोपपत्र' },
      VictimRights: { en: 'Victim Rights & Informant Updates', mr: 'पीडित हक्क व प्रगती अहवाल' },
      Cyber: { en: 'Cybercrime & Financial Freeze', mr: 'सायबर गुन्हा व खाती गोठवणे' },
    };
    return language === 'mr' ? map[phase]?.mr || phase : map[phase]?.en || phase;
  };

  // Helper to persist updated run record to IndexedDB
  const persistRun = async (newSteps: ChecklistStepState[]): Promise<void> => {
    if (!run) return;
    try {
      const updated: ChecklistRunRecord = {
        ...run,
        steps: newSteps,
        updatedAt: new Date().toISOString(),
      };
      await saveChecklistRun(updated);
    } catch (err) {
      console.error('Failed to save checklist progress:', err);
      error(
        language === 'mr' ? 'डिव्हाइसवर सेव्ह करताना त्रुटी आली' : 'Failed to save to local device'
      );
    }
  };

  // Handle tick/un-tick toggle
  const handleToggleStep = (stepItem: ResolvedStepItem) => {
    if (!run) return;

    if (stepItem.state.done) {
      // Un-tick requires confirmation dialog
      const title = language === 'mr' ? stepItem.def.text_mr : stepItem.def.text_en;
      setUncheckTarget({ stepId: stepItem.state.stepId, stepTitle: title });
    } else {
      // Direct tick
      const nowIso = new Date().toISOString();
      const updatedSteps = run.steps.map((s) =>
        s.stepId === stepItem.state.stepId
          ? { ...s, done: true, doneAt: nowIso, isNew: false }
          : s
      );
      persistRun(updatedSteps);
      success(
        language === 'mr' ? 'पायरी पूर्ण म्हणून नोंदवली.' : 'Step marked as completed.'
      );
    }
  };

  // Confirm un-ticking a completed step
  const confirmUncheck = () => {
    if (!run || !uncheckTarget) return;
    const updatedSteps = run.steps.map((s) =>
      s.stepId === uncheckTarget.stepId
        ? { ...s, done: false, doneAt: undefined }
        : s
    );
    persistRun(updatedSteps);
    setUncheckTarget(null);
    info(
      language === 'mr' ? 'पायरी प्रलंबित म्हणून परत नोंदवली.' : 'Step reverted to pending.'
    );
  };

  // Update note for a step
  const handleNoteChange = (stepId: string, noteValue: string) => {
    if (!run) return;
    const updatedSteps = run.steps.map((s) =>
      s.stepId === stepId ? { ...s, note: noteValue } : s
    );
    persistRun(updatedSteps);
  };

  // Mark all in phase
  const handleMarkAllInPhase = (phase: ProcedurePhase) => {
    const uncompletedInPhase = resolvedSteps
      .filter((s) => s.def.phase === phase && !s.state.done)
      .map((s) => s.state.stepId);

    if (uncompletedInPhase.length === 0) return;

    setMarkAllTarget({
      phase,
      stepIds: uncompletedInPhase,
    });
  };

  const confirmMarkAllInPhase = () => {
    if (!run || !markAllTarget) return;
    const nowIso = new Date().toISOString();
    const updatedSteps = run.steps.map((s) => {
      if (markAllTarget.stepIds.includes(s.stepId)) {
        return { ...s, done: true, doneAt: nowIso, isNew: false };
      }
      return s;
    });

    persistRun(updatedSteps);
    setMarkAllTarget(null);
    success(
      language === 'mr'
        ? `${getPhaseTitle(markAllTarget.phase)} मधील सर्व पायऱ्या पूर्ण नोंदवल्या.`
        : `All steps in ${getPhaseTitle(markAllTarget.phase)} marked as completed.`
    );
  };

  // Toggle attachment of evidence to step
  const handleToggleEvidenceAttachment = (stepId: string, evidenceId: string) => {
    if (!run) return;
    const updatedSteps = run.steps.map((s) => {
      if (s.stepId !== stepId) return s;
      const currentAttached = s.evidenceIds || [];
      const isAlready = currentAttached.includes(evidenceId);
      const newAttached = isAlready
        ? currentAttached.filter((id) => id !== evidenceId)
        : [...currentAttached, evidenceId];
      return { ...s, evidenceIds: newAttached };
    });

    persistRun(updatedSteps);
  };

  // Detach evidence directly from card chip
  const handleDetachEvidence = (stepId: string, evidenceId: string) => {
    if (!run) return;
    const updatedSteps = run.steps.map((s) => {
      if (s.stepId !== stepId) return s;
      return {
        ...s,
        evidenceIds: (s.evidenceIds || []).filter((id) => id !== evidenceId),
      };
    });
    persistRun(updatedSteps);
    info(
      language === 'mr' ? 'पुरावा पायरीवरून काढला.' : 'Evidence detached from step.'
    );
  };

  // Regenerate checklist based on updated case facts
  const handleRegenerate = async () => {
    if (!run || !offence) return;

    setShowRegenerateConfirm(false);

    const freshSteps = generateChecklist(offence, effectiveFacts, []);
    const existingMap = new Map<string, ChecklistStepState>();
    run.steps.forEach((s) => existingMap.set(s.stepId, s));

    let newStepsCount = 0;
    const mergedSteps: ChecklistStepState[] = freshSteps.map((fStep) => {
      const existing = existingMap.get(fStep.id);
      if (existing) {
        return existing;
      }
      newStepsCount++;
      return {
        stepId: fStep.id,
        done: false,
        isNew: true,
      };
    });

    // Also preserve any custom steps that were previously in the run
    run.steps.forEach((s) => {
      if (!freshSteps.some((fs) => fs.id === s.stepId)) {
        mergedSteps.push(s);
      }
    });

    await persistRun(mergedSteps);
    success(
      language === 'mr'
        ? `चेकलिस्ट यशस्वीरीत्या अद्ययावत केली. ${newStepsCount} नवीन पायऱ्या जोडल्या.`
        : `Checklist regenerated with current case facts. ${newStepsCount} new step(s) added.`
    );
  };

  // Plain text summary generation for sharing
  const handleShareSummary = async () => {
    if (!run || !offence) return;

    const caseInfo = currentCase
      ? `Case No: ${currentCase.caseNo} | FIR No: ${currentCase.firNo} (${currentCase.policeStation})`
      : 'Standalone Procedure Checklist';

    const header = [
      '========================================',
      'NYAY SAATHI • POLICE INVESTIGATION SUMMARY',
      '========================================',
      caseInfo,
      `Offence: ${offence.title_en} [BNS ${offence.bnsSection}]`,
      `Progress: ${stats.done}/${stats.total} steps completed (${stats.percent}%)`,
      `Mandatory Remaining: ${stats.mandatoryRemaining}`,
      `Generated: ${new Date().toLocaleString()}`,
      '----------------------------------------',
      '',
    ].join('\n');

    const bodySections: string[] = [];

    PHASES_ORDER.forEach((phase) => {
      const inPhase = resolvedSteps.filter((s) => s.def.phase === phase);
      if (inPhase.length === 0) return;

      const phaseLines = [
        `[ ${getPhaseTitle(phase).toUpperCase()} ]`,
      ];

      inPhase.forEach((item, idx) => {
        const mark = item.state.done ? '[✓ DONE]' : item.def.mandatory ? '[! MANDATORY]' : '[  OPEN   ]';
        const text = language === 'mr' ? item.def.text_mr : item.def.text_en;
        const refs = item.def.legalRefs.map((r) => `${r.act} ${r.section}`).join(', ');
        const refsText = refs ? ` (${refs})` : '';
        const timeText = item.state.doneAt ? ` - Completed: ${new Date(item.state.doneAt).toLocaleTimeString()}` : '';
        const noteText = item.state.note ? `\n    Note: "${item.state.note}"` : '';

        phaseLines.push(`${idx + 1}. ${mark} ${text}${refsText}${timeText}${noteText}`);
      });

      phaseLines.push('');
      bodySections.push(phaseLines.join('\n'));
    });

    const footer = [
      '----------------------------------------',
      'Notice: Generated via Nyay Saathi Offline Decision Support System.',
      'BNSS 2023 Statutory Investigation Checkpoint Log.',
      '========================================',
    ].join('\n');

    const fullSummaryText = `${header}\n${bodySections.join('\n')}\n${footer}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Nyay Saathi Checklist - ${currentCase?.firNo || offence.bnsSection}`,
          text: fullSummaryText,
        });
        success(
          language === 'mr' ? 'सारांश यशस्वीरीत्या शेअर केला.' : 'Checklist summary shared.'
        );
        return;
      } catch (err: unknown) {
        if ((err as Error).name !== 'AbortError') {
          console.warn('Share API failed, falling back to clipboard:', err);
        } else {
          return;
        }
      }
    }

    // Fallback: clipboard copy
    try {
      await navigator.clipboard.writeText(fullSummaryText);
      success(
        language === 'mr'
          ? 'चेकलिस्ट सारांश क्लिपबोर्डवर कॉपी केला.'
          : 'Checklist summary copied to clipboard.'
      );
    } catch {
      error(
        language === 'mr' ? 'क्लिपबोर्डवर कॉपी करता आले नाही' : 'Could not copy to clipboard'
      );
    }
  };

  // Loading state
  if (runLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-6 px-4">
        <Skeleton className="w-full h-24 rounded-2xl" />
        <Skeleton className="w-full h-40 rounded-2xl" />
        <Skeleton className="w-full h-96 rounded-2xl" />
      </div>
    );
  }

  // Not Found State
  if (!run || !offence) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <EmptyState
          icon={<AlertCircle className="w-12 h-12 text-muted" />}
          title={t('checklistRunner.notFoundTitle')}
          description={t('checklistRunner.notFoundDesc')}
          actionLabel={t('checklistRunner.backToGuide')}
          onAction={() => navigate('/guide')}
        />
      </div>
    );
  }

  return (
    <div className="min-w-0 max-w-5xl mx-auto space-y-6 pb-24 px-4 sm:px-6">
      {/* STICKY TOP PROGRESS BAR (Appears on scroll below AppHeader) */}
      <div
        className={`fixed top-[58px] left-0 right-0 z-30 transition-all duration-300 bg-navy-900/95 backdrop-blur-md border-b border-navy-700/80 shadow-lg px-4 py-2.5 ${
          isScrolled ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => {
                if (currentCase) navigate(`/cases/${currentCase.id}`);
                else navigate('/guide');
              }}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-navy-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">
                {currentCase ? `FIR ${currentCase.firNo} • ` : ''}
                {language === 'mr' ? offence.title_mr : offence.title_en}
              </div>
              <div className="text-[11px] text-muted font-mono">
                {t('checklistRunner.doneCount', { done: stats.done })} / {stats.total} (
                {stats.percent}%) • {t('checklistRunner.mandatoryRemainingCount', { count: stats.mandatoryRemaining })}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Mini Progress Bar */}
            <div className="w-24 sm:w-36 h-2 bg-navy-800 rounded-full overflow-hidden border border-navy-700">
              <div
                className={`h-full transition-all duration-300 ${
                  stats.percent === 100 ? 'bg-emerald-500' : 'bg-saffron'
                }`}
                style={{ width: `${stats.percent}%` }}
              />
            </div>

            <Button
              variant="secondary"
              size="sm"
              icon={<Share2 className="w-3.5 h-3.5" />}
              onClick={handleShareSummary}
              className="hidden sm:inline-flex"
            >
              {t('checklistRunner.shareSummary')}
            </Button>
          </div>
        </div>
      </div>

      {/* TOP HERO HEADER */}
      <div className="space-y-4 pt-2">
        {/* Back Link & Local Save Indicator */}
        <div className="flex items-center justify-between gap-3 text-xs text-muted">
          <Link
            to={currentCase ? `/cases/${currentCase.id}` : `/guide/${offence.id}`}
            className="inline-flex items-center gap-1.5 text-saffron hover:text-saffron-light font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>
              {currentCase ? t('checklistRunner.backToCase') : t('checklistRunner.backToGuide')}
            </span>
          </Link>

          <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-[11px] bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-800/40">
            <HardDrive className="w-3 h-3 shrink-0" />
            <span>{t('checklistRunner.savedLocally')}</span>
          </div>
        </div>

        {/* Main Header Card */}
        <Card className="p-5 sm:p-6 bg-gradient-to-br from-navy-800 to-navy-900 border-navy-700 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            {/* Title & Case/Offence Info */}
            <div className="space-y-2 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                {currentCase ? (
                  <Badge variant="info" size="sm">
                    {t('checklistRunner.firLabel')}: {currentCase.firNo}
                  </Badge>
                ) : (
                  <Badge variant="neutral" size="sm">
                    {t('checklistRunner.standalone')}
                  </Badge>
                )}

                <Badge variant="warning" size="sm">
                  BNS {offence.bnsSection}
                </Badge>

                {offence.oldIpcSection && (
                  <span className="text-xs text-muted font-mono">
                    (was IPC {offence.oldIpcSection})
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
                {language === 'mr' ? offence.title_mr : offence.title_en}
              </h1>

              {currentCase && (
                <p className="text-xs text-slate-300">
                  <span className="text-muted">{t('checklistRunner.caseLabel')}:</span>{' '}
                  <span className="font-semibold text-white">{currentCase.caseNo}</span> •{' '}
                  <span className="text-muted">PS:</span> {currentCase.policeStation}
                  {currentCase.district ? `, ${currentCase.district}` : ''}
                </p>
              )}
            </div>

            {/* Progress Ring & Top Counter */}
            <div className="flex items-center gap-4 bg-navy-900/90 border border-navy-700/80 rounded-2xl p-4 shrink-0 shadow-inner">
              <ProgressRing
                value={stats.percent}
                size={68}
                strokeWidth={7}
                color={stats.percent === 100 ? 'green' : 'saffron'}
              >
                <div className="text-center">
                  <div className="font-mono font-bold text-white text-sm leading-none">
                    {stats.percent}%
                  </div>
                </div>
              </ProgressRing>

              <div className="space-y-1 text-xs">
                <div className="font-bold text-white text-sm">
                  {t('checklistRunner.doneCount', { done: stats.done })}{' '}
                  <span className="text-muted font-normal">/ {stats.total}</span>
                </div>
                <div className="text-slate-300">
                  {t('checklistRunner.remainingCount', { count: stats.remaining })}
                </div>
                <div className="text-amber-400 font-semibold">
                  {t('checklistRunner.mandatoryRemainingCount', { count: stats.mandatoryRemaining })}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-navy-700/60">
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={<RotateCw className="w-3.5 h-3.5" />}
                onClick={() => setShowRegenerateConfirm(true)}
              >
                {t('checklistRunner.regenerateChecklist')}
              </Button>
            </div>

            <Button
              variant="primary"
              size="sm"
              icon={<Share2 className="w-3.5 h-3.5" />}
              onClick={handleShareSummary}
            >
              {t('checklistRunner.shareSummary')}
            </Button>
          </div>
        </Card>
      </div>

      {/* ALL MANDATORY STEPS COMPLETE BANNER */}
      {stats.allMandatoryDone && (
        <div className="bg-emerald-950/40 border-2 border-emerald-500/60 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 shadow-md animate-in fade-in duration-300">
          <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1 min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-emerald-300">
              {t('checklistRunner.allMandatoryCompleteTitle')}
            </h3>
            <p className="text-xs text-emerald-200/90 leading-relaxed">
              {t('checklistRunner.allMandatoryCompleteDesc')}
            </p>
          </div>
        </div>
      )}

      {/* FILTER BUTTONS STRIP */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-navy-800 border border-navy-700 rounded-xl overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
              filter === 'all'
                ? 'bg-saffron text-navy-950 shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-navy-700'
            }`}
          >
            {t('checklistRunner.filterAll')} ({stats.total})
          </button>

          <button
            type="button"
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
              filter === 'pending'
                ? 'bg-saffron text-navy-950 shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-navy-700'
            }`}
          >
            {t('checklistRunner.filterPending')} ({stats.remaining})
          </button>

          <button
            type="button"
            onClick={() => setFilter('done')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
              filter === 'done'
                ? 'bg-emerald-500 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-navy-700'
            }`}
          >
            {t('checklistRunner.filterDone')} ({stats.done})
          </button>

          <button
            type="button"
            onClick={() => setFilter('mandatory')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
              filter === 'mandatory'
                ? 'bg-danger text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-navy-700'
            }`}
          >
            {t('checklistRunner.filterMandatory')} ({stats.mandatoryRemaining})
          </button>
        </div>
      </div>

      {/* STEPS LIST GROUPED BY PROCEDURE PHASE */}
      <div className="space-y-6">
        {groupedSteps.length === 0 || filteredSteps.length === 0 ? (
          <EmptyState
            icon={<CheckSquare className="w-12 h-12 text-muted" />}
            title={t('checklistRunner.noStepsMatchingFilter')}
            description={t('procedureGuide.noOffencesFoundDesc')}
            actionLabel={t('procedureGuide.clearFilters')}
            onAction={() => setFilter('all')}
          />
        ) : (
          groupedSteps.map((group) => {
            const isPhaseCollapsed = !!collapsedPhases[group.phase];
            const isPhaseAllDone = group.totalInPhase > 0 && group.doneInPhase === group.totalInPhase;

            // If no steps in this group match the filter, skip rendering
            if (group.items.length === 0) return null;

            return (
              <div
                key={group.phase}
                className="bg-navy-800/80 border border-navy-700 rounded-2xl overflow-hidden shadow-xs space-y-0"
              >
                {/* PHASE HEADER */}
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-navy-800 border-b border-navy-700/80">
                  <div
                    className="flex items-center gap-3 cursor-pointer min-w-0"
                    onClick={() =>
                      setCollapsedPhases((prev) => ({
                        ...prev,
                        [group.phase]: !prev[group.phase],
                      }))
                    }
                  >
                    <div className="p-2 rounded-xl bg-navy-900 border border-navy-700 text-saffron shrink-0">
                      <Layers className="w-4 h-4" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-base font-bold text-white tracking-tight">
                          {getPhaseTitle(group.phase)}
                        </h2>
                        {isPhaseAllDone && (
                          <Badge variant="success" size="sm">
                            {language === 'mr' ? 'टप्पा पूर्ण' : 'Phase Completed'}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted mt-0.5 font-mono">
                        {group.doneInPhase} / {group.totalInPhase}{' '}
                        {language === 'mr' ? 'पायऱ्या पूर्ण' : 'steps completed'}
                      </div>
                    </div>
                  </div>

                  {/* Phase Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {!isPhaseAllDone && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleMarkAllInPhase(group.phase)}
                      >
                        {t('checklistRunner.markAllInPhase')}
                      </Button>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        setCollapsedPhases((prev) => ({
                          ...prev,
                          [group.phase]: !prev[group.phase],
                        }))
                      }
                      className="p-1.5 rounded-lg text-muted hover:text-white hover:bg-navy-700 transition-colors"
                      title={isPhaseCollapsed ? 'Expand' : 'Collapse'}
                    >
                      {isPhaseCollapsed ? (
                        <ChevronDown className="w-5 h-5" />
                      ) : (
                        <ChevronUp className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* PHASE PROGRESS BAR */}
                <div className="w-full h-1 bg-navy-900">
                  <div
                    className={`h-full transition-all duration-300 ${
                      isPhaseAllDone ? 'bg-emerald-500' : 'bg-saffron'
                    }`}
                    style={{
                      width: `${
                        group.totalInPhase > 0
                          ? Math.round((group.doneInPhase / group.totalInPhase) * 100)
                          : 0
                      }%`,
                    }}
                  />
                </div>

                {/* PHASE STEPS LIST */}
                {!isPhaseCollapsed && (
                  <div className="p-4 sm:p-5 space-y-4">
                    {group.items.map((item) => {
                      const isDone = item.state.done;
                      const isNotesOpen = !!expandedNotes[item.state.stepId];
                      const stepText = language === 'mr' ? item.def.text_mr : item.def.text_en;
                      const attachedEvList = (item.state.evidenceIds || [])
                        .map((id) => caseEvidence.find((e) => e.id === id))
                        .filter(Boolean) as EvidenceRecord[];

                      return (
                        <Card
                          key={item.state.stepId}
                          className={`p-4 sm:p-5 transition-all ${
                            isDone
                              ? 'bg-navy-900/70 border-navy-700/60 opacity-90'
                              : 'bg-navy-800 border-navy-700 hover:border-saffron/40'
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            {/* LARGE 48PX INTERACTIVE CHECKBOX */}
                            <button
                              type="button"
                              onClick={() => handleToggleStep(item)}
                              aria-checked={isDone}
                              className={`w-12 h-12 min-w-[48px] min-h-[48px] rounded-xl flex items-center justify-center transition-all cursor-pointer border-2 shrink-0 ${
                                isDone
                                  ? 'bg-emerald-500 border-emerald-400 text-navy-950 shadow-md shadow-emerald-950/40'
                                  : 'bg-navy-900/90 border-navy-600 text-transparent hover:border-saffron hover:bg-navy-900'
                              }`}
                              title={
                                isDone
                                  ? language === 'mr'
                                    ? 'पूर्ण झालेली पायरी अन-टिक करा'
                                    : 'Un-tick completed step'
                                  : language === 'mr'
                                  ? 'पायरी पूर्ण म्हणून नोंदवा'
                                  : 'Mark step as done'
                              }
                            >
                              <CheckSquare
                                className={`w-6 h-6 transition-transform ${
                                  isDone ? 'scale-100 text-white' : 'scale-75 text-transparent'
                                }`}
                              />
                            </button>

                            {/* STEP CONTENT */}
                            <div className="space-y-3 flex-1 min-w-0">
                              {/* Step Badges Strip */}
                              <div className="flex flex-wrap items-center gap-2">
                                {item.def.mandatory ? (
                                  <Badge variant="danger" size="sm">
                                    {t('checklistRunner.mandatoryBadge')}
                                  </Badge>
                                ) : (
                                  <Badge variant="neutral" size="sm">
                                    {t('checklistRunner.situationalBadge')}
                                  </Badge>
                                )}

                                {item.state.isNew && (
                                  <Badge variant="warning" size="sm">
                                    <Sparkles className="w-3 h-3 mr-1 inline" />
                                    {t('checklistRunner.newBadge')}
                                  </Badge>
                                )}

                                {item.deadlineNotice && (
                                  <span
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate('/deadlines');
                                    }}
                                    className="cursor-pointer"
                                    title="View in Deadlines Tracker"
                                  >
                                    <Badge
                                      variant={item.deadlineNotice.isOverdue ? 'danger' : 'warning'}
                                      size="sm"
                                    >
                                      <Clock className="w-3 h-3 mr-1 inline" />
                                      {item.deadlineNotice.isOverdue
                                        ? `OVERDUE: ${item.deadlineNotice.label}`
                                        : item.deadlineNotice.label}
                                    </Badge>
                                  </span>
                                )}

                                {/* Legal Reference Chips */}
                                {item.def.legalRefs.map((ref, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 rounded-md bg-navy-900 border border-saffron/30 text-[11px] font-mono font-semibold text-saffron tracking-tight"
                                  >
                                    {ref.act} {ref.section}
                                    {ref.subSection ? `(${ref.subSection})` : ''}
                                  </span>
                                ))}
                              </div>

                              {/* Step Text */}
                              <div className="space-y-1">
                                <p
                                  className={`text-sm sm:text-base font-semibold leading-relaxed ${
                                    isDone ? 'line-through text-slate-400' : 'text-white'
                                  }`}
                                >
                                  {stepText}
                                </p>

                                {/* Completed Timestamp */}
                                {isDone && item.state.doneAt && (
                                  <div className="flex items-center gap-1.5 text-xs text-muted font-mono pt-0.5">
                                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>
                                      {t('checklistRunner.completedAt', {
                                        time: formatDateTime(item.state.doneAt),
                                      })}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Action Buttons Row */}
                              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-navy-700/40">
                                {/* 'i' Button: Why It Matters */}
                                <button
                                  type="button"
                                  onClick={() => setSelectedWhyStep(item.def)}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-navy-900 hover:bg-navy-700 text-xs text-saffron border border-navy-700 hover:border-saffron/40 transition-colors"
                                >
                                  <Info className="w-3.5 h-3.5" />
                                  <span>{t('checklistRunner.whyItMattersBtn')}</span>
                                </button>

                                {/* Expand/Collapse Note */}
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedNotes((prev) => ({
                                      ...prev,
                                      [item.state.stepId]: !prev[item.state.stepId],
                                    }))
                                  }
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border transition-colors ${
                                    item.state.note
                                      ? 'bg-amber-950/30 text-amber-300 border-amber-800/50'
                                      : 'bg-navy-900 text-slate-300 hover:text-white border-navy-700'
                                  }`}
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                  <span>
                                    {item.state.note
                                      ? t('checklistRunner.noteLabel')
                                      : isNotesOpen
                                      ? t('checklistRunner.hideNote')
                                      : t('checklistRunner.addNote')}
                                  </span>
                                </button>

                                {/* Attach Evidence Button (if needsEvidence is true) */}
                                {item.def.needsEvidence && (
                                  <button
                                    type="button"
                                    onClick={() => setAttachEvidenceStepId(item.state.stepId)}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-navy-900 text-sky-400 hover:text-sky-300 border border-navy-700 hover:border-sky-500/40 text-xs transition-colors"
                                  >
                                    <Paperclip className="w-3.5 h-3.5" />
                                    <span>
                                      {t('checklistRunner.attachEvidenceBtn')}{' '}
                                      {attachedEvList.length > 0 && `(${attachedEvList.length})`}
                                    </span>
                                  </button>
                                )}

                                {/* Create Document Button (if documentTemplateId exists) */}
                                {item.def.documentTemplateId && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      navigate(
                                        `/documents?template=${item.def.documentTemplateId}&caseId=${
                                          currentCase?.id || ''
                                        }&runId=${run.id}`
                                      )
                                    }
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-navy-900 text-purple-400 hover:text-purple-300 border border-navy-700 hover:border-purple-500/40 text-xs transition-colors"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    <span>{t('checklistRunner.createDocBtn')}</span>
                                  </button>
                                )}

                                {/* Launch Search & Seizure Wizard Button */}
                                {(item.def.phase === 'SearchSeizure' ||
                                  item.state.stepId.includes('search') ||
                                  item.state.stepId.includes('seizure')) &&
                                  currentCase && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        navigate(`/cases/${currentCase.id}/search-seizure`)
                                      }
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-saffron/10 text-saffron hover:bg-saffron/20 border border-saffron/40 text-xs font-semibold transition-colors"
                                    >
                                      <Search className="w-3.5 h-3.5" />
                                      <span>
                                        {language === 'mr'
                                          ? 'मार्गदर्शित झडती व जप्ती'
                                          : 'Search & Seizure Protocol'}
                                      </span>
                                    </button>
                                  )}
                              </div>

                              {/* Attached Evidence Chips */}
                              {attachedEvList.length > 0 && (
                                <div className="space-y-1.5 pt-1">
                                  <div className="text-[11px] font-semibold text-muted uppercase tracking-wider">
                                    {t('checklistRunner.attachedEvidence')}:
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    {attachedEvList.map((ev) => (
                                      <span
                                        key={ev.id}
                                        className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-navy-900 border border-sky-500/30 text-xs text-sky-200"
                                      >
                                        <ShieldCheck className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                                        <span className="font-semibold text-white">
                                          {ev.exhibitNo}
                                        </span>
                                        <span className="truncate max-w-[140px]">
                                          {ev.fileName}
                                        </span>
                                        <span className="font-mono text-[10px] text-muted">
                                          ({ev.sha256.slice(0, 6)}...)
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleDetachEvidence(item.state.stepId, ev.id)
                                          }
                                          className="text-muted hover:text-danger ml-1 p-0.5 rounded transition-colors"
                                          title="Detach"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Expandable Notes Input Field */}
                              {isNotesOpen && (
                                <div className="space-y-1.5 pt-2 animate-in fade-in duration-200">
                                  <div className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                                    <span>{t('checklistRunner.noteLabel')}</span>
                                    <span className="text-[11px] text-muted">
                                      {t('checklistRunner.savedLocally')}
                                    </span>
                                  </div>
                                  <textarea
                                    value={item.state.note || ''}
                                    onChange={(e) =>
                                      handleNoteChange(item.state.stepId, e.target.value)
                                    }
                                    placeholder={t('checklistRunner.notesPlaceholder')}
                                    rows={2}
                                    className="w-full bg-navy-900 border border-navy-700 rounded-xl p-3 text-xs text-white placeholder-muted focus:outline-hidden focus:border-saffron transition-colors resize-y"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* BOTTOM SHEET: WHY IT MATTERS */}
      <BottomSheet
        isOpen={!!selectedWhyStep}
        onClose={() => setSelectedWhyStep(null)}
        title={
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-saffron shrink-0" />
            <span className="font-bold text-white text-base">
              {t('procedureGuide.whyItMatters')}
            </span>
          </div>
        }
      >
        {selectedWhyStep && (
          <div className="space-y-5 p-1">
            {/* Step summary & phase */}
            <div className="space-y-1">
              <div className="text-xs font-semibold text-saffron uppercase tracking-wider">
                {getPhaseTitle(selectedWhyStep.phase)}
              </div>
              <h4 className="text-base font-bold text-white leading-snug">
                {language === 'mr' ? selectedWhyStep.text_mr : selectedWhyStep.text_en}
              </h4>
            </div>

            {/* Why explanation */}
            <div className="p-4 rounded-2xl bg-navy-900 border border-navy-700 space-y-2">
              <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-saffron" />
                <span>
                  {language === 'mr'
                    ? 'वैधानिक आवश्यकता व उद्देश:'
                    : 'Statutory Safeguard & Rationale:'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                {language === 'mr' ? selectedWhyStep.why_mr : selectedWhyStep.why_en}
              </p>
            </div>

            {/* Inclusion rule reason */}
            <div className="space-y-1">
              <div className="text-xs font-bold text-muted uppercase tracking-wider">
                {t('procedureGuide.inclusionReason')}
              </div>
              <p className="text-xs text-slate-300">
                {language === 'mr'
                  ? selectedWhyStep.inclusionReason_mr
                  : selectedWhyStep.inclusionReason_en}
              </p>
            </div>

            {/* Legal citations */}
            {selectedWhyStep.legalRefs.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-bold text-muted uppercase tracking-wider">
                  {language === 'mr' ? 'कायदेशीर संदर्भ व कलमे:' : 'Statutory Provisions:'}
                </div>
                <div className="space-y-2">
                  {selectedWhyStep.legalRefs.map((ref, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-navy-900 border border-navy-700 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-saffron">
                          {ref.act} Sec {ref.section}
                          {ref.subSection ? `(${ref.subSection})` : ''}
                        </span>
                        <Badge variant="warning" size="sm">
                          {t('procedureGuide.verifiedFalse')}
                        </Badge>
                      </div>
                      <div className="text-xs font-semibold text-white">
                        {language === 'mr' ? ref.title_mr : ref.title_en}
                      </div>
                      <div className="text-[11px] text-muted">
                        {language === 'mr' ? ref.summary_mr : ref.summary_en}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </BottomSheet>

      {/* MODAL: ATTACH EVIDENCE PICKER */}
      <Modal
        isOpen={!!attachEvidenceStepId}
        onClose={() => setAttachEvidenceStepId(null)}
        title={t('checklistRunner.selectEvidenceTitle')}
        maxWidth="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              variant="secondary"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => {
                navigate(
                  `/evidence/new?caseId=${currentCase?.id || ''}&returnToChecklist=${run.id}`
                );
              }}
            >
              {t('checklistRunner.addNewEvidence')}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setAttachEvidenceStepId(null)}
            >
              {t('checklistRunner.close')}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-xs text-muted">
            {t('checklistRunner.selectEvidenceDesc')}
          </p>

          {caseEvidence.length === 0 ? (
            <div className="p-6 text-center rounded-2xl bg-navy-900 border border-navy-700 space-y-3">
              <Paperclip className="w-8 h-8 text-muted mx-auto" />
              <div className="space-y-1">
                <div className="text-sm font-bold text-white">
                  {t('checklistRunner.noEvidenceAvailable')}
                </div>
                <div className="text-xs text-muted">
                  {language === 'mr'
                    ? 'या प्रकरणासाठी कोणताही डिजिटल पुरावा नोंदवलेला नाही. नवीन पुरावा जोडा.'
                    : 'No digital evidence files logged for this case file yet.'}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {caseEvidence.map((ev) => {
                const currentStepState = run.steps.find((s) => s.stepId === attachEvidenceStepId);
                const isAttached = (currentStepState?.evidenceIds || []).includes(ev.id);

                return (
                  <div
                    key={ev.id}
                    onClick={() => {
                      if (attachEvidenceStepId) {
                        handleToggleEvidenceAttachment(attachEvidenceStepId, ev.id);
                      }
                    }}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                      isAttached
                        ? 'bg-sky-950/40 border-sky-500/60'
                        : 'bg-navy-900 border-navy-700 hover:border-navy-600'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={isAttached}
                        onChange={() => {}}
                        className="w-4 h-4 rounded text-sky-500 bg-navy-800 border-navy-600 focus:ring-0 cursor-pointer shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white text-xs">
                            {ev.exhibitNo}
                          </span>
                          <span className="text-xs text-slate-300 truncate">
                            {ev.fileName}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-muted truncate">
                          SHA-256: {ev.sha256.slice(0, 16)}...
                        </div>
                      </div>
                    </div>

                    <Badge variant={ev.sealed ? 'success' : 'neutral'} size="sm">
                      {ev.sealed ? 'Sealed' : 'Open'}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Modal>

      {/* CONFIRM DIALOG: UN-TICK COMPLETED STEP */}
      <ConfirmDialog
        isOpen={!!uncheckTarget}
        onClose={() => setUncheckTarget(null)}
        onConfirm={confirmUncheck}
        title={t('checklistRunner.unmarkStepTitle')}
        message={
          <div className="space-y-2">
            <p>{t('checklistRunner.unmarkStepDesc')}</p>
            {uncheckTarget && (
              <div className="p-3 rounded-xl bg-navy-900 border border-navy-700 text-xs font-semibold text-white">
                {uncheckTarget.stepTitle}
              </div>
            )}
          </div>
        }
        confirmText={t('checklistRunner.confirm')}
        cancelText={t('checklistRunner.cancel')}
        variant="warning"
      />

      {/* CONFIRM DIALOG: MARK ALL IN PHASE */}
      <ConfirmDialog
        isOpen={!!markAllTarget}
        onClose={() => setMarkAllTarget(null)}
        onConfirm={confirmMarkAllInPhase}
        title={t('checklistRunner.markAllConfirmTitle')}
        message={
          <div className="space-y-2">
            <p>{t('checklistRunner.markAllConfirmDesc')}</p>
            {markAllTarget && (
              <div className="p-3 rounded-xl bg-navy-900 border border-navy-700 text-xs font-semibold text-saffron">
                {getPhaseTitle(markAllTarget.phase)} (
                {markAllTarget.stepIds.length}{' '}
                {language === 'mr' ? 'पायऱ्या' : 'steps'})
              </div>
            )}
          </div>
        }
        confirmText={t('checklistRunner.confirm')}
        cancelText={t('checklistRunner.cancel')}
        variant="primary"
      />

      {/* CONFIRM DIALOG: REGENERATE CHECKLIST */}
      <ConfirmDialog
        isOpen={showRegenerateConfirm}
        onClose={() => setShowRegenerateConfirm(false)}
        onConfirm={handleRegenerate}
        title={t('checklistRunner.regenerateChecklist')}
        message={
          <div className="space-y-2">
            <p>{t('checklistRunner.regenerateDesc')}</p>
            <p className="text-xs text-muted">
              {language === 'mr'
                ? 'आधी पूर्ण झालेल्या सर्व नोंदी आणि शेरे सुरक्षित राहतील.'
                : 'All previously completed steps, timestamps, notes, and attached evidence will be safely preserved.'}
            </p>
          </div>
        }
        confirmText={t('checklistRunner.confirm')}
        cancelText={t('checklistRunner.cancel')}
        variant="primary"
      />
    </div>
  );
};
