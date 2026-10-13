import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useParams, useNavigate, Link } from 'react-router-dom';
import {
  FileText,
  Printer,
  Download,
  Plus,
  Trash2,
  ExternalLink,
  Shield,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Sparkles,
  Camera,
  Layers,
  ArrowLeft,
  ChevronRight,
  FileCheck2,
  History,
  Lock,
  User,
  Eye,
  AlertTriangle,
} from 'lucide-react';
import {
  useLiveData,
  listAllDocuments,
  listCases,
  listAllEvidence,
  getProfile,
  deleteDocument,
  getDocument,
} from '../../lib/db/index.ts';
import {
  DocumentRecord,
  CaseRecord,
  EvidenceRecord,
} from '../../types/database.ts';
import { DOCUMENT_TEMPLATES, DocumentTemplate } from '../../data/templates.tsx';
import { getTemplateById } from '../../lib/documents/engine.ts';
import { DocumentBuilder } from '../../components/documents/DocumentBuilder.tsx';
import { Section63CertificateView } from '../../components/certificate/Section63CertificateView.tsx';
import { useI18n, formatDateTime, formatDate } from '../../i18n/index.ts';
import { useToast } from '../../components/ui/Toast.tsx';
import {
  Button,
  Badge,
  Card,
  Tabs,
  ConfirmDialog,
  EmptyState,
  Skeleton,
} from '../../components/ui/index.ts';

