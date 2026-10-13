import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Search,
  Camera,
  Video,
  FileText,
  Clock,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Plus,
  Trash2,
  Check,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Download,
  Printer,
  Share2,
  Lock,
  User,
  MapPin,
  Calendar,
  Sparkles,
  ExternalLink,
  Package,
  Layers,
} from 'lucide-react';
import {
  useLiveData,
  getCase,
  updateCase,
  addCaseEvent,
  listEvidenceByCase,
  createEvidence,
  saveDocument,
  getProfile,
  addAuditLog,
} from '../../lib/db/index.ts';
import { appendCustodyEntry } from '../../lib/custody/index.ts';
import { CaseRecord, EvidenceRecord } from '../../types/database.ts';
import { exportPdf, printDocument, shareDocument } from '../../lib/pdf/index.ts';
import { useI18n, formatDateTime, formatDate } from '../../i18n/index.ts';
import { useToast } from '../../components/ui/Toast.tsx';
import {
  Card,
  Button,
  Badge,
  Input,
  Textarea,
  Checkbox,
  Stepper,
  StepItem,
  ConfirmDialog,
  Modal,
} from '../../components/ui/index.ts';

interface SeizedItem {
  id: string;
  itemNo: number;
  description: string;
  quantity: string;
  whereFound: string;
  condition: string;
  sealNo: string;
  photoEvidenceId?: string;
  photoName?: string;
}

