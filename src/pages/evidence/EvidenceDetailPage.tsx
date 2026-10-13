import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Plus,
  Printer,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  FileText,
  Camera,
  Video,
  Music,
  MapPin,
  User,
  Building,
  AlertTriangle,
  Lock,
  Unlock,
  ExternalLink,
  Info,
  Calendar,
  Sparkles,
  FileCheck,
  Trash2,
  Share2,
} from 'lucide-react';
import {
  useLiveData,
  getEvidence,
  getEvidenceBlob,
  deleteEvidence,
  getCase,
  getProfile,
  addAuditLog,
} from '../../lib/db/index.ts';
import {
  CustodyLogRecord,
  EvidenceRecord,
  CaseRecord,
} from '../../types/database.ts';
import {
  verifyChain,
  appendCustodyEntry,
  getNextSuggestedAction,
  CUSTODY_ACTIONS,
  CustodyAction,
  VerifyChainResult,
} from '../../lib/custody/index.ts';
import { useI18n, formatDateTime, formatDate } from '../../i18n/index.ts';
import { useToast } from '../../components/ui/Toast.tsx';
import { Section63CertificateView } from '../../components/certificate/Section63CertificateView.tsx';
import {
  Button,
  Badge,
  Card,
  Tabs,
  BottomSheet,
  ConfirmDialog,
  Skeleton,
  EmptyState,
} from '../../components/ui/index.ts';

