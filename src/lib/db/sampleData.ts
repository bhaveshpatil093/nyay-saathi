import { getDatabase, addAuditLog } from './index.ts';
import {
  CaseRecord,
  EvidenceRecord,
  CaseEventRecord,
  ChecklistRunRecord,
  DocumentRecord,
  CustodyLogRecord,
} from '../../types/database.ts';
import { GENERAL_PROCEDURE_STEPS } from '../../data/steps.ts';
import { dbEvents } from './events.ts';

/**
 * Seeds rich, realistic, strictly fictional Maharashtra Police Station sample data:
 *
 * 1. Case A: Theft (BNS 303(2))
 *    - Search & seizure conducted
 *    - 3 evidence items with complete chain of custody
 *    - Checklist ~70% completed
 *
 * 2. Case B: Online Cheating / Cyber (BNS 318(4))
 *    - Electronic evidence with Section 63 BSA certificate generated
 *    - One overdue deadline (14-day enquiry / notice overdue)
 *    - Checklist ~40% completed
 *
 * 3. Case C: Robbery (BNS 309)
 *    - Arrest made 20 hours ago -> 24-hour Magistrate production deadline is "due soon" (4h remaining)
 *    - Checklist ~25% completed
 *
 * All records are flagged with `isSample: true` and use fictional names and numbers only.
 */
