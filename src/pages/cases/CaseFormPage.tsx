import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  getProfile,
  createCase,
  getCase,
  updateCase,
  addCaseEvent,
  saveChecklistRun,
  listChecklistRunsByCase,
} from '../../lib/db/index.ts';
import { CaseRecord, CaseFacts, LegalProvision } from '../../types/database.ts';
import { SAMPLE_OFFENCES } from '../../data/offences.ts';
import { Offence } from '../../data/types.ts';
import { generateChecklist } from '../../lib/procedure/generate.ts';
import { POLICE_RANKS } from '../../data/districts.ts';
import { useI18n } from '../../i18n/index.ts';
import {
  Stepper,
  Button,
  Input,
  Textarea,
  DateTimeInput,
  Select,
  Switch,
  SearchBar,
  Badge,
  Modal,
  Card,
  FieldError,
} from '../../components/ui/index.ts';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Plus,
  Trash2,
  AlertTriangle,
  Scale,
  ShieldCheck,
  FileText,
  User,
  Users,
  Building,
  CheckSquare,
  HelpCircle,
} from 'lucide-react';

export const CaseFormPage: React.FC = () => {
  const { t, language } = useI18n();
  const navigate = useNavigate();
  const params = useParams<{ caseId?: string }>();
  const [searchParams] = useSearchParams();
  const caseIdToEdit = params.caseId || searchParams.get('id');

  const isEditMode = Boolean(caseIdToEdit);

  // Current Stepper Step (0 to 3)
  const [currentStep, setCurrentStep] = useState(0);

  // Loading states
  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal prompt after saving new case
  const [savedCase, setSavedCase] = useState<CaseRecord | null>(null);
  const [showChecklistPrompt, setShowChecklistPrompt] = useState(false);

  // STEP 1: Basics Form State
  const [caseNo, setCaseNo] = useState('');
  const [firNo, setFirNo] = useState('');
  const [firDateTime, setFirDateTime] = useState('');
  const [policeStation, setPoliceStation] = useState('');
  const [district, setDistrict] = useState('');
  const [ioName, setIoName] = useState('');
  const [ioRank, setIoRank] = useState('psi');
  const [complainantName, setComplainantName] = useState('');
  const [accusedList, setAccusedList] = useState<string[]>(['']);
  const [summary, setSummary] = useState('');

  // STEP 2: Offence Form State
  const [selectedOffenceIds, setSelectedOffenceIds] = useState<string[]>([]);
  const [offenceSearch, setOffenceSearch] = useState('');
  const [offenceCategoryFilter, setOffenceCategoryFilter] = useState<string>('all');

  // STEP 3: Facts Form State
  const [facts, setFacts] = useState<CaseFacts>({
    cognizable: true,
    womanVictim: false,
    childVictim: false,
    arrestMade: false,
    searchConducted: false,
    electronicEvidence: false,
    seizureMade: false,
    rapeCase: false,
    injuryOrDeath: false,
  });

  // Validation Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Rank options for IO
  const rankOptions = useMemo(() => {
    return POLICE_RANKS.map((r) => ({
      value: r.value,
      label: language === 'mr' ? `${r.labelMr} (${r.value.toUpperCase()})` : `${r.labelEn} (${r.value.toUpperCase()})`,
    }));
  }, [language]);

  // Load existing profile or existing case to edit
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const profile = await getProfile();

        if (isEditMode && caseIdToEdit) {
          const existing = await getCase(caseIdToEdit);
          if (existing && isMounted) {
            setCaseNo(existing.caseNo || '');
            setFirNo(existing.firNo || '');
            setFirDateTime(existing.firDateTime || '');
            setPoliceStation(existing.policeStation || '');
            setDistrict(existing.district || '');
            setIoName(existing.ioName || '');
            setIoRank(existing.ioRank || 'psi');
            setComplainantName(existing.complainantName || '');
            setAccusedList(existing.accusedNames && existing.accusedNames.length > 0 ? existing.accusedNames : ['']);
            setSummary(existing.summary || '');
            setSelectedOffenceIds(existing.offenceIds || []);
            setFacts({
              cognizable: existing.facts?.cognizable ?? true,
              womanVictim: existing.facts?.womanVictim ?? false,
              childVictim: existing.facts?.childVictim ?? false,
              arrestMade: existing.facts?.arrestMade ?? false,
              searchConducted: existing.facts?.searchConducted ?? false,
              electronicEvidence: existing.facts?.electronicEvidence ?? false,
              seizureMade: existing.facts?.seizureMade ?? false,
              rapeCase: existing.facts?.rapeCase ?? false,
              injuryOrDeath: existing.facts?.injuryOrDeath ?? false,
            });
          }
        } else if (isMounted) {
          // Pre-fill defaults for new case from officer profile
          const year = new Date().getFullYear();
          const rand = Math.floor(100 + Math.random() * 900);
          setCaseNo(`CR/${year}/${rand}`);
          setFirNo(`0${rand}/${year}`);

          // Local datetime format: YYYY-MM-DDTHH:MM
          const now = new Date();
          const pad = (n: number) => String(n).padStart(2, '0');
          const localIso = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
          setFirDateTime(localIso);

          if (profile) {
            setPoliceStation(profile.station || '');
            setDistrict(profile.district || '');
            setIoName(profile.name || '');
            setIoRank(profile.rank || 'psi');
          }
        }
      } catch (err) {
        console.error('Failed to load initial case data:', err);
      } finally {
        if (isMounted) setInitialLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [isEditMode, caseIdToEdit]);

  // Stepper definition
  const steps = [
    { id: 0, title: t('casesManager.stepBasics') },
    { id: 1, title: t('casesManager.stepOffence') },
    { id: 2, title: t('casesManager.stepFacts') },
    { id: 3, title: t('casesManager.stepReview') },
  ];

  // Accused management
  const handleAddAccused = () => {
    setAccusedList((prev) => [...prev, '']);
  };

  const handleRemoveAccused = (idx: number) => {
    setAccusedList((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateAccused = (idx: number, val: string) => {
    setAccusedList((prev) => {
      const copy = [...prev];
      copy[idx] = val;
      return copy;
    });
  };

  // Offence toggle and fact prefilling
  const handleToggleOffence = (offence: Offence) => {
    const isSelected = selectedOffenceIds.includes(offence.id);
    let nextIds: string[];

    if (isSelected) {
      nextIds = selectedOffenceIds.filter((id) => id !== offence.id);
    } else {
      nextIds = [...selectedOffenceIds, offence.id];

      // Pre-fill facts sensible defaults from the selected offence
      setFacts((prev) => ({
        ...prev,
        cognizable: offence.cognizable ?? prev.cognizable,
        womanVictim: offence.factsDefaults?.womanVictim ? true : prev.womanVictim,
        childVictim: offence.factsDefaults?.childVictim ? true : prev.childVictim,
        electronicEvidence: offence.factsDefaults?.electronicEvidenceLikely ? true : prev.electronicEvidence,
        searchConducted: offence.factsDefaults?.searchLikely ? true : prev.searchConducted,
        arrestMade: offence.factsDefaults?.arrestLikely ? true : prev.arrestMade,
        rapeCase: offence.id === 'offence_rape_bns_64' ? true : prev.rapeCase,
        injuryOrDeath:
          offence.id.includes('murder') || offence.id.includes('homicide') || offence.id.includes('death')
            ? true
            : prev.injuryOrDeath,
      }));
    }

    setSelectedOffenceIds(nextIds);
    if (errors.offences && nextIds.length > 0) {
      setErrors((prev) => ({ ...prev, offences: '' }));
    }
  };

  // Filter offences in Step 2
  const filteredOffences = useMemo(() => {
    return SAMPLE_OFFENCES.filter((off) => {
      if (offenceCategoryFilter !== 'all' && off.category !== offenceCategoryFilter) {
        return false;
      }
      if (offenceSearch.trim()) {
        const q = offenceSearch.toLowerCase().trim();
        const enTitle = off.title_en.toLowerCase();
        const mrTitle = off.title_mr.toLowerCase();
        const bns = off.bnsSection.toLowerCase();
        const ipc = (off.oldIpcSection || '').toLowerCase();
        const tags = (off.tags || []).join(' ').toLowerCase();

        return (
          enTitle.includes(q) ||
          mrTitle.includes(q) ||
          bns.includes(q) ||
          ipc.includes(q) ||
          tags.includes(q)
        );
      }
      return true;
    });
  }, [offenceSearch, offenceCategoryFilter]);

  // Available offence categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    SAMPLE_OFFENCES.forEach((o) => {
      if (o.category) set.add(o.category);
    });
    return Array.from(set);
  }, []);

  // Validation
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 0) {
      if (!firNo.trim()) {
        newErrors.firNo = language === 'mr' ? 'एफआयआर क्रमांक आवश्यक आहे' : 'FIR number is required';
      }
      if (!firDateTime.trim()) {
        newErrors.firDateTime = language === 'mr' ? 'एफआयआर तारीख व वेळ आवश्यक आहे' : 'FIR date & time is required';
      }
      if (!policeStation.trim()) {
        newErrors.policeStation = language === 'mr' ? 'पोलीस ठाणे आवश्यक आहे' : 'Police station is required';
      }
      if (!complainantName.trim()) {
        newErrors.complainantName = language === 'mr' ? 'फिर्यादीचे नाव आवश्यक आहे' : 'Complainant name is required';
      }
    } else if (step === 1) {
      if (selectedOffenceIds.length === 0) {
        newErrors.offences = language === 'mr' ? 'किमान एक गुन्हा निवडणे आवश्यक आहे' : 'Please select at least one offence';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Submit / Save Case
  const handleSave = async () => {
    if (!validateStep(0) || !validateStep(1)) {
      return;
    }

    setSaving(true);
    try {
      // Build legal provisions array from selected offences
      const provisions: LegalProvision[] = selectedOffenceIds.map((id) => {
        const off = SAMPLE_OFFENCES.find((o) => o.id === id);
        return {
          act: off?.bnsSection.startsWith('IT') ? 'ITAct' : 'BNS',
          section: off?.bnsSection || id,
        };
      });

      // Filter non-empty accused names
      const cleanAccused = accusedList.map((a) => a.trim()).filter(Boolean);

      const caseDataPayload = {
        caseNo: caseNo.trim() || firNo.trim(),
        firNo: firNo.trim(),
        firDateTime: firDateTime.trim(),
        policeStation: policeStation.trim(),
        district: district.trim(),
        offenceIds: selectedOffenceIds,
        provisions,
        facts,
        ioName: ioName.trim(),
        ioRank,
        complainantName: complainantName.trim(),
        accusedNames: cleanAccused.length > 0 ? cleanAccused : [language === 'mr' ? 'अनोळखी आरोपी' : 'Unknown Accused'],
        summary: summary.trim(),
        status: (isEditMode ? undefined : 'open') as 'open',
        isSample: false,
      };

      if (isEditMode && caseIdToEdit) {
        const updated = await updateCase(caseIdToEdit, caseDataPayload);
        navigate(`/cases/${updated.id}`);
      } else {
        const created = await createCase(caseDataPayload);

        // Statutory FIR registered caseEvent
        await addCaseEvent({
          caseId: created.id,
          type: 'fir_registered',
          dateTime: created.firDateTime || new Date().toISOString(),
          note: language === 'mr'
            ? `पोलीस ठाण्यात एफआयआर क्र. ${created.firNo} नोंदवला गेला.`
            : `FIR No. ${created.firNo} registered at police station.`,
        });

        // Store saved case and open checklist prompt modal
        setSavedCase(created);
        setShowChecklistPrompt(true);
      }
    } catch (err) {
      console.error('Failed to save case file:', err);
      alert('Failed to save case file. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Handler when officer chooses to generate procedure checklist immediately
  const handleGenerateChecklistNow = async () => {
    if (!savedCase) return;

    try {
      // Find primary offence
      const primaryOffence =
        SAMPLE_OFFENCES.find((o) => o.id === savedCase.offenceIds[0]) || SAMPLE_OFFENCES[0];

      // Generate procedural checklist steps
      const generatedSteps = generateChecklist(primaryOffence, savedCase.facts);

      // Create checklist run in IndexedDB
      const runRecord = await saveChecklistRun({
        caseId: savedCase.id,
        offenceId: primaryOffence.id,
        steps: generatedSteps.map((s) => ({
          stepId: s.id,
          done: false,
        })),
      });

      setShowChecklistPrompt(false);
      navigate(`/checklist/${runRecord.id}`);
    } catch (err) {
      console.error('Failed to generate checklist run:', err);
      // Fallback: navigate to case detail
      navigate(`/cases/${savedCase.id}`);
    }
  };

  if (initialLoading) {
    return (
      <div className="py-12 flex justify-center items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-saffron"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 space-y-6 pb-28 w-full">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/cases')}
            className="p-2 rounded-xl bg-navy-800 hover:bg-navy-700 text-muted hover:text-white border border-navy-700 transition-colors"
            aria-label={t('casesManager.backToCases')}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {isEditMode ? t('casesManager.editTitle') : t('casesManager.newTitle')}
            </h1>
            <p className="text-xs sm:text-sm text-muted">
              {isEditMode
                ? `${t('casesManager.firNo')}: ${firNo}`
                : t('pages.casesNew.subtitle')}
            </p>
          </div>
        </div>

        <Badge variant="info" size="sm">
          BNSS 2023
        </Badge>
      </div>

      {/* Stepper Header */}
      <div className="bg-navy-800/80 border border-navy-700 rounded-2xl p-4 shadow-sm">
        <Stepper
          steps={steps}
          currentStepIndex={currentStep}
          orientation="horizontal"
          onStepClick={(idx) => {
            if (idx < currentStep) setCurrentStep(idx);
            else if (validateStep(currentStep)) setCurrentStep(idx);
          }}
        />
      </div>

      {/* STEP 1: BASICS */}
      {currentStep === 0 && (
        <Card className="space-y-6 p-5 sm:p-7">
          <div className="border-b border-navy-700 pb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-saffron" />
              <span>{t('casesManager.stepBasics')}</span>
            </h2>
            <p className="text-xs text-muted mt-1">
              {language === 'mr'
                ? 'पोलीस ठाण्यातील अधिकृत एफआयआर व प्राथमिक गु.र.नं. माहिती'
                : 'Mandatory police station FIR registration information under BNSS Section 173.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <Input
              label={t('casesManager.firNo')}
              required
              value={firNo}
              onChange={(e) => {
                setFirNo(e.target.value);
                if (errors.firNo) setErrors((prev) => ({ ...prev, firNo: '' }));
              }}
              placeholder={t('casesManager.firNoPlaceholder')}
              error={errors.firNo}
            />

            <Input
              label={t('casesManager.caseNo')}
              value={caseNo}
              onChange={(e) => setCaseNo(e.target.value)}
              placeholder={t('casesManager.caseNoPlaceholder')}
              hint={language === 'mr' ? 'गुन्हा नोंदवही क्रमांक' : 'Police Station Station Diary / Crime Register No.'}
            />

            <DateTimeInput
              label={t('casesManager.firDateTime')}
              required
              type="datetime-local"
              value={firDateTime}
              onChange={(e) => {
                setFirDateTime(e.target.value);
                if (errors.firDateTime) setErrors((prev) => ({ ...prev, firDateTime: '' }));
              }}
              error={errors.firDateTime}
            />

            <Input
              label={t('casesManager.policeStation')}
              required
              value={policeStation}
              onChange={(e) => {
                setPoliceStation(e.target.value);
                if (errors.policeStation) setErrors((prev) => ({ ...prev, policeStation: '' }));
              }}
              error={errors.policeStation}
              icon={<Building className="w-4 h-4" />}
            />

            <Input
              label={t('casesManager.district')}
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label={t('casesManager.ioName')}
                value={ioName}
                onChange={(e) => setIoName(e.target.value)}
                icon={<User className="w-4 h-4" />}
              />
              <Select
                label={t('casesManager.ioRank')}
                options={rankOptions}
                value={ioRank}
                onChange={(e) => setIoRank(e.target.value)}
              />
            </div>

            <div className="sm:col-span-2">
              <Input
                label={t('casesManager.complainantName')}
                required
                value={complainantName}
                onChange={(e) => {
                  setComplainantName(e.target.value);
                  if (errors.complainantName) setErrors((prev) => ({ ...prev, complainantName: '' }));
                }}
                placeholder={t('casesManager.complainantPlaceholder')}
                error={errors.complainantName}
                icon={<User className="w-4 h-4" />}
              />
            </div>

            {/* Accused Dynamic List */}
            <div className="sm:col-span-2 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-white flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-saffron" />
                  <span>{t('casesManager.accusedNames')}</span>
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  icon={<Plus className="w-4 h-4" />}
                  onClick={handleAddAccused}
                >
                  {t('casesManager.addAccused')}
                </Button>
              </div>

              {accusedList.map((accused, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    value={accused}
                    onChange={(e) => handleUpdateAccused(idx, e.target.value)}
                    placeholder={`${t('casesManager.accusedPlaceholder')} #${idx + 1}`}
                  />
                  {accusedList.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveAccused(idx)}
                      className="p-3 text-muted hover:text-danger rounded-xl hover:bg-navy-900 border border-transparent hover:border-navy-700 transition-colors"
                      title={t('casesManager.removeAccused')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="sm:col-span-2">
              <Textarea
                label={t('casesManager.summary')}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder={t('casesManager.summaryPlaceholder')}
                rows={3}
              />
            </div>
          </div>
        </Card>
      )}

      {/* STEP 2: OFFENCE SELECTION */}
      {currentStep === 1 && (
        <Card className="space-y-6 p-5 sm:p-7">
          <div className="border-b border-navy-700 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Scale className="w-5 h-5 text-saffron" />
                <span>{t('casesManager.stepOffence')}</span>
              </h2>
              <p className="text-xs text-muted mt-1">
                {language === 'mr'
                  ? 'BNS व इतर कायद्यांखालील लागू कलमे निवडा'
                  : 'Select applicable sections under Bharatiya Nyaya Sanhita (BNS 2023) and related acts.'}
              </p>
            </div>

            <Badge variant="warning" size="md">
              {t('casesManager.pendingReviewBadge')}
            </Badge>
          </div>

          <FieldError error={errors.offences} />

          {/* Selected Offences Preview */}
          {selectedOffenceIds.length > 0 && (
            <div className="bg-navy-900/80 border border-saffron/30 rounded-2xl p-4 space-y-2">
              <div className="text-xs font-bold text-saffron uppercase tracking-wider">
                {t('casesManager.selectedOffences', { count: selectedOffenceIds.length })}
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedOffenceIds.map((id) => {
                  const off = SAMPLE_OFFENCES.find((o) => o.id === id);
                  if (!off) return null;
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-saffron/15 text-white border border-saffron/40 text-xs font-semibold"
                    >
                      <span>{language === 'mr' ? off.title_mr : off.title_en}</span>
                      <span className="font-mono text-saffron">({off.bnsSection})</span>
                      <button
                        type="button"
                        onClick={() => handleToggleOffence(off)}
                        className="text-muted hover:text-danger ml-1"
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Search & Category Filter */}
          <div className="space-y-3">
            <SearchBar
              value={offenceSearch}
              onValueChange={setOffenceSearch}
              placeholder={t('casesManager.searchOffence')}
            />

            {/* Category pills */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
              <button
                type="button"
                onClick={() => setOffenceCategoryFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors select-none ${
                  offenceCategoryFilter === 'all'
                    ? 'bg-saffron text-navy-900 font-bold'
                    : 'bg-navy-900 text-muted hover:text-white border border-navy-700'
                }`}
              >
                {t('casesManager.categoryAll')}
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setOffenceCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors select-none whitespace-nowrap ${
                    offenceCategoryFilter === cat
                      ? 'bg-saffron text-navy-900 font-bold'
                      : 'bg-navy-900 text-muted hover:text-white border border-navy-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Offence Selection Cards */}
          <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
            {filteredOffences.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted">
                {t('casesManager.noOffencesFound')}
              </div>
            ) : (
              filteredOffences.map((off) => {
                const isSelected = selectedOffenceIds.includes(off.id);
                return (
                  <div
                    key={off.id}
                    onClick={() => handleToggleOffence(off)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 select-none ${
                      isSelected
                        ? 'bg-navy-700/80 border-saffron shadow-sm'
                        : 'bg-navy-900/60 hover:bg-navy-900 border-navy-700 hover:border-navy-600'
                    }`}
                  >
                    {/* Checkbox indicator */}
                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                        isSelected
                          ? 'bg-saffron text-navy-900 font-bold'
                          : 'border border-navy-500 bg-navy-800'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-white text-base">
                          {language === 'mr' ? off.title_mr : off.title_en}
                        </span>

                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-saffron/20 text-saffron border border-saffron/40">
                          {off.bnsSection}
                        </span>

                        {off.oldIpcSection && (
                          <span className="text-xs font-mono text-muted bg-navy-800 px-2 py-0.5 rounded border border-navy-700">
                            Old: {off.oldIpcSection}
                          </span>
                        )}

                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-navy-800 text-muted border border-navy-700">
                          {off.category}
                        </span>
                      </div>

                      <p className="text-xs text-muted line-clamp-2">
                        {language === 'mr' ? off.description_mr : off.description_en}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-muted">
                        <span className="font-medium text-slate-300">
                          {off.maxPunishmentYears >= 99
                            ? t('casesManager.punishmentLifeOrDeath')
                            : t('casesManager.maxPunishment', { years: off.maxPunishmentYears })}
                        </span>
                        <span>•</span>
                        <span className={off.cognizable ? 'text-india-green font-medium' : 'text-muted'}>
                          {off.cognizable ? t('casesManager.cognizableBadge') : t('casesManager.nonCognizableBadge')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      )}

      {/* STEP 3: FACTS QUESTIONNAIRE */}
      {currentStep === 2 && (
        <Card className="space-y-6 p-5 sm:p-7">
          <div className="border-b border-navy-700 pb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-saffron" />
              <span>{t('casesManager.factsTitle')}</span>
            </h2>
            <p className="text-xs text-muted mt-1">
              {t('casesManager.factsSubtitle')}
            </p>
          </div>

          <div className="space-y-4 divide-y divide-navy-700/60">
            {/* 1. Cognizable */}
            <div className="pt-3">
              <Switch
                checked={facts.cognizable}
                onChange={(val) => setFacts((prev) => ({ ...prev, cognizable: val }))}
                label={t('casesManager.cognizableFact')}
                description={t('casesManager.cognizableFactDesc')}
              />
            </div>

            {/* 2. Woman Victim */}
            <div className="pt-3">
              <Switch
                checked={facts.womanVictim}
                onChange={(val) => setFacts((prev) => ({ ...prev, womanVictim: val }))}
                label={t('casesManager.womanVictimFact')}
                description={t('casesManager.womanVictimFactDesc')}
              />
            </div>

            {/* 3. Child Victim */}
            <div className="pt-3">
              <Switch
                checked={facts.childVictim}
                onChange={(val) => setFacts((prev) => ({ ...prev, childVictim: val }))}
                label={t('casesManager.childVictimFact')}
                description={t('casesManager.childVictimFactDesc')}
              />
            </div>

            {/* 4. Arrest Made */}
            <div className="pt-3">
              <Switch
                checked={facts.arrestMade}
                onChange={(val) => setFacts((prev) => ({ ...prev, arrestMade: val }))}
                label={t('casesManager.arrestMadeFact')}
                description={t('casesManager.arrestMadeFactDesc')}
              />
            </div>

            {/* 5. Search Conducted */}
            <div className="pt-3">
              <Switch
                checked={facts.searchConducted}
                onChange={(val) => setFacts((prev) => ({ ...prev, searchConducted: val }))}
                label={t('casesManager.searchConductedFact')}
                description={t('casesManager.searchConductedFactDesc')}
              />
            </div>

            {/* 6. Electronic Evidence */}
            <div className="pt-3">
              <Switch
                checked={facts.electronicEvidence}
                onChange={(val) => setFacts((prev) => ({ ...prev, electronicEvidence: val }))}
                label={t('casesManager.electronicEvidenceFact')}
                description={t('casesManager.electronicEvidenceFactDesc')}
              />
            </div>

            {/* 7. Property / Seizure Made */}
            <div className="pt-3">
              <Switch
                checked={facts.seizureMade}
                onChange={(val) => setFacts((prev) => ({ ...prev, seizureMade: val }))}
                label={t('casesManager.seizureMadeFact')}
                description={t('casesManager.seizureMadeFactDesc')}
              />
            </div>

            {/* 8. Rape / Sexual Assault Flag */}
            <div className="pt-3">
              <Switch
                checked={facts.rapeCase}
                onChange={(val) => setFacts((prev) => ({ ...prev, rapeCase: val }))}
                label={t('casesManager.rapeCaseFact')}
                description={t('casesManager.rapeCaseFactDesc')}
              />
            </div>

            {/* 9. Injury or Death */}
            <div className="pt-3">
              <Switch
                checked={facts.injuryOrDeath}
                onChange={(val) => setFacts((prev) => ({ ...prev, injuryOrDeath: val }))}
                label={t('casesManager.injuryOrDeathFact')}
                description={t('casesManager.injuryOrDeathFactDesc')}
              />
            </div>
          </div>
        </Card>
      )}

      {/* STEP 4: REVIEW & SAVE */}
      {currentStep === 3 && (
        <Card className="space-y-6 p-5 sm:p-7">
          <div className="border-b border-navy-700 pb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-saffron" />
              <span>{t('casesManager.reviewSummary')}</span>
            </h2>
            <p className="text-xs text-muted mt-1">
              {t('casesManager.reviewWarning')}
            </p>
          </div>

          {/* Review Grid */}
          <div className="space-y-5">
            {/* Basics Summary */}
            <div className="bg-navy-900/80 rounded-2xl p-4 border border-navy-700 space-y-3">
              <div className="text-xs font-bold text-saffron uppercase tracking-wider">
                {t('casesManager.stepBasics')}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                <div>
                  <div className="text-xs text-muted">{t('casesManager.firNo')}</div>
                  <div className="font-bold text-white">{firNo || '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-muted">{t('casesManager.caseNo')}</div>
                  <div className="font-mono text-white">{caseNo || '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-muted">{t('casesManager.firDateTime')}</div>
                  <div className="text-white">{firDateTime || '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-muted">{t('casesManager.policeStation')}</div>
                  <div className="text-white">{policeStation || '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-muted">{t('casesManager.ioName')}</div>
                  <div className="text-white">{ioName} ({ioRank.toUpperCase()})</div>
                </div>
                <div>
                  <div className="text-xs text-muted">{t('casesManager.complainantName')}</div>
                  <div className="text-white">{complainantName || '-'}</div>
                </div>
              </div>

              {accusedList.filter(Boolean).length > 0 && (
                <div className="pt-2 border-t border-navy-800 text-xs text-muted">
                  <span className="font-semibold text-slate-300">{t('casesManager.accusedNames')}: </span>
                  <span>{accusedList.filter(Boolean).join(', ')}</span>
                </div>
              )}

              {summary && (
                <div className="pt-2 border-t border-navy-800 text-xs text-muted">
                  <span className="font-semibold text-slate-300">{t('casesManager.summary')}: </span>
                  <span className="text-slate-400">{summary}</span>
                </div>
              )}
            </div>

            {/* Offences Summary */}
            <div className="bg-navy-900/80 rounded-2xl p-4 border border-navy-700 space-y-2">
              <div className="text-xs font-bold text-saffron uppercase tracking-wider">
                {t('casesManager.selectedOffences', { count: selectedOffenceIds.length })}
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedOffenceIds.map((id) => {
                  const off = SAMPLE_OFFENCES.find((o) => o.id === id);
                  if (!off) return null;
                  return (
                    <div
                      key={id}
                      className="px-3 py-1.5 rounded-xl bg-navy-800 border border-saffron/30 text-xs flex items-center gap-2"
                    >
                      <span className="font-semibold text-white">
                        {language === 'mr' ? off.title_mr : off.title_en}
                      </span>
                      <span className="font-mono text-saffron">{off.bnsSection}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Facts Summary */}
            <div className="bg-navy-900/80 rounded-2xl p-4 border border-navy-700 space-y-2">
              <div className="text-xs font-bold text-saffron uppercase tracking-wider">
                {t('casesManager.factsTitle')}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {Object.entries(facts).map(([key, val]) => (
                  <div
                    key={key}
                    className={`px-3 py-2 rounded-xl flex items-center justify-between border ${
                      val
                        ? 'bg-india-green/10 border-india-green/30 text-white'
                        : 'bg-navy-800/60 border-navy-700/60 text-muted'
                    }`}
                  >
                    <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                    <span className={`font-bold ${val ? 'text-india-green' : 'text-muted'}`}>
                      {val ? 'YES' : 'NO'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Navigation Footer Toolbar */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={currentStep === 0 ? () => navigate('/cases') : handlePrev}
          icon={currentStep === 0 ? undefined : <ArrowLeft className="w-4 h-4" />}
        >
          {currentStep === 0 ? t('casesManager.cancelButton') : language === 'mr' ? 'मागे' : 'Back'}
        </Button>

        {currentStep < steps.length - 1 ? (
          <Button
            type="button"
            variant="primary"
            onClick={handleNext}
            icon={<ArrowRight className="w-4 h-4" />}
            iconPosition="right"
          >
            {language === 'mr' ? 'पुढे' : 'Continue'}
          </Button>
        ) : (
          <Button
            type="button"
            variant="primary"
            onClick={handleSave}
            loading={saving}
            icon={<Check className="w-5 h-5 stroke-[2.5]" />}
            className="shadow-lg shadow-saffron/20"
          >
            {isEditMode ? t('casesManager.updateButton') : t('casesManager.saveButton')}
          </Button>
        )}
      </div>

      {/* Modal Prompt: Generate Procedure Checklist Now? */}
      <Modal
        isOpen={showChecklistPrompt}
        onClose={() => {
          setShowChecklistPrompt(false);
          if (savedCase) navigate(`/cases/${savedCase.id}`);
        }}
        title={
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-saffron" />
            <span>{t('casesManager.generatePromptTitle')}</span>
          </div>
        }
        footer={
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 w-full">
            <Button
              variant="ghost"
              onClick={() => {
                setShowChecklistPrompt(false);
                if (savedCase) navigate(`/cases/${savedCase.id}`);
              }}
              className="w-full sm:w-auto"
            >
              {t('casesManager.generatePromptNo')}
            </Button>
            <Button
              variant="primary"
              onClick={handleGenerateChecklistNow}
              className="w-full sm:w-auto shadow-md"
            >
              {t('casesManager.generatePromptYes')}
            </Button>
          </div>
        }
      >
        <div className="space-y-3 py-2">
          <p className="text-sm text-slate-200">
            {t('casesManager.generatePromptDesc')}
          </p>
          <div className="bg-navy-900 border border-navy-700 rounded-xl p-3 text-xs text-muted space-y-1">
            <div className="flex justify-between">
              <span>{t('casesManager.firNo')}:</span>
              <span className="font-bold text-white">{savedCase?.firNo}</span>
            </div>
            <div className="flex justify-between">
              <span>{t('casesManager.stepOffence')}:</span>
              <span className="font-bold text-saffron">
                {savedCase?.provisions.map((p) => `${p.act} ${p.section}`).join(', ')}
              </span>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
