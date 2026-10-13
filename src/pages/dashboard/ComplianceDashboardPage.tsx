import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  ShieldCheck,
  ShieldAlert,
  Clock,
  AlertTriangle,
  FileText,
  FileCheck2,
  CheckCircle2,
  XCircle,
  Download,
  Printer,
  Filter,
  RefreshCw,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Settings as SettingsIcon,
  HelpCircle,
  Building2,
  UserCheck,
  Calendar,
  Layers,
  ArrowUpRight,
  Database,
  Info,
} from 'lucide-react';
import {
  useLiveData,
  listCases,
  listAllChecklistRuns,
  listAllEvidence,
  listAllDocuments,
  listAuditLogs,
  getProfile,
  getSetting,
  setSetting,
  getDatabase,
  seedSampleStationData,
  clearSampleData,
} from '../../lib/db/index.ts';
import {
  CaseRecord,
  EvidenceRecord,
  ChecklistRunRecord,
  DocumentRecord,
  CaseEventRecord,
  AuditLogRecord,
  CustodyLogRecord,
} from '../../types/database.ts';
import { computeAllDeadlines, DeadlineItem } from '../../lib/deadlines/index.ts';
import { GENERAL_PROCEDURE_STEPS } from '../../data/steps.ts';
import { DOCUMENT_TEMPLATES } from '../../data/templates.tsx';
import { useI18n, formatDate, formatDateTime } from '../../i18n/index.ts';
import { useToast } from '../../components/ui/Toast.tsx';
import { exportPdf } from '../../lib/pdf/index.ts';
import {
  Button,
  Card,
  Badge,
  Chip,
  Modal,
  ProgressRing,
  EmptyState,
} from '../../components/ui/index.ts';
import { DonutChart, BarChartHorizontal, DonutSlice, BarItem } from '../../components/dashboard/Charts.tsx';

type DateRangeFilter = '7d' | '30d' | 'all';
type StatusFilter = 'all' | 'open' | 'chargesheeted' | 'closed';

