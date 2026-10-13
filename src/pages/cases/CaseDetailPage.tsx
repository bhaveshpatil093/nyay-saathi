import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  useLiveData,
  getCase,
  updateCase,
  deleteCase,
  listChecklistRunsByCase,
  saveChecklistRun,
  listCaseEvents,
  addCaseEvent,
  deleteCaseEvent,
  listEvidenceByCase,
} from '../../lib/db/index.ts';
import {
  CaseRecord,
  CaseStatus,
  CaseEventType,
  ChecklistRunRecord,
  CaseEventRecord,
  EvidenceRecord,
} from '../../types/database.ts';
import { SAMPLE_OFFENCES } from '../../data/offences.ts';
import { GENERAL_PROCEDURE_STEPS } from '../../data/steps.ts';
import { generateChecklist } from '../../lib/procedure/generate.ts';
import { computeDeadlines, DeadlineItem } from '../../lib/deadlines/index.ts';
import { useI18n, formatDate, formatDateTime } from '../../i18n/index.ts';
import {
  Tabs,
  Badge,
  Button,
  ProgressRing,
  ConfirmDialog,
  Modal,
  Input,
  Select,
  Textarea,
  DateTimeInput,
  Card,
  EmptyState,
  Skeleton,
} from '../../components/ui/index.ts';
import {
  ArrowLeft,
  Edit,
  Trash2,
  CheckSquare,
  Clock,
  ShieldCheck,
  FileText,
  User,
  Users,
  Building,
  Scale,
  Camera,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Plus,
  ExternalLink,
  ShieldAlert,
  Search,
  Package,
  Stethoscope,
  Info,
} from 'lucide-react';