export async function seedSampleStationData(): Promise<{
  casesCount: number;
  evidenceCount: number;
  documentsCount: number;
}> {
  const db = await getDatabase();
  const now = new Date();

  // Helper date generators
  const hoursAgo = (hours: number): string => {
    return new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString();
  };

  const daysAgo = (days: number, hoursOffset: number = 0): string => {
    return new Date(now.getTime() - (days * 24 + hoursOffset) * 60 * 60 * 1000).toISOString();
  };

  // 1. Case A: Theft
  const caseA_id = `sample_case_a_${Date.now()}`;
  const caseA: CaseRecord = {
    id: caseA_id,
    caseNo: 'CR-104/2026',
    firNo: 'FIR-042/2026',
    firDateTime: daysAgo(3, 4),
    policeStation: 'Shivaji Nagar PS, Pune City',
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
    ioName: 'PSI Ramesh Patil',
    ioRank: 'PSI',
    complainantName: 'Sunil D. Kulkarni',
    accusedNames: ['Sachin G. More'],
    summary:
      'Mobile snatching and wallet theft at Swargate bus depot. Stolen OnePlus phone and leather wallet recovered during search with independent panchas.',
    status: 'open',
    isSample: true,
    createdAt: daysAgo(3, 4),
    updatedAt: hoursAgo(6),
  };

  // 2. Case B: Cyber Fraud (Online Cheating)
  const caseB_id = `sample_case_b_${Date.now()}`;
  const caseB: CaseRecord = {
    id: caseB_id,
    caseNo: 'CR-106/2026',
    firNo: 'FIR-044/2026',
    firDateTime: daysAgo(18, 2), // 18 days ago -> triggers overdue preliminary inquiry / statutory notice deadline
    policeStation: 'Shivaji Nagar PS, Pune City',
    district: 'Pune',
    offenceIds: ['cyber_fraud_bns_318'],
    provisions: [{ act: 'BNS', section: '318', subSection: '4' }],
    facts: {
      cognizable: true,
      womanVictim: false,
      childVictim: false,
      arrestMade: false,
      searchConducted: false,
      electronicEvidence: true,
      seizureMade: false,
      rapeCase: false,
      injuryOrDeath: false,
    },
    ioName: 'API Sunita Deshmukh',
    ioRank: 'API',
    complainantName: 'Anil B. Joshi',
    accusedNames: ['Unknown Cyber Fraudster (Fintech Syndicate)'],
    summary:
      'Online investment cheating of Rs 2,40,000 via fraudulent Telegram task links and fraudulent UPI handle transfers. Bank notices sent.',
    status: 'open',
    isSample: true,
    createdAt: daysAgo(18, 2),
    updatedAt: daysAgo(1, 0),
  };

  // 3. Case C: Robbery (Arrest made 20h ago -> 24h deadline due soon!)
  const caseC_id = `sample_case_c_${Date.now()}`;
  const caseC: CaseRecord = {
    id: caseC_id,
    caseNo: 'CR-112/2026',
    firNo: 'FIR-049/2026',
    firDateTime: hoursAgo(22),
    policeStation: 'Shivaji Nagar PS, Pune City',
    district: 'Pune',
    offenceIds: ['robbery_bns_309'],
    provisions: [{ act: 'BNS', section: '309', subSection: '2' }],
    facts: {
      cognizable: true,
      womanVictim: false,
      childVictim: false,
      arrestMade: true,
      searchConducted: true,
      electronicEvidence: false,
      seizureMade: true,
      rapeCase: false,
      injuryOrDeath: true,
    },
    ioName: 'PSI Ramesh Patil',
    ioRank: 'PSI',
    complainantName: 'Vikas M. Jadhav',
    accusedNames: ['Rahul K. Pawar'],
    summary:
      'Robbery of gold chain and cash near FC Road with physical threats. Suspect apprehended during night police patrolling and taken into custody.',
    status: 'open',
    isSample: true,
    createdAt: hoursAgo(22),
    updatedAt: hoursAgo(2),
  };

  const sampleCases = [caseA, caseB, caseC];
  for (const c of sampleCases) {
    await db.put('cases', c);
  }

  // Events for Case A
  const eventsCaseA: CaseEventRecord[] = [
    {
      id: `ev_${caseA_id}_1`,
      caseId: caseA_id,
      type: 'fir_registered',
      dateTime: daysAgo(3, 4),
      note: 'FIR registered under BNS Section 303(2). Entry made in Station General Diary.',
    },
    {
      id: `ev_${caseA_id}_2`,
      caseId: caseA_id,
      type: 'search_started',
      dateTime: daysAgo(2, 6),
      note: 'Search conducted at suspect residence with independent witnesses and Section 105 videography.',
    },
    {
      id: `ev_${caseA_id}_3`,
      caseId: caseA_id,
      type: 'seizure_made',
      dateTime: daysAgo(2, 5),
      note: 'Seizure memo drawn for stolen OnePlus smartphone and cash. Exhibits sealed.',
    },
    {
      id: `ev_${caseA_id}_4`,
      caseId: caseA_id,
      type: 'arrest_made',
      dateTime: daysAgo(2, 2),
      note: 'Accused Sachin More arrested. Intimation given to family. Remand granted by Magistrate.',
    },
  ];

  // Events for Case B (18 days old, overdue preliminary inquiry)
  const eventsCaseB: CaseEventRecord[] = [
    {
      id: `ev_${caseB_id}_1`,
      caseId: caseB_id,
      type: 'fir_registered',
      dateTime: daysAgo(18, 2),
      note: 'FIR registered under BNS 318(4) and IT Act Section 66D for online financial fraud.',
    },
    {
      id: `ev_${caseB_id}_2`,
      caseId: caseB_id,
      type: 'seizure_made',
      dateTime: daysAgo(17, 4),
      note: 'Extracted victim bank statement and WhatsApp chat logs with SHA-256 fingerprint.',
    },
  ];

  // Events for Case C (Arrest 20h ago -> triggers 24h remand warning)
  const eventsCaseC: CaseEventRecord[] = [
    {
      id: `ev_${caseC_id}_1`,
      caseId: caseC_id,
      type: 'fir_registered',
      dateTime: hoursAgo(22),
      note: 'FIR registered under BNS Section 309(2) (Robbery). Emergency wireless flash broadcasted.',
    },
    {
      id: `ev_${caseC_id}_2`,
      caseId: caseC_id,
      type: 'arrest_made',
      dateTime: hoursAgo(20), // Exactly 20 hours ago! 4h remaining to 24h limit
      note: 'Accused Rahul Pawar arrested on FC Road. Grounds of arrest served. Production before Magistrate due.',
    },
    {
      id: `ev_${caseC_id}_3`,
      caseId: caseC_id,
      type: 'seizure_made',
      dateTime: hoursAgo(19),
      note: 'Recovered gold chain seized under panchnama with videography.',
    },
  ];

  const allEvents = [...eventsCaseA, ...eventsCaseB, ...eventsCaseC];
  for (const ev of allEvents) {
    await db.put('caseEvents', ev);
  }

  // Mandatory Procedure Steps for Checklists
  const mandatorySteps = GENERAL_PROCEDURE_STEPS.filter((s) => s.mandatory);

  // Checklist for Case A: ~70% done (7 of 10 steps completed)
  const stepsCaseA = mandatorySteps.map((step, idx) => ({
    stepId: step.id,
    done: idx < 7,
    doneAt: idx < 7 ? daysAgo(2, idx) : undefined,
    note: idx < 7 ? 'Complied with independent panchas and videography' : undefined,
    isNew: false,
  }));
  await db.put('checklistRuns', {
    id: `chk_${caseA_id}`,
    caseId: caseA_id,
    offenceId: 'theft_bns_303',
    steps: stepsCaseA,
    createdAt: daysAgo(3, 4),
    updatedAt: hoursAgo(6),
  });

  // Checklist for Case B: ~40% done (4 of 10 steps completed)
  const stepsCaseB = mandatorySteps.map((step, idx) => ({
    stepId: step.id,
    done: idx < 4,
    doneAt: idx < 4 ? daysAgo(17, idx) : undefined,
    note: idx < 4 ? 'Complied during cyber preliminary analysis' : undefined,
    isNew: false,
  }));
  await db.put('checklistRuns', {
    id: `chk_${caseB_id}`,
    caseId: caseB_id,
    offenceId: 'cyber_fraud_bns_318',
    steps: stepsCaseB,
    createdAt: daysAgo(18, 2),
    updatedAt: daysAgo(1, 0),
  });

  // Checklist for Case C: ~25% done (2 of 10 steps completed)
  const stepsCaseC = mandatorySteps.map((step, idx) => ({
    stepId: step.id,
    done: idx < 2 || idx === 3,
    doneAt: idx < 2 || idx === 3 ? hoursAgo(19) : undefined,
    note: idx < 2 || idx === 3 ? 'Immediate arrest procedure recorded in Station Diary' : undefined,
    isNew: false,
  }));
  await db.put('checklistRuns', {
    id: `chk_${caseC_id}`,
    caseId: caseC_id,
    offenceId: 'robbery_bns_309',
    steps: stepsCaseC,
    createdAt: hoursAgo(22),
    updatedAt: hoursAgo(2),
  });

  // 3 Evidence items for Case A with COMPLETE CUSTODY CHAINS
  const evidenceA1_id = `sample_ev_${caseA_id}_1`;
  const evidenceA1: EvidenceRecord = {
    id: evidenceA1_id,
    caseId: caseA_id,
    exhibitNo: 'EX-01',
    fileName: 'CCTV_Footage_Swargate_Depot.mp4',
    mimeType: 'video/mp4',
    size: 48920112,
    lastModified: daysAgo(3, 6),
    sha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    algorithm: 'SHA-256',
    description: 'CCTV surveillance recording from Platform 4 showing suspect snatching handbag',
    source: 'MSRTC Bus Depot CCTV NVR, Channel 2',
    handlerName: 'PSI Ramesh Patil',
    loggedAt: daysAgo(3, 2),
    geo: { lat: 18.5018, lng: 73.8586, accuracy: 5 },
    deviceInfo: 'Hikvision DS-7608NI-K2 NVR',
    sealed: true,
    isSample: true,
  };

  const evidenceA2_id = `sample_ev_${caseA_id}_2`;
  const evidenceA2: EvidenceRecord = {
    id: evidenceA2_id,
    caseId: caseA_id,
    exhibitNo: 'EX-02',
    fileName: 'Seized_OnePlus_Phone_Ex01.jpg',
    mimeType: 'image/jpeg',
    size: 3410220,
    lastModified: daysAgo(2, 5),
    sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    algorithm: 'SHA-256',
    description: 'Photograph of seized stolen OnePlus Nord CE smartphone with intact serial label',
    source: 'Recovered from possession of suspect Sachin More',
    handlerName: 'PSI Ramesh Patil',
    loggedAt: daysAgo(2, 5),
    geo: { lat: 18.5022, lng: 73.8591, accuracy: 8 },
    deviceInfo: 'Police Station Forensic Kit DSLR',
    sealed: true,
    isSample: true,
  };

  const evidenceA3_id = `sample_ev_${caseA_id}_3`;
  const evidenceA3: EvidenceRecord = {
    id: evidenceA3_id,
    caseId: caseA_id,
    exhibitNo: 'EX-03',
    fileName: 'Search_Seizure_Panchnama_Sec105_Video.mp4',
    mimeType: 'video/mp4',
    size: 38402110,
    lastModified: daysAgo(2, 4),
    sha256: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
    algorithm: 'SHA-256',
    description: 'Audio-video recording of search and seizure panchnama under Section 105 BNSS',
    source: 'Body camera / Mobile of Investigating Officer',
    handlerName: 'PSI Ramesh Patil',
    loggedAt: daysAgo(2, 4),
    geo: { lat: 18.502, lng: 73.859, accuracy: 6 },
    deviceInfo: 'Samsung SM-M346B Police Terminal',
    sealed: true,
    isSample: true,
  };

  // Electronic Evidence for Case B (with Section 63 BSA certificate)
  const evidenceB1_id = `sample_ev_${caseB_id}_1`;
  const evidenceB1: EvidenceRecord = {
    id: evidenceB1_id,
    caseId: caseB_id,
    exhibitNo: 'EX-01',
    fileName: 'Bank_Statement_Telegram_Chat_Extraction.pdf',
    mimeType: 'application/pdf',
    size: 1450210,
    lastModified: daysAgo(17, 3),
    sha256: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
    algorithm: 'SHA-256',
    description: 'Digital bank account statement and Telegram task payment chats extraction',
    source: 'Complainant device WhatsApp & Telegram exports',
    handlerName: 'API Sunita Deshmukh',
    loggedAt: daysAgo(17, 3),
    geo: { lat: 18.5314, lng: 73.8446, accuracy: 10 },
    deviceInfo: 'Vivo V29e Android 14',
    sealed: true,
    isSample: true,
  };

  const sampleEvidence = [evidenceA1, evidenceA2, evidenceA3, evidenceB1];
  for (const ev of sampleEvidence) {
    await db.put('evidence', ev);
  }

  // Complete Custody Chains for Evidence Items
  const custodyLogs: CustodyLogRecord[] = [
    {
      id: `cl_${evidenceA1_id}_1`,
      evidenceId: evidenceA1_id,
      seq: 1,
      action: 'Seized & Hash Computed',
      fromPerson: 'MSRTC Depot Security Officer',
      toPerson: 'PSI Ramesh Patil (IO)',
      location: 'Swargate Bus Station Office',
      remarks: 'CCTV footage exported to clean thumb drive and sealed with lac seal.',
      timestamp: daysAgo(3, 2),
      prevHash: '0000000000000000000000000000000000000000000000000000000000000000',
      entryHash: '1111a884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08111',
    },
    {
      id: `cl_${evidenceA1_id}_2`,
      evidenceId: evidenceA1_id,
      seq: 2,
      action: 'Deposited in Police Station Malkhana',
      fromPerson: 'PSI Ramesh Patil (IO)',
      toPerson: 'HC Vitthal Kamble (Malkhana Moharir)',
      location: 'Shivaji Nagar PS Malkhana Room',
      remarks: 'Sealed packet deposited in Malkhana Register No. 4, Item 88.',
      timestamp: daysAgo(2, 6),
      prevHash: '1111a884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08111',
      entryHash: '2222a884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08222',
    },
    {
      id: `cl_${evidenceA2_id}_1`,
      evidenceId: evidenceA2_id,
      seq: 1,
      action: 'Recovered & Seized',
      fromPerson: 'Accused Sachin More',
      toPerson: 'PSI Ramesh Patil (IO)',
      location: 'Swargate Outpost Panchnama Spot',
      remarks: 'OnePlus smartphone seized under spot panchnama in presence of panchas.',
      timestamp: daysAgo(2, 5),
      prevHash: '0000000000000000000000000000000000000000000000000000000000000000',
      entryHash: '3333e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852',
    },
    {
      id: `cl_${evidenceA3_id}_1`,
      evidenceId: evidenceA3_id,
      seq: 1,
      action: 'Recorded under Sec 105 BNSS',
      fromPerson: 'PC Ganesh Pawar (Videographer)',
      toPerson: 'PSI Ramesh Patil (IO)',
      location: 'Spot of Panchnama',
      remarks: 'Raw unedited video recording of search procedure saved with timestamp.',
      timestamp: daysAgo(2, 4),
      prevHash: '0000000000000000000000000000000000000000000000000000000000000000',
      entryHash: '4444c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
    },
    {
      id: `cl_${evidenceB1_id}_1`,
      evidenceId: evidenceB1_id,
      seq: 1,
      action: 'Extracted with Sec 63 BSA Certificate',
      fromPerson: 'Complainant Anil Joshi',
      toPerson: 'API Sunita Deshmukh',
      location: 'Cyber Cell, Shivaji Nagar PS',
      remarks: 'Digital PDF and chat transcript verified with SHA-256 hash.',
      timestamp: daysAgo(17, 3),
      prevHash: '0000000000000000000000000000000000000000000000000000000000000000',
      entryHash: '55554b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacda',
    },
  ];

  for (const cl of custodyLogs) {
    await db.put('custodyLogs', cl);
  }

  // Section 63 BSA Certificate Document for Case B (Generated)
  const docCertB: DocumentRecord = {
    id: `sample_doc_sec63_${caseB_id}`,
    caseId: caseB_id,
    templateId: 'sec_63_bsa_certificate',
    language: 'mr',
    fields: {
      caseNo: 'CR-106/2026',
      firNo: 'FIR-044/2026',
      policeStation: 'Shivaji Nagar PS, Pune City',
      officerName: 'API Sunita Deshmukh',
      officerRank: 'API',
      exhibitNo: 'EX-01',
      fileName: 'Bank_Statement_Telegram_Chat_Extraction.pdf',
      sha256: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
      deviceModel: 'Vivo V29e (Android 14)',
      operatingSystem: 'Funtouch OS 14',
      storageMedia: 'Internal Flash Memory',
      hashAlgorithm: 'SHA-256',
      generatedDate: daysAgo(17, 1),
      deponentName: 'API Sunita Deshmukh',
      certifierTitle: 'Assistant Police Inspector, Cyber Cell',
    },
    createdAt: daysAgo(17, 1),
    updatedAt: daysAgo(17, 1),
    version: 1,
    isSample: true,
  };

  // Seizure Panchnama Document for Case A
  const docPanchnamaA: DocumentRecord = {
    id: `sample_doc_panchnama_${caseA_id}`,
    caseId: caseA_id,
    templateId: 'seizure_memo',
    language: 'mr',
    fields: {
      caseNo: 'CR-104/2026',
      firNo: 'FIR-042/2026',
      policeStation: 'Shivaji Nagar PS, Pune City',
      officerName: 'PSI Ramesh Patil',
      officerRank: 'PSI',
      panch1Name: 'Anand V. Joshi, Age 38, Residing at Shivaji Nagar',
      panch2Name: 'Suresh M. Kadam, Age 42, Residing at Model Colony',
      seizedArticles: 'OnePlus Nord CE Mobile (Blue), Cash Rs 1,800/- in leather wallet',
      videographyDone: 'Yes, as mandated by Section 105 BNSS',
    },
    createdAt: daysAgo(2, 5),
    updatedAt: daysAgo(2, 5),
    version: 1,
    isSample: true,
  };

  await db.put('documents', docCertB);
  await db.put('documents', docPanchnamaA);

  await addAuditLog(
    'sample_data_loaded',
    `Loaded 3 realistic demonstration cases (Theft, Online Fraud, Robbery) with complete custody chains and Section 63 BSA certificate.`
  );

  // Notify all stores
  dbEvents.notify('cases');
  dbEvents.notify('evidence');
  dbEvents.notify('caseEvents');
  dbEvents.notify('checklistRuns');
  dbEvents.notify('documents');
  dbEvents.notify('custodyLogs');
  dbEvents.notify('auditLog');

  return {
    casesCount: sampleCases.length,
    evidenceCount: sampleEvidence.length,
    documentsCount: 2,
  };
}