export const EvidenceDetailPage: React.FC = () => {
  const { evidenceId } = useParams<{ evidenceId: string }>();
  const navigate = useNavigate();
  const { t, language } = useI18n();
  const { success, error, info } = useToast();

  const [activeTab, setActiveTab] = useState<'custody' | 'details' | 'verify' | 'certificate'>('custody');
  const [copiedHash, setCopiedHash] = useState<boolean>(false);
  const [copiedEntryHash, setCopiedEntryHash] = useState<string | null>(null);
  const [expandedHashes, setExpandedHashes] = useState<Record<string, boolean>>({});

  // Add Custody Entry Modal State
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [action, setAction] = useState<CustodyAction>('Transferred');
  const [fromPerson, setFromPerson] = useState<string>('');
  const [toPerson, setToPerson] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [transferDateTime, setTransferDateTime] = useState<string>('');
  const [timeError, setTimeError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Print Preview Modal State
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Live Evidence Data
  const { data: evidence, loading: loadingEvidence } = useLiveData<EvidenceRecord | null>(
    () => (evidenceId ? getEvidence(evidenceId) : Promise.resolve(null)),
    ['evidence'],
    [evidenceId]
  );

  // Live Case Record
  const { data: currentCase } = useLiveData<CaseRecord | null>(
    () => (evidence?.caseId ? getCase(evidence.caseId) : Promise.resolve(null)),
    ['cases'],
    [evidence?.caseId]
  );

  // Live Officer Profile
  const { data: profile } = useLiveData(() => getProfile(), ['profile']);

  // Live Evidence Blob (for preview)
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    let url: string | null = null;
    if (evidenceId) {
      getEvidenceBlob(evidenceId).then((blob) => {
        if (active && blob) {
          url = URL.createObjectURL(blob);
          setBlobUrl(url);
        }
      });
    }
    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [evidenceId]);

  // Live Chain Verification
  const [chainResult, setChainResult] = useState<VerifyChainResult | null>(null);
  const [verifying, setVerifying] = useState<boolean>(true);

  const runVerification = useCallback(async () => {
    if (!evidenceId) return;
    setVerifying(true);
    try {
      const res = await verifyChain(evidenceId);
      setChainResult(res);
    } catch (err) {
      console.error('Failed to verify custody chain:', err);
    } finally {
      setVerifying(false);
    }
  }, [evidenceId]);

  // Re-verify whenever evidence or custody changes
  useEffect(() => {
    runVerification();
  }, [runVerification]);

  const custodyEntries = useMemo(() => {
    return chainResult?.entries || [];
  }, [chainResult]);

  const lastEntry = useMemo(() => {
    if (custodyEntries.length === 0) return null;
    return custodyEntries[custodyEntries.length - 1];
  }, [custodyEntries]);

  // Pre-fill next action & handlers when opening Add Modal
  const handleOpenAddModal = () => {
    const suggested = getNextSuggestedAction(lastEntry?.action);
    setAction(suggested);

    // Pre-fill from person from last entry's to person
    const defaultFrom = lastEntry?.toPerson || profile?.name || 'PSI Ramesh Patil';
    setFromPerson(defaultFrom);
    setToPerson('');
    setLocation(lastEntry?.location || profile?.station || 'Shivaji Nagar PS Malkhana');
    setRemarks('');

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const localIso = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
    setTransferDateTime(localIso);
    setTimeError(null);
    setShowAddModal(true);
  };

  // Validate date is not before previous entry
  const handleDateTimeChange = (val: string) => {
    setTransferDateTime(val);
    if (lastEntry) {
      const prevTime = new Date(lastEntry.timestamp).getTime();
      const newTime = new Date(val).getTime();
      if (newTime < prevTime) {
        setTimeError(
          t('chainOfCustody.timestampError', {
            time: formatDateTime(lastEntry.timestamp),
          })
        );
      } else {
        setTimeError(null);
      }
    } else {
      setTimeError(null);
    }
  };

  // Submit Custody Log
  const handleSaveCustodyEntry = async () => {
    if (!evidenceId || !fromPerson.trim() || !toPerson.trim()) return;

    if (lastEntry) {
      const prevTime = new Date(lastEntry.timestamp).getTime();
      const currTime = new Date(transferDateTime).getTime();
      if (currTime < prevTime) {
        setTimeError(
          t('chainOfCustody.timestampError', {
            time: formatDateTime(lastEntry.timestamp),
          })
        );
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const newRecord = await appendCustodyEntry({
        evidenceId,
        action,
        fromPerson: fromPerson.trim(),
        toPerson: toPerson.trim(),
        location: location.trim(),
        remarks: remarks.trim(),
        timestamp: new Date(transferDateTime).toISOString(),
      });

      success(
        language === 'mr' ? 'ताबा नोंद यशस्वीपणे जोडली गेली' : 'Custody entry appended to chain',
        t('chainOfCustody.appendSuccess', { seq: newRecord.seq })
      );
      setShowAddModal(false);
      await runVerification();
    } catch (err) {
      console.error('Failed to append custody entry:', err);
      error(
        language === 'mr' ? 'नोंद जोडताना त्रुटी आली' : 'Failed to append custody entry',
        String(err)
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Copy SHA-256 hash
  const handleCopyHash = (text: string, isEntryId?: string) => {
    navigator.clipboard.writeText(text);
    if (isEntryId) {
      setCopiedEntryHash(isEntryId);
      setTimeout(() => setCopiedEntryHash(null), 2000);
    } else {
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    }
    info(t('chainOfCustody.copiedToast'));
  };

  // Toggle Hash Expansion
  const toggleHashExpansion = (id: string) => {
    setExpandedHashes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Delete Evidence Handler with strong warning
  const handleDeleteEvidence = async () => {
    if (!evidenceId) return;
    setIsDeleting(true);
    try {
      await deleteEvidence(evidenceId);
      await addAuditLog('evidence_deleted', `Deleted evidence record: ${evidence?.exhibitNo} (${evidenceId})`);
      success(
        language === 'mr' ? 'पुरावा फाईल हटवली गेली' : 'Evidence Deleted',
        language === 'mr' ? 'पुरावा रेकॉर्ड यशस्वीपणे काढले.' : 'Evidence record was permanently removed.'
      );
      navigate(currentCase ? `/cases/${currentCase.id}` : '/cases');
    } catch (err) {
      console.error('Failed to delete evidence:', err);
      error('Error', String(err));
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  if (loadingEvidence || verifying) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-6 px-4">
        <Skeleton className="w-full h-24 rounded-2xl" />
        <Skeleton className="w-full h-14 rounded-2xl" />
        <Skeleton className="w-full h-80 rounded-2xl" />
      </div>
    );
  }

  if (!evidence) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4">
        <EmptyState
          icon={<AlertTriangle className="w-12 h-12 text-muted" />}
          title={language === 'mr' ? 'पुरावा सापडला नाही' : 'Evidence Exhibit Not Found'}
          description={
            language === 'mr'
              ? 'हा पुरावा रेकॉर्ड डेटाबेसमध्ये उपलब्ध नाही किंवा हटवला गेला असावा.'
              : 'The requested evidence exhibit does not exist in local IndexedDB storage.'
          }
          actionLabel={language === 'mr' ? 'प्रकरणांकडे परत' : 'Back to Cases'}
          onAction={() => navigate('/cases')}
        />
      </div>
    );
  }

  // Format full 64-char hash in readable blocks of 8
  const formatChunkedHash = (hash: string) => {
    if (!hash) return '';
    return hash.match(/.{1,8}/g)?.join(' ') || hash;
  };

  const tabsList = [
    {
      id: 'custody',
      label: language === 'mr' ? 'ताबा साखळी (Custody)' : 'Chain of Custody',
      count: custodyEntries.length,
      badgeVariant: chainResult?.ok ? ('success' as const) : ('danger' as const),
    },
    {
      id: 'details',
      label: language === 'mr' ? 'तपशील (Details)' : 'Exhibit Details',
      badgeVariant: 'neutral' as const,
    },
    {
      id: 'verify',
      label: language === 'mr' ? 'हॅश पडताळणी (Verify)' : 'Sec 63 Verify',
      badgeVariant: 'neutral' as const,
    },
    {
      id: 'certificate',
      label: language === 'mr' ? 'प्रमाणपत्र (Certificate)' : 'Certificate',
      badgeVariant: 'neutral' as const,
    },
  ];

  const suggestedNextAction = getNextSuggestedAction(lastEntry?.action);

  return (
    <div className="min-w-0 max-w-5xl mx-auto space-y-6 pb-24 px-4 sm:px-6 pt-2">
      {/* 1. TOP HEADER & METADATA BAR */}
      <div className="space-y-4 bg-navy-800/90 border border-navy-700 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <button
              type="button"
              onClick={() => (currentCase ? navigate(`/cases/${currentCase.id}`) : navigate(-1))}
              className="p-2.5 rounded-xl bg-navy-900 hover:bg-navy-700 text-muted hover:text-white border border-navy-700 transition-colors mt-0.5 sm:mt-0"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm px-2.5 py-0.5 rounded-lg bg-saffron/20 text-saffron border border-saffron/40 font-bold">
                  {evidence.exhibitNo}
                </span>
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight break-all">
                  {evidence.fileName}
                </h1>
                <Badge variant={evidence.sealed ? 'success' : 'warning'} size="sm">
                  {evidence.sealed ? (
                    <span className="flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      <span>{t('casesManager.sealedBadge')}</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Unlock className="w-3 h-3" />
                      <span>{t('casesManager.unsealedBadge')}</span>
                    </span>
                  )}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-muted mt-1.5">
                {currentCase && (
                  <>
                    <Link
                      to={`/cases/${currentCase.id}`}
                      className="text-saffron hover:underline font-semibold flex items-center gap-1"
                    >
                      <span>FIR {currentCase.firNo}</span>
                      <span className="text-muted">({currentCase.policeStation})</span>
                    </Link>
                    <span>•</span>
                  </>
                )}
                <span>{evidence.mimeType}</span>
                <span>•</span>
                <span>{(evidence.size / 1024).toFixed(1)} KB</span>
                <span>•</span>
                <span>{formatDateTime(evidence.loggedAt)}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Button
              variant="secondary"
              size="sm"
              icon={<Printer className="w-4 h-4" />}
              onClick={() => setShowPrintModal(true)}
            >
              {t('chainOfCustody.exportBtn')}
            </Button>

            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 text-muted hover:text-danger rounded-xl hover:bg-navy-700 border border-navy-700 transition-colors"
              title="Delete evidence exhibit"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* SHA-256 DIGITAL FINGERPRINT HERO BANNER */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-navy-900 border border-navy-700/80 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-saffron uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>SHA-256 Digital Fingerprint (Sec 63 BSA)</span>
            </span>

            <button
              type="button"
              onClick={() => handleCopyHash(evidence.sha256)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-navy-800 hover:bg-navy-700 text-xs font-semibold text-slate-300 hover:text-white border border-navy-600 transition-colors"
            >
              {copiedHash ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Hash</span>
                </>
              )}
            </button>
          </div>

          <div className="p-2.5 rounded-lg bg-navy-950 border border-navy-700 font-mono text-xs sm:text-sm text-emerald-300 tracking-wider break-all select-all">
            {formatChunkedHash(evidence.sha256)}
          </div>

          <p className="text-[11px] text-muted leading-relaxed">
            <span className="text-slate-300 font-semibold">Digital Fingerprint Rule:</span>{' '}
            {language === 'mr'
              ? 'डिजिटल फिंगरप्रिंट; जर फाईलमधील एक पिक्सेल किंवा बाईट जरी बदलला, तरी हा संपूर्ण ६४-अक्षरी हॅश क्षणात बदलतो.'
              : 'A digital fingerprint; if even one pixel or byte changes, the entire cryptographic fingerprint changes.'}
          </p>
        </div>
      </div>

      {/* 2. NAVIGATION TABS */}
      <Tabs
        tabs={tabsList}
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as typeof activeTab)}
        variant="pill"
      />

      {/* 3. TAB CONTENT */}
      {activeTab === 'custody' && (
        <div className="space-y-6">
          {/* BIG STATUS BANNER (GREEN OR RED) */}
          <div
            className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm ${
              chainResult?.ok
                ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-200'
                : 'bg-danger/15 border-danger/50 text-danger-light animate-pulse'
            }`}
          >
            <div className="flex items-start sm:items-center gap-3.5">
              <div
                className={`p-3 rounded-xl shrink-0 ${
                  chainResult?.ok
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-danger/20 text-danger border border-danger/40'
                }`}
              >
                {chainResult?.ok ? (
                  <ShieldCheck className="w-7 h-7" />
                ) : (
                  <ShieldAlert className="w-7 h-7" />
                )}
              </div>

              <div className="space-y-0.5">
                <h3 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                  <span>
                    {chainResult?.ok
                      ? t('chainOfCustody.intactBanner', { count: chainResult.totalEntries })
                      : t('chainOfCustody.brokenBanner', { seq: chainResult?.brokenSeq || 1 })}
                  </span>
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {chainResult?.ok
                    ? t('chainOfCustody.intactSubtext')
                    : t('chainOfCustody.brokenSubtext', {
                        reason:
                          (language === 'mr'
                            ? chainResult?.reason_mr || chainResult?.reason
                            : chainResult?.reason) || 'Cryptographic mismatch detected',
                      })}
                </p>
              </div>
            </div>

            {/* Add Entry Button */}
            <Button
              variant="primary"
              size="md"
              icon={<Plus className="w-4 h-4" />}
              onClick={handleOpenAddModal}
              className="shrink-0 self-start sm:self-auto"
            >
              {t('chainOfCustody.addEntryBtn')}
            </Button>
          </div>

          {/* EDUCATIONAL EXPLAINER: WHY EACH ENTRY CARRIES THE PREVIOUS HASH */}
          <div className="p-4 rounded-2xl bg-navy-800/80 border border-navy-700 space-y-2">
            <div className="flex items-center gap-2 text-saffron text-xs font-bold uppercase tracking-wider">
              <Info className="w-4 h-4" />
              <span>{t('chainOfCustody.whyHashTitle')}</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {t('chainOfCustody.whyHashExplanation')}
            </p>
          </div>

          {/* VERTICAL TIMELINE WITH SAFFRON LINE & NUMBERED NODES */}
          {custodyEntries.length === 0 ? (
            <Card className="p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-navy-900 border border-navy-700 flex items-center justify-center mx-auto text-saffron">
                <FileCheck className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-white">
                  {t('chainOfCustody.emptyTitle')}
                </h4>
                <p className="text-xs text-muted max-w-md mx-auto">
                  {t('chainOfCustody.emptyDesc')}
                </p>
              </div>
              <Button
                variant="primary"
                icon={<Plus className="w-4 h-4" />}
                onClick={handleOpenAddModal}
              >
                {t('chainOfCustody.addEntryBtn')}
              </Button>
            </Card>
          ) : (
            <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-saffron">
              {custodyEntries.map((item, idx) => {
                const isGenesis = item.seq === 1;
                const isExpanded = Boolean(expandedHashes[item.id]);
                const isCopied = copiedEntryHash === item.id;
                const isBrokenNode = chainResult && !chainResult.ok && chainResult.brokenSeq === item.seq;

                return (
                  <div key={item.id} className="relative group">
                    {/* Numbered Node on the Saffron Line */}
                    <div
                      className={`absolute -left-[31px] sm:-left-[35px] top-4 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold font-mono border-2 transition-all shadow-md z-10 ${
                        isBrokenNode
                          ? 'bg-danger text-white border-white animate-bounce'
                          : 'bg-navy-900 text-saffron border-saffron group-hover:scale-110'
                      }`}
                    >
                      {item.seq}
                    </div>

                    {/* Timeline Card */}
                    <Card
                      className={`p-4 sm:p-5 rounded-2xl transition-all space-y-3 ${
                        isBrokenNode
                          ? 'border-2 border-danger bg-danger/10'
                          : 'border-navy-700 bg-navy-800/90 hover:border-saffron/40'
                      }`}
                    >
                      {/* Top Action & Timestamp Row */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-navy-700/60 pb-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-white text-base">
                            {language === 'mr'
                              ? t(`chainOfCustody.actions.${item.action}` as any) || item.action
                              : item.action}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-navy-900 border border-navy-700 font-mono text-[11px] font-semibold text-slate-300">
                            {t('chainOfCustody.seqLabel', { seq: item.seq })}
                          </span>
                          {isGenesis && (
                            <Badge variant="info" size="sm">
                              Genesis Anchor
                            </Badge>
                          )}
                        </div>

                        <span className="text-xs text-muted font-mono flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-muted shrink-0" />
                          <span className="text-slate-300 font-medium">
                            {formatDateTime(item.timestamp)}
                          </span>
                        </span>
                      </div>

                      {/* Transfer Custodians & Location Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div className="p-2.5 rounded-xl bg-navy-900/80 border border-navy-700/60 space-y-0.5">
                          <span className="text-muted text-[11px]">
                            {t('chainOfCustody.fromPersonLabel')}
                          </span>
                          <div className="font-semibold text-white flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-muted shrink-0" />
                            <span className="truncate">{item.fromPerson}</span>
                          </div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-navy-900/80 border border-navy-700/60 space-y-0.5">
                          <span className="text-muted text-[11px]">
                            {t('chainOfCustody.toPersonLabel')}
                          </span>
                          <div className="font-semibold text-saffron flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-saffron shrink-0" />
                            <span className="truncate">{item.toPerson}</span>
                          </div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-navy-900/80 border border-navy-700/60 space-y-0.5">
                          <span className="text-muted text-[11px]">
                            {t('chainOfCustody.locationLabel')}
                          </span>
                          <div className="font-semibold text-slate-200 flex items-center gap-1">
                            <Building className="w-3.5 h-3.5 text-muted shrink-0" />
                            <span className="truncate">{item.location}</span>
                          </div>
                        </div>
                      </div>

                      {/* Remarks */}
                      {item.remarks && (
                        <div className="text-xs text-slate-300 leading-relaxed bg-navy-900/50 p-2.5 rounded-xl border border-navy-700/40">
                          <span className="text-muted font-medium">
                            {t('chainOfCustody.remarksLabel')}:{' '}
                          </span>
                          <span>{item.remarks}</span>
                        </div>
                      )}

                      {/* CRYPTOGRAPHIC HASH CHAIN LINKAGE STRIP */}
                      <div className="pt-2 border-t border-navy-700/60 flex flex-col gap-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-mono text-[11px] text-muted">
                              {t('chainOfCustody.shortHash')}:
                            </span>
                            <span className="font-mono text-xs font-bold text-emerald-400 bg-navy-900 px-2 py-0.5 rounded border border-navy-700">
                              {item.entryHash.slice(0, 8)}...{item.entryHash.slice(-4)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleCopyHash(item.entryHash, item.id)}
                              className="text-xs text-muted hover:text-white transition-colors flex items-center gap-1 font-mono"
                            >
                              {isCopied ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span className="text-emerald-400">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => toggleHashExpansion(item.id)}
                              className="text-xs text-saffron hover:underline flex items-center gap-1 font-semibold"
                            >
                              <span>{isExpanded ? 'Hide Details' : 'Expand Hashes'}</span>
                              {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Expanded Full Cryptographic Hashes */}
                        {isExpanded && (
                          <div className="p-3 rounded-xl bg-navy-950 border border-navy-700 space-y-2 text-xs font-mono animate-fadeIn">
                            <div>
                              <div className="text-[11px] text-muted mb-0.5">
                                {t('chainOfCustody.prevHashLabel')}{' '}
                                {isGenesis
                                  ? `(${t('chainOfCustody.genesisAnchor')})`
                                  : `(${t('chainOfCustody.precedingLink', { seq: item.seq - 1 })})`}
                                :
                              </div>
                              <div className="text-slate-300 break-all select-all bg-navy-900 p-1.5 rounded border border-navy-800">
                                {item.prevHash}
                              </div>
                            </div>

                            <div>
                              <div className="text-[11px] text-muted mb-0.5">
                                {t('chainOfCustody.entryHashLabel')}:
                              </div>
                              <div className="text-emerald-400 break-all select-all bg-navy-900 p-1.5 rounded border border-navy-800">
                                {item.entryHash}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: EXHIBIT DETAILS */}
      {activeTab === 'details' && (
        <Card className="p-6 space-y-5">
          <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-navy-700 pb-3">
            <FileText className="w-5 h-5 text-saffron" />
            <span>Digital Exhibit Metadata & Physical Description</span>
          </h3>

          {/* Media Preview if Blob available */}
          {blobUrl && (
            <div className="p-4 rounded-2xl bg-navy-900 border border-navy-700 flex justify-center">
              {evidence.mimeType.startsWith('image/') && (
                <img
                  src={blobUrl}
                  alt={evidence.fileName}
                  className="max-h-80 rounded-xl object-contain shadow-md"
                />
              )}
              {evidence.mimeType.startsWith('video/') && (
                <video src={blobUrl} controls className="max-h-80 rounded-xl w-full" />
              )}
              {evidence.mimeType.startsWith('audio/') && (
                <audio src={blobUrl} controls className="w-full mt-2" />
              )}
              {evidence.mimeType === 'application/pdf' && (
                <a
                  href={blobUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-saffron hover:underline text-sm font-semibold flex items-center gap-1.5"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open PDF in new tab</span>
                </a>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-navy-900 border border-navy-700/70 space-y-1">
              <span className="text-muted">Exhibit Identification</span>
              <div className="font-bold text-white text-sm">{evidence.exhibitNo}</div>
            </div>

            <div className="p-3 rounded-xl bg-navy-900 border border-navy-700/70 space-y-1">
              <span className="text-muted">Logging Officer / Handler</span>
              <div className="font-semibold text-white">{evidence.handlerName || 'PSI In-charge'}</div>
            </div>

            <div className="p-3 rounded-xl bg-navy-900 border border-navy-700/70 space-y-1">
              <span className="text-muted">Source / Recovery Location</span>
              <div className="font-semibold text-white">{evidence.source || 'Scene of Offence'}</div>
            </div>

            <div className="p-3 rounded-xl bg-navy-900 border border-navy-700/70 space-y-1">
              <span className="text-muted">Recording Device Info</span>
              <div className="font-semibold text-white">{evidence.deviceInfo || 'Station Terminal'}</div>
            </div>
          </div>

          {evidence.description && (
            <div className="space-y-1.5 text-xs">
              <span className="text-muted font-medium">Description of Exhibit:</span>
              <p className="p-3 rounded-xl bg-navy-900 border border-navy-700 text-slate-200 leading-relaxed">
                {evidence.description}
              </p>
            </div>
          )}

          {evidence.geo && (
            <div className="p-3 rounded-xl bg-navy-900 border border-navy-700 text-xs flex items-center gap-2">
              <MapPin className="w-4 h-4 text-saffron shrink-0" />
              <span className="text-muted">Geo-tagging:</span>
              <span className="font-mono text-white">
                Lat {evidence.geo.lat.toFixed(5)}, Lng {evidence.geo.lng.toFixed(5)} (±{evidence.geo.accuracy || 10}m)
              </span>
            </div>
          )}
        </Card>
      )}

      {/* TAB 3: VERIFY INTEGRITY (PROMPT 16 PREPARATION) */}
      {activeTab === 'verify' && (
        <Card className="p-6 space-y-5">
          <div className="space-y-1 border-b border-navy-700 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-saffron" />
              <span>Section 63 BSA Zero-Trust Integrity Verification</span>
            </h3>
            <p className="text-xs text-muted">
              Verify client-side whether this stored digital exhibit or any newly presented file has been altered.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-navy-900 border border-navy-700 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-semibold">Registered Exhibit Hash:</span>
              <Badge variant="success" size="sm">
                Recorded on Device
              </Badge>
            </div>
            <div className="font-mono text-emerald-300 bg-navy-950 p-2.5 rounded border border-navy-800 break-all select-all">
              {evidence.sha256}
            </div>
            <div className="flex items-center justify-between text-muted pt-1 border-t border-navy-800">
              <span>Algorithm: SHA-256</span>
              <span>Total Chain Links: {custodyEntries.length}</span>
            </div>
          </div>

          <Button
            variant="primary"
            onClick={runVerification}
            icon={<ShieldCheck className="w-4 h-4" />}
          >
            Re-run Complete Chain Hash Verification
          </Button>
        </Card>
      )}

      {/* TAB 4: CERTIFICATE (PROMPT 17) */}
      {activeTab === 'certificate' && (
        <Section63CertificateView
          evidence={evidence}
          caseRecord={currentCase}
          officerProfile={profile}
        />
      )}

      {/* 4. BOTTOM SHEET: ADD CUSTODY ENTRY FORM */}
      <BottomSheet
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-saffron shrink-0" />
            <span className="font-bold text-white text-base">
              {t('chainOfCustody.modalTitle')}
            </span>
          </div>
        }
      >
        <div className="space-y-4 p-1">
          <p className="text-xs text-muted">
            {t('chainOfCustody.modalDesc')}
          </p>

          {/* Action Selector with Suggested Action Highlight */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">
                {t('chainOfCustody.actionLabel')}
              </label>
              {suggestedNextAction && (
                <span className="text-[11px] text-saffron font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>
                    {t('chainOfCustody.suggestedBadge')}: {suggestedNextAction}
                  </span>
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CUSTODY_ACTIONS.map((act) => {
                const isSelected = action === act;
                const isSuggested = suggestedNextAction === act;
                return (
                  <button
                    key={act}
                    type="button"
                    onClick={() => setAction(act)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium text-left transition-all border ${
                      isSelected
                        ? 'bg-saffron text-navy-900 border-saffron font-bold shadow-xs'
                        : isSuggested
                        ? 'bg-navy-900 border-saffron/50 text-white hover:border-saffron'
                        : 'bg-navy-800 border-navy-700 text-slate-300 hover:text-white hover:border-navy-600'
                    }`}
                  >
                    <div>{language === 'mr' ? t(`chainOfCustody.actions.${act}` as any) || act : act}</div>
                    {isSuggested && !isSelected && (
                      <div className="text-[10px] text-saffron font-mono">Suggested</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* From & To Person Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">
                {t('chainOfCustody.fromPersonLabel')} *
              </label>
              <input
                type="text"
                value={fromPerson}
                onChange={(e) => setFromPerson(e.target.value)}
                placeholder="e.g. PSI Ramesh Patil"
                className="w-full bg-navy-800 border border-navy-600 rounded-xl px-3 py-2 text-xs text-white placeholder-muted focus:outline-hidden focus:border-saffron"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">
                {t('chainOfCustody.toPersonLabel')} *
              </label>
              <input
                type="text"
                value={toPerson}
                onChange={(e) => setToPerson(e.target.value)}
                placeholder="e.g. FSL Assistant Director, Pune"
                className="w-full bg-navy-800 border border-navy-600 rounded-xl px-3 py-2 text-xs text-white placeholder-muted focus:outline-hidden focus:border-saffron"
              />
            </div>
          </div>

          {/* Location Input */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">
              {t('chainOfCustody.locationLabel')}
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. State Forensic Science Laboratory, Kalina / Malkhana"
              className="w-full bg-navy-800 border border-navy-600 rounded-xl px-3 py-2 text-xs text-white placeholder-muted focus:outline-hidden focus:border-saffron"
            />
          </div>

          {/* Date & Time Input (Validated) */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">
              {t('chainOfCustody.timestampLabel')} *
            </label>
            <input
              type="datetime-local"
              value={transferDateTime}
              onChange={(e) => handleDateTimeChange(e.target.value)}
              className={`w-full bg-navy-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden ${
                timeError
                  ? 'border border-danger focus:border-danger'
                  : 'border border-navy-600 focus:border-saffron'
              }`}
            />
            {timeError && (
              <p className="text-[11px] text-danger font-medium flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{timeError}</span>
              </p>
            )}
          </div>

          {/* Remarks Input */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">
              {t('chainOfCustody.remarksLabel')}
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Dispatched for ballistic analysis under GD #18"
              className="w-full bg-navy-800 border border-navy-600 rounded-xl px-3 py-2 text-xs text-white placeholder-muted focus:outline-hidden focus:border-saffron resize-none"
            />
          </div>

          {/* Immutable Notice */}
          <p className="text-[11px] text-muted italic">
            * Once appended, this custody record cannot be edited or deleted. Any subsequent correction must be appended as a new procedural Note.
          </p>

          <Button
            variant="primary"
            size="md"
            loading={isSubmitting}
            disabled={!fromPerson.trim() || !toPerson.trim() || Boolean(timeError)}
            onClick={handleSaveCustodyEntry}
            className="w-full shadow-md"
          >
            {t('chainOfCustody.saveBtn')}
          </Button>
        </div>
      </BottomSheet>

      {/* 5. PRINTABLE CHAIN OF CUSTODY SHEET MODAL */}
      <BottomSheet
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        title={
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-saffron shrink-0" />
            <span className="font-bold text-white text-base">
              {t('chainOfCustody.exportBtn')}
            </span>
          </div>
        }
      >
        <div className="space-y-4 p-1">
          <div className="flex justify-end gap-2">
            <Button
              variant="primary"
              size="sm"
              icon={<Printer className="w-4 h-4" />}
              onClick={handlePrint}
            >
              {t('chainOfCustody.printPdfBtn')}
            </Button>
          </div>

          {/* A4 PRINT VIEW CONTAINER */}
          <div
            id="printable-custody-sheet"
            className="bg-white text-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-300 space-y-6 shadow-sm print:p-0 print:border-none print:shadow-none font-sans"
          >
            {/* Header */}
            <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
              <div className="text-xs uppercase font-bold tracking-widest text-slate-600">
                Maharashtra Police • Seva First
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">
                {t('chainOfCustody.exportSheetTitle')}
              </h2>
              <div className="text-xs font-semibold text-slate-700">
                {t('chainOfCustody.statutoryRef')}
              </div>
            </div>

            {/* Exhibit & Case Identifiers Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs border border-slate-300 p-3 rounded-lg bg-slate-50">
              <div>
                <span className="text-slate-500 font-medium">FIR Number: </span>
                <span className="font-bold text-slate-900">{currentCase?.firNo || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Police Station: </span>
                <span className="font-bold text-slate-900">{currentCase?.policeStation || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Exhibit Number: </span>
                <span className="font-bold text-slate-900">{evidence.exhibitNo}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium">File Name: </span>
                <span className="font-bold text-slate-900">{evidence.fileName}</span>
              </div>
              <div className="col-span-2 pt-1 border-t border-slate-200">
                <span className="text-slate-500 font-medium">SHA-256 Fingerprint: </span>
                <span className="font-mono text-[11px] font-bold text-slate-900 break-all">
                  {evidence.sha256}
                </span>
              </div>
            </div>

            {/* Verification Status Stamp */}
            <div
              className={`p-3 rounded-lg border text-center font-bold text-xs uppercase tracking-wider ${
                chainResult?.ok
                  ? 'border-emerald-700 bg-emerald-50 text-emerald-800'
                  : 'border-red-700 bg-red-50 text-red-800'
              }`}
            >
              {chainResult?.ok
                ? `${t('chainOfCustody.verifiedIntactStamp')} (${custodyEntries.length} verified links)`
                : t('chainOfCustody.verifiedBrokenStamp')}
            </div>

            {/* Ledger Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-900 bg-slate-100 text-slate-800">
                    <th className="py-2 px-1 font-bold">#</th>
                    <th className="py-2 px-1 font-bold">Action</th>
                    <th className="py-2 px-1 font-bold">From / Dispatcher</th>
                    <th className="py-2 px-1 font-bold">To / Recipient</th>
                    <th className="py-2 px-1 font-bold">Location</th>
                    <th className="py-2 px-1 font-bold">Timestamp</th>
                    <th className="py-2 px-1 font-bold">Entry Hash</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {custodyEntries.map((c) => (
                    <tr key={c.id}>
                      <td className="py-2 px-1 font-mono font-bold text-slate-900">{c.seq}</td>
                      <td className="py-2 px-1 font-semibold text-slate-900">{c.action}</td>
                      <td className="py-2 px-1 text-slate-700">{c.fromPerson}</td>
                      <td className="py-2 px-1 text-slate-700">{c.toPerson}</td>
                      <td className="py-2 px-1 text-slate-600">{c.location}</td>
                      <td className="py-2 px-1 font-mono text-[11px] text-slate-700">
                        {formatDate(c.timestamp)}
                      </td>
                      <td className="py-2 px-1 font-mono text-[10px] text-slate-800 break-all max-w-[120px]">
                        {c.entryHash.slice(0, 10)}...
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Officer Signature Block */}
            <div className="pt-8 border-t border-slate-400 flex justify-between items-end text-xs">
              <div>
                <div className="text-slate-500">Generated on:</div>
                <div className="font-semibold text-slate-800">{formatDateTime(new Date().toISOString())}</div>
              </div>
              <div className="text-right space-y-1">
                <div className="w-48 border-b border-slate-700 mx-auto" />
                <div className="font-bold text-slate-900">{t('chainOfCustody.officialSignature')}</div>
              </div>
            </div>
          </div>
        </div>
      </BottomSheet>

      {/* 6. DELETE CONFIRM DIALOG */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteEvidence}
        title={language === 'mr' ? 'पुरावा कायमचा हटवायचा?' : 'Delete Evidence Record?'}
        message={
          language === 'mr'
            ? 'सावधान: हा पुरावा हटवल्यास सर्व ताबा साखळी (Custody Logs) नोंदी नष्ट होतील आणि न्यायालयीन तपासणीत पुरावा साखळी तुटू शकते. ही कृती पूर्ववत करता येत नाही.'
            : 'WARNING: Deleting this evidence exhibit will permanently destroy its cryptographic chain of custody ledger and audit trail. This action cannot be undone.'
        }
        confirmText={language === 'mr' ? 'होय, पुरावा हटवा' : 'Yes, Delete Record'}
        variant="danger"
        loading={isDeleting}
      />
    </div>
  );
};
