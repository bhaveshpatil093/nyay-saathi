import React, { useState, useEffect } from 'react';
import {
  getStorageEstimate,
  createCase,
  listCases,
  createEvidence,
  listEvidenceByCase,
  addCustodyLog,
  listCustodyLogs,
  saveDocument,
  listDocumentsByCase,
  listAuditLogs,
  clearAllData,
  getProfile,
  getAllSettings,
  useLiveData,
} from '../lib/db/index.ts';
import {
  appendCustodyEntry,
  corruptCustodyEntryForDevTest,
  repairCustodyEntryForDevTest,
  verifyChain,
} from '../lib/custody/index.ts';
import { Card, SectionTitle, Button, Badge, ListItem, DisclaimerBanner, useToast } from '../components/ui/index.ts';
import { useI18n } from '../i18n/index.ts';
import {
  Database,
  HardDrive,
  Trash2,
  Plus,
  RefreshCw,
  FileText,
  Camera,
  Shield,
  Activity,
  CheckCircle,
  ShieldAlert,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';

export const DevDbPage: React.FC = () => {
  const { t, formatDate, formatDateTime } = useI18n();
  const toast = useToast();

  const [storage, setStorage] = useState<{ usageBytes: number; quotaBytes: number; percentageUsed: number }>({
    usageBytes: 0,
    quotaBytes: 0,
    percentageUsed: 0,
  });

  const refreshStorage = async () => {
    const est = await getStorageEstimate();
    setStorage(est);
  };

  useEffect(() => {
    refreshStorage();
  }, []);

  // Live data subscriptions via useLiveData hook
  const { data: cases = [], reload: reloadCases } = useLiveData(() => listCases('all'), ['cases']);
  const { data: allAuditLogs = [], reload: reloadAudit } = useLiveData(() => listAuditLogs(20), ['auditLog']);
  const { data: profileRecord } = useLiveData(() => getProfile(), ['profile']);
  const { data: settingsRecord = {} } = useLiveData(() => getAllSettings(), ['settings']);

  // Selected case for sub-store inspection
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');

  const activeCaseId = selectedCaseId || (cases.length > 0 ? cases[0].id : '');

  const { data: caseEvidence = [] } = useLiveData(
    () => (activeCaseId ? listEvidenceByCase(activeCaseId) : Promise.resolve([])),
    ['evidence', 'evidenceBlobs'],
    [activeCaseId]
  );

  const { data: caseDocs = [] } = useLiveData(
    () => (activeCaseId ? listDocumentsByCase(activeCaseId) : Promise.resolve([])),
    ['documents'],
    [activeCaseId]
  );

  // 1. Seed Sample Case
  const handleSeedCase = async () => {
    try {
      const caseNum = Math.floor(100 + Math.random() * 900);
      const newCase = await createCase({
        caseNo: `CR/${caseNum}/2024`,
        firNo: `FIR-${caseNum}`,
        firDateTime: new Date().toISOString(),
        policeStation: 'Shivaji Nagar PS, Pune',
        district: 'Pune',
        offenceIds: ['theft_bns_303'],
        provisions: [{ act: 'BNS', section: '303', subSection: '2' }],
        facts: {
          cognizable: true,
          womanVictim: false,
          childVictim: false,
          arrestMade: true,
          searchConducted: true,
          electronicEvidence: true,
          seizureMade: true,
          rapeCase: false,
          injuryOrDeath: false,
        },
        ioName: profileRecord?.name || 'PSI Ramesh Patil',
        ioRank: profileRecord?.rank || 'PSI',
        complainantName: 'Sunil D. Kulkarni',
        accusedNames: ['Sachin G. More'],
        summary: 'Theft of mobile phone and cash near FC Road bus stand. Audio-video seizure conducted under Sec 105 BNSS.',
        status: 'open',
        isSample: true,
      });

      setSelectedCaseId(newCase.id);
      refreshStorage();
      toast.success('Sample Case Created', `Case ${newCase.caseNo} saved in IndexedDB`);
    } catch (err) {
      toast.error('Failed to create case', String(err));
    }
  };

  // 2. Add Sample Digital Evidence
  const handleSeedEvidence = async () => {
    if (!activeCaseId) {
      toast.error('No case selected', 'Please create or select a case first');
      return;
    }

    try {
      const exhibitNum = caseEvidence.length + 1;
      const fakeBlob = new Blob(['Mock seizure video recording under Section 105 BNSS 2023'], {
        type: 'video/mp4',
      });

      const newEv = await createEvidence(
        {
          caseId: activeCaseId,
          exhibitNo: `EX-${exhibitNum}`,
          fileName: `Seizure_Recording_Sec105_${Date.now()}.mp4`,
          mimeType: 'video/mp4',
          size: fakeBlob.size,
          lastModified: new Date().toISOString(),
          sha256: 'a35f98a28e7d812d4a1b098198f23490b4102ef190bc98371908bc12984a9190',
          algorithm: 'SHA-256',
          description: 'Video recording of search and panchnama in presence of independent witnesses.',
          source: 'Mobile Camera (Camera #2)',
          handlerName: profileRecord?.name || 'PSI Ramesh Patil',
          deviceInfo: 'Samsung Galaxy F14 5G (IMEI ending in 4102)',
          sealed: true,
        },
        fakeBlob
      );

      // Also add initial chain of custody entry anchored to file hash
      const log1 = await appendCustodyEntry({
        evidenceId: newEv.id,
        action: 'Collected',
        fromPerson: 'Scene of Offence',
        toPerson: profileRecord?.name || 'PSI Ramesh Patil',
        location: 'Shivaji Nagar PS, Pune',
        remarks: 'Recorded on mobile camera in presence of panchas, SHA-256 fingerprint generated.',
      });

      // Add second entry (Sealed) to demonstrate a multi-link chain
      await appendCustodyEntry({
        evidenceId: newEv.id,
        action: 'Sealed',
        fromPerson: profileRecord?.name || 'PSI Ramesh Patil',
        toPerson: 'Malkhana In-charge HC Joshi',
        location: 'Shivaji Nagar PS Malkhana',
        remarks: 'Secured inside evidence bag #A-42 and sealed with station wax imprint.',
      });

      refreshStorage();
      toast.success('Sample Evidence Added', `Exhibit ${newEv.exhibitNo} with 2-link verified custody chain`);
    } catch (err) {
      toast.error('Failed to add evidence', String(err));
    }
  };

  // State to track last corrupted entry ID for repair testing
  const [lastCorruptedId, setLastCorruptedId] = useState<string | null>(null);
  const [lastCorruptedEvidenceId, setLastCorruptedEvidenceId] = useState<string | null>(null);

  // 3b. Corrupt Custody Entry Test (Breaks Hash Chain)
  const handleCorruptCustodyLog = async () => {
    try {
      // Pick first evidence from active case or any evidence
      const targetEvidenceId = caseEvidence.length > 0 ? caseEvidence[0].id : undefined;
      const res = await corruptCustodyEntryForDevTest(targetEvidenceId);

      setLastCorruptedId(res.corruptedEntryId || null);
      setLastCorruptedEvidenceId(res.evidenceId || null);

      refreshStorage();
      toast.warning(
        'Chain Tampered on Purpose!',
        `Corrupted entry #${res.seq} in evidence ${res.evidenceId?.slice(0, 8)}... Visit /evidence/${res.evidenceId} to verify the chain shows red!`
      );
    } catch (err) {
      toast.error('Failed to corrupt custody entry', String(err));
    }
  };

  // 3c. Repair Custody Entry
  const handleRepairCustodyLog = async () => {
    if (!lastCorruptedId) {
      toast.info('No corrupted entry tracked', 'Corrupt an entry first or inspect the custody tab');
      return;
    }

    try {
      const repaired = await repairCustodyEntryForDevTest(lastCorruptedId);
      if (repaired) {
        refreshStorage();
        toast.success(
          'Chain Repaired',
          'Cryptographic hash recalculated and verified intact!'
        );
        setLastCorruptedId(null);
      }
    } catch (err) {
      toast.error('Failed to repair entry', String(err));
    }
  };

  // 3. Add Sample Document Record
  const handleSeedDocument = async () => {
    if (!activeCaseId) {
      toast.error('No case selected', 'Please create or select a case first');
      return;
    }

    try {
      const doc = await saveDocument({
        caseId: activeCaseId,
        templateId: 'seizure_memo_bnss_105',
        language: 'mr',
        fields: {
          panchNames: ['Anil K. Shinde', 'Mahesh R. Gaikwad'],
          seizedArticles: ['Redmi Note 12 Pro', 'Cash Rs. 4,500'],
          placeOfSeizure: 'FC Road, Shivaji Nagar, Pune',
        },
      });

      refreshStorage();
      toast.success('Sample Document Saved', `Template: ${doc.templateId}`);
    } catch (err) {
      toast.error('Failed to save document', String(err));
    }
  };

  // 4. Wipe All Data
  const handleClearAll = async () => {
    if (window.confirm('Wipe all local IndexedDB records? This cannot be undone.')) {
      await clearAllData();
      setSelectedCaseId('');
      refreshStorage();
      toast.warning('Database Cleared', 'All 11 IndexedDB object stores reset');
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="flex-1 flex flex-col p-4 gap-6 text-white max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <SectionTitle
            title="IndexedDB Data Layer (#/dev/db)"
            subtitle="Real-time inspection of all 11 local database stores via idb"
            badge={<Badge variant="success">Zero Backend • 100% Offline</Badge>}
          />
          <div className="flex items-center gap-2">
            <Button size="md" variant="ghost" onClick={refreshStorage} icon={<RefreshCw className="w-4 h-4" />}>
              Refresh
            </Button>
            <Button size="md" variant="danger" onClick={handleClearAll} icon={<Trash2 className="w-4 h-4" />}>
              Wipe DB
            </Button>
          </div>
        </div>
        <DisclaimerBanner type="privacy" compact />
      </div>

      {/* Storage Estimate Card */}
      <Card
        header={
          <div className="flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-saffron" />
            <span>Device Storage Estimate (navigator.storage)</span>
          </div>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 bg-navy-900 rounded-xl border border-navy-600 flex flex-col">
            <span className="text-xs text-muted">IndexedDB Usage</span>
            <span className="text-xl font-bold font-mono text-white mt-1">
              {formatBytes(storage.usageBytes)}
            </span>
          </div>
          <div className="p-3 bg-navy-900 rounded-xl border border-navy-600 flex flex-col">
            <span className="text-xs text-muted">Allocated Device Quota</span>
            <span className="text-xl font-bold font-mono text-white mt-1">
              {formatBytes(storage.quotaBytes)}
            </span>
          </div>
          <div className="p-3 bg-navy-900 rounded-xl border border-navy-600 flex flex-col">
            <span className="text-xs text-muted">Storage Utilization</span>
            <span className="text-xl font-bold font-mono text-india-green mt-1">
              {storage.percentageUsed}%
            </span>
          </div>
        </div>
      </Card>

      {/* Seeder Action Bar */}
      <Card
        header={
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-saffron" />
            <span>Database Seeders & Operations</span>
          </div>
        }
      >
        <div className="flex flex-wrap gap-3">
          <Button variant="primary" onClick={handleSeedCase} icon={<Plus className="w-4 h-4" />}>
            Seed BNS 303 Theft Case
          </Button>
          <Button variant="secondary" onClick={handleSeedEvidence} icon={<Camera className="w-4 h-4" />}>
            Add SHA-256 Video Evidence
          </Button>
          <Button variant="secondary" onClick={handleSeedDocument} icon={<FileText className="w-4 h-4" />}>
            Create Panchnama Document
          </Button>
        </div>
      </Card>

      {/* Dev Cryptographic Tamper Test Card (Prompt Requirement) */}
      <Card
        header={
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-danger" />
              <span>Chain of Custody Tamper Test (BSA Sec 63)</span>
            </div>
            <Badge variant="warning" size="sm">Dev Testing</Badge>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-xs text-muted leading-relaxed">
            Test cryptographic tamper detection: Deliberately alter a stored custody record in IndexedDB without updating its SHA-256 hash. The Chain of Custody tab on <span className="font-mono text-saffron">/evidence/:evidenceId</span> will detect the mismatch and show a <span className="text-danger font-bold">RED "Chain broken at entry N"</span> status banner.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="danger"
              onClick={handleCorruptCustodyLog}
              icon={<ShieldAlert className="w-4 h-4" />}
            >
              Corrupt Custody Log (Test Chain Break)
            </Button>

            {lastCorruptedId && (
              <Button
                variant="ghost"
                onClick={handleRepairCustodyLog}
                icon={<ShieldCheck className="w-4 h-4 text-emerald-400" />}
              >
                Restore Corrupted Entry
              </Button>
            )}

            {lastCorruptedEvidenceId && (
              <a
                href={`#/evidence/${lastCorruptedEvidenceId}`}
                className="text-xs text-saffron hover:underline font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-navy-900 border border-saffron/40"
              >
                <span>View Tampered Chain (/evidence/{lastCorruptedEvidenceId.slice(0, 8)}...)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </Card>

      {/* Cases Store Inspector */}
      <Card
        header={
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-saffron" />
              <span>Registered Cases Store ({cases.length})</span>
            </div>
            <Badge variant="neutral" size="sm">Store: cases</Badge>
          </div>
        }
      >
        {cases.length === 0 ? (
          <div className="text-center py-6 text-muted text-sm">
            No cases in IndexedDB yet. Tap "Seed BNS 303 Theft Case" above.
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {cases.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedCaseId(c.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                  c.id === activeCaseId
                    ? 'border-saffron bg-saffron/10 ring-1 ring-saffron'
                    : 'border-navy-600 bg-navy-900/60 hover:bg-navy-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{c.caseNo}</span>
                    <Badge variant="info" size="sm">{c.firNo}</Badge>
                    <Badge variant={c.status === 'open' ? 'warning' : 'success'} size="sm">
                      {c.status.toUpperCase()}
                    </Badge>
                  </div>
                  <span className="text-[11px] font-mono text-muted">
                    {formatDate(c.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-muted line-clamp-1">{c.summary}</p>
                <div className="flex items-center gap-3 text-[11px] text-muted font-medium">
                  <span>IO: {c.ioName} ({c.ioRank})</span>
                  <span>•</span>
                  <span>Accused: {c.accusedNames.join(', ')}</span>
                  <span>•</span>
                  <span className="text-saffron">
                    Provisions: {c.provisions.map((p) => `${p.act} ${p.section}`).join(', ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Sub-Stores for Selected Case */}
      {activeCaseId && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Evidence Store */}
          <Card
            header={
              <div className="flex items-center justify-between w-full">
                <span className="text-sm font-semibold">Evidence Store ({caseEvidence.length})</span>
                <Badge variant="neutral" size="sm">Store: evidence</Badge>
              </div>
            }
          >
            {caseEvidence.length === 0 ? (
              <span className="text-xs text-muted">No evidence attached yet.</span>
            ) : (
              <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                {caseEvidence.map((ev) => (
                  <div key={ev.id} className="p-2.5 rounded-lg bg-navy-900 border border-navy-600/70 text-xs flex flex-col gap-1">
                    <div className="flex items-center justify-between font-bold text-white">
                      <span>{ev.exhibitNo} • {ev.fileName}</span>
                      <Badge variant="success" size="sm">Sealed</Badge>
                    </div>
                    <span className="font-mono text-[10px] text-india-green truncate">
                      SHA-256: {ev.sha256}
                    </span>
                    <div className="flex items-center justify-between text-[10px] text-muted pt-0.5">
                      <span>Device: {ev.deviceInfo}</span>
                      <a
                        href={`#/evidence/${ev.id}`}
                        className="text-saffron hover:underline font-semibold flex items-center gap-1"
                      >
                        <span>Open Details</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Documents Store */}
          <Card
            header={
              <div className="flex items-center justify-between w-full">
                <span className="text-sm font-semibold">Documents Store ({caseDocs.length})</span>
                <Badge variant="neutral" size="sm">Store: documents</Badge>
              </div>
            }
          >
            {caseDocs.length === 0 ? (
              <span className="text-xs text-muted">No documents generated yet.</span>
            ) : (
              <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                {caseDocs.map((doc) => (
                  <div key={doc.id} className="p-2.5 rounded-lg bg-navy-900 border border-navy-600/70 text-xs flex flex-col gap-1">
                    <div className="flex items-center justify-between font-bold text-white">
                      <span>{doc.templateId}</span>
                      <Badge variant="info" size="sm">{doc.language.toUpperCase()}</Badge>
                    </div>
                    <span className="text-[10px] text-muted font-mono">
                      Generated: {formatDateTime(doc.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Audit Log Stream */}
      <Card
        header={
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-saffron" />
              <span>Tamper-Evident Audit Log Store ({allAuditLogs.length})</span>
            </div>
            <Badge variant="neutral" size="sm">Store: auditLog</Badge>
          </div>
        }
      >
        <div className="max-h-64 overflow-y-auto rounded-xl border border-navy-600/60 divide-y divide-navy-600/40">
          {allAuditLogs.map((log) => (
            <div key={log.id} className="p-2.5 flex items-start justify-between gap-3 text-xs bg-navy-900/60 hover:bg-navy-900">
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-white">{log.action}</span>
                <span className="text-muted text-[11px] truncate mt-0.5">{log.detail}</span>
              </div>
              <span className="font-mono text-[10px] text-muted shrink-0">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