/**
 * Removes all sample demonstration cases and their linked events,
 * checklist runs, evidence, custody logs, and documents.
 * Keeps all real user cases and officer profile untouched.
 */
export async function clearSampleData(): Promise<number> {
  const db = await getDatabase();
  const cases = await db.getAll('cases');
  const sampleCases = cases.filter((c) => c.isSample || c.id.startsWith('sample_'));
  const sampleCaseIds = new Set(sampleCases.map((c) => c.id));

  // Delete sample cases
  for (const c of sampleCases) {
    await db.delete('cases', c.id);
  }

  // Delete linked case events
  const allEvents = await db.getAll('caseEvents');
  for (const ev of allEvents) {
    if (sampleCaseIds.has(ev.caseId) || ev.id.startsWith('ev_sample_')) {
      await db.delete('caseEvents', ev.id);
    }
  }

  // Delete linked checklist runs
  const allRuns = await db.getAll('checklistRuns');
  for (const r of allRuns) {
    if (sampleCaseIds.has(r.caseId) || r.id.startsWith('chk_sample_')) {
      await db.delete('checklistRuns', r.id);
    }
  }

  // Delete linked evidence and custody logs
  const allEvidence = await db.getAll('evidence');
  for (const ev of allEvidence) {
    if (sampleCaseIds.has(ev.caseId) || ev.isSample || ev.id.startsWith('sample_ev_')) {
      await db.delete('evidence', ev.id);

      const allLogs = await db.getAll('custodyLogs');
      for (const log of allLogs) {
        if (log.evidenceId === ev.id || log.id.startsWith('cl_sample_')) {
          await db.delete('custodyLogs', log.id);
        }
      }
    }
  }

  // Delete linked documents
  const allDocs = await db.getAll('documents');
  for (const d of allDocs) {
    if (sampleCaseIds.has(d.caseId) || d.isSample || d.id.startsWith('sample_doc_')) {
      await db.delete('documents', d.id);
    }
  }

  await addAuditLog('sample_data_cleared', `Removed ${sampleCases.length} sample cases and all associated records.`);

  // Notify all stores
  dbEvents.notify('cases');
  dbEvents.notify('evidence');
  dbEvents.notify('caseEvents');
  dbEvents.notify('checklistRuns');
  dbEvents.notify('documents');
  dbEvents.notify('custodyLogs');
  dbEvents.notify('auditLog');

  return sampleCases.length;
}