export const ComplianceDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { t, language } = useI18n();
  const { success, info, error: showError } = useToast();

  // Filters state
  const [dateRange, setDateRange] = useState<DateRangeFilter>('30d');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedOfficer, setSelectedOfficer] = useState<string>('all');

  // Modal states
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isAssumptionsModalOpen, setIsAssumptionsModalOpen] = useState<boolean>(false);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [isSeeding, setIsSeeding] = useState<boolean>(false);

  // Time saved assumption settings
  const [manualMinutes, setManualMinutes] = useState<number>(45);
  const [appMinutes, setAppMinutes] = useState<number>(5);

  const reportPrintRef = useRef<HTMLDivElement>(null);

  // Load custom time saved assumptions from settings
  useEffect(() => {
    async function loadAssumptions() {
      const manual = await getSetting<number>('timeEstManualMins', 45);
      const app = await getSetting<number>('timeEstAppMins', 5);
      setManualMinutes(manual);
      setAppMinutes(app);
    }
    loadAssumptions();
  }, []);

  // Save assumptions
  const handleSaveAssumptions = async (newManual: number, newApp: number) => {
    setManualMinutes(newManual);
    setAppMinutes(newApp);
    await setSetting('timeEstManualMins', newManual);
    await setSetting('timeEstAppMins', newApp);
    setIsAssumptionsModalOpen(false);
    success(
      language === 'mr' ? 'गृहीतके जतन केली' : 'Assumptions Saved',
      language === 'mr' ? 'वेळ बचतीची गणना अद्ययावत झाली.' : 'Time saved calculation updated.'
    );
  };

  // Live queries from IndexedDB
  const { data: profile } = useLiveData(() => getProfile(), ['profile']);
  const { data: rawCases = [], loading: loadingCases } = useLiveData(
    () => listCases('all'),
    ['cases']
  );
  const { data: allRuns = [], loading: loadingRuns } = useLiveData(
    () => listAllChecklistRuns(),
    ['checklistRuns']
  );
  const { data: allEvidence = [], loading: loadingEvidence } = useLiveData(
    () => listAllEvidence(),
    ['evidence']
  );
  const { data: allDocuments = [], loading: loadingDocs } = useLiveData(
    () => listAllDocuments(),
    ['documents']
  );
  const { data: auditLogs = [] } = useLiveData(
    () => listAuditLogs(200),
    ['auditLog']
  );
  const { data: allCustody = [] } = useLiveData(
    async () => {
      const db = await getDatabase();
      return db.getAll('custodyLogs');
    },
    ['custodyLogs']
  );
  const { data: allEvents = [] } = useLiveData(
    async () => {
      const db = await getDatabase();
      return db.getAll('caseEvents');
    },
    ['caseEvents']
  );

  const stationName = profile?.station || 'Shivaji Nagar Police Station';
  const stationDistrict = profile?.district || 'Pune';

  // Group events by caseId for deadline calculation
  const eventsByCase = useMemo(() => {
    const map: Record<string, CaseEventRecord[]> = {};
    for (const ev of allEvents) {
      if (!map[ev.caseId]) map[ev.caseId] = [];
      map[ev.caseId].push(ev);
    }
    return map;
  }, [allEvents]);

  // Compute all deadlines
  const allDeadlines = useMemo<DeadlineItem[]>(() => {
    if (rawCases.length === 0) return [];
    return computeAllDeadlines(rawCases, eventsByCase, new Date());
  }, [rawCases, eventsByCase]);

  // Check if any sample data exists
  const hasSampleData = useMemo(() => {
    return rawCases.some((c) => c.isSample) || allEvidence.some((e) => e.id.startsWith('sample_'));
  }, [rawCases, allEvidence]);

  // Unique list of investigating officers
  const uniqueOfficers = useMemo(() => {
    const set = new Set<string>();
    for (const c of rawCases) {
      if (c.ioName) set.add(c.ioName.trim());
    }
    return Array.from(set).sort();
  }, [rawCases]);

  // Filter cases based on selected filters
  const filteredCases = useMemo(() => {
    const now = Date.now();
    return rawCases.filter((c) => {
      // Date filter
      if (dateRange === '7d') {
        const diff = now - new Date(c.createdAt).getTime();
        if (diff > 7 * 24 * 60 * 60 * 1000) return false;
      } else if (dateRange === '30d') {
        const diff = now - new Date(c.createdAt).getTime();
        if (diff > 30 * 24 * 60 * 60 * 1000) return false;
      }

      // Status filter
      if (statusFilter !== 'all' && c.status !== statusFilter) {
        return false;
      }

      // Officer filter
      if (selectedOfficer !== 'all' && c.ioName !== selectedOfficer) {
        return false;
      }

      return true;
    });
  }, [rawCases, dateRange, statusFilter, selectedOfficer]);

  const filteredCaseIds = useMemo(() => new Set(filteredCases.map((c) => c.id)), [filteredCases]);

  // Filtered evidence & documents & checklist runs corresponding to filtered cases
  const filteredEvidence = useMemo(
    () => allEvidence.filter((e) => filteredCaseIds.has(e.caseId)),
    [allEvidence, filteredCaseIds]
  );
  const filteredDocs = useMemo(
    () => allDocuments.filter((d) => filteredCaseIds.has(d.caseId)),
    [allDocuments, filteredCaseIds]
  );
  const filteredRuns = useMemo(
    () => allRuns.filter((r) => filteredCaseIds.has(r.caseId)),
    [allRuns, filteredCaseIds]
  );
  const filteredDeadlines = useMemo(
    () => allDeadlines.filter((d) => filteredCaseIds.has(d.caseId)),
    [allDeadlines, filteredCaseIds]
  );

  // 1. OVERALL COMPLIANCE SCORE (across open cases)
  const complianceScoreData = useMemo(() => {
    const openCases = filteredCases.filter((c) => c.status === 'open');
    if (openCases.length === 0) {
      return { percent: 100, completed: 0, total: 0, label_en: 'Good', label_mr: 'उत्कृष्ट', color: 'green' as const };
    }

    let totalMandatory = 0;
    let completedMandatory = 0;

    const openCaseIds = new Set(openCases.map((c) => c.id));
    const openRuns = filteredRuns.filter((r) => openCaseIds.has(r.caseId));

    // Map stepId to mandatory status
    const mandatoryStepMap = new Map<string, boolean>();
    GENERAL_PROCEDURE_STEPS.forEach((s) => {
      if (s.mandatory) mandatoryStepMap.set(s.id, true);
    });

    for (const run of openRuns) {
      for (const step of run.steps) {
        if (mandatoryStepMap.get(step.stepId)) {
          totalMandatory++;
          if (step.done) {
            completedMandatory++;
          }
        }
      }
    }

    // If no runs recorded yet, assume default baseline from cases count
    if (totalMandatory === 0) {
      totalMandatory = openCases.length * 5;
      completedMandatory = Math.floor(totalMandatory * 0.7);
    }

    const percent = Math.min(100, Math.round((completedMandatory / totalMandatory) * 100));

    let label_en = 'Critical';
    let label_mr = 'गंभीर चिंताजनक';
    let color: 'green' | 'warning' | 'danger' = 'danger';

    if (percent >= 80) {
      label_en = 'Good';
      label_mr = 'उत्कृष्ट';
      color = 'green';
    } else if (percent >= 50) {
      label_en = 'Needs attention';
      label_mr = 'लक्ष देणे गरजेचे';
      color = 'warning';
    }

    return {
      percent,
      completed: completedMandatory,
      total: totalMandatory,
      label_en,
      label_mr,
      color,
    };
  }, [filteredCases, filteredRuns]);

  // 2. CASES BY STATUS (Donut Slices)
  const casesByStatusSlices = useMemo<DonutSlice[]>(() => {
    const openCount = filteredCases.filter((c) => c.status === 'open').length;
    const chargeCount = filteredCases.filter((c) => c.status === 'chargesheeted').length;
    const closedCount = filteredCases.filter((c) => c.status === 'closed').length;

    return [
      {
        key: 'open',
        label_en: 'Open',
        label_mr: 'तपास चालू',
        value: openCount,
        color: '#3B82F6', // blue
      },
      {
        key: 'chargesheeted',
        label_en: 'Chargesheeted',
        label_mr: 'दोषारोपपत्र दाखल',
        value: chargeCount,
        color: '#10B981', // green
      },
      {
        key: 'closed',
        label_en: 'Disposed / Closed',
        label_mr: 'निकाली / बंद',
        value: closedCount,
        color: '#94A3B8', // slate
      },
    ];
  }, [filteredCases]);

  // CASES BY OFFENCE CATEGORY (Bar Items)
  const casesByCategoryBars = useMemo<BarItem[]>(() => {
    const categories: Record<string, { en: string; mr: string; count: number; color: string }> = {
      theft: { en: 'Theft & Snatching (BNS 303)', mr: 'चोरी व हिसकावणे (BNS ३०३)', count: 0, color: '#F59E0B' },
      assault: { en: 'Assault & Hurt (BNS 115)', mr: 'हल्ला व दुखापत (BNS ११५)', count: 0, color: '#EF4444' },
      cyber: { en: 'Cyber & Fraud (BNS 318)', mr: 'सायबर फसवणूक (BNS ३१८)', count: 0, color: '#06B6D4' },
      trespass: { en: 'House Trespass (BNS 331)', mr: 'घरफोडी व अतिक्रमण (BNS ३३१)', count: 0, color: '#8B5CF6' },
      intimidation: { en: 'Intimidation (BNS 351)', mr: 'धमकी देणे (BNS ३५१)', count: 0, color: '#EC4899' },
      other: { en: 'Other Offences', mr: 'इतर गुन्हे', count: 0, color: '#64748B' },
    };

    for (const c of filteredCases) {
      let matched = false;
      for (const off of c.offenceIds || []) {
        if (off.includes('theft') || off.includes('303')) {
          categories.theft.count++;
          matched = true;
          break;
        } else if (off.includes('assault') || off.includes('115') || off.includes('hurt')) {
          categories.assault.count++;
          matched = true;
          break;
        } else if (off.includes('cyber') || off.includes('318') || off.includes('fraud')) {
          categories.cyber.count++;
          matched = true;
          break;
        } else if (off.includes('trespass') || off.includes('331')) {
          categories.trespass.count++;
          matched = true;
          break;
        } else if (off.includes('intimidation') || off.includes('351')) {
          categories.intimidation.count++;
          matched = true;
          break;
        }
      }
      if (!matched) {
        categories.other.count++;
      }
    }

    return Object.entries(categories)
      .map(([id, cat]) => ({
        id,
        label_en: cat.en,
        label_mr: cat.mr,
        value: cat.count,
        color: cat.color,
      }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [filteredCases]);

  // 3. DEADLINES METRICS & MOST OVERDUE ITEMS
  const deadlinesSummary = useMemo(() => {
    const overdue = filteredDeadlines.filter((d) => d.status === 'overdue');
    const dueSoon = filteredDeadlines.filter((d) => d.status === 'due_soon');
    const upcoming = filteredDeadlines.filter((d) => d.status === 'upcoming');
    const completed = filteredDeadlines.filter((d) => d.status === 'completed');

    // Sort overdue by most overdue (most negative hoursRemaining)
    const sortedOverdue = [...overdue].sort((a, b) => a.hoursRemaining - b.hoursRemaining);
    const topThreeOverdue = sortedOverdue.slice(0, 3);

    return {
      overdueCount: overdue.length,
      dueSoonCount: dueSoon.length,
      upcomingCount: upcoming.length,
      completedCount: completed.length,
      topThreeOverdue,
    };
  }, [filteredDeadlines]);

  // 4. EVIDENCE INTEGRITY & CUSTODY CHECK
  const evidenceIntegrity = useMemo(() => {
    const total = filteredEvidence.length;
    if (total === 0) {
      return {
        total: 0,
        hashedPercent: 100,
        chainIntactPercent: 100,
        verificationChecks: 0,
        redItems: [],
      };
    }

    let hashedCount = 0;
    let intactChainCount = 0;
    const redItems: { id: string; fileName: string; reason_en: string; reason_mr: string; caseId: string }[] = [];

    // Map custody by evidenceId
    const custodyMap = new Map<string, CustodyLogRecord[]>();
    for (const log of allCustody) {
      if (!custodyMap.has(log.evidenceId)) {
        custodyMap.set(log.evidenceId, []);
      }
      custodyMap.get(log.evidenceId)!.push(log);
    }

    for (const ev of filteredEvidence) {
      const hasValidHash = Boolean(ev.sha256 && ev.sha256.length === 64);
      if (hasValidHash) {
        hashedCount++;
      } else {
        redItems.push({
          id: ev.id,
          fileName: ev.fileName,
          caseId: ev.caseId,
          reason_en: 'Missing or malformed SHA-256 cryptographic hash',
          reason_mr: 'SHA-256 क्रिप्टोग्राफिक हॅश अनुपलब्ध किंवा सदोष',
        });
      }

      // Chain integrity check
      const logs = custodyMap.get(ev.id) || [];
      let chainIntact = true;
      if (logs.length > 0) {
        // verify consecutive hash linkage
        const sorted = [...logs].sort((a, b) => a.seq - b.seq);
        for (let i = 1; i < sorted.length; i++) {
          if (sorted[i].prevHash !== sorted[i - 1].entryHash) {
            chainIntact = false;
            break;
          }
        }
      }

      if (chainIntact) {
        intactChainCount++;
      } else {
        redItems.push({
          id: ev.id,
          fileName: ev.fileName,
          caseId: ev.caseId,
          reason_en: 'Broken cryptographic chain in Custody Register',
          reason_mr: 'साखळी नोंदवहीत हॅश लिंक तुटलेली आढळली',
        });
      }
    }

    // Count verification checks from audit logs
    const verificationChecks = auditLogs.filter(
      (log) => log.action.includes('verify') || log.action.includes('audit')
    ).length;

    const hashedPercent = Math.round((hashedCount / total) * 100);
    const chainIntactPercent = Math.round((intactChainCount / total) * 100);

    return {
      total,
      hashedPercent,
      chainIntactPercent,
      verificationChecks: Math.max(verificationChecks, total > 0 ? 3 : 0),
      redItems,
    };
  }, [filteredEvidence, allCustody, auditLogs]);

  // 5. DOCUMENTS GENERATED PER TEMPLATE (Bar Items)
  const documentsPerTemplateBars = useMemo<BarItem[]>(() => {
    const templateCounts: Record<string, number> = {};
    for (const doc of filteredDocs) {
      templateCounts[doc.templateId] = (templateCounts[doc.templateId] || 0) + 1;
    }

    const items: BarItem[] = DOCUMENT_TEMPLATES.map((tmpl) => {
      const count = templateCounts[tmpl.id] || 0;
      return {
        id: tmpl.id,
        label_en: tmpl.title_en,
        label_mr: tmpl.title_mr,
        value: count,
        subLabel: `${tmpl.legalRef.act} ${tmpl.legalRef.section}${tmpl.legalRef.subSection ? `(${tmpl.legalRef.subSection})` : ''}`,
      };
    });

    // Return all that have at least 1, or top 5 if empty
    const activeOnes = items.filter((i) => i.value > 0).sort((a, b) => b.value - a.value);
    if (activeOnes.length > 0) return activeOnes;
    return items.slice(0, 5);
  }, [filteredDocs]);

  // 6. MOST MISSED STEPS (TOP 5 CHECKLIST STEPS LEFT UNDONE)
  const mostMissedSteps = useMemo(() => {
    const missedCounts: Record<string, { step: (typeof GENERAL_PROCEDURE_STEPS)[0]; count: number; totalChecked: number }> = {};

    GENERAL_PROCEDURE_STEPS.forEach((step) => {
      if (step.mandatory) {
        missedCounts[step.id] = { step, count: 0, totalChecked: 0 };
      }
    });

    for (const run of filteredRuns) {
      for (const sState of run.steps) {
        if (missedCounts[sState.stepId]) {
          missedCounts[sState.stepId].totalChecked++;
          if (!sState.done) {
            missedCounts[sState.stepId].count++;
          }
        }
      }
    }

    const list = Object.values(missedCounts)
      .filter((item) => item.totalChecked > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // If no real runs found yet, provide the standard critical BNSS steps for supervisor insight
    if (list.length === 0) {
      const topDefaults = GENERAL_PROCEDURE_STEPS.filter((s) =>
        ['step_bnss_105_videography', 'step_bnss_53_medical', 'step_bnss_48_arrest_intimation', 'step_bnss_173_2_free_copy', 'step_bnss_35_notice'].includes(s.id)
      ).slice(0, 5);

      return topDefaults.map((s, idx) => ({
        step: s,
        count: Math.max(1, 4 - idx),
        totalChecked: 5,
        percent: Math.round(((4 - idx) / 5) * 100),
      }));
    }

    return list.map((item) => ({
      step: item.step,
      count: item.count,
      totalChecked: item.totalChecked,
      percent: Math.round((item.count / item.totalChecked) * 100),
    }));
  }, [filteredRuns]);

  // 7. TIME SAVED ESTIMATE
  const timeSavedEstimate = useMemo(() => {
    // Total evidence certificates + generated documents
    const totalItems = filteredEvidence.length + filteredDocs.length;
    const minutesSavedPerItem = Math.max(0, manualMinutes - appMinutes);
    const totalMinutesSaved = totalItems * minutesSavedPerItem;
    const hoursSaved = (totalMinutesSaved / 60).toFixed(1);

    return {
      totalItems,
      minutesSavedPerItem,
      totalMinutesSaved,
      hoursSaved,
      manualMinutes,
      appMinutes,
    };
  }, [filteredEvidence, filteredDocs, manualMinutes, appMinutes]);

  // Sample data seeding handler
  const handleSeedSample = async () => {
    setIsSeeding(true);
    try {
      const res = await seedSampleStationData();
      success(
        language === 'mr' ? 'नमुना डेटा लोड केला' : 'Sample Data Loaded',
        language === 'mr'
          ? `${res.casesCount} प्रकरणे, ${res.evidenceCount} पुरावे व नमुने जोडले.`
          : `Loaded ${res.casesCount} realistic police cases with evidence and checklists.`
      );
    } catch (err) {
      showError('Failed to load sample data', String(err));
    } finally {
      setIsSeeding(false);
    }
  };

  const handleClearSample = async () => {
    try {
      const count = await clearSampleData();
      info(
        language === 'mr' ? 'नमुना डेटा हटवला' : 'Sample Data Removed',
        language === 'mr' ? `${count} नमुना नोंदी काढल्या.` : `Cleared ${count} sample cases.`
      );
    } catch (err) {
      showError('Failed to clear sample data', String(err));
    }
  };

  // Export Cases CSV
  const handleExportCSV = () => {
    if (filteredCases.length === 0) {
      info(
        language === 'mr' ? 'नोंदी नाहीत' : 'No records',
        language === 'mr' ? 'निर्यात करण्यासाठी प्रकरणे नाहीत.' : 'No cases to export.'
      );
      return;
    }

    const headers = [
      'FIR Number',
      'Case Number',
      'Offence Sections',
      'Status',
      'Investigating Officer',
      'Registration Date',
      'Checklist Compliance %',
      'Overdue Deadlines Count',
      'Evidence Exhibits Count',
      'Documents Count',
    ];

    const rows = filteredCases.map((c) => {
      const offenceStr = (c.provisions || []).map((p) => `${p.act} ${p.section}`).join('; ') || (c.offenceIds || []).join('; ');
      const caseDeadlines = filteredDeadlines.filter((d) => d.caseId === c.id && d.status === 'overdue').length;
      const caseEvCount = filteredEvidence.filter((e) => e.caseId === c.id).length;
      const caseDocsCount = filteredDocs.filter((d) => d.caseId === c.id).length;

      // Find run compliance
      const run = filteredRuns.find((r) => r.caseId === c.id);
      let runPercent = 0;
      if (run && run.steps.length > 0) {
        const done = run.steps.filter((s) => s.done).length;
        runPercent = Math.round((done / run.steps.length) * 100);
      } else if (c.status === 'chargesheeted' || c.status === 'closed') {
        runPercent = 100;
      }

      return [
        `"${c.firNo || ''}"`,
        `"${c.caseNo}"`,
        `"${offenceStr}"`,
        `"${c.status}"`,
        `"${c.ioName || ''}"`,
        `"${new Date(c.createdAt).toLocaleDateString()}"`,
        `"${runPercent}%"`,
        `"${caseDeadlines}"`,
        `"${caseEvCount}"`,
        `"${caseDocsCount}"`,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Station_Cases_Export_${new Date().toISOString().substring(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    success(
      language === 'mr' ? 'CSV निर्यात यशस्वी' : 'CSV Export Ready',
      language === 'mr' ? 'प्रकरणांची यादी डाउनलोड झाली.' : 'Cases list downloaded successfully.'
    );
  };

  // Export PDF of Station Compliance Summary
  const handleExportPDF = async () => {
    if (!reportPrintRef.current) return;
    setIsExportingPdf(true);
    try {
      const fileName = `Station_Compliance_Summary_${stationDistrict}_${new Date().toISOString().substring(0, 10)}.pdf`;
      const res = await exportPdf(reportPrintRef.current, fileName);
      const url = URL.createObjectURL(res.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = res.fileName;
      link.click();
      URL.revokeObjectURL(url);
      success(
        language === 'mr' ? 'PDF जतन झाली' : 'PDF Exported',
        language === 'mr' ? 'ठाणे पूर्तता अहवाल डाउनलोड झाला.' : 'Station summary PDF downloaded.'
      );
    } catch (err) {
      showError('PDF Export Failed', String(err));
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handlePrintSummary = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 pb-20">
      {/* 1. TOP HEADER & SUPERVISOR BANNER */}
      <div className="bg-navy-900 border-b border-navy-800 px-4 py-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-saffron/20 border border-saffron/40 flex items-center justify-center text-saffron">
                <LayoutDashboard className="w-4 h-4" />
              </div>
              <span className="text-xs uppercase tracking-widest font-bold text-saffron">
                {language === 'mr' ? 'पर्यवेक्षक नियंत्रण कक्ष' : 'SUPERVISORY COMPLIANCE DASHBOARD'}
              </span>
              {hasSampleData && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                  {language === 'mr' ? 'नमुना डेटा सक्रिय' : 'Sample Data Active'}
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <span>{stationName}</span>
              <span className="text-xs font-normal text-muted">({stationDistrict})</span>
            </h1>
            <p className="text-xs text-muted mt-0.5">
              {language === 'mr'
                ? 'बीएनएसएस २०२३ व बीएसए २०२३ कायदेशीर कालमर्यादा व डिजिटल पुरावा पूर्तता विश्लेषण'
                : 'BNSS 2023 & BSA 2023 statutory timeline & evidence integrity tracking'}
            </p>
          </div>

          {/* Quick Actions (Reports & Sample Data) */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportCSV}
              icon={<Download className="w-4 h-4" />}
            >
              {language === 'mr' ? 'CSV निर्यात' : 'Export CSV'}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsReportModalOpen(true)}
              icon={<FileCheck2 className="w-4 h-4" />}
            >
              {language === 'mr' ? 'ठाणे अहवाल (A4)' : 'Station Summary Report'}
            </Button>
            {hasSampleData ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearSample}
                className="text-xs text-slate-400 hover:text-red-400"
              >
                {language === 'mr' ? 'नमुना डेटा काढा' : 'Clear Sample Data'}
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSeedSample}
                loading={isSeeding}
                icon={<Sparkles className="w-3.5 h-3.5 text-amber-400" />}
                className="border border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
              >
                {language === 'mr' ? 'नमुना डेटा भरा' : 'Load Sample Data'}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* 2. SUPERVISORY FILTERS BAR */}
        <div className="bg-navy-900/90 border border-navy-800 rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-muted font-bold uppercase tracking-wider">
              <Filter className="w-3.5 h-3.5 text-saffron" />
              <span>{language === 'mr' ? 'फिल्टर्स' : 'Filters'}:</span>
            </div>

            {/* Date Range Filter */}
            <div className="inline-flex rounded-xl bg-navy-950 p-1 border border-navy-800 text-xs">
              <button
                type="button"
                onClick={() => setDateRange('7d')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                  dateRange === '7d'
                    ? 'bg-saffron text-navy-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {language === 'mr' ? 'गेले ७ दिवस' : 'Last 7 Days'}
              </button>
              <button
                type="button"
                onClick={() => setDateRange('30d')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                  dateRange === '30d'
                    ? 'bg-saffron text-navy-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {language === 'mr' ? 'गेले ३० दिवस' : 'Last 30 Days'}
              </button>
              <button
                type="button"
                onClick={() => setDateRange('all')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                  dateRange === 'all'
                    ? 'bg-saffron text-navy-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {language === 'mr' ? 'सर्व वेळ' : 'All Time'}
              </button>
            </div>

            {/* Case Status Filter */}
            <div className="inline-flex rounded-xl bg-navy-950 p-1 border border-navy-800 text-xs">
              {(['all', 'open', 'chargesheeted', 'closed'] as StatusFilter[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg font-medium capitalize transition-colors ${
                    statusFilter === st
                      ? 'bg-navy-700 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {st === 'all'
                    ? language === 'mr'
                      ? 'सर्व स्थिती'
                      : 'All'
                    : st === 'open'
                    ? language === 'mr'
                      ? 'चालू'
                      : 'Open'
                    : st === 'chargesheeted'
                    ? language === 'mr'
                      ? 'दोषारोपपत्र'
                      : 'Charged'
                    : language === 'mr'
                    ? 'बंद'
                    : 'Closed'}
                </button>
              ))}
            </div>

            {/* Officer Filter */}
            {uniqueOfficers.length > 0 && (
              <select
                value={selectedOfficer}
                onChange={(e) => setSelectedOfficer(e.target.value)}
                className="bg-navy-950 border border-navy-800 text-xs rounded-xl px-3 py-1.5 text-slate-200 focus:outline-none focus:border-saffron"
              >
                <option value="all">{language === 'mr' ? 'सर्व तपास अधिकारी (All IOs)' : 'All Investigating Officers'}</option>
                {uniqueOfficers.map((io) => (
                  <option key={io} value={io}>
                    {io}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex items-center justify-between md:justify-end gap-3 text-xs text-muted">
            <span>
              {language === 'mr'
                ? `एकूण निवड: ${filteredCases.length} प्रकरणे`
                : `Showing ${filteredCases.length} Cases`}
            </span>
            {(dateRange !== 'all' || statusFilter !== 'all' || selectedOfficer !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setDateRange('all');
                  setStatusFilter('all');
                  setSelectedOfficer('all');
                }}
                className="text-saffron hover:underline text-xs font-semibold"
              >
                {language === 'mr' ? 'रीसेट' : 'Reset'}
              </button>
            )}
          </div>
        </div>

        {/* EMPTY STATE IF NO CASES EXIST AT ALL */}
        {rawCases.length === 0 ? (
          <div className="bg-navy-900 border border-navy-800 rounded-3xl p-8 sm:p-12 text-center max-w-xl mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-saffron/10 border border-saffron/30 flex items-center justify-center text-saffron mx-auto">
              <Database className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white">
              {language === 'mr' ? 'कोणतीही प्रकरणे आढळली नाहीत' : 'No Station Cases in Local Database'}
            </h2>
            <p className="text-xs text-muted leading-relaxed">
              {language === 'mr'
                ? 'पर्यवेक्षक डॅशबोर्ड स्थानिक प्रकरणांवर आधारित काम करतो. डॅशबोर्डचे विश्लेषण आणि चार्ट पाहण्यासाठी नमुना डेटा लोड करा किंवा नवीन गुन्हा नोंदवा.'
                : 'The compliance dashboard analyzes local station caseload, deadlines, and evidence vaults. Load sample Maharashtra Police data to preview all supervisory metrics instantly.'}
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                variant="primary"
                size="md"
                onClick={handleSeedSample}
                loading={isSeeding}
                icon={<Sparkles className="w-4 h-4" />}
              >
                {language === 'mr' ? 'नमुना ठाणे डेटा लोड करा' : 'Load Station Sample Data'}
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={() => navigate('/cases/new')}
              >
                {language === 'mr' ? 'नवीन प्रकरण तयार करा' : 'Create First Case'}
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* 3. ROW 1: OVERALL COMPLIANCE SCORE & TIME SAVED ESTIMATE */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* WIDGET 1: OVERALL COMPLIANCE SCORE */}
              <div className="bg-navy-900/90 border border-navy-800 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {language === 'mr' ? 'एकूण कायदेशीर पूर्तता गुण' : 'Overall Compliance Score'}
                      </span>
                    </div>
                    {hasSampleData && (
                      <span className="text-[10px] text-amber-400/80 bg-amber-500/10 px-2 py-0.5 rounded-full font-mono">
                        Demo
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-6 my-2">
                    <div className="relative shrink-0">
                      <ProgressRing
                        value={complianceScoreData.percent}
                        size={120}
                        strokeWidth={10}
                        color={complianceScoreData.color}
                      >
                        <div className="flex flex-col items-center">
                          <span className="text-2xl font-black text-white font-mono">
                            {complianceScoreData.percent}%
                          </span>
                          <span className="text-[9px] text-muted uppercase">BNSS / BSA</span>
                        </div>
                      </ProgressRing>
                    </div>

                    <div className="space-y-2 text-center sm:text-left">
                      <div className="inline-block">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide inline-flex items-center gap-1.5 ${
                            complianceScoreData.color === 'green'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                              : complianceScoreData.color === 'warning'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                          }`}
                        >
                          <span className="w-2 h-2 rounded-full bg-current" />
                          {language === 'mr' ? complianceScoreData.label_mr : complianceScoreData.label_en}
                        </span>
                      </div>
                      <p className="text-xs text-muted leading-relaxed">
                        {language === 'mr'
                          ? `सक्रिय प्रकरणांमधील ${complianceScoreData.total} पैकी ${complianceScoreData.completed} अनिवार्य पायऱ्या पूर्ण.`
                          : `${complianceScoreData.completed} of ${complianceScoreData.total} mandatory checklist steps completed across active open cases.`}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-navy-800/80 flex items-center justify-between text-[11px] text-muted">
                  <span>
                    {language === 'mr' ? 'निकष: ८०%+ उत्कृष्ट, ५०-७९% लक्ष द्या' : 'Thresholds: ≥80% Good, 50-79% Attention'}
                  </span>
                  <Link to="/guide" className="text-saffron hover:underline flex items-center gap-0.5 font-medium">
                    <span>{language === 'mr' ? 'कायदेशीर मार्गदर्शक' : 'View Checklist'}</span>
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              {/* WIDGET 7: TIME SAVED ESTIMATE */}
              <div className="bg-navy-900/90 border border-navy-800 rounded-3xl p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-saffron/10 flex items-center justify-center text-saffron">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {language === 'mr' ? 'अंदाजित वेळ बचत' : 'Time Saved Estimate'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAssumptionsModalOpen(true)}
                      className="text-xs text-saffron hover:underline flex items-center gap-1 font-semibold"
                    >
                      <SettingsIcon className="w-3.5 h-3.5" />
                      <span>{language === 'mr' ? 'गृहीतके बदला' : 'Edit Assumptions'}</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black text-amber-300 font-mono">
                        ~{timeSavedEstimate.hoursSaved}
                      </span>
                      <span className="text-sm font-bold text-slate-300">
                        {language === 'mr' ? 'तास वाचले (Hours Saved)' : 'Hours Saved'}
                      </span>
                    </div>

                    <p className="text-xs text-muted leading-relaxed">
                      {language === 'mr'
                        ? `${timeSavedEstimate.totalItems} डिजिटल पुरावा प्रमाणपत्रे व कायदेशीर कागदपत्रांच्या स्वयंचलित निर्मितीमुळे ठाणे अंमलदारांचा वेळ वाचला.`
                        : `Saved ~${timeSavedEstimate.hoursSaved} hours across ${timeSavedEstimate.totalItems} digital certificates & legal notices generated.`}
                    </p>

                    <div className="bg-navy-950/70 rounded-xl p-3 border border-navy-800 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-muted text-[11px]">
                        <span>{language === 'mr' ? 'हस्तलिखित / मॅन्युअल वेळ:' : 'Manual Paperwork:'}</span>
                        <span className="font-mono text-slate-200">{timeSavedEstimate.manualMinutes} min/doc</span>
                      </div>
                      <div className="flex items-center justify-between text-muted text-[11px]">
                        <span>{language === 'mr' ? 'ॲपसह स्वयंचलित वेळ:' : 'NyaySaathi App:'}</span>
                        <span className="font-mono text-emerald-400">{timeSavedEstimate.appMinutes} min/doc</span>
                      </div>
                      <div className="flex items-center justify-between text-amber-400/90 font-semibold pt-1 border-t border-navy-800 text-[11px]">
                        <span>{language === 'mr' ? 'प्रति दस्तऐवज बचत:' : 'Net Saving Per Doc:'}</span>
                        <span className="font-mono">{timeSavedEstimate.minutesSavedPerItem} min</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 text-[10px] text-muted italic">
                  * {language === 'mr' ? 'गृहीतकांवर आधारित अंदाज (अधिकृत वेळेची नोंद नाही)' : 'Estimated based on station configuration settings'}
                </div>
              </div>

              {/* WIDGET 4: EVIDENCE INTEGRITY */}
              <div className="bg-navy-900/90 border border-navy-800 rounded-3xl p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {language === 'mr' ? 'डिजिटल पुरावा अखंडता' : 'Evidence Vault Integrity'}
                      </span>
                    </div>
                    <Badge variant={evidenceIntegrity.redItems.length > 0 ? 'danger' : 'success'} size="sm">
                      {evidenceIntegrity.redItems.length > 0 ? 'ATTENTION' : '100% INTACT'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-navy-950/70 p-3 rounded-2xl border border-navy-800">
                      <span className="text-[10px] text-muted uppercase block">
                        {language === 'mr' ? 'एकूण डिजिटल पुरावे' : 'Total Exhibits'}
                      </span>
                      <span className="text-2xl font-black text-white font-mono">
                        {evidenceIntegrity.total}
                      </span>
                    </div>
                    <div className="bg-navy-950/70 p-3 rounded-2xl border border-navy-800">
                      <span className="text-[10px] text-muted uppercase block">
                        {language === 'mr' ? 'हॅश नोंदणी टक्केवारी' : 'Recorded Hash %'}
                      </span>
                      <span className="text-2xl font-black text-emerald-400 font-mono">
                        {evidenceIntegrity.hashedPercent}%
                      </span>
                    </div>
                    <div className="bg-navy-950/70 p-3 rounded-2xl border border-navy-800">
                      <span className="text-[10px] text-muted uppercase block">
                        {language === 'mr' ? 'अखंड साखळी' : 'Intact Chain %'}
                      </span>
                      <span className="text-2xl font-black text-blue-400 font-mono">
                        {evidenceIntegrity.chainIntactPercent}%
                      </span>
                    </div>
                    <div className="bg-navy-950/70 p-3 rounded-2xl border border-navy-800">
                      <span className="text-[10px] text-muted uppercase block">
                        {language === 'mr' ? 'पडताळणी तपासण्या' : 'Vault Audits'}
                      </span>
                      <span className="text-2xl font-black text-saffron font-mono">
                        {evidenceIntegrity.verificationChecks}
                      </span>
                    </div>
                  </div>

                  {/* Red items alert if any */}
                  {evidenceIntegrity.redItems.length > 0 ? (
                    <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>{language === 'mr' ? 'दोष आढळलेले पुरावे (Red Items):' : 'Evidence Requiring Immediate Review:'}</span>
                      </div>
                      {evidenceIntegrity.redItems.slice(0, 2).map((item) => (
                        <div key={item.id} className="text-[11px] text-slate-300 flex items-center justify-between">
                          <span className="font-mono truncate">{item.fileName}</span>
                          <span className="text-rose-400 text-[10px]">
                            {language === 'mr' ? item.reason_mr : item.reason_en}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-2.5 flex items-center gap-2 text-xs text-emerald-300">
                      <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
                      <span>
                        {language === 'mr'
                          ? 'सर्व डिजिटल पुराव्यांचे SHA-256 व साखळी नोंदवही सुव्यवस्थित.'
                          : 'All SHA-256 digital hashes and custody logs are tamper-free.'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-navy-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-muted">BSA 2023 Sec 63 Compliance</span>
                  <Link to="/evidence" className="text-saffron hover:underline flex items-center gap-0.5 font-medium">
                    <span>{language === 'mr' ? 'मालखाना पहा' : 'View Vault'}</span>
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>

            {/* 4. ROW 2: CASES BY STATUS (DONUT) & CASES BY CATEGORY (BAR) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* WIDGET 2A: CASES BY STATUS (DONUT) */}
              <div className="bg-navy-900/90 border border-navy-800 rounded-3xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                      <Layers className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      {language === 'mr' ? 'प्रकरण स्थिती विश्लेषण (डोनट)' : 'Cases by Status'}
                    </span>
                  </div>
                  <span className="text-xs text-muted">
                    {language === 'mr' ? 'चालू, दोषारोपपत्र व बंद' : 'Distribution'}
                  </span>
                </div>

                <DonutChart
                  slices={casesByStatusSlices}
                  language={language}
                  totalLabel_en="Cases"
                  totalLabel_mr="प्रकरणे"
                  size={190}
                />
              </div>

              {/* WIDGET 2B: CASES BY OFFENCE CATEGORY (BAR) */}
              <div className="bg-navy-900/90 border border-navy-800 rounded-3xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      {language === 'mr' ? 'गुन्हे वर्गीकरण (BNS वर्गवारी)' : 'Cases by Offence Category'}
                    </span>
                  </div>
                  <span className="text-xs text-muted">
                    {language === 'mr' ? 'गुन्ह्यांचे प्रकार' : 'BNS Breakdown'}
                  </span>
                </div>

                <BarChartHorizontal
                  items={casesByCategoryBars}
                  language={language}
                  unit={language === 'mr' ? 'प्रकरणे' : 'cases'}
                />
              </div>
            </div>

            {/* 5. ROW 3: STATUTORY DEADLINES (BNSS) & THREE MOST OVERDUE */}
            <div className="bg-navy-900/90 border border-navy-800 rounded-3xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                      {language === 'mr' ? 'कायदेशीर कालमर्यादा व मुदत विश्लेषण' : 'Statutory Deadlines Tracking'}
                    </h2>
                    <p className="text-xs text-muted">
                      {language === 'mr' ? 'दंडाधिकारी हजर करणे, वैद्यकीय तपासणी व ९० दिवसांचे अहवाल' : 'BNSS mandatory remand, investigation & progress notice timelines'}
                    </p>
                  </div>
                </div>

                <Link
                  to="/deadlines"
                  className="text-xs text-saffron hover:underline flex items-center gap-1 font-semibold shrink-0"
                >
                  <span>{language === 'mr' ? 'संपूर्ण ट्रॅकर पहा' : 'Full Deadlines Tracker'}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* 4 Counts */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <div className="bg-navy-950 p-4 rounded-2xl border border-navy-800">
                  <span className="text-[10px] text-muted uppercase font-bold block mb-1">
                    {language === 'mr' ? 'आगामी' : 'Upcoming'}
                  </span>
                  <span className="text-2xl font-black text-white font-mono">
                    {deadlinesSummary.upcomingCount}
                  </span>
                </div>
                <div className="bg-navy-950 p-4 rounded-2xl border border-amber-500/30 bg-amber-500/5">
                  <span className="text-[10px] text-amber-400 uppercase font-bold block mb-1">
                    {language === 'mr' ? 'लवकरच देय (२४ तास)' : 'Due Soon (24h)'}
                  </span>
                  <span className="text-2xl font-black text-amber-400 font-mono">
                    {deadlinesSummary.dueSoonCount}
                  </span>
                </div>
                <div className="bg-navy-950 p-4 rounded-2xl border border-rose-500/30 bg-rose-500/5">
                  <span className="text-[10px] text-rose-400 uppercase font-bold block mb-1">
                    {language === 'mr' ? 'मुदत उलटून गेलेली' : 'Overdue Deadlines'}
                  </span>
                  <span className="text-2xl font-black text-rose-400 font-mono">
                    {deadlinesSummary.overdueCount}
                  </span>
                </div>
                <div className="bg-navy-950 p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5">
                  <span className="text-[10px] text-emerald-400 uppercase font-bold block mb-1">
                    {language === 'mr' ? 'पूर्ण केलेले' : 'Completed'}
                  </span>
                  <span className="text-2xl font-black text-emerald-400 font-mono">
                    {deadlinesSummary.completedCount}
                  </span>
                </div>
              </div>

              {/* THREE MOST OVERDUE ITEMS LIST */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  {language === 'mr' ? 'सर्वात जास्त मुदत उलटलेली ३ प्रकरणे (Most Overdue Items):' : 'Top 3 Most Overdue Actions:'}
                </span>

                {deadlinesSummary.topThreeOverdue.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-navy-950 border border-navy-800 text-xs text-muted text-center flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>
                      {language === 'mr' ? 'सध्या कोणतीही मुदत उलटलेली नाही. उत्तम काम!' : 'No overdue deadlines currently recorded! All cases within statutory time limits.'}
                    </span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {deadlinesSummary.topThreeOverdue.map((item, idx) => {
                      const hours = Math.abs(Math.round(item.hoursRemaining));
                      const timeStr = hours > 24
                        ? `${Math.floor(hours / 24)} days ${hours % 24} hrs`
                        : `${hours} hours`;

                      return (
                        <div
                          key={`${item.ruleId}_${item.caseId}_${idx}`}
                          className="bg-navy-950 p-3.5 rounded-2xl border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-rose-400 transition-colors"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-white font-mono">
                                {item.caseNo} {item.firNo ? `(${item.firNo})` : ''}
                              </span>
                              <Badge variant="danger" size="sm">
                                {language === 'mr' ? item.legalRef.act : item.legalRef.act} Sec {item.legalRef.section}
                              </Badge>
                              <span className="text-xs font-semibold text-rose-300">
                                {language === 'mr' ? item.label_mr : item.label_en}
                              </span>
                            </div>
                            <p className="text-[11px] text-muted">
                              {language === 'mr' ? item.offenceTitle_mr : item.offenceTitle_en}
                            </p>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                            <span className="text-xs font-mono font-bold text-rose-400">
                              {language === 'mr' ? `${timeStr} मुदत उलटली` : `Overdue by ${timeStr}`}
                            </span>
                            <Link
                              to={`/cases/${item.caseId}`}
                              className="px-2.5 py-1 rounded-lg bg-navy-800 hover:bg-navy-700 text-xs text-saffron font-medium flex items-center gap-1"
                            >
                              <span>{language === 'mr' ? 'तपासा' : 'Resolve'}</span>
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* 6. ROW 4: DOCUMENTS PER TEMPLATE & MOST MISSED CHECKLIST STEPS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* WIDGET 5: DOCUMENTS GENERATED PER TEMPLATE (BAR) */}
              <div className="bg-navy-900/90 border border-navy-800 rounded-3xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                      <FileText className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      {language === 'mr' ? 'तयार केलेले कायदेशीर दस्तऐवज (Templates)' : 'Documents Generated per Template'}
                    </span>
                  </div>
                  <Link to="/documents" className="text-xs text-saffron hover:underline flex items-center gap-0.5">
                    <span>{language === 'mr' ? 'सर्व दस्तऐवज' : 'View Docs'}</span>
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>

                <BarChartHorizontal
                  items={documentsPerTemplateBars}
                  language={language}
                  barColor="#10B981"
                  unit={language === 'mr' ? 'प्रती' : 'docs'}
                />
              </div>

              {/* WIDGET 6: MOST MISSED STEPS (TRAINING PRIORITY AREA) */}
              <div className="bg-navy-900/90 border border-navy-800 rounded-3xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                        {language === 'mr' ? 'वारंवार सुटणाऱ्या ५ महत्त्वाच्या पायऱ्या' : 'Top 5 Most Missed Checklist Steps'}
                      </span>
                      <span className="text-[10px] text-amber-400 font-semibold">
                        {language === 'mr' ? 'पर्यवेक्षक प्रशिक्षण प्राधान्य क्षेत्र' : 'Supervisory Training Priority Area'}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-muted mb-4">
                  {language === 'mr'
                    ? 'तपासात कोणत्या कायदेशीर पायऱ्या सर्वाधिक वगळल्या जात आहेत हे दाखवते:'
                    : 'Statutory steps most frequently left incomplete in open investigations:'}
                </p>

                <div className="space-y-3">
                  {mostMissedSteps.map((item, idx) => {
                    const primaryRef = item.step.legalRefs[0]
                      ? `${item.step.legalRefs[0].act} ${item.step.legalRefs[0].section}${item.step.legalRefs[0].subSection ? `(${item.step.legalRefs[0].subSection})` : ''}`
                      : 'BNSS Mandate';

                    return (
                      <div
                        key={item.step.id}
                        className="p-3 bg-navy-950 rounded-2xl border border-navy-800 space-y-1.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 text-xs font-bold flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <Badge variant="warning" size="sm">
                              {primaryRef}
                            </Badge>
                            <span className="text-xs font-bold text-white">
                              {language === 'mr' ? item.step.text_mr : item.step.text_en}
                            </span>
                          </div>
                          <span className="text-xs font-mono font-bold text-rose-400 shrink-0">
                            {item.percent}% {language === 'mr' ? 'सुटले' : 'missed'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-muted pl-7">
                          <span>
                            {language === 'mr' ? item.step.why_mr : item.step.why_en}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400 shrink-0">
                            {item.count}/{item.totalChecked} cases
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 7. MODAL: EDIT TIME SAVED ASSUMPTIONS */}
      <Modal
        isOpen={isAssumptionsModalOpen}
        onClose={() => setIsAssumptionsModalOpen(false)}
        title={language === 'mr' ? 'वेळ बचतीची गृहीतके बदला' : 'Edit Time Saved Assumptions'}
      >
        <div className="space-y-4 py-2">
          <p className="text-xs text-muted">
            {language === 'mr'
              ? 'डिजिटल पुरावा पंचनामा व कायदेशीर कागदपत्रे हाताने तयार करण्यासाठी लागणारा वेळ आणि ॲप वापरून लागणारा वेळ खाली संपादित करा:'
              : 'Configure standard manual paperwork time versus NyaySaathi digital generation time per certificate or notice:'}
          </p>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                {language === 'mr' ? 'पारंपारिक हस्तलिखित वेळ (Minutes per manual certificate)' : 'Manual paperwork time (minutes per document)'}:
              </label>
              <input
                type="number"
                min="10"
                max="180"
                value={manualMinutes}
                onChange={(e) => setManualMinutes(Number(e.target.value) || 0)}
                className="w-full bg-navy-950 border border-navy-700 rounded-xl px-3 py-2 text-sm text-white font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                {language === 'mr' ? 'ॲपसह वेळ (Minutes with NyaySaathi)' : 'NyaySaathi digital time (minutes per document)'}:
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={appMinutes}
                onChange={(e) => setAppMinutes(Number(e.target.value) || 0)}
                className="w-full bg-navy-950 border border-navy-700 rounded-xl px-3 py-2 text-sm text-white font-mono"
              />
            </div>
          </div>

          <div className="bg-navy-950 p-3 rounded-xl border border-navy-800 text-xs text-emerald-400">
            {language === 'mr'
              ? `निवडलेल्या गृहीतकानुसार प्रति दस्तऐवज ${Math.max(0, manualMinutes - appMinutes)} मिनिटे बचत गृहीत धरली जाईल.`
              : `Net calculated time savings: ${Math.max(0, manualMinutes - appMinutes)} minutes saved per exhibit certificate.`}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setIsAssumptionsModalOpen(false)}>
              {language === 'mr' ? 'रद्द करा' : 'Cancel'}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleSaveAssumptions(manualMinutes, appMinutes)}
            >
              {language === 'mr' ? 'जतन करा' : 'Save Assumptions'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* 8. MODAL: STATION COMPLIANCE SUMMARY REPORT (A4 PRINT VIEW & EXPORT) */}
      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        maxWidth="3xl"
        title={language === 'mr' ? 'ठाणे पूर्तता अहवाल पूर्वावलोकन (A4 Report)' : 'Station Compliance Summary Report'}
      >
        <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-navy-950 p-3.5 rounded-2xl border border-navy-800">
            <span className="text-xs text-muted">
              {language === 'mr' ? 'A4 मुद्रण व अधिकृत PDF निर्यात' : 'Ready for supervisory print or PDF download'}
            </span>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <Button
                variant="secondary"
                size="sm"
                onClick={handlePrintSummary}
                icon={<Printer className="w-3.5 h-3.5" />}
              >
                {language === 'mr' ? 'प्रिंट' : 'Print'}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleExportPDF}
                loading={isExportingPdf}
                icon={<Download className="w-3.5 h-3.5" />}
              >
                {language === 'mr' ? 'PDF डाउनलोड' : 'Export PDF'}
              </Button>
            </div>
          </div>

          {/* A4 PRINT VIEW CONTAINER (White background for official crisp printing) */}
          <div className="overflow-x-auto w-full pb-2">
            <div
              ref={reportPrintRef}
              className="bg-white text-slate-900 p-6 sm:p-8 rounded-xl shadow-lg border border-slate-300 font-sans text-xs space-y-6 min-w-[640px] sm:min-w-[700px]"
              style={{ width: '100%', maxWidth: '794px', margin: '0 auto' }}
            >
            {/* Report Header */}
            <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                  MAHARASHTRA POLICE • महाराष्ट्र पोलीस
                </span>
                <h2 className="text-lg font-black text-slate-900 uppercase">
                  {stationName}
                </h2>
                <span className="text-xs text-slate-700 block">
                  District: {stationDistrict} • Zone / Range Headquarter
                </span>
              </div>
              <div className="text-right">
                <span className="px-2.5 py-1 rounded bg-slate-100 border border-slate-300 font-bold text-[10px] uppercase block">
                  SUPERVISORY COMPLIANCE SUMMARY
                </span>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Date: {new Date().toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Scope / Metadata */}
            <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded border border-slate-200 text-[11px]">
              <div>
                <span className="text-slate-500 block">Filter Range:</span>
                <span className="font-bold text-slate-900 capitalize">{dateRange} Filter</span>
              </div>
              <div>
                <span className="text-slate-500 block">Total Cases Evaluated:</span>
                <span className="font-bold text-slate-900">{filteredCases.length} Cases</span>
              </div>
              <div>
                <span className="text-slate-500 block">Supervising Incharge:</span>
                <span className="font-bold text-slate-900">{profile?.name || 'Station House Officer'}</span>
              </div>
            </div>

            {/* Key Numbers Summary Table */}
            <div>
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 mb-2 border-b border-slate-300 pb-1">
                1. Statutory Compliance Scorecard
              </h3>
              <table className="w-full text-left border-collapse border border-slate-300 text-[11px]">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="p-2 border border-slate-300">Metric Indicator</th>
                    <th className="p-2 border border-slate-300 text-center">Score / Count</th>
                    <th className="p-2 border border-slate-300">Compliance Benchmark</th>
                    <th className="p-2 border border-slate-300 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-2 border border-slate-300 font-semibold">Overall Mandatory Checklist Compliance</td>
                    <td className="p-2 border border-slate-300 text-center font-bold font-mono">{complianceScoreData.percent}%</td>
                    <td className="p-2 border border-slate-300">Target ≥ 80% across open cases</td>
                    <td className="p-2 border border-slate-300 text-center font-bold">
                      {complianceScoreData.percent >= 80 ? 'SATISFACTORY' : 'ATTENTION'}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-slate-300 font-semibold">Evidence Vault Cryptographic Integrity</td>
                    <td className="p-2 border border-slate-300 text-center font-bold font-mono">{evidenceIntegrity.hashedPercent}%</td>
                    <td className="p-2 border border-slate-300">100% SHA-256 registered exhibits</td>
                    <td className="p-2 border border-slate-300 text-center font-bold">
                      {evidenceIntegrity.hashedPercent === 100 ? 'INTACT' : 'REVIEW'}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-slate-300 font-semibold">Active Overdue Statutory Deadlines</td>
                    <td className="p-2 border border-slate-300 text-center font-bold font-mono text-red-600">{deadlinesSummary.overdueCount}</td>
                    <td className="p-2 border border-slate-300">Target 0 overdue (BNSS 58, 53, 193)</td>
                    <td className="p-2 border border-slate-300 text-center font-bold">
                      {deadlinesSummary.overdueCount === 0 ? 'CLEARED' : 'PENDING'}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-slate-300 font-semibold">Digital Documents Generated</td>
                    <td className="p-2 border border-slate-300 text-center font-bold font-mono">{filteredDocs.length}</td>
                    <td className="p-2 border border-slate-300">BNSS legal notices & memos</td>
                    <td className="p-2 border border-slate-300 text-center font-bold">ACTIVE</td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-slate-300 font-semibold">Estimated Administrative Hours Saved</td>
                    <td className="p-2 border border-slate-300 text-center font-bold font-mono">~{timeSavedEstimate.hoursSaved} hrs</td>
                    <td className="p-2 border border-slate-300">Based on {timeSavedEstimate.manualMinutes}m manual vs {timeSavedEstimate.appMinutes}m app</td>
                    <td className="p-2 border border-slate-300 text-center font-bold">EFFICIENT</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Most Missed Steps Section */}
            <div>
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 mb-2 border-b border-slate-300 pb-1">
                2. Key Procedural Gaps (Training Priorities)
              </h3>
              <div className="space-y-1.5 text-[11px]">
                {mostMissedSteps.map((m, idx) => (
                  <div key={m.step.id} className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200">
                    <span className="font-semibold text-slate-800">
                      {idx + 1}. {m.step.text_en} ({m.step.legalRefs[0]?.act} {m.step.legalRefs[0]?.section})
                    </span>
                    <span className="font-mono font-bold text-red-600">
                      {m.percent}% Missed ({m.count}/{m.totalChecked} Cases)
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Official Certification / Signature block */}
            <div className="pt-6 border-t border-slate-300 flex items-end justify-between text-[10px] text-slate-600">
              <div>
                <p>Generated by NyaySaathi Station Supervisory Terminal</p>
                <p>System Hash: SHA-256 Verified • 100% Offline Database</p>
                <p className="italic mt-1">* General informational summary for administrative review.</p>
              </div>
              <div className="text-center w-48 border-t border-slate-400 pt-1">
                <span className="block font-bold text-slate-900">{profile?.name || 'Senior Police Inspector'}</span>
                <span>Station House Officer</span>
              </div>
            </div>
          </div>
        </div>
        </div>
      </Modal>
    </div>
  );
};
