import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  FileText,
  Printer,
  Download,
  Share2,
  Save,
  Check,
  AlertTriangle,
  Clock,
  ExternalLink,
  ChevronRight,
  History,
  Eye,
  Edit3,
  Sparkles,
} from 'lucide-react';
import { DocumentTemplate, DocumentFieldDef } from '../../data/templates.tsx';
import { CaseRecord, EvidenceRecord, DocumentRecord, DocumentVersion } from '../../types/database.ts';
import { prefillDocumentFields, validateDocumentFields } from '../../lib/documents/engine.ts';
import { exportPdf, printDocument, shareDocument } from '../../lib/pdf/index.ts';
import { saveDocument, getProfile } from '../../lib/db/index.ts';
import { useI18n, formatDateTime, formatDate } from '../../i18n/index.ts';
import { useToast } from '../ui/Toast.tsx';
import {
  Card,
  Button,
  Badge,
  Input,
  Textarea,
  Select,
  Checkbox,
  Modal,
} from '../ui/index.ts';

export interface DocumentBuilderProps {
  template: DocumentTemplate;
  caseRecord?: CaseRecord | null;
  evidence?: EvidenceRecord | null;
  initialFields?: Record<string, any>;
  existingDoc?: DocumentRecord | null;
  onSaved?: (doc: DocumentRecord) => void;
}