export const DocumentsPage: React.FC = () => {
  const { docId } = useParams<{ docId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t, language } = useI18n();
  const { success, error, info } = useToast();

  const [activeTab, setActiveTab] = useState<'templates' | 'saved'>(
    docId ? 'templates' : (searchParams.get('tab') as 'templates' | 'saved') || 'templates'
  );
  const [selectedCaseId, setSelectedCaseId] = useState<string>(searchParams.get('caseId') || '');
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string>(searchParams.get('evidenceId') || '');
  const [activeTemplateId, setActiveTemplateId] = useState<string>(
    searchParams.get('template') || 'arrest_memo'
  );
  const [templateCategoryFilter, setTemplateCategoryFilter] = useState<string>('all');
  const [templateSearchQuery, setTemplateSearchQuery] = useState<string>('');

  // Saved documents search & filters
  const [savedSearchQuery, setSavedSearchQuery] = useState<string>('');
  const [savedCaseFilter, setSavedCaseFilter] = useState<string>('all');
  const [savedTemplateFilter, setSavedTemplateFilter] = useState<string>('all');

  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [docToDelete, setDocToDelete] = useState<string | null>(null);

  // Fetch all documents
  const { data: documents = [], loading: loadingDocs } = useLiveData<DocumentRecord[]>(
    () => listAllDocuments(),
    ['documents']
  );

  // Fetch all cases
  const { data: cases = [], loading: loadingCases } = useLiveData<CaseRecord[]>(
    () => listCases('all'),
    ['cases']
  );

  // Fetch all evidence
  const { data: allEvidence = [] } = useLiveData<EvidenceRecord[]>(
    () => listAllEvidence(),
    ['evidence']
  );

  // Officer Profile
  const { data: profile } = useLiveData(() => getProfile(), ['profile']);

  // If docId is in URL, fetch that document
  const { data: existingDoc } = useLiveData<DocumentRecord | null>(
    () => (docId ? getDocument(docId) : Promise.resolve(null)),
    ['documents'],
    [docId]
  );

  // When existing document is loaded from URL param docId
  useEffect(() => {
    if (existingDoc) {
      if (existingDoc.caseId) setSelectedCaseId(existingDoc.caseId);
      if (existingDoc.templateId) setActiveTemplateId(existingDoc.templateId);
      setActiveTab('templates');
    }
  }, [existingDoc]);

  // Set default case if not selected
  useEffect(() => {
    if (!selectedCaseId && cases.length > 0) {
      setSelectedCaseId(cases[0].id);
    }
  }, [cases, selectedCaseId]);

  // Evidence options for selected case
  const availableEvidence = useMemo(() => {
    if (!selectedCaseId) return allEvidence;
    return allEvidence.filter((ev) => ev.caseId === selectedCaseId);
  }, [allEvidence, selectedCaseId]);

  // Set default evidence when case changes
  useEffect(() => {
    if (availableEvidence.length > 0 && (!selectedEvidenceId || !availableEvidence.some((e) => e.id === selectedEvidenceId))) {
      setSelectedEvidenceId(availableEvidence[0].id);
    }
  }, [availableEvidence, selectedEvidenceId]);

  const activeEvidence = useMemo(() => {
    return allEvidence.find((ev) => ev.id === selectedEvidenceId) || availableEvidence[0] || null;
  }, [allEvidence, selectedEvidenceId, availableEvidence]);

  const activeCase = useMemo(() => {
    return cases.find((c) => c.id === selectedCaseId) || null;
  }, [cases, selectedCaseId]);

  // Resolve active template from registry
  const currentTemplate = useMemo(() => {
    return getTemplateById(activeTemplateId) || DOCUMENT_TEMPLATES[0];
  }, [activeTemplateId]);

  // Filtered Templates Grid
  const filteredTemplates = useMemo(() => {
    return DOCUMENT_TEMPLATES.filter((tmpl) => {
      // Category filter
      if (templateCategoryFilter !== 'all' && tmpl.category !== templateCategoryFilter) {
        return false;
      }
      // Search query
      if (templateSearchQuery.trim()) {
        const q = templateSearchQuery.toLowerCase();
        const matchTitle = tmpl.title_en.toLowerCase().includes(q) || tmpl.title_mr.toLowerCase().includes(q);
        const matchStatute = tmpl.legalRef.act.toLowerCase().includes(q) || tmpl.legalRef.section.toLowerCase().includes(q);
        const matchDesc = tmpl.description_en.toLowerCase().includes(q) || tmpl.description_mr.toLowerCase().includes(q);
        return matchTitle || matchStatute || matchDesc;
      }
      return true;
    });
  }, [templateCategoryFilter, templateSearchQuery]);

  // Filtered Saved Documents
  const filteredSavedDocuments = useMemo(() => {
    return documents.filter((doc) => {
      // Case filter
      if (savedCaseFilter !== 'all' && doc.caseId !== savedCaseFilter) {
        return false;
      }
      // Template filter
      if (savedTemplateFilter !== 'all' && doc.templateId !== savedTemplateFilter) {
        return false;
      }
      // Search query
      if (savedSearchQuery.trim()) {
        const q = savedSearchQuery.toLowerCase();
        const tmpl = getTemplateById(doc.templateId);
        const matchedCase = cases.find((c) => c.id === doc.caseId);

        const matchTmpl = tmpl ? tmpl.title_en.toLowerCase().includes(q) || tmpl.title_mr.toLowerCase().includes(q) : false;
        const matchCase = matchedCase ? matchedCase.caseNo.toLowerCase().includes(q) || matchedCase.firNo.toLowerCase().includes(q) : false;
        return matchTmpl || matchCase || doc.id.toLowerCase().includes(q);
      }
      return true;
    });
  }, [documents, savedCaseFilter, savedTemplateFilter, savedSearchQuery, cases]);

  const handleDelete = async () => {
    if (!docToDelete) return;
    try {
      await deleteDocument(docToDelete);
      success(language === 'mr' ? 'दस्तऐवज हटवला' : 'Document Deleted', 'Document record removed from local store.');
    } catch (err) {
      error('Delete Failed', String(err));
    } finally {
      setShowDeleteConfirm(false);
      setDocToDelete(null);
    }
  };

  const tabsList = [
    {
      id: 'templates',
      label: language === 'mr' ? 'कायदेशीर नमुने (Templates)' : 'Document Generator',
      badgeVariant: 'neutral' as const,
    },
    {
      id: 'saved',
      label: language === 'mr' ? 'जतन केलेले दस्तऐवज (Saved)' : 'Saved Documents',
      count: documents.length,
      badgeVariant: documents.length > 0 ? ('success' as const) : ('neutral' as const),
    },
  ];

  return (
    <div className="min-w-0 max-w-6xl mx-auto space-y-6 pb-24 px-4 sm:px-6 pt-2">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-saffron/15 text-saffron border border-saffron/30">
              <FileText className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {language === 'mr' ? 'कायदेशीर दस्तऐवज प्रणाली' : 'Legal Document System'}
            </h1>
          </div>
          <p className="text-xs text-muted mt-1">
            {language === 'mr'
              ? 'BNSS २०२३ व BSA २०२३ अंतर्गत वैधानिक नमुने, अटक पंचनामे, नोटीस व अहवाल (A4 PDF निर्यातीसह)'
              : 'Statutory templates under BNSS 2023 & BSA 2023 with on-device A4 PDF rendering and version tracking.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="warning" size="sm">
            {language === 'mr' ? 'प्रारूप कायदेशीर पुनरावलोकन प्रलंबित' : 'Format Pending Legal Review'}
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={tabsList}
        activeTab={activeTab}
        onChange={(id) => {
          setActiveTab(id as typeof activeTab);
          setSearchParams({ tab: id });
        }}
        variant="pill"
      />

      {/* TAB 1: TEMPLATES & BUILDER */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          {/* Case & Evidence Selector Bar */}
          <Card className="p-4 bg-navy-900 border-navy-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Case Picker */}
              <div>
                <label className="text-xs font-semibold text-white block mb-1.5 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-saffron" />
                  <span>{language === 'mr' ? 'संबंधित गुन्हा निवडा (Case Reference)' : 'Target Case Reference'}</span>
                </label>
                {cases.length === 0 ? (
                  <div className="text-xs text-muted p-2 bg-navy-950 rounded-xl border border-navy-800">
                    {language === 'mr' ? 'गुन्हे उपलब्ध नाहीत. ' : 'No cases registered. '}{' '}
                    <Link to="/cases/new" className="text-saffron underline font-semibold">
                      {language === 'mr' ? 'नवीन गुन्हा नोंदवा' : 'Register a case'}
                    </Link>
                  </div>
                ) : (
                  <select
                    value={selectedCaseId}
                    onChange={(e) => setSelectedCaseId(e.target.value)}
                    className="w-full px-3 py-2 bg-navy-950 border border-navy-700 rounded-xl text-white text-xs focus:border-saffron focus:outline-none"
                  >
                    {cases.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.caseNo} ({c.firNo}) - {c.policeStation}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Digital Evidence Picker (if applicable) */}
              <div>
                <label className="text-xs font-semibold text-white block mb-1.5 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-blue-400" />
                  <span>{language === 'mr' ? 'संबंधित डिजिटल पुरावा (ऐच्छिक)' : 'Linked Digital Evidence (Optional)'}</span>
                </label>
                {availableEvidence.length === 0 ? (
                  <div className="text-xs text-muted p-2 bg-navy-950 rounded-xl border border-navy-800">
                    {language === 'mr' ? 'या गुन्ह्यात डिजिटल पुरावे नाहीत' : 'No evidence files in this case'}
                  </div>
                ) : (
                  <select
                    value={selectedEvidenceId}
                    onChange={(e) => setSelectedEvidenceId(e.target.value)}
                    className="w-full px-3 py-2 bg-navy-950 border border-navy-700 rounded-xl text-white text-xs focus:border-saffron focus:outline-none"
                  >
                    {availableEvidence.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.exhibitNo} - {ev.fileName} ({ev.sha256.slice(0, 10)}...)
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </Card>

          {/* Template Catalog Grid & Search */}
          {!docId && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Search Bar */}
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-muted absolute left-3 top-3" />
                  <input
                    type="text"
                    value={templateSearchQuery}
                    onChange={(e) => setTemplateSearchQuery(e.target.value)}
                    placeholder={
                      language === 'mr'
                        ? 'कायदेशीर नमुने शोधा (कलम, शीर्षक)...'
                        : 'Search templates by section or title...'
                    }
                    className="w-full pl-9 pr-4 py-2 bg-navy-950 border border-navy-700 rounded-xl text-white text-xs focus:border-saffron focus:outline-none"
                  />
                </div>

                {/* Category Filter Chips */}
                <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                  {[
                    { id: 'all', label: language === 'mr' ? 'सर्व' : 'All' },
                    { id: 'arrest', label: language === 'mr' ? 'अटक (Arrest)' : 'Arrest' },
                    { id: 'investigation', label: language === 'mr' ? 'तपास (Investigation)' : 'Investigation' },
                    { id: 'seizure', label: language === 'mr' ? 'झडती व जप्ती' : 'Seizure' },
                    { id: 'evidence', label: language === 'mr' ? 'पुरावे (FSL)' : 'Forensic' },
                    { id: 'victim', label: language === 'mr' ? 'फिर्यादी / पीडित' : 'Victim Rights' },
                    { id: 'medical', label: language === 'mr' ? 'वैद्यकीय' : 'Medical' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setTemplateCategoryFilter(cat.id)}
                      className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                        templateCategoryFilter === cat.id
                          ? 'bg-saffron text-navy-950 font-bold'
                          : 'bg-navy-900 border border-navy-700 text-slate-300 hover:text-white'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Template Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredTemplates.map((tmpl) => {
                  const isSelected = activeTemplateId === tmpl.id;
                  return (
                    <div
                      key={tmpl.id}
                      onClick={() => {
                        setActiveTemplateId(tmpl.id);
                        setSearchParams({ template: tmpl.id, caseId: selectedCaseId });
                      }}
                      className={`p-3.5 rounded-2xl cursor-pointer transition-all border flex flex-col justify-between gap-2.5 ${
                        isSelected
                          ? 'border-saffron bg-saffron/10 ring-1 ring-saffron shadow-sm'
                          : 'border-navy-700 bg-navy-900/80 hover:bg-navy-900 hover:border-navy-600'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-navy-950 border border-saffron/30 text-[10px] font-mono font-bold text-saffron">
                            {tmpl.legalRef.act} {tmpl.legalRef.section}
                          </span>
                          <Badge variant={isSelected ? 'warning' : 'neutral'} size="sm">
                            {tmpl.badge}
                          </Badge>
                        </div>
                        <h3 className="font-bold text-white text-xs sm:text-sm line-clamp-1">
                          {language === 'mr' ? tmpl.title_mr : tmpl.title_en}
                        </h3>
                        <p className="text-[11px] text-muted line-clamp-2 leading-relaxed">
                          {language === 'mr' ? tmpl.description_mr : tmpl.description_en}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-navy-800 text-[11px] text-saffron font-semibold">
                        <span>{isSelected ? (language === 'mr' ? 'निवडलेला नमुना' : 'Active Template') : (language === 'mr' ? 'तयार करा' : 'Build Document')}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ACTIVE TEMPLATE BUILDER */}
          {activeTemplateId === 'sec_63_bsa_certificate' ? (
            <Card className="p-4 sm:p-6 bg-navy-900 border-navy-700">
              {activeEvidence ? (
                <Section63CertificateView
                  evidence={activeEvidence}
                  caseRecord={activeCase}
                  officerProfile={profile}
                  onSaved={() => {
                    success('Saved', 'Section 63 BSA certificate saved successfully.');
                    setActiveTab('saved');
                  }}
                />
              ) : (
                <EmptyState
                  icon={<FileCheck2 className="w-12 h-12 text-muted" />}
                  title={language === 'mr' ? 'पुरावा निवडा' : 'Select an Evidence Record'}
                  description={
                    language === 'mr'
                      ? 'BSA कलम ६३ प्रमाणपत्र तयार करण्यासाठी वरील यादीतून पुरावा निवडा किंवा /evidence/new मध्ये जाऊन नवीन पुरावा नोंदवा.'
                      : 'Please select an evidence file above to generate the Section 63 BSA certificate with SHA-256 hash.'
                  }
                />
              )}
            </Card>
          ) : (
            <DocumentBuilder
              key={`${currentTemplate.id}-${existingDoc?.id || 'new'}-${selectedCaseId}`}
              template={currentTemplate}
              caseRecord={activeCase}
              evidence={activeEvidence}
              existingDoc={existingDoc}
              onSaved={(doc) => {
                // If this was new, route to its docId
                if (!docId) {
                  navigate(`/documents/${doc.id}`);
                }
              }}
            />
          )}
        </div>
      )}

      {/* TAB 2: SAVED DOCUMENTS LIST */}
      {activeTab === 'saved' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="p-4 rounded-2xl bg-navy-900 border border-navy-700 flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-muted absolute left-3 top-3" />
              <input
                type="text"
                value={savedSearchQuery}
                onChange={(e) => setSavedSearchQuery(e.target.value)}
                placeholder={
                  language === 'mr'
                    ? 'जतन केलेले दस्तऐवज शोधा (गुन्हा क्र., एफआयआर, शीर्षक)...'
                    : 'Search saved documents by case, FIR, or template title...'
                }
                className="w-full pl-9 pr-4 py-2 bg-navy-950 border border-navy-700 rounded-xl text-white text-xs focus:border-saffron focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={savedCaseFilter}
                onChange={(e) => setSavedCaseFilter(e.target.value)}
                className="px-3 py-2 bg-navy-950 border border-navy-700 rounded-xl text-white text-xs focus:border-saffron focus:outline-none flex-1 sm:flex-initial"
              >
                <option value="all">{language === 'mr' ? 'सर्व गुन्हे' : 'All Cases'}</option>
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.caseNo} ({c.firNo})
                  </option>
                ))}
              </select>

              <select
                value={savedTemplateFilter}
                onChange={(e) => setSavedTemplateFilter(e.target.value)}
                className="px-3 py-2 bg-navy-950 border border-navy-700 rounded-xl text-white text-xs focus:border-saffron focus:outline-none flex-1 sm:flex-initial"
              >
                <option value="all">{language === 'mr' ? 'सर्व नमुने' : 'All Templates'}</option>
                {DOCUMENT_TEMPLATES.map((tmpl) => (
                  <option key={tmpl.id} value={tmpl.id}>
                    {tmpl.title_en}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Saved Documents Cards / Table */}
          {filteredSavedDocuments.length === 0 ? (
            <EmptyState
              icon={<FileText className="w-12 h-12 text-muted" />}
              title={language === 'mr' ? 'कोणतेही जतन केलेले दस्तऐवज नाहीत' : 'No Saved Documents Found'}
              description={
                language === 'mr'
                  ? 'तुम्ही तयार केलेले दस्तऐवज येथे सुरक्षित साठवले जातात. नवीन दस्तऐवज तयार करण्यासाठी "कायदेशीर नमुने" टॅब वापरा.'
                  : 'Generated legal documents, arrest memos, and notices will appear here with version tracking.'
              }
              actionLabel={language === 'mr' ? 'नवीन दस्तऐवज तयार करा' : 'Create First Document'}
              onAction={() => setActiveTab('templates')}
            />
          ) : (
            <div className="space-y-3">
              {filteredSavedDocuments.map((doc) => {
                const tmpl = getTemplateById(doc.templateId);
                const linkedCase = cases.find((c) => c.id === doc.caseId);
                const title = tmpl
                  ? language === 'mr'
                    ? tmpl.title_mr
                    : tmpl.title_en
                  : doc.templateId;

                return (
                  <div
                    key={doc.id}
                    className="p-4 rounded-2xl bg-navy-900 border border-navy-700 hover:border-navy-600 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{title}</span>
                        {doc.isSample && (
                          <Badge variant="neutral" size="sm">
                            {language === 'mr' ? 'नमुना' : 'SAMPLE'}
                          </Badge>
                        )}
                        <Badge variant="info" size="sm">
                          v{doc.version || 1}
                        </Badge>
                        <span className="text-[10px] font-mono uppercase bg-navy-950 px-2 py-0.5 rounded text-muted">
                          {doc.language || 'en'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-muted text-[11px]">
                        <span>
                          Case: <strong className="text-slate-300">{linkedCase?.caseNo || doc.caseId}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          FIR: <strong className="text-slate-300">{linkedCase?.firNo || '-'}</strong>
                        </span>
                        <span>•</span>
                        <span>Saved: {formatDateTime(doc.updatedAt || doc.createdAt)}</span>
                        {doc.versions && doc.versions.length > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-sky-400 font-medium">
                              {doc.versions.length} revisions in history
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => navigate(`/documents/${doc.id}`)}
                        icon={<Eye className="w-3.5 h-3.5" />}
                      >
                        {language === 'mr' ? 'पहा / संपादन' : 'Open in Builder'}
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDocToDelete(doc.id);
                          setShowDeleteConfirm(true);
                        }}
                        icon={<Trash2 className="w-3.5 h-3.5 text-danger" />}
                      >
                        {language === 'mr' ? 'हटवा' : 'Delete'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title={language === 'mr' ? 'दस्तऐवज हटवायचा का?' : 'Delete Saved Document?'}
        message={
          language === 'mr'
            ? 'आपण हा जतन केलेला दस्तऐवज कायमचा हटवू इच्छिता का? ही क्रिया पूर्ववत करता येणार नाही.'
            : 'Are you sure you want to permanently delete this saved legal document? This action cannot be undone.'
        }
        confirmText={language === 'mr' ? 'होय, हटवा' : 'Delete Document'}
        cancelText={language === 'mr' ? 'रद्द करा' : 'Cancel'}
        onConfirm={handleDelete}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDocToDelete(null);
        }}
      />
    </div>
  );
};
