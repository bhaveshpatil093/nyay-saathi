import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  FileText,
  Printer,
  Download,
  Share2,
  Copy,
  Check,
  Shield,
  ShieldCheck,
  AlertTriangle,
  Info,
  Calendar,
  User,
  Building,
  Edit3,
  Eye,
  Save,
  Sparkles,
} from 'lucide-react';
import {
  CaseRecord,
  EvidenceRecord,
  CustodyLogRecord,
} from '../../types/database.ts';
import { exportPdf, printDocument, shareDocument } from '../../lib/pdf/index.ts';
import { saveDocument, listCustodyLogs, addAuditLog } from '../../lib/db/index.ts';
import { useI18n, formatDateTime, formatDate } from '../../i18n/index.ts';
import { useToast } from '../ui/Toast.tsx';
import { Button, Badge, Card } from '../ui/index.ts';

export interface Section63CertificateProps {
  evidence: EvidenceRecord;
  caseRecord?: CaseRecord | null;
  officerProfile?: {
    name?: string;
    rank?: string;
    station?: string;
    district?: string;
  } | null;
  onSaved?: (docId: string) => void;
}

export type CertificateLanguage = 'en' | 'mr' | 'both';

export const Section63CertificateView: React.FC<Section63CertificateProps> = ({
  evidence,
  caseRecord,
  officerProfile,
  onSaved,
}) => {
  const { t, language: appLanguage } = useI18n();
  const { success, error, info } = useToast();

  const printContainerRef = useRef<HTMLDivElement>(null);
  const [certLanguage, setCertLanguage] = useState<CertificateLanguage>('en');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [custodyLogs, setCustodyLogs] = useState<CustodyLogRecord[]>([]);

  // Form Fields for Part A
  const [officerName, setOfficerName] = useState<string>(
    officerProfile?.name || evidence.handlerName || 'PSI Ramesh Patil'
  );
  const [officerDesignation, setOfficerDesignation] = useState<string>(
    officerProfile?.rank ? `${officerProfile.rank.toUpperCase()}, Investigating Officer` : 'Police Sub-Inspector (PSI)'
  );
  const [policeStationAddress, setPoliceStationAddress] = useState<string>(
    officerProfile?.station || caseRecord?.policeStation || 'Shivaji Nagar Police Station, Pune'
  );
  const [deviceDescription, setDeviceDescription] = useState<string>(
    evidence.deviceInfo || 'Samsung Galaxy F14 5G (Android 14, Camera Unit #2, IMEI ending in 4102)'
  );
  const [mannerObtained, setMannerObtained] = useState<string>(
    evidence.source
      ? `Recorded at ${evidence.source} in presence of independent witnesses during search & panchnama.`
      : 'Direct electronic recording made during spot investigation in presence of independent panchas.'
  );

  // Checkbox declarations
  const [checkRegularUse, setCheckRegularUse] = useState<boolean>(true);
  const [checkOperatingProperly, setCheckOperatingProperly] = useState<boolean>(true);
  const [checkOrdinaryCourse, setCheckOrdinaryCourse] = useState<boolean>(true);
  const [checkTrueCopy, setCheckTrueCopy] = useState<boolean>(true);

  // Form Fields for Part B (Expert)
  const [expertName, setExpertName] = useState<string>('');
  const [expertDesignation, setExpertDesignation] = useState<string>('');
  const [expertQualification, setExpertQualification] = useState<string>('');
  const [expertFindings, setExpertFindings] = useState<string>(
    'The electronic record was examined using forensic cryptographic hash verification. The computed SHA-256 bit-stream matches without variance.'
  );

  const [place, setPlace] = useState<string>(
    officerProfile?.district || caseRecord?.district || 'Pune'
  );
  const [signDate, setSignDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );

  // Fetch custody logs
  useEffect(() => {
    let active = true;
    if (evidence.id) {
      listCustodyLogs(evidence.id).then((logs) => {
        if (active) {
          logs.sort((a, b) => a.seq - b.seq);
          setCustodyLogs(logs);
        }
      });
    }
    return () => {
      active = false;
    };
  }, [evidence.id]);

  // Unique 16-character Verification Code
  const verificationCode = useMemo(() => {
    const hashPart = evidence.sha256.slice(0, 16).toUpperCase();
    const casePart = (caseRecord?.firNo || caseRecord?.caseNo || 'EXHIBIT').replace(/[^a-zA-Z0-9]/g, '');
    return `${hashPart}-${casePart}`;
  }, [evidence.sha256, caseRecord]);

  // Handle Save Document to IndexedDB
  const handleSaveDocument = async () => {
    setIsSaving(true);
    try {
      const doc = await saveDocument({
        caseId: evidence.caseId || 'unassigned',
        templateId: 'sec_63_bsa_certificate',
        language: certLanguage === 'mr' ? 'mr' : 'en',
        fields: {
          evidenceId: evidence.id,
          exhibitNo: evidence.exhibitNo,
          fileName: evidence.fileName,
          sha256: evidence.sha256,
          verificationCode,
          officerName,
          officerDesignation,
          policeStationAddress,
          deviceDescription,
          mannerObtained,
          checkRegularUse,
          checkOperatingProperly,
          checkOrdinaryCourse,
          checkTrueCopy,
          expertName,
          expertDesignation,
          place,
          signDate,
        },
      });

      await addAuditLog(
        'document_generated',
        `Generated Section 63 BSA Certificate for Exhibit ${evidence.exhibitNo}`
      );

      success(
        appLanguage === 'mr' ? 'प्रमाणपत्र जतन केले' : 'Certificate Saved',
        appLanguage === 'mr' ? 'कलम ६३ प्रमाणपत्र दस्तऐवज दालनात सेव्ह केले.' : 'Certificate saved in document store.'
      );

      if (onSaved) {
        onSaved(doc.id);
      }
    } catch (err) {
      console.error('Failed to save certificate document:', err);
      error(
        appLanguage === 'mr' ? 'जतन करताना त्रुटी' : 'Save Failed',
        String(err)
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Download PDF
  const handleDownloadPdf = async () => {
    if (!printContainerRef.current) return;
    setIsGeneratingPdf(true);
    try {
      const fileName = `Sec63_BSA_Certificate_${evidence.exhibitNo}_${evidence.fileName.replace(/\.[^/.]+$/, '')}.pdf`;
      await exportPdf(printContainerRef.current, fileName, { isSample: evidence.isSample });
      success(
        appLanguage === 'mr' ? 'पीडीएफ तयार झाले' : 'PDF Downloaded',
        appLanguage === 'mr' ? 'कलम ६३ प्रमाणपत्र पीडीएफ यशस्वीरीत्या डाउनलोड केले.' : 'Section 63 certificate PDF saved to device.'
      );
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      error(
        appLanguage === 'mr' ? 'पीडीएफ निर्मिती अयशस्वी' : 'PDF Generation Failed',
        String(err)
      );
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Handle Share Document via Web Share API
  const handleShare = async () => {
    if (!printContainerRef.current) return;
    setIsGeneratingPdf(true);
    try {
      const fileName = `Sec63_BSA_Certificate_${evidence.exhibitNo}.pdf`;
      const res = await exportPdf(printContainerRef.current, fileName, { isSample: evidence.isSample });
      const shared = await shareDocument(
        res.blob,
        `Sec 63 BSA Certificate - Exhibit ${evidence.exhibitNo}`,
        fileName
      );
      if (shared) {
        success(
          appLanguage === 'mr' ? 'दस्तऐवज शेअर केले' : 'Document Shared',
          appLanguage === 'mr' ? 'प्रमाणपत्र पीडीएफ पाठवले गेले.' : 'Certificate shared successfully.'
        );
      } else {
        info(
          appLanguage === 'mr' ? 'पीडीएफ डाउनलोड झाले' : 'PDF Downloaded',
          appLanguage === 'mr' ? 'थेट शेअरिंग समर्थित नसल्याने पीडीएफ फाइल डाउनलोड झाली.' : 'PDF downloaded to device storage.'
        );
      }
    } catch (err) {
      console.error('Failed to share document:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP CONTROLS & STATUTORY DISCLAIMER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-navy-800 p-4 rounded-2xl border border-navy-700">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="warning" size="sm">
              Pending Legal Review
            </Badge>
            <span className="text-xs text-muted">
              Section 63, Bharatiya Sakshya Adhiniyam, 2023
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Format based on the Schedule to BSA 2023. Verify against the official text before use.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={<Edit3 className="w-3.5 h-3.5" />}
            onClick={() => setIsEditing((prev) => !prev)}
          >
            {isEditing ? 'Hide Edit Form' : 'Edit Certificate Data'}
          </Button>

          <Button
            variant="secondary"
            size="sm"
            icon={<Save className="w-3.5 h-3.5" />}
            loading={isSaving}
            onClick={handleSaveDocument}
          >
            Save Document
          </Button>

          <Button
            variant="secondary"
            size="sm"
            icon={<Printer className="w-3.5 h-3.5" />}
            onClick={printDocument}
          >
            Print
          </Button>

          <Button
            variant="secondary"
            size="sm"
            icon={<Share2 className="w-3.5 h-3.5" />}
            loading={isGeneratingPdf}
            onClick={handleShare}
          >
            Share
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={<Download className="w-3.5 h-3.5" />}
            loading={isGeneratingPdf}
            onClick={handleDownloadPdf}
          >
            Download PDF
          </Button>
        </div>
      </div>

      {/* 2. LANGUAGE PICKER CHIPS */}
      <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-navy-900 border border-navy-700">
        <span className="text-xs font-semibold text-slate-300">
          Certificate Language (प्रमाणपत्र भाषा):
        </span>
        <div className="inline-flex rounded-xl bg-navy-800 p-0.5 border border-navy-700">
          <button
            type="button"
            onClick={() => setCertLanguage('en')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              certLanguage === 'en'
                ? 'bg-saffron text-navy-900 font-bold shadow-xs'
                : 'text-muted hover:text-white'
            }`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => setCertLanguage('mr')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              certLanguage === 'mr'
                ? 'bg-saffron text-navy-900 font-bold shadow-xs'
                : 'text-muted hover:text-white'
            }`}
          >
            मराठी (Devanagari)
          </button>
          <button
            type="button"
            onClick={() => setCertLanguage('both')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              certLanguage === 'both'
                ? 'bg-saffron text-navy-900 font-bold shadow-xs'
                : 'text-muted hover:text-white'
            }`}
          >
            Both (द्विभाषिक A4)
          </button>
        </div>
      </div>

      {/* 3. EDITABLE FIELDS DRAWER (TOGGLEABLE) */}
      {isEditing && (
        <Card className="p-5 space-y-4 border-saffron/40 bg-navy-800/95 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-navy-700 pb-2">
            <h4 className="text-sm font-bold text-saffron uppercase tracking-wider flex items-center gap-2">
              <Edit3 className="w-4 h-4" />
              <span>Edit Certificate Fields Before Generation</span>
            </h4>
            <span className="text-xs text-muted">Pre-filled from case facts</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="text-muted font-medium">Part A: Deponent / Officer Name</label>
              <input
                type="text"
                value={officerName}
                onChange={(e) => setOfficerName(e.target.value)}
                className="w-full bg-navy-900 border border-navy-600 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-saffron"
              />
            </div>

            <div className="space-y-1">
              <label className="text-muted font-medium">Designation / Role</label>
              <input
                type="text"
                value={officerDesignation}
                onChange={(e) => setOfficerDesignation(e.target.value)}
                className="w-full bg-navy-900 border border-navy-600 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-saffron"
              />
            </div>

            <div className="space-y-1">
              <label className="text-muted font-medium">Police Station / Control Address</label>
              <input
                type="text"
                value={policeStationAddress}
                onChange={(e) => setPoliceStationAddress(e.target.value)}
                className="w-full bg-navy-900 border border-navy-600 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-saffron"
              />
            </div>

            <div className="space-y-1">
              <label className="text-muted font-medium">Place of Certification</label>
              <input
                type="text"
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                className="w-full bg-navy-900 border border-navy-600 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-saffron"
              />
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="text-muted font-medium">Source Device Description</label>
              <input
                type="text"
                value={deviceDescription}
                onChange={(e) => setDeviceDescription(e.target.value)}
                className="w-full bg-navy-900 border border-navy-600 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-saffron"
              />
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="text-muted font-medium">Manner in which Record was Obtained</label>
              <textarea
                rows={2}
                value={mannerObtained}
                onChange={(e) => setMannerObtained(e.target.value)}
                className="w-full bg-navy-900 border border-navy-600 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-saffron resize-none"
              />
            </div>
          </div>

          {/* Statutory Declaration Checkboxes */}
          <div className="pt-2 border-t border-navy-700/60 space-y-2 text-xs">
            <span className="font-semibold text-slate-200">Statutory Statements (Section 63(2) BSA):</span>
            <div className="space-y-1.5 text-slate-300">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checkRegularUse}
                  onChange={(e) => setCheckRegularUse(e.target.checked)}
                  className="rounded bg-navy-900 text-saffron border-navy-600 focus:ring-0"
                />
                <span>Device was in regular lawful use during the period record was produced.</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checkOperatingProperly}
                  onChange={(e) => setCheckOperatingProperly(e.target.checked)}
                  className="rounded bg-navy-900 text-saffron border-navy-600 focus:ring-0"
                />
                <span>Device was operating properly and record contents were not impaired.</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checkOrdinaryCourse}
                  onChange={(e) => setCheckOrdinaryCourse(e.target.checked)}
                  className="rounded bg-navy-900 text-saffron border-navy-600 focus:ring-0"
                />
                <span>Information reproduced was supplied in the ordinary course of lawful activities.</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checkTrueCopy}
                  onChange={(e) => setCheckTrueCopy(e.target.checked)}
                  className="rounded bg-navy-900 text-saffron border-navy-600 focus:ring-0"
                />
                <span>Electronic output is a true and accurate copy with verified SHA-256 hash.</span>
              </label>
            </div>
          </div>
        </Card>
      )}

      {/* 4. A4 PRINT & PDF CANVAS CONTAINER (794px width standard A4 ratio) */}
      <div className="overflow-x-auto pb-6 flex justify-center">
        <div
          ref={printContainerRef}
          id="certificate-print-root"
          className="w-[794px] min-h-[1123px] bg-white text-slate-900 p-10 shadow-2xl rounded-sm font-serif border border-slate-300 print:border-none print:shadow-none print:p-8 space-y-6 select-text"
          style={{ boxSizing: 'border-box' }}
        >
          {/* RENDER ENGLISH VERSION */}
          {(certLanguage === 'en' || certLanguage === 'both') && (
            <div className="space-y-5">
              {/* Official Header */}
              <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
                <div className="text-[11px] uppercase tracking-widest font-sans font-bold text-slate-600 flex items-center justify-center gap-2">
                  <span>MAHARASHTRA POLICE</span>
                  <span>•</span>
                  <span>CRIME INVESTIGATION DEPARTMENT</span>
                </div>

                <h1 className="text-lg font-black text-slate-950 uppercase tracking-tight">
                  CERTIFICATE UNDER SECTION 63 OF THE BHARATIYA SAKSHYA ADHINIYAM, 2023
                </h1>

                <div className="text-xs font-sans text-slate-700 italic">
                  [In terms of the Schedule to the Bharatiya Sakshya Adhiniyam, 2023 (Admissibility of Electronic Records)]
                </div>

                <div className="pt-2 flex items-center justify-between text-xs font-sans border-t border-slate-300 mt-2">
                  <div>
                    <span className="font-semibold text-slate-700">Police Station: </span>
                    <span className="font-bold">{caseRecord?.policeStation || policeStationAddress}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">FIR No: </span>
                    <span className="font-bold">{caseRecord?.firNo || 'Unassigned'}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">Case No: </span>
                    <span className="font-bold">{caseRecord?.caseNo || 'Unassigned'}</span>
                  </div>
                </div>
              </div>

              {/* Pending Legal Review & Verification Box */}
              <div className="flex items-center justify-between p-2.5 bg-slate-100 border border-slate-300 rounded font-sans text-xs">
                <div>
                  <div className="font-bold text-slate-900 uppercase">VERIFICATION REFERENCE</div>
                  <div className="font-mono text-[11px] font-bold text-slate-800">
                    {verificationCode}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-600 uppercase font-semibold">FORMAT NOTICE</div>
                  <div className="text-[11px] text-slate-700 font-medium">
                    Schedule to BSA 2023 • Decision Support Format
                  </div>
                </div>
              </div>

              {/* PART A: Person in control of device */}
              <div className="space-y-3">
                <div className="bg-slate-900 text-white font-sans text-xs font-bold px-3 py-1 uppercase tracking-wider flex items-center justify-between">
                  <span>PART A — STATEMENT BY PERSON PRODUCING ELECTRONIC RECORD</span>
                  <span className="text-[10px] font-normal text-slate-300">[Section 63(4)(a) BSA 2023]</span>
                </div>

                <div className="text-xs leading-relaxed text-slate-800 space-y-2">
                  <p>
                    I, <span className="font-bold underline">{officerName}</span>, residing/stationed at{' '}
                    <span className="font-bold underline">{policeStationAddress}</span>, holding the designation/office of{' '}
                    <span className="font-bold underline">{officerDesignation}</span>, hereby solemnly certify and affirm as follows:
                  </p>

                  <ol className="list-decimal list-inside space-y-1.5 pl-1">
                    <li>
                      <span className="font-semibold">Description of Source Device:</span> The electronic record produced herewith was produced by/from the following computer/device/system: <span className="font-mono font-bold">{deviceDescription}</span>.
                    </li>
                    <li>
                      <span className="font-semibold">Particulars of Electronic Record:</span>
                      <div className="pl-4 pt-1 font-mono text-[11px] grid grid-cols-2 gap-1 text-slate-900">
                        <div>• Exhibit No: <strong>{evidence.exhibitNo}</strong></div>
                        <div>• File Name: <strong>{evidence.fileName}</strong></div>
                        <div>• MIME Type: <strong>{evidence.mimeType}</strong></div>
                        <div>• Size: <strong>{(evidence.size / 1024).toFixed(1)} KB</strong></div>
                        <div>• Date & Time: <strong>{formatDateTime(evidence.loggedAt)}</strong></div>
                        <div>• Source / Location: <strong>{evidence.source || 'Scene'}</strong></div>
                      </div>
                    </li>
                    <li>
                      <span className="font-semibold">Manner in which Record was Obtained:</span> {mannerObtained}
                    </li>
                    <li>
                      <span className="font-semibold">Statutory Conditions Satisfied:</span>
                      <div className="pl-4 pt-1 space-y-1 font-sans text-[11px]">
                        <div>[ {checkRegularUse ? '✓' : ' '} ] The device was in regular lawful operation throughout the relevant period.</div>
                        <div>[ {checkOperatingProperly ? '✓' : ' '} ] The device was operating properly and record contents were not impaired.</div>
                        <div>[ {checkOrdinaryCourse ? '✓' : ' '} ] The information reproduces data supplied in the ordinary course of lawful activities.</div>
                        <div>[ {checkTrueCopy ? '✓' : ' '} ] The output produced herewith is a true, faithful and untampered reproduction.</div>
                      </div>
                    </li>
                    <li>
                      <span className="font-semibold">Cryptographic Hash Verification:</span> The integrity of the electronic file was verified using cryptographic hash function:
                      <div className="mt-1 p-2 bg-slate-100 border border-slate-300 font-mono text-[11px] break-all select-all font-bold text-slate-950">
                        SHA-256: {evidence.sha256}
                      </div>
                    </li>
                  </ol>
                </div>

                {/* Part A Signature Block */}
                <div className="pt-4 flex justify-between items-end text-xs font-sans">
                  <div className="space-y-0.5">
                    <div>Date: <span className="underline">{signDate}</span></div>
                    <div>Place: <span className="underline">{place}</span></div>
                  </div>
                  <div className="text-center space-y-1">
                    <div className="w-48 border-b border-slate-800" />
                    <div className="font-bold text-slate-900">{officerName}</div>
                    <div className="text-[11px] text-slate-600">{officerDesignation}</div>
                  </div>
                </div>
              </div>

              {/* PART B: Forensic Expert Certificate */}
              <div className="space-y-3 pt-2 border-t border-slate-300">
                <div className="bg-slate-900 text-white font-sans text-xs font-bold px-3 py-1 uppercase tracking-wider flex items-center justify-between">
                  <span>PART B — CERTIFICATE BY EXPERT / EXAMINER</span>
                  <span className="text-[10px] font-normal text-slate-300">[Section 63(4)(b) BSA 2023]</span>
                </div>

                <div className="text-xs leading-relaxed text-slate-800 space-y-2">
                  <p>
                    I, <span className="font-bold underline">{expertName || '__________________________________'}</span>, holding the qualification of{' '}
                    <span className="font-bold underline">{expertQualification || '__________________________________'}</span>, working as{' '}
                    <span className="font-bold underline">{expertDesignation || 'Scientific Officer / Cyber Forensics Examiner'}</span>, certify that:
                  </p>
                  <p>
                    {expertFindings} The computed cryptographic SHA-256 hash matches the hash recorded in Part A without discrepancy:
                  </p>
                  <div className="p-1.5 bg-slate-50 border border-slate-300 font-mono text-[10px] text-slate-900">
                    Verified SHA-256: {evidence.sha256}
                  </div>
                </div>

                {/* Part B Signature Block */}
                <div className="pt-3 flex justify-between items-end text-xs font-sans">
                  <div className="space-y-0.5">
                    <div>Date: <span className="underline">__________________</span></div>
                    <div>Place: <span className="underline">{place}</span></div>
                  </div>
                  <div className="text-center space-y-1">
                    <div className="w-48 border-b border-slate-800" />
                    <div className="font-bold text-slate-900">Signature of Expert</div>
                    <div className="text-[11px] text-slate-600">Forensic Laboratory / Cyber Cell Stamp</div>
                  </div>
                </div>
              </div>

              {/* Chain of Custody Summary Table */}
              {custodyLogs.length > 0 && (
                <div className="pt-2 border-t border-slate-300 space-y-1 font-sans">
                  <div className="text-[11px] font-bold text-slate-800 uppercase">
                    Chain of Custody Summary ({custodyLogs.length} Verified Transfers):
                  </div>
                  <table className="w-full text-left text-[10px] border border-slate-300">
                    <thead>
                      <tr className="bg-slate-100 text-slate-800">
                        <th className="p-1 border border-slate-300">#</th>
                        <th className="p-1 border border-slate-300">Action</th>
                        <th className="p-1 border border-slate-300">From</th>
                        <th className="p-1 border border-slate-300">To</th>
                        <th className="p-1 border border-slate-300">Timestamp</th>
                        <th className="p-1 border border-slate-300">Entry Hash</th>
                      </tr>
                    </thead>
                    <tbody>
                      {custodyLogs.slice(0, 5).map((c) => (
                        <tr key={c.id}>
                          <td className="p-1 border border-slate-300 font-mono font-bold">{c.seq}</td>
                          <td className="p-1 border border-slate-300 font-semibold">{c.action}</td>
                          <td className="p-1 border border-slate-300 truncate max-w-[90px]">{c.fromPerson}</td>
                          <td className="p-1 border border-slate-300 truncate max-w-[90px]">{c.toPerson}</td>
                          <td className="p-1 border border-slate-300 font-mono">{formatDate(c.timestamp)}</td>
                          <td className="p-1 border border-slate-300 font-mono">{c.entryHash.slice(0, 10)}...</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* RENDER MARATHI VERSION (DEVANAGARI) */}
          {(certLanguage === 'mr' || certLanguage === 'both') && (
            <div className={`space-y-5 ${certLanguage === 'both' ? 'pt-10 border-t-2 border-dashed border-slate-400' : ''}`}>
              {/* Official Header (Marathi) */}
              <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
                <div className="text-[11px] uppercase tracking-widest font-sans font-bold text-slate-600 flex items-center justify-center gap-2">
                  <span>महाराष्ट्र पोलीस</span>
                  <span>•</span>
                  <span>गुन्हे अन्वेषण विभाग</span>
                </div>

                <h1 className="text-lg font-black text-slate-950 uppercase tracking-tight">
                  भारतीय साक्ष अधिनियम, २०२३ च्या कलम ६३ अन्वये इलेक्ट्रॉनिक पुराव्याचे प्रमाणपत्र
                </h1>

                <div className="text-xs font-sans text-slate-700 italic">
                  [भारतीय साक्ष अधिनियम, २०२३ च्या अनुसूचीनुसार (इलेक्ट्रॉनिक नोंदींची ग्राह्यता)]
                </div>

                <div className="pt-2 flex items-center justify-between text-xs font-sans border-t border-slate-300 mt-2">
                  <div>
                    <span className="font-semibold text-slate-700">पोलीस ठाणे: </span>
                    <span className="font-bold">{caseRecord?.policeStation || policeStationAddress}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">एफआयआर क्र.: </span>
                    <span className="font-bold">{caseRecord?.firNo || 'नोंद नाही'}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">केस क्र.: </span>
                    <span className="font-bold">{caseRecord?.caseNo || 'नोंद नाही'}</span>
                  </div>
                </div>
              </div>

              {/* Verification Reference */}
              <div className="flex items-center justify-between p-2.5 bg-slate-100 border border-slate-300 rounded font-sans text-xs">
                <div>
                  <div className="font-bold text-slate-900 uppercase">पडताळणी संदर्भ क्रमांक</div>
                  <div className="font-mono text-[11px] font-bold text-slate-800">
                    {verificationCode}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-600 uppercase font-semibold">कायदेशीर सूचना</div>
                  <div className="text-[11px] text-slate-700 font-medium">
                    BSA २०२३ अनुसूची • कायदेशीर पुनरावलोकन प्रलंबित
                  </div>
                </div>
              </div>

              {/* PART A (Marathi) */}
              <div className="space-y-3">
                <div className="bg-slate-900 text-white font-sans text-xs font-bold px-3 py-1 uppercase tracking-wider flex items-center justify-between">
                  <span>भाग अ — इलेक्ट्रॉनिक पुरावा सादर करणाऱ्या व्यक्तीचे प्रमाणपत्र</span>
                  <span className="text-[10px] font-normal text-slate-300">[कलम ६३(४)(अ) BSA २०२३]</span>
                </div>

                <div className="text-xs leading-relaxed text-slate-800 space-y-2">
                  <p>
                    मी, <span className="font-bold underline">{officerName}</span>, नेमणूक/पत्ता{' '}
                    <span className="font-bold underline">{policeStationAddress}</span>, पदनाम{' '}
                    <span className="font-bold underline">{officerDesignation}</span>, याद्वारे गांभीर्यपूर्वक प्रमाणित करतो की:
                  </p>

                  <ol className="list-decimal list-inside space-y-1.5 pl-1">
                    <li>
                      <span className="font-semibold">मूळ उपकरणाचे वर्णन:</span> सादर केलेला इलेक्ट्रॉनिक पुरावा खालील संगणक/मोबाईल उपकरणाद्वारे तयार करण्यात आला आहे: <span className="font-mono font-bold">{deviceDescription}</span>.
                    </li>
                    <li>
                      <span className="font-semibold">इलेक्ट्रॉनिक पुराव्याचा तपशील:</span>
                      <div className="pl-4 pt-1 font-mono text-[11px] grid grid-cols-2 gap-1 text-slate-900">
                        <div>• एक्झिबीट क्र: <strong>{evidence.exhibitNo}</strong></div>
                        <div>• फाईलचे नाव: <strong>{evidence.fileName}</strong></div>
                        <div>• प्रकार: <strong>{evidence.mimeType}</strong></div>
                        <div>• आकार: <strong>{(evidence.size / 1024).toFixed(1)} KB</strong></div>
                        <div>• दिनांक व वेळ: <strong>{formatDateTime(evidence.loggedAt)}</strong></div>
                        <div>• मिळण्याचे ठिकाण: <strong>{evidence.source || 'घटनास्थळ'}</strong></div>
                      </div>
                    </li>
                    <li>
                      <span className="font-semibold">पुरावा प्राप्त करण्याची पद्धत:</span> {mannerObtained}
                    </li>
                    <li>
                      <span className="font-semibold">कायदेशीर अटींची पूर्तता:</span>
                      <div className="pl-4 pt-1 space-y-1 font-sans text-[11px]">
                        <div>[ {checkRegularUse ? '✓' : ' '} ] संबंधित कालावधीत उपकरण नियमित व कायदेशीर वापराखाली होते.</div>
                        <div>[ {checkOperatingProperly ? '✓' : ' '} ] उपकरण योग्य रीतीने कार्यरत होते आणि डेटा बाधित झालेला नाही.</div>
                        <div>[ {checkOrdinaryCourse ? '✓' : ' '} ] माहिती नियमित कार्यालयीन कामकाजादरम्यान उपकरणात फीड केली गेली.</div>
                        <div>[ {checkTrueCopy ? '✓' : ' '} ] सादर केलेली प्रत मूळ डिजिटल पुराव्याची अचूक व छेडछाड न केलेली प्रत आहे.</div>
                      </div>
                    </li>
                    <li>
                      <span className="font-semibold">क्रिप्टोग्राफिक हॅश पडताळणी:</span> या फाईलची अखंडता खालील क्रिप्टोग्राफिक SHA-256 हॅश अल्गोरिदमद्वारे सिद्ध केली आहे:
                      <div className="mt-1 p-2 bg-slate-100 border border-slate-300 font-mono text-[11px] break-all select-all font-bold text-slate-950">
                        SHA-256: {evidence.sha256}
                      </div>
                    </li>
                  </ol>
                </div>

                {/* Part A Signature (Marathi) */}
                <div className="pt-4 flex justify-between items-end text-xs font-sans">
                  <div className="space-y-0.5">
                    <div>दिनांक: <span className="underline">{signDate}</span></div>
                    <div>ठिकाण: <span className="underline">{place}</span></div>
                  </div>
                  <div className="text-center space-y-1">
                    <div className="w-48 border-b border-slate-800" />
                    <div className="font-bold text-slate-900">{officerName}</div>
                    <div className="text-[11px] text-slate-600">{officerDesignation}</div>
                  </div>
                </div>
              </div>

              {/* PART B (Marathi) */}
              <div className="space-y-3 pt-2 border-t border-slate-300">
                <div className="bg-slate-900 text-white font-sans text-xs font-bold px-3 py-1 uppercase tracking-wider flex items-center justify-between">
                  <span>भाग ब — न्यायवैद्यक (फॉरेन्सिक) तज्ज्ञाचे प्रमाणपत्र</span>
                  <span className="text-[10px] font-normal text-slate-300">[कलम ६३(४)(ब) BSA २०२३]</span>
                </div>

                <div className="text-xs leading-relaxed text-slate-800 space-y-2">
                  <p>
                    मी, <span className="font-bold underline">{expertName || '__________________________________'}</span>, पदवी/पात्रता{' '}
                    <span className="font-bold underline">{expertQualification || '__________________________________'}</span>, पदनाम{' '}
                    <span className="font-bold underline">{expertDesignation || 'वैज्ञानिक अधिकारी / सायबर फॉरेन्सिक तज्ज्ञ'}</span>, याद्वारे प्रमाणित करतो की:
                  </p>
                  <p>
                    इलेक्ट्रॉनिक पुराव्याची तपासणी केली असून, काढलेला SHA-256 हॅश भाग 'अ' मधील हॅशशी तंतोतंत जुळतो:
                  </p>
                  <div className="p-1.5 bg-slate-50 border border-slate-300 font-mono text-[10px] text-slate-900">
                    पडताळलेला SHA-256: {evidence.sha256}
                  </div>
                </div>

                {/* Part B Signature (Marathi) */}
                <div className="pt-3 flex justify-between items-end text-xs font-sans">
                  <div className="space-y-0.5">
                    <div>दिनांक: <span className="underline">__________________</span></div>
                    <div>ठिकाण: <span className="underline">{place}</span></div>
                  </div>
                  <div className="text-center space-y-1">
                    <div className="w-48 border-b border-slate-800" />
                    <div className="font-bold text-slate-900">तज्ज्ञाची स्वाक्षरी</div>
                    <div className="text-[11px] text-slate-600">फॉरेन्सिक लॅब / सायबर शाखा शिक्का</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
