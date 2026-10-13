import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Camera,
  Search,
  Filter,
  Plus,
  Lock,
  Unlock,
  ShieldCheck,
  ShieldAlert,
  FileText,
  Video,
  Music,
  ExternalLink,
  ChevronRight,
  Hash,
} from 'lucide-react';
import { useLiveData, listAllEvidence, listCases } from '../../lib/db/index.ts';
import { EvidenceRecord, CaseRecord } from '../../types/database.ts';
import { verifyChain } from '../../lib/custody/index.ts';
import { useI18n, formatDateTime } from '../../i18n/index.ts';
import {
  Card,
  Button,
  Badge,
  EmptyState,
  Skeleton,
} from '../../components/ui/index.ts';

export const EvidenceListPage: React.FC = () => {
  const navigate = useNavigate();
  const { t, language } = useI18n();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCaseFilter, setSelectedCaseFilter] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [chainIntegrityMap, setChainIntegrityMap] = useState<Record<string, boolean>>({});

  const { data: allEvidence = [], loading: loadingEvidence } = useLiveData<EvidenceRecord[]>(
    () => listAllEvidence(),
    ['evidence']
  );

  const { data: cases = [] } = useLiveData<CaseRecord[]>(
    () => listCases('all'),
    ['cases']
  );

  const casesMap = useMemo(() => {
    const map = new Map<string, CaseRecord>();
    cases.forEach((c) => map.set(c.id, c));
    return map;
  }, [cases]);

  // Verify chain integrity for each evidence item
  useEffect(() => {
    let active = true;
    const verifyAll = async () => {
      const results: Record<string, boolean> = {};
      for (const ev of allEvidence) {
        try {
          const res = await verifyChain(ev.id);
          results[ev.id] = res.ok;
        } catch {
          results[ev.id] = false;
        }
      }
      if (active) {
        setChainIntegrityMap(results);
      }
    };
    if (allEvidence.length > 0) {
      verifyAll();
    }
    return () => {
      active = false;
    };
  }, [allEvidence]);

  const typeFilterChips = [
    { id: 'all', label: language === 'mr' ? 'सर्व' : 'All' },
    { id: 'image', label: language === 'mr' ? 'फोटो (Image)' : 'Image' },
    { id: 'video', label: language === 'mr' ? 'व्हिडिओ (Video)' : 'Video' },
    { id: 'audio', label: language === 'mr' ? 'ऑडिओ (Audio)' : 'Audio' },
    { id: 'document', label: language === 'mr' ? 'दस्तऐवज (Document)' : 'Document' },
    { id: 'other', label: language === 'mr' ? 'इतर (Other)' : 'Other' },
  ];

  const filteredEvidence = useMemo(() => {
    return allEvidence.filter((ev) => {
      // Case filter
      if (selectedCaseFilter !== 'all' && ev.caseId !== selectedCaseFilter) {
        return false;
      }

      // Type filter
      if (selectedTypeFilter !== 'all') {
        const mime = ev.mimeType.toLowerCase();
        if (selectedTypeFilter === 'image' && !mime.startsWith('image/')) return false;
        if (selectedTypeFilter === 'video' && !mime.startsWith('video/')) return false;
        if (selectedTypeFilter === 'audio' && !mime.startsWith('audio/')) return false;
        if (
          selectedTypeFilter === 'document' &&
          !mime.includes('pdf') &&
          !mime.includes('document') &&
          !mime.includes('text')
        )
          return false;
        if (
          selectedTypeFilter === 'other' &&
          (mime.startsWith('image/') ||
            mime.startsWith('video/') ||
            mime.startsWith('audio/') ||
            mime.includes('pdf'))
        )
          return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const relatedCase = casesMap.get(ev.caseId);
        const matchName = ev.fileName.toLowerCase().includes(q);
        const matchExhibit = ev.exhibitNo.toLowerCase().includes(q);
        const matchHash = ev.sha256.toLowerCase().includes(q);
        const matchFir = relatedCase?.firNo.toLowerCase().includes(q);
        const matchDesc = ev.description?.toLowerCase().includes(q);
        if (!matchName && !matchExhibit && !matchHash && !matchFir && !matchDesc) {
          return false;
        }
      }

      return true;
    });
  }, [allEvidence, selectedCaseFilter, selectedTypeFilter, searchQuery, casesMap]);

  if (loadingEvidence) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-6 px-4">
        <Skeleton className="w-full h-24 rounded-2xl" />
        <Skeleton className="w-full h-80 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="min-w-0 max-w-5xl mx-auto space-y-6 pb-24 px-4 sm:px-6 pt-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-saffron/15 text-saffron border border-saffron/30">
              <Camera className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {language === 'mr' ? 'डिजिटल पुरावा तिजोरी (Vault)' : 'Digital Evidence Vault'}
            </h1>
          </div>
          <p className="text-xs text-muted mt-1">
            {language === 'mr'
              ? 'BSA २०२३ कलम ६३ अन्वये SHA-256 क्रिप्टोग्राफिक हॅश व सुरक्षित ताबा साखळी'
              : 'Tamper-evident evidence exhibits with cryptographic SHA-256 fingerprinting.'}
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => navigate('/evidence/new')}
        >
          {language === 'mr' ? 'नवीन पुरावा जोडा' : 'Add Evidence'}
        </Button>
      </div>

      {/* Explainer Banner */}
      <div className="p-3.5 rounded-xl bg-navy-800/80 border border-navy-700 flex items-start gap-3 text-xs text-slate-300">
        <Hash className="w-4 h-4 text-saffron shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-semibold text-white">
            {language === 'mr' ? 'डिजिटल फिंगरप्रिंट संकल्पना:' : 'Zero-Trust Evidence Integrity:'}
          </span>{' '}
          <span>
            {language === 'mr'
              ? 'प्रत्येक पुरावा रेकॉर्ड करताना त्याचा ६४-अक्षरी SHA-256 हॅश स्थानिक पातळीवर मोजला जातो. जर फाईलमध्ये एक पिक्सेल जरी बदलला, तर हॅश बदलतो.'
              : 'Every file is fingerprinted using a 64-character SHA-256 hash. If even one pixel changes, the hash changes completely.'}
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-muted absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'mr' ? 'शोध: एक्झिबीट क्र., फाईल नाव, हॅश, एफआयआर...' : 'Search by exhibit, file name, hash, FIR...'}
              className="w-full bg-navy-800 border border-navy-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-muted focus:outline-hidden focus:border-saffron"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-muted shrink-0" />
            <select
              value={selectedCaseFilter}
              onChange={(e) => setSelectedCaseFilter(e.target.value)}
              className="bg-navy-800 border border-navy-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-saffron cursor-pointer w-full sm:w-auto"
            >
              <option value="all">{language === 'mr' ? 'सर्व प्रकरणे' : 'All Cases'}</option>
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  FIR {c.firNo} ({c.caseNo})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Type Filter Chips */}
        <div className="flex flex-wrap items-center gap-2">
          {typeFilterChips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setSelectedTypeFilter(chip.id)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                selectedTypeFilter === chip.id
                  ? 'bg-saffron text-navy-900 font-bold shadow-xs'
                  : 'bg-navy-800 hover:bg-navy-700 text-slate-300 border border-navy-700'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Evidence Items List */}
      <div className="space-y-3">
        {filteredEvidence.length === 0 ? (
          <EmptyState
            icon={<Camera className="w-12 h-12 text-muted" />}
            title={language === 'mr' ? 'कोणताही पुरावा आढळला नाही' : 'No Evidence Exhibits Found'}
            description={
              language === 'mr'
                ? 'निवडलेल्या निकषांनुसार कोणतेही पुरावा रेकॉर्ड उपलब्ध नाही.'
                : 'No evidence files match your search and filter criteria.'
            }
          />
        ) : (
          filteredEvidence.map((ev) => {
            const relCase = casesMap.get(ev.caseId);
            const isIntact = chainIntegrityMap[ev.id] !== false;
            const shortHash = `${ev.sha256.slice(0, 8)}...${ev.sha256.slice(-8)}`;

            return (
              <Card
                key={ev.id}
                onClick={() => navigate(`/evidence/${ev.id}`)}
                className="p-4 sm:p-5 rounded-2xl border-navy-700 bg-navy-800/90 hover:border-saffron/40 hover:bg-navy-800 transition-all cursor-pointer shadow-xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs px-2.5 py-0.5 rounded-lg bg-navy-900 text-saffron border border-saffron/40 font-bold">
                        {ev.exhibitNo}
                      </span>
                      <h3 className="font-bold text-white text-base truncate">
                        {ev.fileName}
                      </h3>
                      {relCase && (
                        <span className="text-xs text-muted">
                          • FIR {relCase.firNo} ({relCase.policeStation})
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                      <span className="font-mono text-[11px] text-slate-300 bg-navy-900 px-2 py-0.5 rounded border border-navy-700">
                        SHA-256: {shortHash}
                      </span>
                      <span>•</span>
                      <span>{(ev.size / 1024).toFixed(1)} KB</span>
                      <span>•</span>
                      <span>{formatDateTime(ev.loggedAt)}</span>
                    </div>
                  </div>

                  {/* Badges Strip */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 self-start sm:self-auto">
                    {(ev.isSample || relCase?.isSample) && (
                      <Badge variant="neutral" size="sm">
                        {language === 'mr' ? 'नमुना' : 'SAMPLE'}
                      </Badge>
                    )}

                    <Badge variant="neutral" size="sm">
                      <span className="flex items-center gap-1 font-mono text-[10px]">
                        <Hash className="w-3 h-3 text-emerald-400" />
                        <span>Hash Recorded</span>
                      </span>
                    </Badge>

                    <Badge variant={ev.sealed ? 'success' : 'warning'} size="sm">
                      {ev.sealed ? (
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

                    <Badge variant={isIntact ? 'success' : 'danger'} size="sm">
                      <span className="flex items-center gap-1">
                        {isIntact ? (
                          <>
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            <span>Chain Intact</span>
                          </>
                        ) : (
                          <>
                            <ShieldAlert className="w-3 h-3 text-danger" />
                            <span>Chain Broken</span>
                          </>
                        )}
                      </span>
                    </Badge>

                    <ChevronRight className="w-4 h-4 text-saffron hidden sm:block" />
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};