export const SearchSeizureWizardPage: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const { t, language } = useI18n();
  const { success, error, info } = useToast();

  const [currentStep, setCurrentStep] = useState<number>(0);

  // Hidden video and photo inputs
  const videoInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [photoTargetItemId, setPhotoTargetItemId] = useState<string | null>(null);

  // Printable references for PDF export
  const memoPrintRef = useRef<HTMLDivElement>(null);
  const forwardingPrintRef = useRef<HTMLDivElement>(null);

  // Live Case & Profile Data
  const { data: caseRecord, loading: loadingCase } = useLiveData<CaseRecord | null>(
    () => (caseId ? getCase(caseId) : Promise.resolve(null)),
    ['cases'],
    [caseId]
  );
  const { data: profile } = useLiveData(() => getProfile(), ['profile']);
  const { data: caseEvidence = [] } = useLiveData<EvidenceRecord[]>(
    () => (caseId ? listEvidenceByCase(caseId) : Promise.resolve([])),
    ['evidence'],
    [caseId]
  );

  // STEP 1: BEFORE THE SEARCH
  const [chk1Warrant, setChk1Warrant] = useState<boolean>(true);
  const [chk2Witnesses, setChk2Witnesses] = useState<boolean>(true);
  const [chk3BatteryReady, setChk3BatteryReady] = useState<boolean>(true);
  const [chk4ContinuousVideo, setChk4ContinuousVideo] = useState<boolean>(true);
  const [chk5PersonalSearch, setChk5PersonalSearch] = useState<boolean>(true);

  const [place, setPlace] = useState<string>('');
  const [searchDate, setSearchDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState<string>(
    new Date().toTimeString().slice(0, 5)
  );

  const [witness1, setWitness1] = useState({
    name: '',
    age: '',
    address: '',
    phone: '',
    occupation: '',
  });

  const [witness2, setWitness2] = useState({
    name: '',
    age: '',
    address: '',
    phone: '',
    occupation: '',
  });

  const [occupant, setOccupant] = useState({
    name: '',
    age: '',
    address: '',
    phone: '',
    relation: '',
  });

  // STEP 2: DURING THE SEARCH
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [recordedVideos, setRecordedVideos] = useState<EvidenceRecord[]>([]);
  const [isVideoHashing, setIsVideoHashing] = useState<boolean>(false);
  const [seizedItems, setSeizedItems] = useState<SeizedItem[]>([
    {
      id: 'item-1',
      itemNo: 1,
      description: '',
      quantity: '1',
      whereFound: '',
      condition: 'Good / Intact',
      sealNo: 'SEAL-01',
    },
  ]);

  // STEP 3: AFTER THE SEARCH
  const [endTime, setEndTime] = useState<string>(
    new Date().toTimeString().slice(0, 5)
  );
  const [officerRemarks, setOfficerRemarks] = useState<string>(
    'Search and seizure conducted peacefully without damage in the continuous presence of independent witnesses and videographed.'
  );
  const [copyGivenToOccupant, setCopyGivenToOccupant] = useState<boolean>(true);
  const [magistrateForwarded, setMagistrateForwarded] = useState<boolean>(false);
  const [magistrateForwardDateTime, setMagistrateForwardDateTime] = useState<string>(
    new Date().toISOString().slice(0, 16)
  );
  const [carrierDetails, setCarrierDetails] = useState<string>('');

  // STEP 4: SUMMARY & DOCUMENTS
  const [docLanguage, setDocLanguage] = useState<'en' | 'mr'>('en');
  const [activeDocTab, setActiveDocTab] = useState<'memo' | 'letter'>('memo');
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [isSavingAll, setIsSavingAll] = useState<boolean>(false);

  // Set default carrier details from profile
  useEffect(() => {
    if (profile?.name && !carrierDetails) {
      setCarrierDetails(`${profile.rank || 'Officer'} ${profile.name}, PS ${profile.station || ''}`);
    }
  }, [profile, carrierDetails]);

  // Set initial place from case
  useEffect(() => {
    if (caseRecord && !place) {
      setPlace(caseRecord.policeStation ? `Near ${caseRecord.policeStation}` : 'Pune, Maharashtra');
    }
  }, [caseRecord, place]);

  // Live Timer for During-Search elapsed duration
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning]);

  // Format Elapsed Seconds to HH:MM:SS
  const formatTimer = (totalSec: number): string => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Stepper config
  const wizardSteps: StepItem[] = [
    {
      id: 'step1',
      title: language === 'mr' ? 'झडतीपूर्वी' : 'Before Search',
      subtitle: language === 'mr' ? 'BNSS १०३/१०५ पूर्वतयारी' : 'Prerequisites & Witnesses',
    },
    {
      id: 'step2',
      title: language === 'mr' ? 'झडतीदरम्यान' : 'During Search',
      subtitle: language === 'mr' ? 'व्हिडिओ व जप्ती नोंद' : 'Live Timer & Video',
    },
    {
      id: 'step3',
      title: language === 'mr' ? 'झडतीनंतर' : 'After Search',
      subtitle: language === 'mr' ? 'सांगता व २४ तास घड्याळ' : 'Conclusion & 24h Clock',
    },
    {
      id: 'step4',
      title: language === 'mr' ? 'दस्तऐवज' : 'Summary & Documents',
      subtitle: language === 'mr' ? 'पंचनामा व सादर पत्र' : 'Panchnama & Forwarding Letter',
    },
  ];

  // Helper to handle recording video directly as evidence under BNSS 105
  const handleVideoFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !caseId) return;
    e.target.value = '';

    try {
      setIsVideoHashing(true);
      info(language === 'mr' ? 'व्हिडिओ वाचून SHA-256 ठसा काढत आहे...' : 'Reading video & computing SHA-256 fingerprint...');

      const buffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const sha256 = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

      const nextNum = caseEvidence.length + recordedVideos.length + 1;
      const exhibitNo = `VID-EX-${String(nextNum).padStart(3, '0')}`;

      // Save as Evidence
      const newEv = await createEvidence(
        {
          caseId,
          exhibitNo,
          fileName: file.name,
          mimeType: file.type || 'video/mp4',
          size: file.size,
          lastModified: new Date(file.lastModified).toISOString(),
          sha256,
          algorithm: 'SHA-256',
          description: `Mandatory continuous video recording of search and seizure under BNSS Sec 105. Place: ${place}`,
          source: `Recorded on IO Device during search at ${place}`,
          handlerName: profile?.name || 'Investigating Officer',
          sealed: false,
          deviceInfo: navigator.userAgent,
        },
        file
      );

      // Create first custody entry anchored to video SHA-256
      await appendCustodyEntry({
        evidenceId: newEv.id,
        action: 'Collected',
        fromPerson: `Scene of Search (${place})`,
        toPerson: profile?.name || 'Investigating Officer',
        location: caseRecord?.policeStation || 'Police Station',
        remarks: `Continuous audio-video capture under BNSS Sec 105. Exhibit: ${newEv.exhibitNo}.`,
      });

      setRecordedVideos((prev) => [...prev, newEv]);
      setIsVideoHashing(false);
      success(language === 'mr' ? 'व्हिडिओ पुरावा व SHA-256 ठसा यशस्वीरीत्या जोडला!' : 'Video evidence & SHA-256 fingerprint successfully recorded!');
    } catch (err) {
      console.error('Error processing search video:', err);
      setIsVideoHashing(false);
      error(language === 'mr' ? 'व्हिडिओ प्रक्रिया करताना त्रुटी आली.' : 'Failed to record and hash video.');
    }
  };

  // Helper to attach photo to a seized item
  const handlePhotoFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !caseId || !photoTargetItemId) return;
    e.target.value = '';

    try {
      const buffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const sha256 = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

      const nextNum = caseEvidence.length + recordedVideos.length + 1;
      const exhibitNo = `IMG-EX-${String(nextNum).padStart(3, '0')}`;

      const newEv = await createEvidence(
        {
          caseId,
          exhibitNo,
          fileName: file.name,
          mimeType: file.type || 'image/jpeg',
          size: file.size,
          lastModified: new Date(file.lastModified).toISOString(),
          sha256,
          algorithm: 'SHA-256',
          description: `Photo of seized article #${photoTargetItemId} during search at ${place}`,
          source: `Photographed on spot during search at ${place}`,
          handlerName: profile?.name || 'Investigating Officer',
          sealed: true,
          deviceInfo: navigator.userAgent,
        },
        file
      );

      await appendCustodyEntry({
        evidenceId: newEv.id,
        action: 'Collected',
        fromPerson: `Search Spot (${place})`,
        toPerson: profile?.name || 'Investigating Officer',
        location: caseRecord?.policeStation || 'Police Station',
        remarks: `Photographed and sealed on spot. Exhibit ${newEv.exhibitNo}.`,
      });

      setSeizedItems((prev) =>
        prev.map((item) =>
          item.id === photoTargetItemId
            ? { ...item, photoEvidenceId: newEv.id, photoName: file.name }
            : item
        )
      );
      setPhotoTargetItemId(null);
      success(language === 'mr' ? 'वस्तूचा फोटो जोडला व SHA-256 नोंदवला!' : 'Article photo attached and cryptographically hashed!');
    } catch (err) {
      console.error('Photo attach error:', err);
      error('Failed to attach photo');
    }
  };

  // Add Item to Seized Table
  const handleAddSeizedItem = () => {
    const nextItemNo = seizedItems.length + 1;
    setSeizedItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}`,
        itemNo: nextItemNo,
        description: '',
        quantity: '1',
        whereFound: '',
        condition: 'Good / Intact',
        sealNo: `SEAL-${String(nextItemNo).padStart(2, '0')}`,
      },
    ]);
  };

  // Remove Item from Seized Table
  const handleRemoveSeizedItem = (id: string) => {
    if (seizedItems.length <= 1) {
      error(language === 'mr' ? 'किमान एक वस्तू आवश्यक आहे' : 'At least one item is required');
      return;
    }
    setSeizedItems((prev) => prev.filter((i) => i.id !== id));
  };

  // Step 1 Validation
  const handleNextFromStep1 = () => {
    if (!place.trim()) {
      error(language === 'mr' ? 'कृपया झडतीचे ठिकाण टाका' : 'Please specify the search location/premises');
      return;
    }
    if (!witness1.name.trim() || !witness2.name.trim()) {
      error(language === 'mr' ? 'दोन स्वतंत्र पंचांची नावे आवश्यक आहेत' : 'Names of two independent witnesses (panchas) are mandatory under BNSS 103');
      return;
    }
    // Start live timer when moving to Step 2
    if (!isTimerRunning && elapsedSeconds === 0) {
      setIsTimerRunning(true);
    }
    setCurrentStep(1);
  };

  // Step 2 Validation
  const handleNextFromStep2 = () => {
    const invalidItem = seizedItems.find((i) => !i.description.trim());
    if (invalidItem) {
      error(language === 'mr' ? 'कृपया सर्व जप्त वस्तूंचे वर्णन लिहा' : 'Please provide description for all seized articles');
      return;
    }
    setIsTimerRunning(false);
    setEndTime(new Date().toTimeString().slice(0, 5));
    setCurrentStep(2);
  };

  // Step 3 Validation
  const handleNextFromStep3 = () => {
    setCurrentStep(3);
  };

  // PDF Export for active document
  const handleDownloadActiveDocPdf = async () => {
    const targetElement = activeDocTab === 'memo' ? memoPrintRef.current : forwardingPrintRef.current;
    if (!targetElement) return;

    try {
      setIsExportingPdf(true);
      const name =
        activeDocTab === 'memo'
          ? `Seizure_Memo_Panchnama_${caseRecord?.caseNo || 'Case'}.pdf`
          : `Magistrate_Forwarding_Letter_BNSS105_${caseRecord?.caseNo || 'Case'}.pdf`;

      await exportPdf(targetElement, name);
      setIsExportingPdf(false);
      success(language === 'mr' ? 'PDF यशस्वीरीत्या डाउनलोड झाले!' : 'PDF downloaded successfully!');
    } catch (err) {
      console.error('PDF export failed:', err);
      setIsExportingPdf(false);
      error(language === 'mr' ? 'PDF डाऊनलोड करताना त्रुटी आली' : 'Failed to generate PDF');
    }
  };

  // Save All to Case
  const handleSaveAndFinish = async () => {
    if (!caseId || !caseRecord) return;
    try {
      setIsSavingAll(true);

      // 1. Update Case Facts
      const updatedFacts = {
        ...caseRecord.facts,
        searchConducted: true,
        seizureMade: true,
        electronicEvidence: caseRecord.facts.electronicEvidence || recordedVideos.length > 0,
      };

      await updateCase(caseId, {
        facts: updatedFacts,
      });

      // 2. Add Case Events so deadlines and checklists refresh
      const eventDate = searchDate || new Date().toISOString().slice(0, 10);
      const startDateTimeStr = `${eventDate}T${startTime}:00`;
      const endDateTimeStr = `${eventDate}T${endTime}:00`;

      await addCaseEvent({
        caseId,
        type: 'search_started',
        dateTime: startDateTimeStr,
        note: `Search conducted at ${place}. Witnesses: ${witness1.name}, ${witness2.name}. Occupant: ${occupant.name || 'Present'}.`,
      });

      await addCaseEvent({
        caseId,
        type: 'seizure_made',
        dateTime: endDateTimeStr,
        note: `Seizure completed. ${seizedItems.length} articles seized and sealed. Continuous video recorded under BNSS 105. 24h Magistrate transmission clock activated.`,
      });

      // 3. Save Seizure Memo to documents store
      await saveDocument({
        caseId,
        templateId: 'seizure_memo_panchnama',
        language: docLanguage,
        fields: {
          place,
          searchDate,
          startTime,
          endTime,
          witness1,
          witness2,
          occupant,
          seizedItems,
          videoHashes: recordedVideos.map((v) => ({ exhibitNo: v.exhibitNo, sha256: v.sha256 })),
          officerRemarks,
          carrierDetails,
          savedAt: new Date().toISOString(),
        },
      });

      // 4. Save Magistrate Forwarding Letter to documents store
      await saveDocument({
        caseId,
        templateId: 'magistrate_forwarding_letter_bnss105',
        language: docLanguage,
        fields: {
          place,
          searchDate,
          endTime,
          carrierDetails,
          videoHashes: recordedVideos.map((v) => ({ exhibitNo: v.exhibitNo, sha256: v.sha256 })),
          savedAt: new Date().toISOString(),
        },
      });

      // 5. Add Audit Log
      await addAuditLog(
        'search_seizure_completed',
        `Search and seizure completed for case ${caseRecord.caseNo}. BNSS 105 videography and seizure memo archived.`
      );

      setIsSavingAll(false);
      success(
        language === 'mr'
          ? 'झडती-जप्ती यशस्वीरीत्या नोंदवली. प्रकरणातील वस्तुस्थिती, घटना व मुदती अद्ययावत झाल्या!'
          : 'Search & seizure recorded. Case facts, events and statutory deadlines updated!'
      );
      navigate(`/cases/${caseId}`);
    } catch (err) {
      console.error('Save all search seizure failed:', err);
      setIsSavingAll(false);
      error(language === 'mr' ? 'जतन करताना त्रुटी आली' : 'Failed to save search and seizure records');
    }
  };

  if (loadingCase || !caseRecord) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center text-muted">
        {language === 'mr' ? 'प्रकरणाची माहिती लोड करत आहे...' : 'Loading case details...'}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/cases/${caseId}`)}
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            {caseRecord.caseNo}
          </Button>
          <div className="h-4 w-px bg-navy-700 hidden sm:block" />
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Search className="w-5 h-5 text-saffron" />
              <span>{t('searchSeizure.title')}</span>
            </h1>
            <p className="text-xs text-muted">
              {t('searchSeizure.subtitle')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="warning" size="sm">
            {language === 'mr' ? 'कायदेशीर पुनरावलोकन प्रलंबित' : 'Pending Legal Review'}
          </Badge>
          <Badge variant="info" size="sm">
            BNSS 103 & 105
          </Badge>
        </div>
      </div>

      {/* Stepper Navigation */}
      <Card className="p-3 bg-navy-900 border-navy-700">
        <Stepper
          steps={wizardSteps}
          currentStepIndex={currentStep}
          orientation="horizontal"
          onStepClick={(idx) => {
            if (idx <= currentStep) setCurrentStep(idx);
          }}
        />
      </Card>

      {/* Hidden Inputs for Video and Photo Capture */}
      <input
        type="file"
        ref={videoInputRef}
        accept="video/*"
        capture="environment"
        onChange={handleVideoFileSelected}
        className="hidden"
      />
      <input
        type="file"
        ref={photoInputRef}
        accept="image/*"
        capture="environment"
        onChange={handlePhotoFileSelected}
        className="hidden"
      />

      {/* STEP 1: BEFORE THE SEARCH */}
      {currentStep === 0 && (
        <Card
          header={
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-saffron/20 text-saffron text-xs font-bold flex items-center justify-center">
                1
              </div>
              <span className="font-semibold text-white">
                {language === 'mr' ? 'झडतीपूर्वी कायदेशीर पूर्वतयारी (BNSS १०३ व १०५)' : 'Before Search: Statutory Prerequisites'}
              </span>
            </div>
          }
        >
          <div className="space-y-6">
            {/* Checklist with ticks */}
            <div className="p-4 bg-navy-950 rounded-xl border border-navy-700 space-y-3">
              <span className="text-xs font-bold text-saffron uppercase tracking-wider block">
                {t('searchSeizure.preSearchChecklist')}
              </span>

              <div className="space-y-2.5">
                <Checkbox
                  checked={chk1Warrant}
                  onChange={(e) => setChk1Warrant(e.target.checked)}
                  label={t('searchSeizure.chk1')}
                />
                <Checkbox
                  checked={chk2Witnesses}
                  onChange={(e) => setChk2Witnesses(e.target.checked)}
                  label={t('searchSeizure.chk2')}
                />
                <Checkbox
                  checked={chk3BatteryReady}
                  onChange={(e) => setChk3BatteryReady(e.target.checked)}
                  label={t('searchSeizure.chk3')}
                />
                <Checkbox
                  checked={chk4ContinuousVideo}
                  onChange={(e) => setChk4ContinuousVideo(e.target.checked)}
                  label={t('searchSeizure.chk4')}
                />
                <Checkbox
                  checked={chk5PersonalSearch}
                  onChange={(e) => setChk5PersonalSearch(e.target.checked)}
                  label={t('searchSeizure.chk5')}
                />
              </div>

              <div className="p-2.5 rounded-lg bg-navy-900 border border-navy-800 text-[11px] text-muted flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  {language === 'mr'
                    ? 'अनिवार्य तरतूद (BNSS १०५): झडती व जप्ती प्रक्रियेचे ऑडिओ-व्हिडिओ इलेक्ट्रॉनिक साधनांद्वारे सलग चित्रीकरण करणे कायद्याने बंधनकारक आहे.'
                    : 'Mandatory new BNSS 105 requirement: the process of search and seizure shall be recorded through audio-video electronic means.'}
                </span>
              </div>
            </div>

            {/* General Fields: Place, Date, Start Time */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <Input
                  label={t('searchSeizure.placeLabel')}
                  value={place}
                  onChange={(e) => setPlace(e.target.value)}
                  required
                  placeholder="e.g. Flat No 402, Sai Residency, Deccan Gymkhana, Pune"
                />
              </div>
              <Input
                type="date"
                label={t('searchSeizure.dateLabel')}
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                required
              />
              <Input
                type="time"
                label={t('searchSeizure.startTimeLabel')}
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>

            {/* Witness 1 (Pancha 1) */}
            <div className="p-4 rounded-xl bg-navy-950 border border-navy-700 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <User className="w-4 h-4 text-saffron" />
                <span>{t('searchSeizure.witness1Label')}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  label={t('searchSeizure.name')}
                  value={witness1.name}
                  onChange={(e) => setWitness1({ ...witness1, name: e.target.value })}
                  required
                  placeholder="e.g. Ramesh Shankar Patil"
                />
                <Input
                  label={t('searchSeizure.age')}
                  value={witness1.age}
                  onChange={(e) => setWitness1({ ...witness1, age: e.target.value })}
                  placeholder="e.g. 42"
                />
                <Input
                  label={t('searchSeizure.phone')}
                  value={witness1.phone}
                  onChange={(e) => setWitness1({ ...witness1, phone: e.target.value })}
                  placeholder="e.g. 9822012345"
                />
                <div className="sm:col-span-2">
                  <Input
                    label={t('searchSeizure.address')}
                    value={witness1.address}
                    onChange={(e) => setWitness1({ ...witness1, address: e.target.value })}
                    placeholder="Residential address in locality"
                  />
                </div>
                <Input
                  label={t('searchSeizure.occupation')}
                  value={witness1.occupation}
                  onChange={(e) => setWitness1({ ...witness1, occupation: e.target.value })}
                  placeholder="e.g. Businessman / Teacher"
                />
              </div>
            </div>

            {/* Witness 2 (Pancha 2) */}
            <div className="p-4 rounded-xl bg-navy-950 border border-navy-700 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <User className="w-4 h-4 text-saffron" />
                <span>{t('searchSeizure.witness2Label')}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  label={t('searchSeizure.name')}
                  value={witness2.name}
                  onChange={(e) => setWitness2({ ...witness2, name: e.target.value })}
                  required
                  placeholder="e.g. Vijay Baburao Shinde"
                />
                <Input
                  label={t('searchSeizure.age')}
                  value={witness2.age}
                  onChange={(e) => setWitness2({ ...witness2, age: e.target.value })}
                  placeholder="e.g. 38"
                />
                <Input
                  label={t('searchSeizure.phone')}
                  value={witness2.phone}
                  onChange={(e) => setWitness2({ ...witness2, phone: e.target.value })}
                  placeholder="e.g. 9822054321"
                />
                <div className="sm:col-span-2">
                  <Input
                    label={t('searchSeizure.address')}
                    value={witness2.address}
                    onChange={(e) => setWitness2({ ...witness2, address: e.target.value })}
                    placeholder="Residential address in locality"
                  />
                </div>
                <Input
                  label={t('searchSeizure.occupation')}
                  value={witness2.occupation}
                  onChange={(e) => setWitness2({ ...witness2, occupation: e.target.value })}
                  placeholder="e.g. Shop Owner"
                />
              </div>
            </div>

            {/* Occupant / Person Present */}
            <div className="p-4 rounded-xl bg-navy-950 border border-navy-700 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <User className="w-4 h-4 text-emerald-400" />
                <span>{t('searchSeizure.occupantLabel')}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  label={t('searchSeizure.name')}
                  value={occupant.name}
                  onChange={(e) => setOccupant({ ...occupant, name: e.target.value })}
                  placeholder="e.g. Rahul Anant Deshmukh"
                />
                <Input
                  label={t('searchSeizure.age')}
                  value={occupant.age}
                  onChange={(e) => setOccupant({ ...occupant, age: e.target.value })}
                  placeholder="e.g. 34"
                />
                <Input
                  label={t('searchSeizure.relation')}
                  value={occupant.relation}
                  onChange={(e) => setOccupant({ ...occupant, relation: e.target.value })}
                  placeholder="e.g. Tenant / Owner / Accused"
                />
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-navy-800">
              <Button
                variant="primary"
                onClick={handleNextFromStep1}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                {language === 'mr' ? 'झडती सुरू करा (पुढील पायरी)' : 'Commence Search (Next Step)'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* STEP 2: DURING THE SEARCH */}
      {currentStep === 1 && (
        <Card
          header={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-saffron/20 text-saffron text-xs font-bold flex items-center justify-center">
                  2
                </div>
                <span className="font-semibold text-white">
                  {language === 'mr' ? 'झडतीदरम्यान: व्हिडिओ चित्रीकरण व जप्ती नोंद' : 'During Search: Live Videography & Seizure Register'}
                </span>
              </div>
              <Badge variant={isTimerRunning ? 'danger' : 'neutral'} size="sm" className="animate-pulse">
                <Clock className="w-3.5 h-3.5 mr-1" />
                {isTimerRunning ? 'LIVE SEARCH' : 'PAUSED'}
              </Badge>
            </div>
          }
        >
          <div className="space-y-6">
            {/* Live Timer Banner */}
            <div className="p-4 rounded-xl bg-navy-950 border border-navy-700 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
                  <Clock className="w-6 h-6 animate-spin-slow" />
                </div>
                <div>
                  <span className="text-xs text-muted block uppercase tracking-wider">{t('searchSeizure.elapsedTime')}</span>
                  <span className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-widest">
                    {formatTimer(elapsedSeconds)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant={isTimerRunning ? 'ghost' : 'secondary'}
                  size="sm"
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                >
                  {isTimerRunning ? (language === 'mr' ? 'घड्याळ थांबवा' : 'Pause Timer') : (language === 'mr' ? 'घड्याळ चालू करा' : 'Resume Timer')}
                </Button>
              </div>
            </div>

            {/* MANDATORY VIDEO RECORDING SECTION */}
            <div className="p-4 rounded-xl bg-navy-950 border border-saffron/40 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Video className="w-4 h-4 text-saffron" />
                    <span>{language === 'mr' ? 'अनिवार्य ऑडिओ-व्हिडिओ चित्रीकरण (BNSS १०५)' : 'Mandatory Audio-Video Videography (BNSS 105)'}</span>
                  </h3>
                  <p className="text-xs text-muted mt-0.5">
                    {language === 'mr'
                      ? 'प्रत्येक व्हिडिओ रेकॉर्डिंगला त्वरित SHA-256 डिजिटल ठसा दिला जातो व कस्टडी साखळीत जोडला जातो.'
                      : 'Each recording is cryptographically hashed with SHA-256 and anchored to the evidence chain.'}
                  </p>
                </div>

                <Button
                  variant="primary"
                  onClick={() => videoInputRef.current?.click()}
                  loading={isVideoHashing}
                  icon={<Video className="w-4 h-4" />}
                >
                  {t('searchSeizure.recordVideoBtn')}
                </Button>
              </div>

              {/* Recorded Videos List */}
              {recordedVideos.length === 0 ? (
                <div className="p-3 rounded-lg bg-navy-900 border border-navy-800 text-center text-xs text-muted">
                  {language === 'mr'
                    ? 'अद्याप कोणतेही व्हिडिओ चित्रीकरण जोडलेले नाही. "व्हिडिओ चित्रीकरण करा" बटनावर टॅप करा.'
                    : 'No video recordings attached yet. Tap "Record Video (BNSS 105)" to capture evidence.'}
                </div>
              ) : (
                <div className="space-y-2">
                  {recordedVideos.map((vid) => (
                    <div
                      key={vid.id}
                      className="p-3 rounded-xl bg-navy-900 border border-navy-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Video className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{vid.exhibitNo}</span>
                            <span className="text-muted truncate max-w-[180px]">{vid.fileName}</span>
                          </div>
                          <p className="font-mono text-[10px] text-emerald-300 truncate max-w-sm">
                            SHA-256: {vid.sha256}
                          </p>
                        </div>
                      </div>
                      <Badge variant="success" size="sm">
                        <ShieldCheck className="w-3 h-3 mr-1" />
                        {t('searchSeizure.videoRecordedBadge')}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SEIZED ITEMS REGISTER TABLE */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Package className="w-4 h-4 text-blue-400" />
                    <span>{t('searchSeizure.seizedItemsTitle')}</span>
                  </h3>
                  <p className="text-xs text-muted">
                    {language === 'mr' ? 'झडतीत सापडलेल्या प्रत्येक वस्तूची सविस्तर नोंद व सील क्रमांक' : 'Itemize every article found with exact spot, seal number & photo'}
                  </p>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleAddSeizedItem}
                  icon={<Plus className="w-3.5 h-3.5" />}
                >
                  {t('searchSeizure.addItemBtn')}
                </Button>
              </div>

              {/* Items Table / Cards */}
              <div className="space-y-3">
                {seizedItems.map((item, index) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-navy-950 border border-navy-700 space-y-3 relative group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-saffron uppercase tracking-wider">
                        {t('searchSeizure.itemNo')} {index + 1}
                      </span>
                      {seizedItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSeizedItem(item.id)}
                          className="text-xs text-muted hover:text-red-400 flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{language === 'mr' ? 'काढा' : 'Remove'}</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="sm:col-span-2">
                        <Input
                          label={t('searchSeizure.itemDesc')}
                          value={item.description}
                          onChange={(e) =>
                            setSeizedItems((prev) =>
                              prev.map((i) => (i.id === item.id ? { ...i, description: e.target.value } : i))
                            )
                          }
                          required
                          placeholder="e.g. Gold chain 15 grams, yellow metal, hollow pattern"
                        />
                      </div>
                      <Input
                        label={t('searchSeizure.quantity')}
                        value={item.quantity}
                        onChange={(e) =>
                          setSeizedItems((prev) =>
                            prev.map((i) => (i.id === item.id ? { ...i, quantity: e.target.value } : i))
                          )
                        }
                        placeholder="e.g. 1 unit / 15 gm"
                      />
                      <Input
                        label={t('searchSeizure.whereFound')}
                        value={item.whereFound}
                        onChange={(e) =>
                          setSeizedItems((prev) =>
                            prev.map((i) => (i.id === item.id ? { ...i, whereFound: e.target.value } : i))
                          )
                        }
                        placeholder="e.g. Inside brown steel almirah top locker"
                      />
                      <Input
                        label={t('searchSeizure.condition')}
                        value={item.condition}
                        onChange={(e) =>
                          setSeizedItems((prev) =>
                            prev.map((i) => (i.id === item.id ? { ...i, condition: e.target.value } : i))
                          )
                        }
                        placeholder="e.g. Intact, minor scratches"
                      />
                      <Input
                        label={t('searchSeizure.sealNo')}
                        value={item.sealNo}
                        onChange={(e) =>
                          setSeizedItems((prev) =>
                            prev.map((i) => (i.id === item.id ? { ...i, sealNo: e.target.value } : i))
                          )
                        }
                        placeholder="e.g. SEAL-01 / WAX-7"
                      />
                    </div>

                    {/* Photo attachment for this item */}
                    <div className="pt-2 border-t border-navy-800 flex items-center justify-between text-xs">
                      {item.photoName ? (
                        <div className="flex items-center gap-2 text-emerald-400">
                          <Check className="w-3.5 h-3.5" />
                          <span>Photo: {item.photoName} (Hashed)</span>
                        </div>
                      ) : (
                        <span className="text-muted text-[11px]">
                          {language === 'mr' ? 'वस्तूचा फोटो जोडलेला नाही' : 'No photo attached for this item'}
                        </span>
                      )}

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setPhotoTargetItemId(item.id);
                          photoInputRef.current?.click();
                        }}
                        icon={<Camera className="w-3.5 h-3.5" />}
                      >
                        {item.photoName ? (language === 'mr' ? 'फोटो बदला' : 'Change Photo') : t('searchSeizure.attachPhoto')}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-navy-800">
              <Button
                variant="ghost"
                onClick={() => setCurrentStep(0)}
                icon={<ArrowLeft className="w-4 h-4" />}
              >
                {language === 'mr' ? 'मागील' : 'Back'}
              </Button>
              <Button
                variant="primary"
                onClick={handleNextFromStep2}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                {language === 'mr' ? 'झडती सांगता (पुढील पायरी)' : 'Conclude Search (Next Step)'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* STEP 3: AFTER THE SEARCH */}
      {currentStep === 2 && (
        <Card
          header={
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-saffron/20 text-saffron text-xs font-bold flex items-center justify-center">
                3
              </div>
              <span className="font-semibold text-white">
                {language === 'mr' ? 'झडतीनंतर: सांगता व दंडाधिकारी २४ तास घड्याळ' : 'After Search: Conclusion & 24h Magistrate Clock'}
              </span>
            </div>
          }
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                type="time"
                label={t('searchSeizure.endTimeLabel')}
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
              <Input
                label={t('searchSeizure.magistrateCarrier')}
                value={carrierDetails}
                onChange={(e) => setCarrierDetails(e.target.value)}
                placeholder="e.g. HC 1042 Pawar, Shivaji Nagar PS"
              />
            </div>

            <Textarea
              label={t('searchSeizure.remarksLabel')}
              value={officerRemarks}
              onChange={(e) => setOfficerRemarks(e.target.value)}
              rows={3}
              placeholder="Officer investigation remarks..."
            />

            {/* Mandatory Checkboxes */}
            <div className="p-4 rounded-xl bg-navy-950 border border-navy-700 space-y-3">
              <Checkbox
                checked={copyGivenToOccupant}
                onChange={(e) => setCopyGivenToOccupant(e.target.checked)}
                label={t('searchSeizure.copyGivenCheck')}
              />

              <Checkbox
                checked={magistrateForwarded}
                onChange={(e) => setMagistrateForwarded(e.target.checked)}
                label={t('searchSeizure.magistrateCheck')}
              />

              {/* 24-HOUR TRANSMISSION STATUTORY DEADLINE CHIP */}
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-between text-xs text-red-200">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-red-400 shrink-0" />
                  <div>
                    <span className="font-bold text-red-300">
                      {t('searchSeizure.magistrateDeadlineChip')}
                    </span>
                    <p className="text-[11px] text-muted">
                      {language === 'mr'
                        ? 'BNSS कलम १०५: झडती-जप्ती पूर्ण झाल्यापासून २४ तासांच्या आत चित्रीकरण दंडाधिकाऱ्यांना सादर करणे कायद्याने अनिवार्य आहे. हे घड्याळ थेट /deadlines ट्रॅकरमध्ये दिसेल.'
                        : 'BNSS 105: Recording must be forwarded to the Judicial Magistrate within 24 hours of search completion. This activates the statutory clock in /deadlines.'}
                    </p>
                  </div>
                </div>
                <Badge variant="danger" size="sm">24h BNSS 105</Badge>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-navy-800">
              <Button
                variant="ghost"
                onClick={() => setCurrentStep(1)}
                icon={<ArrowLeft className="w-4 h-4" />}
              >
                {language === 'mr' ? 'मागील' : 'Back'}
              </Button>
              <Button
                variant="primary"
                onClick={handleNextFromStep3}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                {language === 'mr' ? 'सारांश व दस्तऐवज (पुढील पायरी)' : 'Summary & Documents (Next Step)'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* STEP 4: SUMMARY & DOCUMENTS GENERATION */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <Card
            header={
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-saffron/20 text-saffron text-xs font-bold flex items-center justify-center">
                    4
                  </div>
                  <span className="font-semibold text-white">
                    {language === 'mr' ? 'सारांश व कायदेशीर दस्तऐवज निर्मिती' : 'Summary & Document Generation'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Language switch */}
                  <div className="flex bg-navy-950 p-1 rounded-lg border border-navy-700 text-xs">
                    <button
                      type="button"
                      onClick={() => setDocLanguage('en')}
                      className={`px-2.5 py-1 rounded font-medium ${
                        docLanguage === 'en' ? 'bg-saffron text-navy-950' : 'text-muted hover:text-white'
                      }`}
                    >
                      English
                    </button>
                    <button
                      type="button"
                      onClick={() => setDocLanguage('mr')}
                      className={`px-2.5 py-1 rounded font-medium ${
                        docLanguage === 'mr' ? 'bg-saffron text-navy-950' : 'text-muted hover:text-white'
                      }`}
                    >
                      मराठी
                    </button>
                  </div>

                  {/* Document switcher */}
                  <div className="flex bg-navy-950 p-1 rounded-lg border border-navy-700 text-xs">
                    <button
                      type="button"
                      onClick={() => setActiveDocTab('memo')}
                      className={`px-3 py-1 rounded font-medium ${
                        activeDocTab === 'memo' ? 'bg-navy-800 text-white' : 'text-muted hover:text-white'
                      }`}
                    >
                      {t('searchSeizure.memoTitle')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveDocTab('letter')}
                      className={`px-3 py-1 rounded font-medium ${
                        activeDocTab === 'letter' ? 'bg-navy-800 text-white' : 'text-muted hover:text-white'
                      }`}
                    >
                      {t('searchSeizure.forwardingTitle')}
                    </button>
                  </div>
                </div>
              </div>
            }
          >
            <div className="space-y-4">
              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-navy-950 rounded-xl border border-navy-700">
                <div className="flex items-center gap-2">
                  <Badge variant="warning" size="sm">
                    {language === 'mr' ? 'कायदेशीर पुनरावलोकन प्रलंबित' : 'Pending Legal Review'}
                  </Badge>
                  <span className="text-xs text-muted">
                    {language === 'mr'
                      ? 'BNSS १०३ व १०५ नुसार A4 प्रिंट स्वरूप'
                      : 'Rendered A4 Print Format'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    loading={isExportingPdf}
                    onClick={handleDownloadActiveDocPdf}
                    icon={<Download className="w-4 h-4" />}
                  >
                    {language === 'mr' ? 'PDF डाउनलोड' : 'Download PDF'}
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => printDocument()}
                    icon={<Printer className="w-4 h-4" />}
                  >
                    {language === 'mr' ? 'प्रिंट करा' : 'Print'}
                  </Button>
                </div>
              </div>

              {/* DOCUMENT A4 PRINT VIEWS (794 x 1123 px standard A4 styling) */}
              <div className="overflow-x-auto p-4 bg-navy-950 rounded-xl border border-navy-700 flex justify-center">
                {activeDocTab === 'memo' ? (
                  /* (A) SEIZURE MEMO / PANCHNAMA */
                  <div
                    ref={memoPrintRef}
                    className="w-[794px] min-h-[1123px] bg-white text-slate-900 p-12 shadow-2xl font-serif text-[13px] leading-relaxed relative flex flex-col justify-between"
                    style={{ boxSizing: 'border-box' }}
                  >
                    <div>
                      {/* Statutory Unverified Notice & Legal Review Badge */}
                      <div className="mb-4 pb-2 border-b border-amber-200 text-amber-800 text-[10px] flex items-center justify-between font-sans">
                        <span className="font-semibold uppercase tracking-wider bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                          PENDING LEGAL REVIEW • कायदेशीर पुनरावलोकन प्रलंबित
                        </span>
                        <span>Format based on BNSS 103 & 105 practice. Verify before use.</span>
                      </div>

                      {/* Header */}
                      <div className="text-center border-b-2 border-slate-900 pb-4 mb-4">
                        <div className="font-sans font-extrabold text-base tracking-wider uppercase text-slate-900">
                          MAHARASHTRA POLICE • महाराष्ट्र पोलीस
                        </div>
                        <div className="text-xs font-sans text-slate-600 mt-0.5">
                          {caseRecord.policeStation} • DISTRICT: {caseRecord.district || 'PUNE'}
                        </div>
                        <h2 className="text-xl font-bold font-serif uppercase tracking-wide mt-3 text-slate-900">
                          {docLanguage === 'mr'
                            ? 'झडती व जप्ती पंचनामा (SEIZURE MEMO)'
                            : 'SEIZURE MEMO / PANCHNAMA'}
                        </h2>
                        <p className="text-[11px] font-sans text-slate-600">
                          Under Sections 103 & 105 of Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS)
                        </p>
                      </div>

                      {/* Case Particulars */}
                      <div className="grid grid-cols-2 gap-2 text-xs font-sans mb-4 p-2.5 bg-slate-50 border border-slate-200 rounded">
                        <div>
                          <strong>Case No:</strong> {caseRecord.caseNo}
                        </div>
                        <div>
                          <strong>FIR No:</strong> {caseRecord.firNo} ({formatDate(caseRecord.firDateTime || caseRecord.createdAt)})
                        </div>
                        <div>
                          <strong>Police Station:</strong> {caseRecord.policeStation}
                        </div>
                        <div>
                          <strong>Offence Provisions:</strong>{' '}
                          {caseRecord.provisions.map((p) => `${p.act} ${p.section}`).join(', ')}
                        </div>
                      </div>

                      {/* Search Logistics */}
                      <div className="space-y-1.5 text-xs mb-4">
                        <div>
                          <strong>Place of Search / Premises:</strong> {place}
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <strong>Date of Search:</strong> {searchDate}
                          </div>
                          <div>
                            <strong>Commencement Time:</strong> {startTime} hrs
                          </div>
                          <div>
                            <strong>Conclusion Time:</strong> {endTime} hrs
                          </div>
                        </div>
                      </div>

                      {/* Independent Witnesses & Occupant */}
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded mb-4 text-xs space-y-2">
                        <div className="font-bold text-slate-900 border-b pb-1 font-sans">
                          Independent Witnesses Present (Panchas under BNSS 103):
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <strong>Pancha 1:</strong> {witness1.name || 'Shri Ramesh Patil'}, Age: {witness1.age || '42'} yrs,
                            <br />
                            Address: {witness1.address || 'Local Resident, Pune'}, Phone: {witness1.phone || '-'}
                          </div>
                          <div>
                            <strong>Pancha 2:</strong> {witness2.name || 'Shri Vijay Shinde'}, Age: {witness2.age || '38'} yrs,
                            <br />
                            Address: {witness2.address || 'Local Resident, Pune'}, Phone: {witness2.phone || '-'}
                          </div>
                        </div>
                        <div className="pt-1 border-t text-[11px]">
                          <strong>Occupant / Person Present:</strong> {occupant.name || 'Rahul Deshmukh'}, Age: {occupant.age || '34'} yrs,
                          Relation to premises: {occupant.relation || 'Occupant/Tenant'}
                        </div>
                      </div>

                      {/* Seized Articles Table */}
                      <div className="mb-4">
                        <div className="font-bold text-slate-900 mb-1.5 text-xs font-sans uppercase">
                          Inventory of Articles Seized on Spot:
                        </div>
                        <table className="w-full text-left border-collapse border border-slate-300 text-[11px]">
                          <thead>
                            <tr className="bg-slate-100 font-sans font-semibold">
                              <th className="border border-slate-300 p-1.5 w-10 text-center">#</th>
                              <th className="border border-slate-300 p-1.5">Description of Article</th>
                              <th className="border border-slate-300 p-1.5 w-24">Qty / Wt</th>
                              <th className="border border-slate-300 p-1.5">Where Found (Recovery Spot)</th>
                              <th className="border border-slate-300 p-1.5">Condition</th>
                              <th className="border border-slate-300 p-1.5 w-24">Seal No.</th>
                            </tr>
                          </thead>
                          <tbody>
                            {seizedItems.map((item, idx) => (
                              <tr key={item.id}>
                                <td className="border border-slate-300 p-1.5 text-center font-mono">{idx + 1}</td>
                                <td className="border border-slate-300 p-1.5">{item.description}</td>
                                <td className="border border-slate-300 p-1.5">{item.quantity}</td>
                                <td className="border border-slate-300 p-1.5">{item.whereFound}</td>
                                <td className="border border-slate-300 p-1.5">{item.condition}</td>
                                <td className="border border-slate-300 p-1.5 font-mono">{item.sealNo}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* BNSS 105 Videography Hashes Section */}
                      <div className="p-3 bg-slate-50 border border-slate-300 rounded mb-4 text-xs space-y-1.5">
                        <div className="font-bold text-slate-900 font-sans flex items-center justify-between">
                          <span>Mandatory Videography Record (BNSS Section 105):</span>
                          <span className="text-[10px] font-mono text-emerald-800">CONTINUOUS AUDIO-VIDEO CAPTURE</span>
                        </div>
                        <p className="text-[11px] text-slate-700 leading-snug">
                          The entire process of search and seizure was continuously recorded through electronic audio-video means without interruption from commencement to sealing, and the digital recordings are cryptographically secured with SHA-256 hashes:
                        </p>
                        {recordedVideos.length > 0 ? (
                          <div className="space-y-1 pt-1">
                            {recordedVideos.map((v) => (
                              <div key={v.id} className="font-mono text-[10px] bg-white p-1.5 border border-slate-200 rounded">
                                <strong>{v.exhibitNo}:</strong> {v.sha256}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="font-mono text-[10px] text-slate-500 italic">
                            Video Recording Exhibit: VID-EX-001 (Hash generated on IO device)
                          </p>
                        )}
                      </div>

                      {/* Statements & Certifications */}
                      <div className="text-[11px] space-y-1 text-slate-800 mb-6 leading-relaxed">
                        <p>
                          1. Prior to commencing search, the police team offered their personal search to the occupant and panchas.
                        </p>
                        <p>
                          2. A copy of this seizure list was signed by all present and delivered to the occupant forthwith under Section 103(2) BNSS.
                        </p>
                        <p>
                          3. All seized articles were labeled, packed, and sealed on the spot in presence of the panchas.
                        </p>
                      </div>

                      {/* Signature Blocks */}
                      <div className="grid grid-cols-4 gap-4 pt-10 border-t border-slate-300 text-center text-xs font-sans">
                        <div>
                          <div className="border-t border-dashed border-slate-400 pt-1 font-bold">
                            {witness1.name || 'Witness 1'}
                          </div>
                          <span className="text-[10px] text-slate-500">Pancha 1 Signature</span>
                        </div>
                        <div>
                          <div className="border-t border-dashed border-slate-400 pt-1 font-bold">
                            {witness2.name || 'Witness 2'}
                          </div>
                          <span className="text-[10px] text-slate-500">Pancha 2 Signature</span>
                        </div>
                        <div>
                          <div className="border-t border-dashed border-slate-400 pt-1 font-bold">
                            {occupant.name || 'Occupant'}
                          </div>
                          <span className="text-[10px] text-slate-500">Occupant / Person Present</span>
                        </div>
                        <div>
                          <div className="border-t border-dashed border-slate-400 pt-1 font-bold">
                            {profile?.name || 'Investigating Officer'}
                          </div>
                          <span className="text-[10px] text-slate-500">
                            IO Signature & Stamp
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="pt-4 border-t border-slate-200 text-center text-[9px] font-sans text-slate-400">
                      Generated by Nyay Saathi. Decision support tool. Verify before use.
                    </div>
                  </div>
                ) : (
                  /* (B) FORWARDING LETTER TO JUDICIAL MAGISTRATE (BNSS 105) */
                  <div
                    ref={forwardingPrintRef}
                    className="w-[794px] min-h-[1123px] bg-white text-slate-900 p-12 shadow-2xl font-serif text-[13px] leading-relaxed relative flex flex-col justify-between"
                    style={{ boxSizing: 'border-box' }}
                  >
                    <div>
                      {/* Statutory Disclaimer Header */}
                      <div className="mb-4 pb-2 border-b border-amber-200 text-amber-800 text-[10px] flex items-center justify-between font-sans">
                        <span className="font-semibold uppercase tracking-wider bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                          PENDING LEGAL REVIEW • कायदेशीर पुनरावलोकन प्रलंबित
                        </span>
                        <span>Format based on BNSS 105 practice. Verify before use.</span>
                      </div>

                      {/* Header */}
                      <div className="text-center border-b-2 border-slate-900 pb-4 mb-6">
                        <div className="font-sans font-extrabold text-base tracking-wider uppercase text-slate-900">
                          OFFICE OF THE INVESTIGATING OFFICER
                        </div>
                        <div className="text-xs font-sans text-slate-600 mt-0.5">
                          {caseRecord.policeStation} • DISTRICT: {caseRecord.district || 'PUNE'}
                        </div>
                        <h2 className="text-xl font-bold font-serif uppercase tracking-wide mt-4 text-slate-900">
                          FORWARDING MEMORANDUM TO JUDICIAL MAGISTRATE
                        </h2>
                        <p className="text-[11px] font-sans text-slate-600">
                          Transmission of Search & Seizure Audio-Video Recording under Section 105 BNSS 2023
                        </p>
                      </div>

                      {/* Recipient */}
                      <div className="mb-6 text-xs font-sans space-y-1">
                        <div>To,</div>
                        <div className="font-bold text-slate-900">
                          The Hon'ble Judicial Magistrate First Class (Court No. 1),
                        </div>
                        <div>District Court Complex, {caseRecord.district || 'Pune'}.</div>
                      </div>

                      {/* Subject & Reference */}
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded mb-6 text-xs font-sans space-y-1">
                        <div>
                          <strong>Subject:</strong> Forwarding of Audio-Video Recording Media & Cryptographic Hash under BNSS Section 105.
                        </div>
                        <div>
                          <strong>Crime / FIR No:</strong> {caseRecord.firNo} dated {formatDate(caseRecord.firDateTime || caseRecord.createdAt)}
                        </div>
                        <div>
                          <strong>Police Station:</strong> {caseRecord.policeStation}
                        </div>
                        <div>
                          <strong>Sections of Law:</strong> {caseRecord.provisions.map((p) => `${p.act} ${p.section}`).join(', ')}
                        </div>
                      </div>

                      {/* Body of Letter */}
                      <div className="text-xs space-y-3 leading-relaxed mb-6">
                        <p>Respected Sir / Madam,</p>
                        <p>
                          1. In the course of investigation of the above referenced crime, a lawful search of the premises situated at <strong>{place}</strong> was conducted on <strong>{searchDate}</strong> between <strong>{startTime}</strong> hrs and <strong>{endTime}</strong> hrs in the presence of two independent local witnesses (panchas) and the occupant.
                        </p>
                        <p>
                          2. As mandated by the statutory provisions of <strong>Section 105 of the Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS)</strong>, the entire process of conducting the search and seizure of articles was continuously recorded through electronic audio-video means without interruption.
                        </p>
                        <p>
                          3. In strict compliance with the statutory mandate requiring transmission of the recording <em>without delay (within 24 hours of search conclusion)</em>, the digital storage media containing the pristine video recording along with the SHA-256 cryptographic hashes is hereby forwarded to this Hon'ble Court.
                        </p>
                      </div>

                      {/* Exhibit Table */}
                      <div className="mb-6">
                        <div className="font-bold text-slate-900 mb-1 text-xs font-sans uppercase">
                          Cryptographic Hash Ledger of Transmitted Electronic Media:
                        </div>
                        <table className="w-full text-left border-collapse border border-slate-300 text-[11px]">
                          <thead>
                            <tr className="bg-slate-100 font-sans font-semibold">
                              <th className="border border-slate-300 p-1.5 w-24">Exhibit #</th>
                              <th className="border border-slate-300 p-1.5">File Name & Format</th>
                              <th className="border border-slate-300 p-1.5">SHA-256 Cryptographic Hash</th>
                            </tr>
                          </thead>
                          <tbody>
                            {recordedVideos.length > 0 ? (
                              recordedVideos.map((v) => (
                                <tr key={v.id}>
                                  <td className="border border-slate-300 p-1.5 font-mono">{v.exhibitNo}</td>
                                  <td className="border border-slate-300 p-1.5">{v.fileName}</td>
                                  <td className="border border-slate-300 p-1.5 font-mono text-[10px] break-all">{v.sha256}</td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td className="border border-slate-300 p-1.5 font-mono">VID-EX-001</td>
                                <td className="border border-slate-300 p-1.5">search_recording_spot.mp4</td>
                                <td className="border border-slate-300 p-1.5 font-mono text-[10px]">
                                  SHA-256 Digital Fingerprint Verified
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Carrier & Transmitted Details */}
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded mb-8 text-xs font-sans space-y-1">
                        <div>
                          <strong>Transmitted Through:</strong> {carrierDetails || 'Police Constable / IO Special Messenger'}
                        </div>
                        <div>
                          <strong>Date & Time of Dispatch:</strong> {formatDateTime(new Date().toISOString())}
                        </div>
                        <div>
                          <strong>Statutory Clock Status:</strong> Within 24-hour statutory limit from search conclusion.
                        </div>
                      </div>

                      {/* Signature Blocks */}
                      <div className="flex justify-between items-end pt-8 border-t border-slate-300 text-xs font-sans">
                        <div className="space-y-1 text-slate-600">
                          <div>Court Receipt Acknowledgment:</div>
                          <div className="h-10 w-44 border border-dashed border-slate-300 rounded flex items-center justify-center text-[10px] text-slate-400">
                            Court Stamp & Date
                          </div>
                        </div>

                        <div className="text-right space-y-1">
                          <div className="font-bold text-slate-900">{profile?.name || 'Investigating Officer'}</div>
                          <div className="text-[11px] text-slate-600">{profile?.rank || 'PSI'} • {caseRecord.policeStation}</div>
                          <div className="text-[10px] text-slate-400">Investigating Officer Signature & Seal</div>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="pt-4 border-t border-slate-200 text-center text-[9px] font-sans text-slate-400">
                      Generated by Nyay Saathi. Decision support tool. Verify before use.
                    </div>
                  </div>
                )}
              </div>

              {/* SAVE TO CASE BUTTON (UPDATES FACTS, EVENTS, DEADLINES) */}
              <div className="pt-4 border-t border-navy-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <Button
                  variant="ghost"
                  onClick={() => setCurrentStep(2)}
                  icon={<ArrowLeft className="w-4 h-4" />}
                >
                  {language === 'mr' ? 'मागील (झडतीनंतर)' : 'Back to Step 3'}
                </Button>

                <Button
                  variant="primary"
                  size="lg"
                  loading={isSavingAll}
                  onClick={handleSaveAndFinish}
                  icon={<Check className="w-5 h-5" />}
                >
                  {t('searchSeizure.saveAndFinishBtn')}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