export const DocumentBuilder: React.FC<DocumentBuilderProps> = ({
  template,
  caseRecord,
  evidence,
  initialFields,
  existingDoc,
  onSaved,
}) => {
  const { t, language: appLanguage } = useI18n();
  const { success, error, info } = useToast();
  const printContainerRef = useRef<HTMLDivElement>(null);

  const [docLanguage, setDocLanguage] = useState<'en' | 'mr'>('en');
  const [fields, setFields] = useState<Record<string, any>>({});
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showVersionHistory, setShowVersionHistory] = useState<boolean>(false);
  const [selectedHistoricalVersion, setSelectedHistoricalVersion] = useState<DocumentVersion | null>(null);

  // Officer Profile
  const [profile, setProfile] = useState<any>(null);
  useEffect(() => {
    getProfile().then(setProfile).catch(() => {});
  }, []);

  // Initialize or prefill fields
  useEffect(() => {
    if (existingDoc && existingDoc.fields) {
      setFields({ ...existingDoc.fields });
      if (existingDoc.language) {
        setDocLanguage(existingDoc.language);
      }
    } else {
      const prefilled = prefillDocumentFields(template, {
        caseRecord,
        profile,
        evidence,
      });
      setFields({ ...prefilled, ...(initialFields || {}) });
    }
  }, [template, caseRecord, profile, evidence, existingDoc, initialFields]);

  // Handle field change
  const handleFieldChange = (key: string, value: any) => {
    setFields((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Validation
  const validation = useMemo(() => {
    return validateDocumentFields(template, fields);
  }, [template, fields]);

  // Save Document
  const handleSaveDocument = async () => {
    if (!validation.valid) {
      const missingNames = validation.missingFields
        .map((f) => (docLanguage === 'mr' ? f.label_mr : f.label_en))
        .join(', ');
      error(
        docLanguage === 'mr' ? 'आवश्यक रकाने बाकी आहेत' : 'Missing Required Fields',
        `${docLanguage === 'mr' ? 'कृपया पुढील माहिती भरा: ' : 'Please fill: '} ${missingNames}`
      );
      return;
    }

    try {
      setIsSaving(true);
      const saved = await saveDocument({
        id: existingDoc?.id,
        caseId: caseRecord?.id || 'general',
        templateId: template.id,
        language: docLanguage,
        fields,
        savedBy: profile?.name || 'Officer',
      });

      setIsSaving(false);
      success(
        docLanguage === 'mr' ? 'दस्तऐवज जतन केला!' : 'Document Saved!',
        docLanguage === 'mr'
          ? `आवृत्ती v${saved.version || 1} सुरक्षितपणे साठवली गेली.`
          : `Version v${saved.version || 1} saved successfully.`
      );
      onSaved?.(saved);
    } catch (err) {
      console.error('Failed to save document:', err);
      setIsSaving(false);
      error('Save Failed', String(err));
    }
  };

  // Export PDF
  const handleExportPdf = async () => {
    if (!validation.valid) {
      const missingNames = validation.missingFields
        .map((f) => (docLanguage === 'mr' ? f.label_mr : f.label_en))
        .join(', ');
      error(
        docLanguage === 'mr' ? 'आवश्यक रकाने बाकी आहेत' : 'Missing Required Fields',
        `${docLanguage === 'mr' ? 'कृपया PDF काढण्यापूर्वी हे भरा: ' : 'Please complete before export: '} ${missingNames}`
      );
      return;
    }

    if (!printContainerRef.current) return;

    try {
      setIsExportingPdf(true);
      const isSample = Boolean(caseRecord?.isSample || existingDoc?.isSample);
      const fileName = `${template.id}_${caseRecord?.caseNo || 'NyaySaathi'}_${docLanguage.toUpperCase()}.pdf`;
      await exportPdf(printContainerRef.current, fileName, { isSample });
      setIsExportingPdf(false);
      success('PDF Exported', 'Document PDF downloaded successfully.');
    } catch (err) {
      console.error('PDF export failed:', err);
      setIsExportingPdf(false);
      error('PDF Failed', 'Could not render PDF document.');
    }
  };

  // Print Document
  const handlePrint = () => {
    printDocument();
  };

  // Share Document
  const handleShare = async () => {
    if (!printContainerRef.current) return;
    try {
      setIsExportingPdf(true);
      const isSample = Boolean(caseRecord?.isSample || existingDoc?.isSample);
      const fileName = `${template.id}_${caseRecord?.caseNo || 'NyaySaathi'}.pdf`;
      const res = await exportPdf(printContainerRef.current, fileName, { isSample });
      setIsExportingPdf(false);
      await shareDocument(res.blob, fileName, template.title_en);
    } catch (err) {
      setIsExportingPdf(false);
      console.warn('Share error:', err);
    }
  };

  // Restore older version
  const handleRestoreVersion = (ver: DocumentVersion) => {
    setFields({ ...ver.fields });
    setDocLanguage(ver.language);
    setShowVersionHistory(false);
    success(
      'Version Restored',
      `Restored fields from version v${ver.version} (${formatDateTime(ver.savedAt)})`
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Template Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-navy-900 border border-navy-700">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="warning" size="sm">
              {template.badge}
            </Badge>
            <Badge variant="info" size="sm">
              {template.legalRef.act} {template.legalRef.section}
              {template.legalRef.subSection ? `(${template.legalRef.subSection})` : ''}
            </Badge>
            {existingDoc?.version && (
              <Badge variant="success" size="sm">
                v{existingDoc.version}
              </Badge>
            )}
          </div>
          <h2 className="text-lg font-bold text-white mt-1.5">
            {docLanguage === 'mr' ? template.title_mr : template.title_en}
          </h2>
          <p className="text-xs text-muted mt-0.5">
            {docLanguage === 'mr' ? template.description_mr : template.description_en}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Language Switch */}
          <div className="flex bg-navy-950 p-1 rounded-xl border border-navy-700 text-xs">
            <button
              type="button"
              onClick={() => setDocLanguage('en')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                docLanguage === 'en'
                  ? 'bg-saffron text-navy-950 shadow-xs'
                  : 'text-muted hover:text-white'
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setDocLanguage('mr')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                docLanguage === 'mr'
                  ? 'bg-saffron text-navy-950 shadow-xs'
                  : 'text-muted hover:text-white'
              }`}
            >
              मराठी (Marathi)
            </button>
          </div>

          {/* Versions History button */}
          {existingDoc?.versions && existingDoc.versions.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowVersionHistory(true)}
              icon={<History className="w-4 h-4 text-sky-400" />}
            >
              {appLanguage === 'mr' ? 'आवृत्ती इतिहास' : 'History'} ({existingDoc.versions.length})
            </Button>
          )}

          {/* Save button */}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleSaveDocument}
            loading={isSaving}
            icon={<Save className="w-4 h-4" />}
          >
            {appLanguage === 'mr' ? 'जतन करा' : 'Save'}
          </Button>

          {/* PDF export button */}
          <Button
            variant="primary"
            size="sm"
            onClick={handleExportPdf}
            loading={isExportingPdf}
            icon={<Download className="w-4 h-4" />}
          >
            {appLanguage === 'mr' ? 'PDF डाउनलोड' : 'Download PDF'}
          </Button>

          {/* Print button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrint}
            icon={<Printer className="w-4 h-4" />}
          >
            {appLanguage === 'mr' ? 'प्रिंट' : 'Print'}
          </Button>
        </div>
      </div>

      {/* Main Grid: Form Editor & Live A4 Print Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form Editor (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card
            header={
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-saffron" />
                  <span className="font-semibold text-white text-sm">
                    {appLanguage === 'mr' ? 'दस्तऐवज तपशील भरा' : 'Fill Document Fields'}
                  </span>
                </div>
                {!validation.valid && (
                  <span className="text-[11px] text-amber-400 font-medium">
                    {validation.missingFields.length} {appLanguage === 'mr' ? 'रकाने आवश्यक' : 'required'}
                  </span>
                )}
              </div>
            }
          >
            <div className="space-y-4">
              {template.fields.map((field) => {
                const label = docLanguage === 'mr' ? field.label_mr : field.label_en;
                const placeholder =
                  docLanguage === 'mr'
                    ? field.placeholder_mr || field.placeholder_en
                    : field.placeholder_en;
                const value = fields[field.key] ?? '';

                if (field.type === 'textarea') {
                  return (
                    <Textarea
                      key={field.key}
                      label={label}
                      value={value}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      placeholder={placeholder}
                      required={field.required}
                      rows={3}
                    />
                  );
                }

                if (field.type === 'select' && field.options) {
                  return (
                    <Select
                      key={field.key}
                      label={label}
                      value={value}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      required={field.required}
                      options={field.options.map((opt) => ({
                        value: opt.value,
                        label: docLanguage === 'mr' ? opt.label_mr : opt.label_en,
                      }))}
                    />
                  );
                }

                if (field.type === 'checkbox') {
                  return (
                    <Checkbox
                      key={field.key}
                      checked={Boolean(value)}
                      onChange={(e) => handleFieldChange(field.key, e.target.checked)}
                      label={label}
                    />
                  );
                }

                return (
                  <Input
                    key={field.key}
                    type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                    label={label}
                    value={value}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    placeholder={placeholder}
                    required={field.required}
                  />
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right Column: Live A4 Printable Preview (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between text-xs text-muted px-1">
            <span className="flex items-center gap-1.5 font-medium">
              <Eye className="w-3.5 h-3.5 text-saffron" />
              <span>{appLanguage === 'mr' ? 'थेट A4 पूर्वावलोकन' : 'Live A4 Print Preview'}</span>
            </span>
            <span className="font-mono text-[11px]">794 x 1123 px (A4 standard)</span>
          </div>

          <div className="overflow-x-auto p-4 bg-navy-950 rounded-2xl border border-navy-700 flex justify-center shadow-inner">
            <div
              ref={printContainerRef}
              className="w-[794px] min-h-[1123px] bg-white text-slate-900 p-12 shadow-2xl font-serif text-[13px] leading-relaxed relative flex flex-col justify-between"
              style={{ boxSizing: 'border-box' }}
            >
              {template.renderPrintLayout(fields, {
                caseRecord,
                profile,
                evidence,
                language: docLanguage,
              })}
            </div>
          </div>
        </div>
      </div>

      {/* VERSION HISTORY MODAL */}
      <Modal
        isOpen={showVersionHistory}
        onClose={() => setShowVersionHistory(false)}
        title={
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-saffron" />
            <span>{appLanguage === 'mr' ? 'दस्तऐवज आवृत्ती इतिहास' : 'Document Version History'}</span>
          </div>
        }
      >
        <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
          <p className="text-xs text-muted">
            {appLanguage === 'mr'
              ? 'प्रत्येक वेळी जतन केल्यावर जुनी प्रत सुरक्षित राहते. आपण मागील कोणत्याही आवृत्तीतील माहिती पुनर्संचयित करू शकता.'
              : 'Every revision creates an immutable version snapshot. You can inspect or restore previous states below.'}
          </p>

          <div className="space-y-2">
            {existingDoc?.versions?.map((ver, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-navy-900 border border-navy-700 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="info" size="sm">
                      v{ver.version}
                    </Badge>
                    <span className="text-white font-mono font-semibold">
                      {formatDateTime(ver.savedAt)}
                    </span>
                    <span className="text-muted font-sans uppercase">({ver.language})</span>
                  </div>
                  <p className="text-[11px] text-muted mt-1">
                    Saved by: <strong className="text-slate-300">{ver.savedBy || 'Officer'}</strong>
                  </p>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleRestoreVersion(ver)}
                >
                  {appLanguage === 'mr' ? 'पुनर्संचयित करा' : 'Restore'}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
};