export const CaseDetailPage: React.FC = () => {
  const { t, language } = useI18n();
  const navigate = useNavigate();
  const { caseId } = useParams<{ caseId: string }>();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'checklist' | 'timeline' | 'evidence' | 'deadlines'>('overview');

  // Modals & Dialogs
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Add Event Modal
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [newEventType, setNewEventType] = useState<CaseEventType>('custom');
  const [newEventDateTime, setNewEventDateTime] = useState('');
  const [newEventNote, setNewEventNote] = useState('');
  const [savingEvent, setSavingEvent] = useState(false);

  // Live Case record
  const { data: currentCase, loading: caseLoading } = useLiveData<CaseRecord | null>(
    () => (caseId ? getCase(caseId) : Promise.resolve(null)),
    ['cases'],
    [caseId]
  );

  // Live Checklist Runs for this case
  const { data: checklistRuns } = useLiveData<ChecklistRunRecord[]>(
    () => (caseId ? listChecklistRunsByCase(caseId) : Promise.resolve([])),
    ['checklistRuns'],
    [caseId]
  );

  // Live Case Events for this case
  const { data: caseEvents } = useLiveData<CaseEventRecord[]>(
    () => (caseId ? listCaseEvents(caseId) : Promise.resolve([])),
    ['caseEvents'],
    [caseId]
  );

  // Live Evidence for this case
  const { data: caseEvidences } = useLiveData<EvidenceRecord[]>(
    () => (caseId ? listEvidenceByCase(caseId) : Promise.resolve([])),
    ['evidence'],
    [caseId]
  );

  // Primary checklist run (if generated)
  const activeChecklistRun = checklistRuns && checklistRuns.length > 0 ? checklistRuns[0] : null;

  // Checklist completion calculation
  const checklistStats = useMemo(() => {
    if (!activeChecklistRun || !activeChecklistRun.steps || activeChecklistRun.steps.length === 0) {
      return { total: 0, done: 0, percent: 0 };
    }
    const total = activeChecklistRun.steps.length;
    const done = activeChecklistRun.steps.filter((s) => s.done).length;
    const percent = Math.round((done / total) * 100);
    return { total, done, percent };
  }, [activeChecklistRun]);

  // Deadlines calculation
  const calculatedDeadlines = useMemo<DeadlineItem[]>(() => {
    if (!currentCase) return [];
    return computeDeadlines(currentCase, caseEvents || []);
  }, [currentCase, caseEvents]);

  // Update Status handler
  const handleStatusChange = async (newStatus: CaseStatus) => {
    if (!caseId || !currentCase) return;
    try {
      await updateCase(caseId, { status: newStatus });
      // Also log a case event
      await addCaseEvent({
        caseId,
        type: 'custom',
        dateTime: new Date().toISOString(),
        note: `Status changed to ${newStatus.toUpperCase()}`,
      });
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  // Delete Case handler
  const handleDeleteCase = async () => {
    if (!caseId) return;
    setDeleting(true);
    try {
      await deleteCase(caseId);
      setShowDeleteConfirm(false);
      navigate('/cases');
    } catch (err) {
      console.error('Failed to delete case:', err);
      alert('Failed to delete case.');
    } finally {
      setDeleting(false);
    }
  };

  // Generate or open checklist run
  const handleGenerateChecklist = async () => {
    if (!currentCase) return;
    try {
      const primaryOffence =
        SAMPLE_OFFENCES.find((o) => o.id === currentCase.offenceIds[0]) || SAMPLE_OFFENCES[0];
      const generatedSteps = generateChecklist(primaryOffence, currentCase.facts);

      const runRecord = await saveChecklistRun({
        caseId: currentCase.id,
        offenceId: primaryOffence.id,
        steps: generatedSteps.map((s) => ({
          stepId: s.id,
          done: false,
        })),
      });

      navigate(`/checklist/${runRecord.id}`);
    } catch (err) {
      console.error('Failed to create checklist run:', err);
    }
  };

  // Add Event handler
  const handleSaveEvent = async () => {
    if (!caseId) return;
    setSavingEvent(true);
    try {
      await addCaseEvent({
        caseId,
        type: newEventType,
        dateTime: newEventDateTime || new Date().toISOString(),
        note: newEventNote.trim(),
      });
      setShowAddEventModal(false);
      setNewEventNote('');
      setNewEventType('custom');
    } catch (err) {
      console.error('Failed to add case event:', err);
    } finally {
      setSavingEvent(false);
    }
  };

  // Event types options for select dropdown
  const eventTypeOptions = useMemo(() => {
    const types: CaseEventType[] = [
      'fir_registered',
      'arrest_made',
      'search_started',
      'seizure_made',
      'medical_exam',
      'chargesheet_filed',
      'custom',
    ];
    return types.map((type) => ({
      value: type,
      label: t(`casesManager.eventTypes.${type}`),
    }));
  }, [t]);

  // Loading view
  if (caseLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-6">
        <Skeleton className="w-full h-24" />
        <Skeleton className="w-full h-80" />
      </div>
    );
  }

  // Case Not Found
  if (!currentCase) {
    return (
      <EmptyState
        icon={<AlertCircle className="w-12 h-12 text-muted" />}
        title={language === 'mr' ? 'प्रकरण सापडले नाही' : 'Case Not Found'}
        description={language === 'mr' ? 'हे प्रकरण हटवले गेले असावे किंवा अस्तित्वात नाही.' : 'The requested case file does not exist or may have been deleted.'}
        actionLabel={t('casesManager.backToCases')}
        onAction={() => navigate('/cases')}
      />
    );
  }

  // Offence details mapping
  const offenceDetails = (currentCase.offenceIds || []).map((id) => {
    const off = SAMPLE_OFFENCES.find((o) => o.id === id);
    return {
      id,
      offence: off,
      title: language === 'mr' ? off?.title_mr || off?.title_en || id : off?.title_en || id,
      bnsSection: off?.bnsSection || '',
      oldIpc: off?.oldIpcSection || '',
      maxYears: off?.maxPunishmentYears || 3,
      cognizable: off?.cognizable ?? true,
      description: language === 'mr' ? off?.description_mr : off?.description_en,
      watchOut: language === 'mr' ? off?.watchOut_mr : off?.watchOut_en,
    };
  });

  // Tab items
  const tabsList = [
    { id: 'overview', label: t('casesManager.tabOverview'), icon: <FileText className="w-4 h-4" /> },
    {
      id: 'checklist',
      label: t('casesManager.tabChecklist'),
      icon: <CheckSquare className="w-4 h-4" />,
      badge: checklistStats.total > 0 ? (
        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-saffron text-navy-900 font-bold">
          {checklistStats.percent}%
        </span>
      ) : undefined,
    },
    {
      id: 'timeline',
      label: t('casesManager.tabTimeline'),
      icon: <Clock className="w-4 h-4" />,
      badge: caseEvents && caseEvents.length > 0 ? (
        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-navy-700 text-slate-200">
          {caseEvents.length}
        </span>
      ) : undefined,
    },
    {
      id: 'evidence',
      label: t('casesManager.tabEvidence', { count: caseEvidences?.length ?? 0 }),
      icon: <Camera className="w-4 h-4" />,
    },
    {
      id: 'deadlines',
      label: t('casesManager.tabDeadlines', { count: calculatedDeadlines.length }),
      icon: <AlertTriangle className="w-4 h-4" />,
      badge: calculatedDeadlines.some((d) => d.status === 'overdue') ? (
        <span className="w-2 h-2 rounded-full bg-danger animate-pulse" />
      ) : undefined,
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 space-y-6 pb-24 w-full">
      {/* Header Bar */}
      <div className="bg-navy-800/90 border border-navy-700 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Back & Identifiers */}
          <div className="flex items-start sm:items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/cases')}
              className="p-2.5 rounded-xl bg-navy-900 hover:bg-navy-700 text-muted hover:text-white border border-navy-700 transition-colors mt-0.5 sm:mt-0"
              aria-label={t('casesManager.backToCases')}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  FIR: {currentCase.firNo}
                </h1>
                {currentCase.caseNo && (
                  <span className="text-xs font-mono text-muted bg-navy-900 px-2 py-0.5 rounded border border-navy-700">
                    {currentCase.caseNo}
                  </span>
                )}
                {currentCase.isSample && (
                  <Badge variant="neutral" size="sm">
                    {language === 'mr' ? 'नमुना' : 'Sample'}
                  </Badge>
                )}
              </div>

              <p className="text-xs text-muted flex items-center gap-2 mt-1">
                <span>{formatDateTime(currentCase.firDateTime || currentCase.createdAt)}</span>
                <span>•</span>
                <span>{currentCase.policeStation}</span>
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            {/* Status Selector Dropdown */}
            <div className="inline-flex rounded-xl bg-navy-900 border border-navy-700 p-0.5">
              {(['open', 'chargesheeted', 'closed'] as CaseStatus[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => handleStatusChange(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    currentCase.status === st
                      ? st === 'open'
                        ? 'bg-saffron text-navy-900 shadow-xs'
                        : st === 'chargesheeted'
                        ? 'bg-indigo-500 text-white shadow-xs'
                        : 'bg-emerald-600 text-white shadow-xs'
                      : 'text-muted hover:text-white'
                  }`}
                >
                  {st === 'open'
                    ? t('casesManager.statusOpen')
                    : st === 'chargesheeted'
                    ? t('casesManager.statusChargesheeted')
                    : t('casesManager.statusClosed')}
                </button>
              ))}
            </div>

            {/* Edit Button */}
            <Button
              variant="secondary"
              size="sm"
              icon={<Edit className="w-4 h-4" />}
              onClick={() => navigate(`/cases/new?id=${currentCase.id}`)}
            >
              {t('casesManager.editCase')}
            </Button>

            {/* Delete Button */}
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 text-muted hover:text-danger rounded-xl hover:bg-navy-700 border border-navy-700 transition-colors"
              title={t('casesManager.deleteCase')}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Section Tags */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-navy-700/60">
          {offenceDetails.map((off) => (
            <span
              key={off.id}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-navy-900/90 border border-saffron/30 text-xs font-medium text-slate-200"
            >
              <span className="font-semibold text-white">{off.title}</span>
              <span className="font-mono text-saffron font-bold">{off.bnsSection}</span>
              {off.oldIpc && (
                <span className="text-[10px] text-muted font-mono">({off.oldIpc})</span>
              )}
            </span>
          ))}

          <Badge variant="warning" size="sm">
            {t('casesManager.pendingReviewBadge')}
          </Badge>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs
        tabs={tabsList}
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as typeof activeTab)}
        variant="pill"
      />

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Facts Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Investigation Details Card */}
            <Card className="p-5 space-y-4">
              <h3 className="text-sm font-bold text-saffron uppercase tracking-wider flex items-center gap-2">
                <Building className="w-4 h-4" />
                <span>{language === 'mr' ? 'तपास व ठाणे तपशील' : 'Investigation & Station Info'}</span>
              </h3>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-muted">{t('casesManager.policeStation')}</div>
                  <div className="font-semibold text-white mt-0.5">{currentCase.policeStation}</div>
                </div>
                <div>
                  <div className="text-muted">{t('casesManager.district')}</div>
                  <div className="font-semibold text-white mt-0.5">{currentCase.district || '-'}</div>
                </div>
                <div>
                  <div className="text-muted">{t('casesManager.ioName')}</div>
                  <div className="font-semibold text-white mt-0.5">
                    {currentCase.ioName || '-'} ({currentCase.ioRank.toUpperCase()})
                  </div>
                </div>
                <div>
                  <div className="text-muted">{t('casesManager.firDateTime')}</div>
                  <div className="font-semibold text-white mt-0.5">
                    {formatDateTime(currentCase.firDateTime || currentCase.createdAt)}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-navy-700/60 space-y-2 text-xs">
                <div>
                  <span className="text-muted">{t('casesManager.complainantName')}: </span>
                  <span className="font-semibold text-white">{currentCase.complainantName}</span>
                </div>
                <div>
                  <span className="text-muted">{t('casesManager.accusedNames')}: </span>
                  <span className="font-semibold text-white">
                    {currentCase.accusedNames && currentCase.accusedNames.length > 0
                      ? currentCase.accusedNames.join(', ')
                      : '-'}
                  </span>
                </div>
              </div>

              {currentCase.summary && (
                <div className="pt-2 border-t border-navy-700/60 text-xs">
                  <div className="text-muted mb-1">{t('casesManager.summary')}</div>
                  <p className="text-slate-300 leading-relaxed bg-navy-900/60 p-3 rounded-xl border border-navy-700/40">
                    {currentCase.summary}
                  </p>
                </div>
              )}
            </Card>

            {/* Procedural Facts Grid Card */}
            <Card className="p-5 space-y-4">
              <h3 className="text-sm font-bold text-saffron uppercase tracking-wider flex items-center gap-2">
                <CheckSquare className="w-4 h-4" />
                <span>{t('casesManager.factsTitle')}</span>
              </h3>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(currentCase.facts).map(([key, val]) => {
                  const isPositive = Boolean(val);
                  return (
                    <div
                      key={key}
                      className={`p-2.5 rounded-xl border flex items-center justify-between ${
                        isPositive
                          ? 'bg-india-green/10 border-india-green/30 text-white'
                          : 'bg-navy-900/40 border-navy-700/60 text-muted'
                      }`}
                    >
                      <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                      <span className={`font-bold ${isPositive ? 'text-india-green' : 'text-muted'}`}>
                        {isPositive ? 'YES' : 'NO'}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="text-[11px] text-muted flex items-start gap-1.5 pt-1">
                <Info className="w-3.5 h-3.5 text-saffron shrink-0 mt-0.5" />
                <span>
                  {language === 'mr'
                    ? 'या वस्तुस्थितीवर आधारित वैधानिक तपासणी यादी व मुदत घड्याळे निश्चित केली जातात.'
                    : 'These facts dynamically evaluate statutory checklists and limitation clocks under BNSS 2023.'}
                </span>
              </div>
            </Card>

            {/* Guided Search & Seizure Module Card (BNSS 103 & 105) */}
            <Card className="p-4 sm:p-5 bg-gradient-to-r from-navy-900 via-navy-900 to-navy-800 border-saffron/40 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-saffron/10 border border-saffron/30 flex items-center justify-center text-saffron shrink-0">
                    <Search className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-sm">
                        {language === 'mr'
                          ? 'मार्गदर्शित झडती व जप्ती कार्यपद्धती (BNSS १०३ व १०५)'
                          : 'Guided Search & Seizure Protocol (BNSS 103 & 105)'}
                      </h4>
                      <Badge variant="warning" size="sm">
                        {language === 'mr' ? 'अनिवार्य चित्रीकरण' : 'Mandatory Video'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted mt-0.5">
                      {language === 'mr'
                        ? 'दोन स्वतंत्र पंचांसमक्ष अखंड व्हिडिओ चित्रीकरण, जप्ती पंचनामा व दंडाधिकाऱ्यांना सादर पत्र'
                        : '4-step wizard with continuous videography, seized items register, Panchnama & Magistrate letter.'}
                    </p>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate(`/cases/${currentCase.id}/search-seizure`)}
                  icon={<Search className="w-4 h-4" />}
                >
                  {language === 'mr' ? 'झडती कार्यपद्धती सुरू करा' : 'Launch Search & Seizure'}
                </Button>
              </div>
            </Card>
          </div>

          {/* Statutory Deadlines Section with per-case chips */}
          <Card className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-navy-700 pb-3">
              <div className="space-y-0.5">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-saffron" />
                  <span>{language === 'mr' ? 'वैधानिक मुदती व मर्यादा घड्याळे (BNSS 2023)' : 'Statutory Deadlines & Limitation Clocks'}</span>
                </h3>
                <p className="text-xs text-muted">
                  {language === 'mr'
                    ? 'बीएनएसएस अंतर्गत प्राथमिक चौकशी, अटक, २४ तास हजर करणे व डिफॉल्ट जामीन मर्यादा'
                    : 'Mandatory statutory limitation clocks evaluated from FIR and investigation events.'}
                </p>
              </div>

              <Button
                variant="secondary"
                size="sm"
                icon={<ExternalLink className="w-3.5 h-3.5" />}
                onClick={() => navigate('/deadlines')}
              >
                {language === 'mr' ? 'सर्व मुदती पहा' : 'View Full Tracker'}
              </Button>
            </div>

            {calculatedDeadlines.length === 0 ? (
              <p className="text-xs text-muted py-2">
                {language === 'mr'
                  ? 'या प्रकरणातील सध्याच्या वस्तुस्थितीनुसार कोणतीही वैधानिक मुदत सक्रिय नाही.'
                  : 'No statutory limitation clocks triggered for current case facts.'}
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {calculatedDeadlines.map((dl) => {
                  const isOverdue = dl.status === 'overdue';
                  const isDueSoon = dl.status === 'due_soon';
                  const isCompleted = dl.status === 'completed';

                  const borderClass = isOverdue
                    ? 'border-l-4 border-l-danger bg-navy-900/90'
                    : isDueSoon
                    ? 'border-l-4 border-l-saffron bg-navy-900/90'
                    : isCompleted
                    ? 'border-l-4 border-l-emerald-500 bg-navy-900/50 opacity-90'
                    : 'border-l-4 border-l-slate-400 bg-navy-900/90';

                  const badgeText =
                    language === 'mr' ? dl.remainingTimeText_mr : dl.remainingTimeText_en;

                  return (
                    <div
                      key={dl.ruleId}
                      onClick={() => navigate('/deadlines')}
                      className={`p-3.5 rounded-xl border border-navy-700/80 cursor-pointer hover:border-saffron/40 transition-colors space-y-2 ${borderClass}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-semibold text-white text-xs leading-snug">
                          {language === 'mr' ? dl.label_mr : dl.label_en}
                        </div>

                        {/* Status Chip */}
                        {isOverdue && (
                          <Badge variant="danger" size="sm">
                            {badgeText}
                          </Badge>
                        )}
                        {isDueSoon && (
                          <Badge variant="warning" size="sm">
                            {badgeText}
                          </Badge>
                        )}
                        {isCompleted && (
                          <Badge variant="success" size="sm">
                            {language === 'mr' ? 'पूर्ण' : 'Completed'}
                          </Badge>
                        )}
                        {!isOverdue && !isDueSoon && !isCompleted && (
                          <Badge variant="neutral" size="sm">
                            {badgeText}
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] pt-1 border-t border-navy-700/40">
                        <span className="font-mono text-saffron font-bold">
                          {dl.legalRef.act} {dl.legalRef.section}
                          {dl.legalRef.subSection ? `(${dl.legalRef.subSection})` : ''}
                        </span>

                        <span className="text-muted font-mono">
                          Due: {formatDate(dl.dueAt)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Offence & WatchOut Tips Card */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Scale className="w-5 h-5 text-saffron" />
              <span>{language === 'mr' ? 'गुन्हे आणि महत्त्वाच्या तपास सूचना' : 'Offences & Procedural Watch-Outs'}</span>
            </h3>

            {offenceDetails.map((item) => (
              <Card key={item.id} className="p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-navy-700 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-white text-base">{item.title}</span>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-saffron/20 text-saffron border border-saffron/40 font-bold">
                      {item.bnsSection}
                    </span>
                    {item.oldIpc && (
                      <span className="text-xs text-muted font-mono">
                        Old: {item.oldIpc}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <Badge variant={item.cognizable ? 'success' : 'neutral'} size="sm">
                      {item.cognizable ? t('casesManager.cognizableBadge') : t('casesManager.nonCognizableBadge')}
                    </Badge>
                    <span className="text-muted">
                      {item.maxYears >= 99
                        ? t('casesManager.punishmentLifeOrDeath')
                        : t('casesManager.maxPunishment', { years: item.maxYears })}
                    </span>
                  </div>
                </div>

                {item.description && (
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {item.description}
                  </p>
                )}

                {item.watchOut && item.watchOut.length > 0 && (
                  <div className="bg-amber-950/20 border border-amber-800/40 rounded-xl p-3.5 space-y-1.5">
                    <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{language === 'mr' ? 'महत्त्वाच्या वैधानिक चुका टाळा (Watch-Out):' : 'Mandatory Procedural Safeguards (Watch-Out):'}</span>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-xs text-amber-200/90">
                      {item.watchOut.map((bullet, idx) => (
                        <li key={idx}>{bullet}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: CHECKLIST */}
      {activeTab === 'checklist' && (
        <Card className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-navy-700 pb-5">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-saffron" />
                <span>{t('casesManager.checklistTitle')}</span>
              </h3>
              <p className="text-xs text-muted mt-1">
                {language === 'mr'
                  ? 'BNSS, BSA व BNS अंतर्गत या प्रकरणासाठी आवश्यक वैधानिक पायऱ्या'
                  : 'Automated statutory checkpoints generated from BNS offence facts.'}
              </p>
            </div>

            {activeChecklistRun ? (
              <Button
                variant="primary"
                icon={<ExternalLink className="w-4 h-4" />}
                onClick={() => navigate(`/checklist/${activeChecklistRun.id}`)}
              >
                {t('casesManager.viewFullChecklist')}
              </Button>
            ) : (
              <Button
                variant="primary"
                icon={<Plus className="w-4 h-4" />}
                onClick={handleGenerateChecklist}
              >
                {t('casesManager.generateChecklistBtn')}
              </Button>
            )}
          </div>

          {!activeChecklistRun ? (
            <div className="text-center py-10 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-navy-900 border border-navy-700 flex items-center justify-center mx-auto text-saffron">
                <CheckSquare className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-white">
                  {t('casesManager.noChecklistRun')}
                </h4>
                <p className="text-xs text-muted max-w-md mx-auto">
                  {language === 'mr'
                    ? 'तपासणी यादी तयार केल्याने फॉरेन्सिक व्हिजिट, झडती ऑडिओ-व्हिडिओ आणि साक्षीदारांचे जबाब यांचे मार्गदर्शन मिळेल.'
                    : 'Generate procedure checklist to begin live tracking of search videography, forensic threshold, and witness statements.'}
                </p>
              </div>
              <Button
                variant="primary"
                onClick={handleGenerateChecklist}
                className="shadow-md"
              >
                {t('casesManager.generateChecklistBtn')}
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Progress Bar & Summary */}
              <div className="bg-navy-900/80 rounded-2xl p-5 border border-navy-700 flex flex-col sm:flex-row items-center gap-5">
                <ProgressRing
                  value={checklistStats.percent}
                  size={64}
                  strokeWidth={6}
                  color={checklistStats.percent === 100 ? 'green' : 'saffron'}
                />

                <div className="space-y-1 text-center sm:text-left flex-1">
                  <div className="text-lg font-bold text-white">
                    {checklistStats.percent}% {language === 'mr' ? 'तपास कार्य पूर्ण' : 'Procedural Tasks Completed'}
                  </div>
                  <p className="text-xs text-muted">
                    {t('casesManager.stepsCompleted', {
                      done: checklistStats.done,
                      total: checklistStats.total,
                    })}
                  </p>
                </div>

                <Button
                  variant="primary"
                  onClick={() => navigate(`/checklist/${activeChecklistRun.id}`)}
                >
                  {t('casesManager.viewFullChecklist')}
                </Button>
              </div>

              {/* Steps Preview */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-muted uppercase tracking-wider">
                  {language === 'mr' ? 'पायऱ्यांचा पूर्वावलोकन' : 'Step Checkpoint Overview'}
                </h4>

                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                  {activeChecklistRun.steps.map((st, idx) => {
                    const stepDef = GENERAL_PROCEDURE_STEPS.find((s) => s.id === st.stepId);
                    const matchingDeadline = calculatedDeadlines.find((dl) => {
                      if (st.stepId.includes('efir') && dl.ruleId === 'deadline_efir_signature') return true;
                      if (st.stepId.includes('prelim') && dl.ruleId === 'deadline_preliminary_enquiry') return true;
                      if (st.stepId.includes('magistrate_24h') && dl.ruleId === 'deadline_magistrate_production_24h') return true;
                      if ((st.stepId.includes('search_video') || st.stepId.includes('seizure')) && dl.ruleId === 'deadline_seizure_video_transmission_24h') return true;
                      if (st.stepId.includes('rape_medical') && dl.ruleId === 'deadline_rape_medical_report_7d') return true;
                      if ((st.stepId.includes('chargesheet') || st.stepId.includes('police_report')) && (dl.ruleId.includes('chargesheet') || dl.ruleId.includes('bail'))) return true;
                      if (st.stepId.includes('progress_update') && dl.ruleId === 'deadline_victim_progress_update_90d') return true;
                      return false;
                    });

                    return (
                      <div
                        key={st.stepId || idx}
                        className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs ${
                          st.done
                            ? 'bg-india-green/5 border-india-green/30 text-white'
                            : 'bg-navy-900 border-navy-700 text-slate-300'
                        }`}
                      >
                        <div className="flex items-start sm:items-center gap-3 min-w-0">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 ${
                              st.done
                                ? 'bg-india-green text-white'
                                : 'bg-navy-800 border border-navy-600 text-muted'
                            }`}
                          >
                            {st.done ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                          </div>
                          <div className="space-y-0.5 min-w-0">
                            <div className="font-semibold text-white truncate">
                              {stepDef ? (language === 'mr' ? stepDef.text_mr : stepDef.text_en) : st.stepId}
                            </div>
                            <span className="font-mono text-muted text-[10px] block">
                              {stepDef ? `${stepDef.phase} • ${stepDef.legalRefs[0]?.act || ''} ${stepDef.legalRefs[0]?.section || ''}` : st.stepId}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                          {matchingDeadline && !st.done && (
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate('/deadlines');
                              }}
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold cursor-pointer transition-transform hover:scale-105 ${
                                matchingDeadline.status === 'overdue'
                                  ? 'bg-danger/20 text-danger-light border border-danger/40 animate-pulse'
                                  : matchingDeadline.status === 'due_soon'
                                  ? 'bg-saffron/20 text-saffron border border-saffron/40'
                                  : 'bg-navy-800 text-slate-300 border border-navy-600'
                              }`}
                              title={matchingDeadline.label}
                            >
                              <Clock className="w-3 h-3" />
                              <span>{language === 'mr' ? matchingDeadline.remainingTimeText_mr : matchingDeadline.remainingTimeText_en}</span>
                            </span>
                          )}

                          {(st.stepId.includes('search') || st.stepId.includes('seizure')) && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/cases/${currentCase.id}/search-seizure`);
                              }}
                              className="px-2 py-0.5 rounded bg-saffron/20 border border-saffron/40 hover:bg-saffron/30 text-saffron text-[10px] font-bold flex items-center gap-1 transition-all"
                            >
                              <Search className="w-3 h-3" />
                              <span>{language === 'mr' ? 'झडती व जप्ती' : 'Search & Seizure'}</span>
                            </button>
                          )}

                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              st.done
                                ? 'bg-india-green/20 text-india-green'
                                : 'bg-navy-800 text-muted'
                            }`}
                          >
                            {st.done ? (language === 'mr' ? 'पूर्ण' : 'DONE') : (language === 'mr' ? 'प्रलंबित' : 'PENDING')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* TAB 3: TIMELINE */}
      {activeTab === 'timeline' && (
        <Card className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-navy-700 pb-5">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-saffron" />
                <span>{t('casesManager.timelineTitle')}</span>
              </h3>
              <p className="text-xs text-muted mt-1">
                {language === 'mr'
                  ? 'तपासातील प्रत्येक महत्त्वपूर्ण कायदेशीर घडामोडींची कालक्रमानुसार नोंद'
                  : 'Chronological investigation diary with statutory timestamps.'}
              </p>
            </div>

            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => {
                const now = new Date();
                const pad = (n: number) => String(n).padStart(2, '0');
                setNewEventDateTime(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`);
                setShowAddEventModal(true);
              }}
            >
              {t('casesManager.addEventBtn')}
            </Button>
          </div>

          {/* Events List */}
          {caseEvents && caseEvents.length === 0 ? (
            <div className="text-center py-12 text-muted text-sm space-y-3">
              <Clock className="w-10 h-10 mx-auto text-muted/60" />
              <p>{t('casesManager.noEvents')}</p>
            </div>
          ) : (
            <div className="relative border-l-2 border-navy-700 ml-4 sm:ml-6 space-y-6 py-2">
              {caseEvents?.map((ev) => {
                // Determine icon based on event type
                let icon = <FileText className="w-4 h-4 text-saffron" />;
                if (ev.type === 'arrest_made') icon = <ShieldAlert className="w-4 h-4 text-danger" />;
                if (ev.type === 'search_started') icon = <Search className="w-4 h-4 text-amber-400" />;
                if (ev.type === 'seizure_made') icon = <Package className="w-4 h-4 text-blue-400" />;
                if (ev.type === 'medical_exam') icon = <Stethoscope className="w-4 h-4 text-emerald-400" />;
                if (ev.type === 'chargesheet_filed') icon = <Scale className="w-4 h-4 text-purple-400" />;

                return (
                  <div key={ev.id} className="relative pl-6 sm:pl-8 group">
                    {/* Timeline Node */}
                    <div className="absolute -left-[17px] top-1 w-8 h-8 rounded-full bg-navy-800 border-2 border-navy-600 flex items-center justify-center group-hover:border-saffron transition-colors">
                      {icon}
                    </div>

                    <div className="bg-navy-900/90 rounded-2xl p-4 border border-navy-700/80 space-y-2 hover:border-navy-600 transition-colors">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-bold text-white text-sm">
                          {t(`casesManager.eventTypes.${ev.type}`) || ev.type}
                        </span>
                        <span className="text-xs text-muted font-mono flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{formatDateTime(ev.dateTime)}</span>
                        </span>
                      </div>

                      {ev.note && (
                        <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                          {ev.note}
                        </p>
                      )}

                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={async () => {
                            if (confirm('Delete this event entry?')) {
                              await deleteCaseEvent(ev.id);
                            }
                          }}
                          className="text-[11px] text-muted hover:text-danger transition-colors"
                        >
                          {language === 'mr' ? 'काढून टाका' : 'Remove'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* TAB 4: EVIDENCE */}
      {activeTab === 'evidence' && (
        <Card className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-navy-700 pb-5">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Camera className="w-5 h-5 text-saffron" />
                <span>{t('casesManager.evidenceTitle')}</span>
              </h3>
              <p className="text-xs text-muted mt-1">
                {language === 'mr'
                  ? 'BSA २०२३ कलम ६३ अन्वये SHA-256 क्रिप्टोग्राफिक हॅशसह जतन केलेले डिजिटल पुरावे'
                  : 'Cryptographically hashed audio, video, photo and document exhibits.'}
              </p>
            </div>

            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => navigate(`/evidence/new?caseId=${currentCase.id}`)}
            >
              {t('casesManager.addEvidenceBtn')}
            </Button>
          </div>

          {caseEvidences && caseEvidences.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <Camera className="w-12 h-12 mx-auto text-muted/60" />
              <div className="space-y-1">
                <h4 className="text-base font-bold text-white">{t('casesManager.noEvidence')}</h4>
                <p className="text-xs text-muted max-w-md mx-auto">
                  {t('casesManager.noEvidenceDesc')}
                </p>
              </div>
              <Button
                variant="secondary"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => navigate(`/evidence/new?caseId=${currentCase.id}`)}
              >
                {t('casesManager.addEvidenceBtn')}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {caseEvidences?.map((ev) => (
                <div
                  key={ev.id}
                  onClick={() => navigate(`/evidence/${ev.id}`)}
                  className="p-4 rounded-xl bg-navy-900 border border-navy-700 hover:border-saffron/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors cursor-pointer select-none"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-navy-800 text-saffron border border-navy-700">
                        {ev.exhibitNo}
                      </span>
                      <span className="font-bold text-white text-sm">{ev.fileName}</span>
                      <Badge variant={ev.sealed ? 'success' : 'warning'} size="sm">
                        {ev.sealed ? t('casesManager.sealedBadge') : t('casesManager.unsealedBadge')}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                      <span className="font-mono text-[11px] text-slate-400">
                        SHA-256: {ev.sha256 ? `${ev.sha256.substring(0, 16)}...` : '-'}
                      </span>
                      <span>•</span>
                      <span>{formatDateTime(ev.loggedAt)}</span>
                    </div>
                  </div>

                  <span className="text-xs text-saffron font-semibold flex items-center gap-1">
                    <span>{language === 'mr' ? 'तपशील पहा' : 'View Exhibit'}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* TAB 5: DEADLINES */}
      {activeTab === 'deadlines' && (
        <Card className="p-6 space-y-6">
          <div className="border-b border-navy-700 pb-5">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-saffron" />
              <span>{t('casesManager.deadlinesTitle')}</span>
            </h3>
            <p className="text-xs text-muted mt-1">
              {t('casesManager.deadlinesSubtitle')}
            </p>
          </div>

          {calculatedDeadlines.length === 0 ? (
            <div className="text-center py-12 text-muted text-sm space-y-2">
              <CheckCircle2 className="w-10 h-10 mx-auto text-india-green/70" />
              <p>{t('casesManager.noDeadlines')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {calculatedDeadlines.map((d) => {
                const isOverdue = d.status === 'overdue';
                const isDueSoon = d.status === 'due_soon';
                const isCompleted = d.status === 'completed';

                const hoursLeftAbs = Math.abs(Math.round(d.hoursRemaining));
                const daysLeftAbs = Math.abs(Math.round(d.hoursRemaining / 24));
                const timeString =
                  hoursLeftAbs <= 48
                    ? `${hoursLeftAbs} ${language === 'mr' ? 'तास' : 'hours'}`
                    : `${daysLeftAbs} ${language === 'mr' ? 'दिवस' : 'days'}`;

                return (
                  <div
                    key={d.ruleId}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                      isOverdue
                        ? 'bg-danger/10 border-danger/40'
                        : isDueSoon
                        ? 'bg-amber-950/20 border-amber-500/40'
                        : isCompleted
                        ? 'bg-emerald-950/20 border-emerald-500/40 opacity-90'
                        : 'bg-navy-900 border-navy-700'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-white text-base">
                            {language === 'mr' ? d.label_mr : d.label_en}
                          </span>

                          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-navy-800 text-saffron border border-navy-700">
                            {d.legalRef.act} {d.legalRef.section}
                            {d.legalRef.subSection ? `(${d.legalRef.subSection})` : ''}
                          </span>
                        </div>

                        <div className="text-xs text-muted flex items-center gap-2">
                          <span>{t('casesManager.triggerEventLabel')}: <strong className="text-slate-300 font-mono">{d.triggerEvent}</strong></span>
                          <span>•</span>
                          <span>{language === 'mr' ? 'अंतिम वेळ' : 'Target'}: {formatDateTime(d.dueAt)}</span>
                        </div>
                      </div>

                      {/* Status Tag */}
                      <div className="self-start sm:self-auto shrink-0">
                        {isCompleted && (
                          <Badge variant="success" size="md">
                            {language === 'mr' ? 'पूर्ण झाले' : 'Completed'}
                          </Badge>
                        )}
                        {!isCompleted && isOverdue && (
                          <Badge variant="danger" size="md">
                            {t('casesManager.overdueStatus', { time: timeString })}
                          </Badge>
                        )}
                        {!isCompleted && isDueSoon && (
                          <Badge variant="warning" size="md">
                            {t('casesManager.dueSoonStatus', { time: timeString })}
                          </Badge>
                        )}
                        {!isCompleted && !isOverdue && !isDueSoon && (
                          <Badge variant="neutral" size="md">
                            {t('casesManager.okStatus', { time: timeString })}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* Delete Case ConfirmDialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteCase}
        loading={deleting}
        title={t('casesManager.deleteCaseTitle')}
        message={t('casesManager.deleteCaseConfirm', {
          caseNo: currentCase.caseNo,
          firNo: currentCase.firNo,
        })}
        confirmText={language === 'mr' ? 'प्रकरण कायमचे हटवा' : 'Delete Case'}
        variant="danger"
      />

      {/* Add Case Event Modal */}
      <Modal
        isOpen={showAddEventModal}
        onClose={() => setShowAddEventModal(false)}
        title={
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-saffron" />
            <span>{t('casesManager.addEventTitle')}</span>
          </div>
        }
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button
              variant="ghost"
              onClick={() => setShowAddEventModal(false)}
            >
              {t('casesManager.cancelButton')}
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveEvent}
              loading={savingEvent}
            >
              {t('casesManager.saveEventBtn')}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 py-2">
          <Select
            label={t('casesManager.eventType')}
            options={eventTypeOptions}
            value={newEventType}
            onChange={(e) => setNewEventType(e.target.value as CaseEventType)}
          />

          <DateTimeInput
            label={t('casesManager.eventDateTime')}
            value={newEventDateTime}
            onChange={(e) => setNewEventDateTime(e.target.value)}
          />

          <Textarea
            label={t('casesManager.eventNote')}
            placeholder={t('casesManager.eventNotePlaceholder')}
            value={newEventNote}
            onChange={(e) => setNewEventNote(e.target.value)}
            rows={3}
          />
        </div>
      </Modal>
    </div>
  );
};
