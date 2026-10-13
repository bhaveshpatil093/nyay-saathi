import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  Upload,
  Copy,
  Check,
  FileText,
  Camera,
  ExternalLink,
  Sparkles,
  ArrowRight,
  HardDrive,
} from 'lucide-react';
import { useLiveData, listAllEvidence, listCases } from '../../lib/db/index.ts';
import { EvidenceRecord, CaseRecord } from '../../types/database.ts';
import { useI18n, formatDateTime, formatDate } from '../../i18n/index.ts';
import { useToast } from '../../components/ui/Toast.tsx';
import { Card, Button, Badge, Input, ProgressBar } from '../../components/ui/index.ts';
import { formatHashBlocks } from './NewEvidencePage.tsx';

export const VerifyPage: React.FC = () => {
  const { t, language } = useI18n();
  const { success, error, info } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [inputHash, setInputHash] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isHashing, setIsHashing] = useState<boolean>(false);
  const [hashingProgress, setHashingProgress] = useState<number>(0);
  const [activeHash, setActiveHash] = useState<string>('');

  const { data: allEvidence = [] } = useLiveData<EvidenceRecord[]>(
    () => listAllEvidence(),
    ['evidence']
  );
  const { data: cases = [] } = useLiveData<CaseRecord[]>(
    () => listCases('all'),
    ['cases']
  );

  const casesMap = new Map<string, CaseRecord>();
  cases.forEach((c) => casesMap.set(c.id, c));

  const handleFileChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    try {
      setSelectedFile(file);
      setIsHashing(true);
      setHashingProgress(25);
      setActiveHash('');

      const buffer = await file.arrayBuffer();
      setHashingProgress(65);

      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

      setHashingProgress(100);
      setIsHashing(false);
      setActiveHash(hashHex);
      setInputHash(hashHex);
      success(language === 'mr' ? 'फाइलचा SHA-256 ठसा काढला!' : 'SHA-256 fingerprint computed!');
    } catch (err) {
      console.error('File hashing error:', err);
      setIsHashing(false);
      error(language === 'mr' ? 'ठसा काढताना त्रुटी आली' : 'Failed to compute file fingerprint');
    }
  };

  const currentSearchHash = (activeHash || inputHash).trim().toLowerCase();

  const matchedEvidence = currentSearchHash
    ? allEvidence.find((ev) => ev.sha256.toLowerCase() === currentSearchHash)
    : null;

  const matchedCase = matchedEvidence ? casesMap.get(matchedEvidence.caseId) : null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-saffron" />
            <span>{language === 'mr' ? 'डिजिटल पुरावा पडताळणी' : 'Verify Evidence Fingerprint'}</span>
          </h1>
          <p className="text-xs text-muted">
            {language === 'mr'
              ? 'कोणतीही फाइल निवडून किंवा ६४-अक्षरी SHA-256 हॅश टाकून मूळ नोंद पडताळा'
              : 'Drop any file or enter a 64-char SHA-256 hash to verify authenticity against the digital evidence vault'}
          </p>
        </div>
        <Badge variant="neutral" size="sm">BSA 2023 Sec 63</Badge>
      </div>

      <div className="p-3.5 rounded-xl bg-saffron/10 border border-saffron/30 text-saffron-300 text-xs sm:text-sm flex items-center gap-3">
        <Sparkles className="w-5 h-5 text-saffron shrink-0" />
        <span className="font-medium">
          {language === 'mr'
            ? 'डिजिटल ठसा: जर एक पिक्सेलही बदलला, तरी हा ठसा बदलतो. सर्व पडताळणी १००% डिव्हाइसवर होते.'
            : 'A digital fingerprint: if even one pixel changes, the fingerprint changes. 100% on-device verification.'}
        </span>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChosen}
        className="hidden"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Option 1: Pick File */}
        <Card
          header={
            <span className="font-semibold text-white text-sm">
              {language === 'mr' ? 'पद्धत १: फाइल निवडा' : 'Method 1: Select a File to Verify'}
            </span>
          }
        >
          <div className="space-y-4 text-center py-2">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-navy-600 hover:border-saffron rounded-2xl p-6 cursor-pointer bg-navy-950/60 transition-colors flex flex-col items-center justify-center gap-2"
            >
              <div className="w-12 h-12 rounded-full bg-saffron/10 text-saffron flex items-center justify-center">
                <Upload className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-white">
                {language === 'mr' ? 'फाइल निवडा किंवा येथे सोडा' : 'Choose file or drag & drop'}
              </span>
              <span className="text-[11px] text-muted">
                {language === 'mr' ? 'फोटो, व्हिडिओ, ऑडिओ, PDF किंवा इतर' : 'Images, videos, audio, PDF, or documents'}
              </span>
            </div>

            {selectedFile && (
              <div className="p-2.5 rounded-lg bg-navy-900 border border-navy-700 text-xs text-left">
                <span className="font-bold text-white block truncate">{selectedFile.name}</span>
                <span className="text-muted text-[10px]">
                  {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type || 'file'}
                </span>
              </div>
            )}

            {isHashing && (
              <div className="space-y-1.5 text-left">
                <div className="flex justify-between text-xs text-saffron">
                  <span>Calculating SHA-256...</span>
                  <span>{hashingProgress}%</span>
                </div>
                <ProgressBar value={hashingProgress} />
              </div>
            )}
          </div>
        </Card>

        {/* Option 2: Enter 64-char Hash */}
        <Card
          header={
            <span className="font-semibold text-white text-sm">
              {language === 'mr' ? 'पद्धत २: ६४-अक्षरी हॅश टाका' : 'Method 2: Paste 64-Character SHA-256'}
            </span>
          }
        >
          <div className="space-y-3 py-2">
            <Input
              label={language === 'mr' ? 'SHA-256 हॅश कोड' : 'SHA-256 Hash Code'}
              value={inputHash}
              onChange={(e) => {
                setInputHash(e.target.value.trim());
                setActiveHash('');
              }}
              placeholder="e.g. a1b2c3d4e5f6..."
            />
            <p className="text-[11px] text-muted leading-relaxed">
              {language === 'mr'
                ? 'न्यायालयात किंवा पंचनाम्यात नमूद केलेला ६४ अक्षरी हॅश पेस्ट करा. प्रणाली त्वरित मूळ पुरावा शोधेल.'
                : 'Paste any 64-hexadecimal character fingerprint from court documents or panchnama to look up the authentic registered case.'}
            </p>
          </div>
        </Card>
      </div>

      {/* VERIFICATION RESULT CARD */}
      {currentSearchHash && (
        <Card
          className={
            matchedEvidence
              ? 'border-emerald-500/50 bg-navy-900/90'
              : 'border-amber-500/50 bg-navy-900/90'
          }
          header={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                {matchedEvidence ? (
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                ) : (
                  <ShieldAlert className="w-5 h-5 text-amber-400" />
                )}
                <span className="font-bold text-white text-sm">
                  {matchedEvidence
                    ? (language === 'mr' ? 'पुराव्याची पडताळणी यशस्वी (AUTHENTIC MATCH)' : 'AUTHENTIC MATCH FOUND IN VAULT')
                    : (language === 'mr' ? 'या हॅशचा पुरावा डेटाबेसमध्ये आढळला नाही' : 'NO MATCHING EVIDENCE IN DATABASE')}
                </span>
              </div>
              <Badge variant={matchedEvidence ? 'success' : 'warning'} size="sm">
                {matchedEvidence ? 'VERIFIED' : 'UNMATCHED'}
              </Badge>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="p-3 bg-navy-950 rounded-xl border border-navy-800">
              <span className="text-[11px] text-muted block mb-1">COMPUTED / ENTERED SHA-256 HASH:</span>
              <p className="font-mono text-xs sm:text-sm text-emerald-300 break-all select-all">
                {formatHashBlocks(currentSearchHash)}
              </p>
            </div>

            {matchedEvidence ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-base">{matchedEvidence.exhibitNo}</span>
                      <Badge variant="info" size="sm">{matchedEvidence.fileName}</Badge>
                      <Badge variant={matchedEvidence.sealed ? 'warning' : 'neutral'} size="sm">
                        {matchedEvidence.sealed ? 'Sealed' : 'Unsealed'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted mt-1">{matchedEvidence.description}</p>
                  </div>

                  <Link
                    to={`/evidence/${matchedEvidence.id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shrink-0"
                  >
                    <span>{language === 'mr' ? 'ताबा साखळी पहा' : 'View Evidence & Chain'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {matchedCase && (
                  <div className="pt-2 border-t border-emerald-500/20 flex flex-wrap items-center gap-3 text-xs text-slate-300">
                    <span><strong>Case No:</strong> {matchedCase.caseNo}</span>
                    <span>•</span>
                    <span><strong>FIR No:</strong> {matchedCase.firNo}</span>
                    <span>•</span>
                    <span><strong>PS:</strong> {matchedCase.policeStation}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-2">
                <p>
                  {language === 'mr'
                    ? 'हा डिजिटल ठसा या ॲपमधील कोणत्याही नोंदवलेल्या पुराव्याशी जुळत नाही. जर फाइलमध्ये थोडासाही बदल (उदा. इमेज रिसायझिंग किंवा मेटाडेटा बदल) झाला असेल, तर ठसा पूर्णपणे बदलतो.'
                    : 'This cryptographic fingerprint does not match any digital evidence currently registered in this applet. Even a 1-pixel alteration completely changes the SHA-256 hash.'}
                </p>
                <div className="pt-1">
                  <Link
                    to="/evidence/new"
                    className="text-saffron hover:underline font-semibold flex items-center gap-1"
                  >
                    <span>{language === 'mr' ? 'हा पुरावा नवीन म्हणून नोंदवा' : 'Register this file as new evidence'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};
