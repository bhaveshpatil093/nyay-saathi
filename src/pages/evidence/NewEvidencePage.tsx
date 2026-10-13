import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Camera,
  Video,
  FileText,
  Upload,
  Copy,
  Check,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  MapPin,
  Clock,
  User,
  HardDrive,
  CheckCircle2,
  FileCheck2,
  Plus,
  ArrowLeft,
  Search,
  ExternalLink,
  Lock,
  Unlock,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  useLiveData,
  listCases,
  listEvidenceByCase,
  listAllEvidence,
  getProfile,
  createEvidence,
  addAuditLog,
} from '../../lib/db/index.ts';
import { appendCustodyEntry } from '../../lib/custody/index.ts';
import { CaseRecord, EvidenceRecord } from '../../types/database.ts';
import { useI18n, formatDateTime, formatDate } from '../../i18n/index.ts';
import { useToast } from '../../components/ui/Toast.tsx';
import {
  Card,
  Button,
  Badge,
  Input,
  Textarea,
  ConfirmDialog,
  ProgressBar,
} from '../../components/ui/index.ts';

// Helper to format SHA-256 in blocks of 8 characters
export function formatHashBlocks(hash: string): string {
  if (!hash) return '';
  return hash.match(/.{1,8}/g)?.join(' ') || hash;
}

// Format file size
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export const NewEvidencePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialCaseId = searchParams.get('caseId') || '';
  const { t, language } = useI18n();
  const { success, error, info } = useToast();

  // Hidden file inputs
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const phonePickerRef = useRef<HTMLInputElement>(null);
  const filePickerRef = useRef<HTMLInputElement>(null);

  // Cases and profile data
  const { data: cases = [], loading: loadingCases } = useLiveData<CaseRecord[]>(
    () => listCases('all'),
    ['cases']
  );
  const { data: profile } = useLiveData(() => getProfile(), ['profile']);
  const { data: allExistingEvidence = [] } = useLiveData<EvidenceRecord[]>(
    () => listAllEvidence(),
    ['evidence']
  );

  // Form states
  const [selectedCaseId, setSelectedCaseId] = useState<string>(initialCaseId);
  const [caseSearchQuery, setCaseSearchQuery] = useState<string>('');
  const [isChangingCase, setIsChangingCase] = useState<boolean>(!initialCaseId);

  // File & Hashing states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isHashing, setIsHashing] = useState<boolean>(false);
  const [hashingProgress, setHashingProgress] = useState<number>(0);
  const [computedSha256, setComputedSha256] = useState<string>('');
  const [copiedHash, setCopiedHash] = useState<boolean>(false);

  // 100MB Warning confirmation dialog
  const [showLargeFileConfirm, setShowLargeFileConfirm] = useState<boolean>(false);
  const [pendingLargeFile, setPendingLargeFile] = useState<File | null>(null);

  // Duplicate Check
  const [duplicateEvidence, setDuplicateEvidence] = useState<EvidenceRecord | null>(null);

  // Metadata & Details form
  const [description, setDescription] = useState<string>('');
  const [source, setSource] = useState<string>('');
  const [exhibitNo, setExhibitNo] = useState<string>('');
  const [handlerName, setHandlerName] = useState<string>('');
  const [isSealed, setIsSealed] = useState<boolean>(true);

  // Geolocation
  const [geoLoc, setGeoLoc] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const [locLoading, setLocLoading] = useState<boolean>(false);
  const [locError, setLocError] = useState<string | null>(null);

  // Submission & Success state
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedEvidence, setSavedEvidence] = useState<EvidenceRecord | null>(null);

  // Pre-fill handler name from profile
  useEffect(() => {
    if (profile?.name && !handlerName) {
      setHandlerName(`${profile.rank ? profile.rank + ' ' : ''}${profile.name}`);
    }
  }, [profile, handlerName]);

  // Set default case if only one exists or URL param
  useEffect(() => {
    if (initialCaseId && cases.some((c) => c.id === initialCaseId)) {
      setSelectedCaseId(initialCaseId);
      setIsChangingCase(false);
    } else if (!selectedCaseId && cases.length > 0) {
      setSelectedCaseId(cases[0].id);
      setIsChangingCase(false);
    }
  }, [cases, initialCaseId, selectedCaseId]);

  // Auto-generate exhibit number based on current case exhibits count
  useEffect(() => {
    if (!selectedCaseId) return;
    const caseEv = allExistingEvidence.filter((e) => e.caseId === selectedCaseId);
    const nextNum = caseEv.length + 1;
    const formatted = `EX-${String(nextNum).padStart(3, '0')}`;
    setExhibitNo(formatted);
  }, [selectedCaseId, allExistingEvidence]);

  // Selected Case Object
  const selectedCase = useMemo(() => {
    return cases.find((c) => c.id === selectedCaseId) || null;
  }, [cases, selectedCaseId]);

  // Filtered cases for search picker
  const filteredCases = useMemo(() => {
    const q = caseSearchQuery.trim().toLowerCase();
    if (!q) return cases;
    return cases.filter(
      (c) =>
        c.caseNo.toLowerCase().includes(q) ||
        c.firNo.toLowerCase().includes(q) ||
        c.policeStation.toLowerCase().includes(q) ||
        c.summary.toLowerCase().includes(q) ||
        c.accusedNames.some((a) => a.toLowerCase().includes(q))
    );
  }, [cases, caseSearchQuery]);

  // File Fingerprint calculation using Web Crypto subtle.digest
  const processAndHashFile = async (file: File) => {
    try {
      setSelectedFile(file);
      setIsHashing(true);
      setHashingProgress(20);
      setComputedSha256('');
      setDuplicateEvidence(null);

      // Read array buffer
      setHashingProgress(45);
      const buffer = await file.arrayBuffer();

      setHashingProgress(75);
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

      setHashingProgress(100);
      setComputedSha256(hashHex);
      setIsHashing(false);

      // Duplicate Check across all stored evidence
      const existingMatch = allExistingEvidence.find((ev) => ev.sha256.toLowerCase() === hashHex.toLowerCase());
      if (existingMatch) {
        setDuplicateEvidence(existingMatch);
      }
    } catch (err) {
      console.error('Error computing SHA-256 hash:', err);
      setIsHashing(false);
      error(language === 'mr' ? 'हॅश काढताना त्रुटी आली.' : 'Failed to compute SHA-256 fingerprint.');
    }
  };

  // Handle file selection from any source input
  const handleFileChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so re-selecting same file triggers change
    e.target.value = '';

    // Check if file > 100MB
    const ONE_HUNDRED_MB = 100 * 1024 * 1024;
    if (file.size > ONE_HUNDRED_MB) {
      setPendingLargeFile(file);
      setShowLargeFileConfirm(true);
      return;
    }

    processAndHashFile(file);
  };

  const handleConfirmLargeFile = () => {
    setShowLargeFileConfirm(false);
    if (pendingLargeFile) {
      processAndHashFile(pendingLargeFile);
      setPendingLargeFile(null);
    }
  };

  // Copy hash to clipboard
  const handleCopyHash = async () => {
    if (!computedSha256) return;
    try {
      await navigator.clipboard.writeText(computedSha256);
      setCopiedHash(true);
      success(language === 'mr' ? 'हॅश कॉपी केला!' : 'SHA-256 hash copied to clipboard');
      setTimeout(() => setCopiedHash(false), 2000);
    } catch {
      error(language === 'mr' ? 'कॉपी करता आले नाही' : 'Failed to copy hash');
    }
  };

  // Request GPS Location
  const handleRequestLocation = () => {
    if (!navigator.geolocation) {
      setLocError(language === 'mr' ? 'या डिव्हाइसवर GPS उपलब्ध नाही' : 'Geolocation is not supported on this device');
      return;
    }
    setLocLoading(true);
    setLocError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocLoading(false);
        setGeoLoc({
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
          accuracy: Math.round(pos.coords.accuracy),
        });
        success(language === 'mr' ? 'स्थान यशस्वीरीत्या जोडले गेले' : 'Location coordinates recorded');
      },
      (err) => {
        setLocLoading(false);
        let msg = language === 'mr' ? 'स्थान परवानगी नाकारली किंवा त्रुटी' : 'Location permission denied or unavailable';
        if (err.code === 1) {
          msg = language === 'mr' ? 'स्थान परवानगी नाकारली (Permission Denied)' : 'Location permission denied';
        } else if (err.code === 2) {
          msg = language === 'mr' ? 'स्थान शोधता आले नाही (Position Unavailable)' : 'Position unavailable';
        }
        setLocError(msg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Save Evidence
  const handleSaveEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaseId) {
      error(language === 'mr' ? 'कृपया गुन्हा निवडा' : 'Please select a case');
      return;
    }
    if (!selectedFile || !computedSha256) {
      error(language === 'mr' ? 'कृपया पुरावा फाइल निवडा' : 'Please provide and fingerprint an evidence file');
      return;
    }
    if (!description.trim()) {
      error(language === 'mr' ? 'कृपया पुराव्याचे वर्णन लिहा' : 'Please enter an evidence description');
      return;
    }
    if (!source.trim()) {
      error(language === 'mr' ? 'कृपया पुरावा कोठून मिळवला ते लिहा' : 'Please enter the source where evidence was obtained');
      return;
    }

    try {
      setIsSaving(true);
      const effectiveCase = selectedCase;
      const effectivePoliceStation = effectiveCase?.policeStation || 'Police Station';

      // 1. Store metadata and blob in IndexedDB
      const newEv = await createEvidence(
        {
          caseId: selectedCaseId,
          exhibitNo: exhibitNo.trim() || `EX-${Date.now().toString().slice(-4)}`,
          fileName: selectedFile.name,
          mimeType: selectedFile.type || 'application/octet-stream',
          size: selectedFile.size,
          lastModified: new Date(selectedFile.lastModified).toISOString(),
          sha256: computedSha256,
          algorithm: 'SHA-256',
          description: description.trim(),
          source: source.trim(),
          handlerName: handlerName.trim() || profile?.name || 'Investigating Officer',
          sealed: isSealed,
          deviceInfo: navigator.userAgent || 'Web Client',
          geo: geoLoc || undefined,
        },
        selectedFile
      );

      // 2. Create the first immutable custody log entry (Collected) anchored to evidence SHA-256
      await appendCustodyEntry({
        evidenceId: newEv.id,
        action: 'Collected',
        fromPerson: source.trim(),
        toPerson: handlerName.trim() || profile?.name || 'Investigating Officer',
        location: effectivePoliceStation,
        remarks: `Initial evidence collection and SHA-256 cryptographic logging. Exhibit: ${newEv.exhibitNo}.`,
        timestamp: new Date().toISOString(),
      });

      // 3. Write to auditLog
      await addAuditLog(
        'evidence_vault_logged',
        `Evidence ${newEv.exhibitNo} (${newEv.fileName}) hashed and registered into case ${effectiveCase?.caseNo || selectedCaseId}.`
      );

      setIsSaving(false);
      setSavedEvidence(newEv);
      success(language === 'mr' ? 'डिजिटल ठसा व पुरावा यशस्वीरीत्या नोंदवला!' : 'Fingerprint & digital evidence successfully recorded!');
    } catch (err) {
      console.error('Error saving evidence:', err);
      setIsSaving(false);
      error(language === 'mr' ? 'पुरावा जतन करताना त्रुटी आली' : 'Failed to save evidence and start custody chain');
    }
  };

  // Reset form to add another
  const handleResetForAnother = () => {
    setSelectedFile(null);
    setComputedSha256('');
    setDescription('');
    setSource('');
    setGeoLoc(null);
    setLocError(null);
    setSavedEvidence(null);
    setDuplicateEvidence(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Top Breadcrumb & Heading */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/evidence')}
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            {language === 'mr' ? 'पुरावा यादी' : 'Evidence List'}
          </Button>
          <div className="h-4 w-px bg-navy-700 hidden sm:block" />
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Camera className="w-5 h-5 text-saffron" />
              <span>{language === 'mr' ? 'नवीन डिजिटल पुरावा नोंदवा' : 'Record Digital Evidence'}</span>
            </h1>
            <p className="text-xs text-muted">
              {language === 'mr'
                ? 'BSA २०२३ कलम ६३ अंतर्गत अपरिवर्तनीय SHA-256 डिजिटल ठसा व ताबा साखळी'
                : 'Immutable SHA-256 fingerprint & chain of custody under BSA 2023 Sec 63'}
            </p>
          </div>
        </div>

        <Badge variant="success" size="sm" className="hidden sm:inline-flex">
          <ShieldCheck className="w-3.5 h-3.5 mr-1" />
          <span>{language === 'mr' ? '१००% स्थानिक व सुरक्षित' : '100% Offline Vault'}</span>
        </Badge>
      </div>

      {/* Simple One-line Hash definition as required */}
      <div className="p-3.5 rounded-xl bg-saffron/10 border border-saffron/30 text-saffron-300 text-xs sm:text-sm flex items-center gap-3">
        <Sparkles className="w-5 h-5 text-saffron shrink-0" />
        <span className="font-medium">
          {language === 'mr'
            ? 'डिजिटल ठसा (Hash): पुराव्याचा असा अद्वितीय संगणकीय ठसा, ज्यामध्ये एक पिक्सेल जरी बदलला, तरी हा ठसा लगेच बदलतो.'
            : 'A digital fingerprint: if even one pixel changes, the cryptographic fingerprint changes.'}
        </span>
      </div>

      {/* SUCCESS SCREEN */}
      {savedEvidence ? (
        <Card className="border-emerald-500/40 bg-navy-900/90 shadow-xl overflow-hidden animate-fade-in">
          <div className="p-6 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 mx-auto flex items-center justify-center">
              <ShieldCheck className="w-10 h-10 text-emerald-400" />
            </div>

            <div>
              <Badge variant="success" size="md" className="px-4 py-1.5 text-sm font-bold uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                {language === 'mr' ? 'डिजिटल ठसा नोंदवला (Fingerprint Recorded)' : 'Fingerprint Recorded'}
              </Badge>
              <h2 className="text-2xl font-bold text-white mt-3">{savedEvidence.exhibitNo}</h2>
              <p className="text-sm text-muted mt-1">{savedEvidence.fileName}</p>
            </div>

            {/* SHA-256 Monospace Block Grouped in 8s */}
            <div className="max-w-xl mx-auto bg-navy-950 p-4 rounded-xl border border-navy-700 text-left">
              <div className="flex items-center justify-between text-xs text-muted mb-1.5">
                <span className="font-semibold text-emerald-400">SHA-256 DIGITAL FINGERPRINT:</span>
                <button
                  type="button"
                  onClick={handleCopyHash}
                  className="flex items-center gap-1 text-saffron hover:underline text-[11px]"
                >
                  {copiedHash ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedHash ? (language === 'mr' ? 'कॉपी झाले' : 'Copied') : (language === 'mr' ? 'कॉपी करा' : 'Copy')}</span>
                </button>
              </div>
              <p className="font-mono text-xs sm:text-sm text-emerald-300 break-all leading-relaxed select-all">
                {formatHashBlocks(savedEvidence.sha256)}
              </p>
            </div>

            {/* Metadata Summary Chips */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs text-muted">
              <span className="px-3 py-1 rounded-lg bg-navy-800 border border-navy-700">
                {language === 'mr' ? 'आकार: ' : 'Size: '}
                <strong className="text-white">{formatBytes(savedEvidence.size)}</strong>
              </span>
              <span className="px-3 py-1 rounded-lg bg-navy-800 border border-navy-700">
                {language === 'mr' ? 'सील स्थिती: ' : 'Status: '}
                <strong className={savedEvidence.sealed ? 'text-amber-400' : 'text-blue-400'}>
                  {savedEvidence.sealed ? (language === 'mr' ? 'सील बंद (Sealed)' : 'Sealed') : (language === 'mr' ? 'खुल्या स्थितीत' : 'Unsealed')}
                </strong>
              </span>
              <span className="px-3 py-1 rounded-lg bg-navy-800 border border-navy-700">
                {language === 'mr' ? 'ताबा साखळी: ' : 'Custody: '}
                <strong className="text-emerald-400">{language === 'mr' ? 'नोंद १ सुरू' : 'Entry #1 Anchored'}</strong>
              </span>
            </div>

            {/* Prompt Required Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-navy-800">
              <Button
                variant="primary"
                onClick={() => navigate(`/evidence/${savedEvidence.id}`)}
                icon={<Clock className="w-4 h-4" />}
              >
                {language === 'mr' ? 'ताबा नोंद जोडा' : 'Add Custody Entry'}
              </Button>

              <Button
                variant="secondary"
                onClick={() =>
                  navigate(
                    `/documents?caseId=${savedEvidence.caseId}&evidenceId=${savedEvidence.id}&template=sec_63_bsa_certificate`
                  )
                }
                icon={<FileCheck2 className="w-4 h-4" />}
              >
                {language === 'mr' ? 'प्रमाणपत्र तयार करा' : 'Generate Certificate'}
              </Button>

              <Button
                variant="ghost"
                onClick={handleResetForAnother}
                icon={<Plus className="w-4 h-4" />}
              >
                {language === 'mr' ? 'आणखी पुरावा जोडा' : 'Add Another'}
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <form onSubmit={handleSaveEvidence} className="space-y-6">
          {/* STEP 1: PICK A CASE (REQUIRED) */}
          <Card
            header={
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-saffron/20 text-saffron text-xs font-bold flex items-center justify-center">
                    1
                  </div>
                  <span className="font-semibold text-white">
                    {language === 'mr' ? 'गुन्हा निवडा (प्रकरण निवड)' : 'Pick a Case (Required)'}
                  </span>
                </div>
                {selectedCase && !isChangingCase && (
                  <button
                    type="button"
                    onClick={() => setIsChangingCase(true)}
                    className="text-xs text-saffron hover:underline font-medium"
                  >
                    {language === 'mr' ? 'बदला' : 'Change Case'}
                  </button>
                )}
              </div>
            }
          >
            {isChangingCase || !selectedCase ? (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-muted absolute left-3 top-3.5" />
                  <input
                    type="text"
                    value={caseSearchQuery}
                    onChange={(e) => setCaseSearchQuery(e.target.value)}
                    placeholder={
                      language === 'mr'
                        ? 'गुन्हा क्र., एफआयआर क्र., किंवा आरोपीच्या नावाने शोधा...'
                        : 'Search by Case No, FIR No, or Accused name...'
                    }
                    className="w-full pl-9 pr-4 py-2.5 bg-navy-950 border border-navy-700 rounded-xl text-white text-sm focus:border-saffron focus:outline-none"
                  />
                </div>

                {cases.length === 0 ? (
                  <div className="text-center py-6 text-muted text-sm">
                    {language === 'mr' ? 'अद्याप कोणतेही गुन्हे नोंदवलेले नाहीत.' : 'No cases registered yet.'}{' '}
                    <Link to="/cases/new" className="text-saffron hover:underline">
                      {language === 'mr' ? 'नवीन गुन्हा नोंदवा' : 'Register a case first'}
                    </Link>
                  </div>
                ) : filteredCases.length === 0 ? (
                  <div className="text-center py-4 text-muted text-xs">
                    {language === 'mr' ? 'शोध निकषांनुसार गुन्हा सापडला नाही' : 'No matching cases found'}
                  </div>
                ) : (
                  <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                    {filteredCases.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => {
                          setSelectedCaseId(c.id);
                          setIsChangingCase(false);
                        }}
                        className={`p-3 rounded-xl border cursor-pointer transition-colors flex items-center justify-between ${
                          selectedCaseId === c.id
                            ? 'bg-saffron/10 border-saffron text-white'
                            : 'bg-navy-950/70 border-navy-700 text-slate-300 hover:bg-navy-800'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white">{c.caseNo}</span>
                            <Badge variant="info" size="sm">
                              {c.firNo}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted mt-0.5 line-clamp-1">{c.summary}</p>
                          <p className="text-[11px] text-muted font-mono mt-0.5">
                            {c.policeStation} • {c.accusedNames.join(', ')}
                          </p>
                        </div>
                        <Button variant={selectedCaseId === c.id ? 'primary' : 'ghost'} size="sm">
                          {selectedCaseId === c.id ? (language === 'mr' ? 'निवडलेले' : 'Selected') : (language === 'mr' ? 'निवडा' : 'Select')}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-navy-950 border border-navy-700 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-base">{selectedCase.caseNo}</span>
                    <Badge variant="info" size="sm">{selectedCase.firNo}</Badge>
                    <Badge variant="success" size="sm">{selectedCase.policeStation}</Badge>
                  </div>
                  <p className="text-xs text-muted mt-1">{selectedCase.summary}</p>
                  <p className="text-[11px] text-muted mt-0.5">
                    {language === 'mr' ? 'आरोपी: ' : 'Accused: '}
                    <span className="text-slate-200">{selectedCase.accusedNames.join(', ')}</span>
                  </p>
                </div>
                <Badge variant="neutral" size="sm">
                  {language === 'mr' ? 'गुन्हा जोडला' : 'Linked'}
                </Badge>
              </div>
            )}
          </Card>

          {/* STEP 2: CHOOSE EVIDENCE SOURCE */}
          <Card
            header={
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-saffron/20 text-saffron text-xs font-bold flex items-center justify-center">
                  2
                </div>
                <span className="font-semibold text-white">
                  {language === 'mr' ? 'पुराव्याचा स्रोत निवडा' : 'Choose Evidence Source'}
                </span>
              </div>
            }
          >
            {/* Hidden native input triggers */}
            <input
              type="file"
              ref={photoInputRef}
              accept="image/*"
              capture="environment"
              onChange={handleFileChosen}
              className="hidden"
            />
            <input
              type="file"
              ref={videoInputRef}
              accept="video/*"
              capture="environment"
              onChange={handleFileChosen}
              className="hidden"
            />
            <input
              type="file"
              ref={phonePickerRef}
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
              onChange={handleFileChosen}
              className="hidden"
            />
            <input
              type="file"
              ref={filePickerRef}
              accept="*/*"
              onChange={handleFileChosen}
              className="hidden"
            />

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="p-4 rounded-xl border border-navy-700 bg-navy-950/80 hover:bg-navy-800 hover:border-saffron/60 transition-all flex flex-col items-center justify-center text-center group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <Camera className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-white">
                  {language === 'mr' ? 'फोटो काढा' : 'Take Photo'}
                </span>
                <span className="text-[10px] text-muted mt-0.5">
                  {language === 'mr' ? 'कॅमेरा वापरून' : 'Back Camera'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                className="p-4 rounded-xl border border-navy-700 bg-navy-950/80 hover:bg-navy-800 hover:border-saffron/60 transition-all flex flex-col items-center justify-center text-center group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <Video className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-white">
                  {language === 'mr' ? 'व्हिडिओ रेकॉर्ड करा' : 'Record Video'}
                </span>
                <span className="text-[10px] text-muted mt-0.5">
                  {language === 'mr' ? 'BNSS १०५ चित्रीकरण' : 'BNSS 105 Capture'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => phonePickerRef.current?.click()}
                className="p-4 rounded-xl border border-navy-700 bg-navy-950/80 hover:bg-navy-800 hover:border-saffron/60 transition-all flex flex-col items-center justify-center text-center group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <HardDrive className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-white">
                  {language === 'mr' ? 'फोनमधून निवडा' : 'Pick from Phone'}
                </span>
                <span className="text-[10px] text-muted mt-0.5">
                  {language === 'mr' ? 'फोटो/व्हिडिओ/ऑडिओ/PDF' : 'Media / Audio / PDF'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => filePickerRef.current?.click()}
                className="p-4 rounded-xl border border-navy-700 bg-navy-950/80 hover:bg-navy-800 hover:border-saffron/60 transition-all flex flex-col items-center justify-center text-center group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-white">
                  {language === 'mr' ? 'स्क्रीनशॉट किंवा इतर' : 'Screenshot / Other'}
                </span>
                <span className="text-[10px] text-muted mt-0.5">
                  {language === 'mr' ? 'सर्व फाइल फॉरमॅट' : 'Any File Format'}
                </span>
              </button>
            </div>

            <p className="text-[11px] text-muted text-center mt-3">
              {language === 'mr'
                ? 'कोणतीही फाइल सर्व्हरवर अपलोड केली जात नाही. सर्व प्रक्रिया केवळ तुमच्या डिव्हाइसवर होते.'
                : 'Zero data upload. Files are stored locally in the secure IndexedDB vault on this device.'}
            </p>
          </Card>

          {/* STEP 3: FINGERPRINT STEP (SHA-256 WITH PROGRESS & MONOSPACE BLOCKS) */}
          {selectedFile && (
            <Card
              header={
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-saffron/20 text-saffron text-xs font-bold flex items-center justify-center">
                      3
                    </div>
                    <span className="font-semibold text-white">
                      {language === 'mr' ? 'डिजिटल ठसा गणना (SHA-256 Fingerprint)' : 'Cryptographic Fingerprint (SHA-256)'}
                    </span>
                  </div>
                  {computedSha256 && (
                    <Badge variant="success" size="sm">
                      <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                      {language === 'mr' ? 'ठसा प्रमाणित' : 'Fingerprinted'}
                    </Badge>
                  )}
                </div>
              }
            >
              <div className="space-y-4">
                {/* File summary bar */}
                <div className="p-3 bg-navy-950 rounded-xl border border-navy-700 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-4 h-4 text-saffron shrink-0" />
                    <span className="font-bold text-white truncate">{selectedFile.name}</span>
                    <span className="text-muted shrink-0">({formatBytes(selectedFile.size)})</span>
                  </div>
                  <span className="text-muted shrink-0 ml-2 font-mono">{selectedFile.type || 'file'}</span>
                </div>

                {/* Progress bar during computation */}
                {isHashing ? (
                  <div className="space-y-2 py-3">
                    <div className="flex items-center justify-between text-xs text-saffron">
                      <span>{language === 'mr' ? 'फाइल वाचून SHA-256 डिजिटल ठसा काढत आहे...' : 'Reading array buffer & computing SHA-256...'}</span>
                      <span className="font-mono">{hashingProgress}%</span>
                    </div>
                    <ProgressBar value={hashingProgress} />
                  </div>
                ) : computedSha256 ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-emerald-400">
                        {language === 'mr' ? 'SHA-256 हॅश (६४ अक्षरी - ८ च्या गटात):' : 'SHA-256 HASH (64 HEX CHARACTERS):'}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyHash}
                        className="flex items-center gap-1 text-saffron hover:underline text-xs"
                      >
                        {copiedHash ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedHash ? (language === 'mr' ? 'कॉपी झाले' : 'Copied') : (language === 'mr' ? 'कॉपी करा' : 'Copy Hash')}</span>
                      </button>
                    </div>

                    {/* Monospace block grouped in blocks of 8 */}
                    <div className="bg-navy-950 p-3.5 rounded-xl border border-navy-700 font-mono text-xs sm:text-sm text-emerald-300 break-all select-all tracking-wider leading-relaxed">
                      {formatHashBlocks(computedSha256)}
                    </div>
                  </div>
                ) : null}

                {/* DUPLICATE WARNING CHECK */}
                {duplicateEvidence && (
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/40 text-amber-200 text-xs space-y-1.5 animate-fade-in">
                    <div className="flex items-center gap-2 font-bold text-amber-400 text-sm">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{language === 'mr' ? 'दुहेरी पुरावा आढळला (Duplicate Hash Detected)' : 'Duplicate Evidence Detected'}</span>
                    </div>
                    <p>
                      {language === 'mr'
                        ? `याच हॅशची फाइल ॲपमध्ये आधीच मुद्द्यामाल क्रमांक ${duplicateEvidence.exhibitNo} म्हणून नोंदवलेली आहे.`
                        : `This identical file with matching SHA-256 hash already exists in this system as Exhibit ${duplicateEvidence.exhibitNo}.`}
                    </p>
                    <Link
                      to={`/evidence/${duplicateEvidence.id}`}
                      className="inline-flex items-center gap-1 text-saffron underline font-semibold mt-1"
                    >
                      <span>{language === 'mr' ? 'मूळ पुरावा नोंद पहा' : 'View Existing Record'}</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* STEP 4: DETAILS FORM & AUTO-METADATA */}
          {selectedFile && computedSha256 && (
            <Card
              header={
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-saffron/20 text-saffron text-xs font-bold flex items-center justify-center">
                    4
                  </div>
                  <span className="font-semibold text-white">
                    {language === 'mr' ? 'पुराव्याचे तपशील व सील स्थिती' : 'Evidence Details & Seal Status'}
                  </span>
                </div>
              }
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Exhibit Number */}
                  <Input
                    label={language === 'mr' ? 'मुद्देमाल / एक्झिबीट क्रमांक (Exhibit No.)' : 'Exhibit Number'}
                    value={exhibitNo}
                    onChange={(e) => setExhibitNo(e.target.value)}
                    required
                    placeholder="e.g. EX-001"
                  />

                  {/* Handler Name */}
                  <Input
                    label={language === 'mr' ? 'पुरावा हाताळणाऱ्याचे नाव (Handler Name)' : 'Handler Name (Investigating Officer)'}
                    value={handlerName}
                    onChange={(e) => setHandlerName(e.target.value)}
                    required
                    placeholder="e.g. PSI Patil"
                  />
                </div>

                {/* Source */}
                <Input
                  label={language === 'mr' ? 'पुरावा कोठून / कोणाकडून हस्तगत केला (Source)' : 'Source (Where & from whom obtained)'}
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  required
                  placeholder={
                    language === 'mr'
                      ? 'उदा. घटनास्थळावरील सीसीटीव्ही डीव्हीआर, दुकान मालक श्री. शिंदे यांच्याकडून'
                      : 'e.g. CCTV DVR seized from shop owner Shri Shinde at crime spot'
                  }
                />

                {/* Description */}
                <Textarea
                  label={language === 'mr' ? 'पुराव्याचे सविस्तर वर्णन (Description)' : 'Evidence Description'}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={2}
                  placeholder={
                    language === 'mr'
                      ? 'उदा. दिनांक १४/०५/२०२४ रोजी दुपारी २:३० वाजताच्या घटनेचे सीसीटीव्ही फुटेज क्लिप'
                      : 'e.g. CCTV recording clip covering entrance between 14:00 to 14:30 hrs'
                  }
                />

                {/* Seal Status Toggle */}
                <div className="p-3.5 bg-navy-950 rounded-xl border border-navy-700 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {isSealed ? <Lock className="w-5 h-5 text-amber-400" /> : <Unlock className="w-5 h-5 text-blue-400" />}
                    <div>
                      <span className="font-semibold text-white text-sm">
                        {isSealed
                          ? (language === 'mr' ? 'लाख मोहरबंद (Sealed with Lac Seal)' : 'Sealed Container / Envelope')
                          : (language === 'mr' ? 'सील न केलेले (Open / Unsealed)' : 'Unsealed / Open State')}
                      </span>
                      <p className="text-[11px] text-muted">
                        {language === 'mr'
                          ? 'न्यायालयात सादर करण्यासाठी पॅकेट सीलबंद आहे का?'
                          : 'Indicate whether the digital media or drive is in a sealed evidence envelope.'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <Button
                      type="button"
                      variant={isSealed ? 'primary' : 'ghost'}
                      size="sm"
                      onClick={() => setIsSealed(true)}
                    >
                      {language === 'mr' ? 'सील बंद' : 'Sealed'}
                    </Button>
                    <Button
                      type="button"
                      variant={!isSealed ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setIsSealed(false)}
                    >
                      {language === 'mr' ? 'खुल्या' : 'Unsealed'}
                    </Button>
                  </div>
                </div>

                {/* AUTOMATIC METADATA CARD */}
                <div className="p-4 rounded-xl bg-navy-950 border border-navy-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-saffron" />
                      {language === 'mr' ? 'स्वयं-नोंदवलेले मेटाडेटा (Auto-captured Metadata)' : 'Automatically Captured Metadata'}
                    </span>
                    <Badge variant="neutral" size="sm">BSA 63</Badge>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                    <div className="p-2 rounded-lg bg-navy-900 border border-navy-800">
                      <span className="text-muted block text-[10px]">{language === 'mr' ? 'फाइल नाव' : 'File Name'}</span>
                      <span className="font-semibold text-slate-200 truncate block">{selectedFile.name}</span>
                    </div>

                    <div className="p-2 rounded-lg bg-navy-900 border border-navy-800">
                      <span className="text-muted block text-[10px]">{language === 'mr' ? 'फाइल आकार' : 'File Size'}</span>
                      <span className="font-semibold text-slate-200">{formatBytes(selectedFile.size)}</span>
                    </div>

                    <div className="p-2 rounded-lg bg-navy-900 border border-navy-800">
                      <span className="text-muted block text-[10px]">{language === 'mr' ? 'माध्यम प्रकार (MIME)' : 'MIME Type'}</span>
                      <span className="font-semibold text-slate-200 truncate block">{selectedFile.type || 'octet-stream'}</span>
                    </div>

                    <div className="p-2 rounded-lg bg-navy-900 border border-navy-800">
                      <span className="text-muted block text-[10px]">{language === 'mr' ? 'फाइल शेवटचा बदल' : 'File Last Modified'}</span>
                      <span className="font-semibold text-slate-200">
                        {formatDateTime(new Date(selectedFile.lastModified).toISOString())}
                      </span>
                    </div>

                    <div className="p-2 rounded-lg bg-navy-900 border border-navy-800">
                      <span className="text-muted block text-[10px]">{language === 'mr' ? 'नोंदणीची वेळ (घड्याळ)' : 'Device Logged Time'}</span>
                      <span className="font-semibold text-emerald-400">
                        {formatDateTime(new Date().toISOString())}
                      </span>
                    </div>

                    <div className="p-2 rounded-lg bg-navy-900 border border-navy-800">
                      <span className="text-muted block text-[10px]">{language === 'mr' ? 'उपकरण प्लॅटफॉर्म' : 'Platform / OS'}</span>
                      <span className="font-semibold text-slate-200 truncate block">
                        {navigator.userAgent.slice(0, 25)}...
                      </span>
                    </div>
                  </div>

                  {/* Optional Location */}
                  <div className="pt-2 border-t border-navy-800 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs text-muted">
                        {geoLoc ? (
                          <span className="text-emerald-400 font-mono">
                            {geoLoc.lat}, {geoLoc.lng} (±{geoLoc.accuracy}m)
                          </span>
                        ) : (
                          language === 'mr' ? 'स्थान (ऐच्छिक - GPS समन्वय)' : 'Optional GPS Coordinates'
                        )}
                      </span>
                    </div>

                    {geoLoc ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setGeoLoc(null)}
                      >
                        {language === 'mr' ? 'स्थान काढा' : 'Remove Location'}
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={handleRequestLocation}
                        loading={locLoading}
                        icon={<MapPin className="w-3.5 h-3.5" />}
                      >
                        {language === 'mr' ? 'स्थान जोडा (Add location)' : 'Add Location'}
                      </Button>
                    )}

                    {locError && (
                      <p className="w-full text-[11px] text-amber-400 mt-1">{locError}</p>
                    )}
                  </div>
                </div>

                {/* Submit Action Button */}
                <div className="pt-4 flex items-center justify-end gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => navigate('/evidence')}
                  >
                    {language === 'mr' ? 'रद्द करा' : 'Cancel'}
                  </Button>

                  <Button
                    type="submit"
                    variant="primary"
                    loading={isSaving}
                    icon={<ShieldCheck className="w-4 h-4" />}
                  >
                    {language === 'mr' ? 'पुरावा जतन करा व साखळी सुरू करा' : 'Save & Anchor Custody Chain'}
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </form>
      )}

      {/* 100 MB LARGE FILE WARNING MODAL */}
      <ConfirmDialog
        isOpen={showLargeFileConfirm}
        title={language === 'mr' ? 'मोठ्या आकाराची फाइल सूचना (> १०० MB)' : 'Large File Warning (> 100 MB)'}
        message={
          language === 'mr'
            ? `निवडलेली फाइल १०० MB पेक्षा मोठी आहे (${pendingLargeFile ? formatBytes(pendingLargeFile.size) : ''}). संपूर्ण फाइलचा SHA-256 डिजिटल ठसा तुमच्याच डिव्हाइसवर काढण्यासाठी थोडा वेळ लागू शकतो. आपण पुढे चालू ठेवू इच्छिता का?`
            : `The selected file is over 100 MB (${pendingLargeFile ? formatBytes(pendingLargeFile.size) : ''}). Generating an on-device cryptographic hash may take a moment. Do you want to continue?`
        }
        confirmText={language === 'mr' ? 'होय, ठसा काढा' : 'Proceed with Hashing'}
        cancelText={language === 'mr' ? 'रद्द करा' : 'Cancel'}
        onConfirm={handleConfirmLargeFile}
        onClose={() => {
          setShowLargeFileConfirm(false);
          setPendingLargeFile(null);
        }}
      />
    </div>
  );
};
