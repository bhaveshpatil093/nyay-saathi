import { CustodyLogRecord, EvidenceRecord } from '../../types/database.ts';
import { getDatabase, getEvidence, updateEvidence, addAuditLog, notifyStoreChange, generateId, getIsoTimestamp } from '../db/index.ts';

export type CustodyAction =
  | 'Collected'
  | 'Sealed'
  | 'Unsealed'
  | 'Transferred'
  | 'Received'
  | 'Sent to FSL'
  | 'Returned from FSL'
  | 'Produced in court'
  | 'Verified'
  | 'Note';

export const CUSTODY_ACTIONS: CustodyAction[] = [
  'Collected',
  'Sealed',
  'Unsealed',
  'Transferred',
  'Received',
  'Sent to FSL',
  'Returned from FSL',
  'Produced in court',
  'Verified',
  'Note',
];

export interface CanonicalCustodyPayload {
  evidenceId: string;
  seq: number;
  action: string;
  fromPerson: string;
  toPerson: string;
  location: string;
  remarks: string;
  timestamp: string;
  prevHash: string;
}

export interface VerifyChainResult {
  ok: boolean;
  totalEntries: number;
  brokenSeq?: number;
  reason?: string;
  reason_mr?: string;
  entries: CustodyLogRecord[];
  verifiedAt: string;
}

/**
 * Creates a deterministic, canonical JSON string for custody entry hashing.
 * Key order is strictly preserved.
 */
export function createCanonicalCustodyString(entry: CanonicalCustodyPayload): string {
  return JSON.stringify({
    evidenceId: entry.evidenceId,
    seq: entry.seq,
    action: entry.action,
    fromPerson: entry.fromPerson,
    toPerson: entry.toPerson,
    location: entry.location,
    remarks: entry.remarks,
    timestamp: entry.timestamp,
    prevHash: entry.prevHash,
  });
}

/**
 * Computes SHA-256 hash using Web Crypto API.
 */
export async function computeSha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Computes the entryHash for a custody log payload.
 */
export async function computeCustodyEntryHash(payload: CanonicalCustodyPayload): Promise<string> {
  const canonical = createCanonicalCustodyString(payload);
  return computeSha256(canonical);
}

/**
 * Suggests next logical procedural action based on the last recorded action.
 */
export function getNextSuggestedAction(lastAction?: string): CustodyAction {
  switch (lastAction) {
    case 'Collected':
      return 'Sealed';
    case 'Sealed':
      return 'Transferred';
    case 'Transferred':
      return 'Received';
    case 'Received':
      return 'Sent to FSL';
    case 'Sent to FSL':
      return 'Returned from FSL';
    case 'Returned from FSL':
      return 'Produced in court';
    case 'Unsealed':
      return 'Sealed';
    case 'Produced in court':
      return 'Received';
    case 'Verified':
      return 'Transferred';
    default:
      return 'Collected';
  }
}

/**
 * Appends a new custody log entry into the immutable chain.
 * Validates sequence, non-decreasing timestamps, and cryptographic linkage.
 */
export async function appendCustodyEntry(params: {
  evidenceId: string;
  action: CustodyAction | string;
  fromPerson: string;
  toPerson: string;
  location: string;
  remarks: string;
  timestamp?: string;
}): Promise<CustodyLogRecord> {
  const evidence = await getEvidence(params.evidenceId);
  if (!evidence) {
    throw new Error(`Evidence record ${params.evidenceId} not found`);
  }

  const db = await getDatabase();
  const existingLogs: CustodyLogRecord[] = await db.getAllFromIndex('custodyLogs', 'by-evidenceId', params.evidenceId);
  existingLogs.sort((a, b) => a.seq - b.seq);

  const seq = existingLogs.length + 1;
  const entryTimestamp = params.timestamp || getIsoTimestamp();

  // Validate timestamp is not earlier than previous entry
  if (existingLogs.length > 0) {
    const lastEntry = existingLogs[existingLogs.length - 1];
    const prevTime = new Date(lastEntry.timestamp).getTime();
    const currTime = new Date(entryTimestamp).getTime();
    if (currTime < prevTime) {
      throw new Error(`Entry timestamp (${entryTimestamp}) cannot be earlier than previous entry #${lastEntry.seq} (${lastEntry.timestamp})`);
    }
  }

  // Anchor prevHash to evidence file hash for seq 1, or last entry's entryHash
  const prevHash = seq === 1 ? evidence.sha256 : existingLogs[existingLogs.length - 1].entryHash;

  const payload: CanonicalCustodyPayload = {
    evidenceId: params.evidenceId,
    seq,
    action: params.action,
    fromPerson: params.fromPerson.trim(),
    toPerson: params.toPerson.trim(),
    location: params.location.trim(),
    remarks: params.remarks.trim(),
    timestamp: entryTimestamp,
    prevHash,
  };

  const entryHash = await computeCustodyEntryHash(payload);

  const record: CustodyLogRecord = {
    id: generateId('custody'),
    ...payload,
    entryHash,
  };

  await db.put('custodyLogs', record);

  // Update sealed state on evidence if action is Sealed or Unsealed
  if (params.action === 'Sealed') {
    await updateEvidence(params.evidenceId, { sealed: true });
  } else if (params.action === 'Unsealed') {
    await updateEvidence(params.evidenceId, { sealed: false });
  }

  await addAuditLog(
    'custody_appended',
    `Custody chain #${seq} appended: ${params.action} (${entryHash.slice(0, 8)}...) for evidence ${evidence.exhibitNo}`
  );

  notifyStoreChange('custodyLogs');
  return record;
}

/**
 * Recomputes and verifies the complete cryptographic chain for an evidence exhibit.
 * Returns ok or the first broken sequence number and explicit reason.
 */
export async function verifyChain(evidenceId: string): Promise<VerifyChainResult> {
  const verifiedAt = getIsoTimestamp();
  const evidence = await getEvidence(evidenceId);
  if (!evidence) {
    return {
      ok: false,
      totalEntries: 0,
      brokenSeq: 0,
      reason: `Evidence record ${evidenceId} not found in database.`,
      reason_mr: `डेटाबेसमध्ये पुरावा नोंद ${evidenceId} सापडली नाही.`,
      entries: [],
      verifiedAt,
    };
  }

  const db = await getDatabase();
  const logs: CustodyLogRecord[] = await db.getAllFromIndex('custodyLogs', 'by-evidenceId', evidenceId);
  logs.sort((a, b) => a.seq - b.seq);

  if (logs.length === 0) {
    return {
      ok: true,
      totalEntries: 0,
      entries: [],
      verifiedAt,
    };
  }

  for (let i = 0; i < logs.length; i++) {
    const curr = logs[i];
    const expectedSeq = i + 1;

    // 1. Sequence number validation
    if (curr.seq !== expectedSeq) {
      return {
        ok: false,
        totalEntries: logs.length,
        brokenSeq: curr.seq,
        reason: `Sequence violation: expected #${expectedSeq}, but found #${curr.seq}.`,
        reason_mr: `क्रमवारी त्रुटी: अनुक्रमांक #${expectedSeq} अपेक्षित होता, परंतु #${curr.seq} आढळला.`,
        entries: logs,
        verifiedAt,
      };
    }

    // 2. Previous hash linkage validation
    if (i === 0) {
      // Seq 1 must anchor directly to the evidence file's SHA-256
      if (curr.prevHash.toLowerCase() !== evidence.sha256.toLowerCase()) {
        return {
          ok: false,
          totalEntries: logs.length,
          brokenSeq: 1,
          reason: `Genesis anchor mismatch: prevHash (${curr.prevHash.slice(0, 10)}...) does not match original evidence SHA-256 (${evidence.sha256.slice(0, 10)}...).`,
          reason_mr: `प्रारंभिक हॅश विसंगती: prevHash (${curr.prevHash.slice(0, 10)}...) मूळ पुराव्याच्या SHA-256 शी जुळत नाही.`,
          entries: logs,
          verifiedAt,
        };
      }
    } else {
      const prev = logs[i - 1];
      if (curr.prevHash.toLowerCase() !== prev.entryHash.toLowerCase()) {
        return {
          ok: false,
          totalEntries: logs.length,
          brokenSeq: curr.seq,
          reason: `Chain link broken at #${curr.seq}: prevHash (${curr.prevHash.slice(0, 10)}...) does not match entry #${prev.seq} hash (${prev.entryHash.slice(0, 10)}...).`,
          reason_mr: `साखळी खंडित #${curr.seq}: prevHash मागील नोंद #${prev.seq} च्या हॅशशी जुळत नाही.`,
          entries: logs,
          verifiedAt,
        };
      }

      // 3. Chronological timestamp validation
      const prevTime = new Date(prev.timestamp).getTime();
      const currTime = new Date(curr.timestamp).getTime();
      if (currTime < prevTime) {
        return {
          ok: false,
          totalEntries: logs.length,
          brokenSeq: curr.seq,
          reason: `Chronological violation at #${curr.seq}: timestamp is earlier than preceding entry #${prev.seq}.`,
          reason_mr: `वेळेचा विसंगती दोष #${curr.seq}: नोंद वेळ मागील नोंद #${prev.seq} च्या वेळेपेक्षा आधीची आहे.`,
          entries: logs,
          verifiedAt,
        };
      }
    }

    // 4. Cryptographic integrity of payload
    const expectedHash = await computeCustodyEntryHash({
      evidenceId: curr.evidenceId,
      seq: curr.seq,
      action: curr.action,
      fromPerson: curr.fromPerson,
      toPerson: curr.toPerson,
      location: curr.location,
      remarks: curr.remarks,
      timestamp: curr.timestamp,
      prevHash: curr.prevHash,
    });

    if (curr.entryHash.toLowerCase() !== expectedHash.toLowerCase()) {
      return {
        ok: false,
        totalEntries: logs.length,
        brokenSeq: curr.seq,
        reason: `Cryptographic tamper detected at entry #${curr.seq}: record data was modified after calculation (expected ${expectedHash.slice(0, 8)}..., stored ${curr.entryHash.slice(0, 8)}...).`,
        reason_mr: `नोंद #${curr.seq} मध्ये छेडछाड आढळली: रेकॉर्ड डेटा हॅशनंतर बदलला गेला आहे (अपेक्षित ${expectedHash.slice(0, 8)}..., साठवलेला ${curr.entryHash.slice(0, 8)}...).`,
        entries: logs,
        verifiedAt,
      };
    }
  }

  return {
    ok: true,
    totalEntries: logs.length,
    entries: logs,
    verifiedAt,
  };
}

/**
 * Dev test helper: deliberately corrupts a custody entry to verify detection.
 */
export async function corruptCustodyEntryForDevTest(evidenceId?: string): Promise<{
  success: boolean;
  corruptedEntryId?: string;
  evidenceId?: string;
  seq?: number;
}> {
  const db = await getDatabase();
  let targetId = evidenceId;

  if (!targetId) {
    const allEvidence: EvidenceRecord[] = await db.getAll('evidence');
    if (allEvidence.length === 0) {
      throw new Error('No evidence records found to corrupt.');
    }
    targetId = allEvidence[0].id;
  }

  const logs: CustodyLogRecord[] = await db.getAllFromIndex('custodyLogs', 'by-evidenceId', targetId);
  if (logs.length === 0) {
    throw new Error('No custody entries exist for this evidence. Please add at least one entry first.');
  }

  // Pick last or middle entry to corrupt
  const entryToCorrupt = { ...logs[logs.length - 1] };
  entryToCorrupt.remarks = `${entryToCorrupt.remarks || ''} [TAMPERED_BY_DEV_TEST]`;
  // We do NOT recalculate entryHash - this creates an authentic tamper detection!

  await db.put('custodyLogs', entryToCorrupt);
  await addAuditLog('dev_test_corrupt', `Deliberately corrupted custody log #${entryToCorrupt.seq} for evidence ${targetId}`);
  notifyStoreChange('custodyLogs');

  return {
    success: true,
    corruptedEntryId: entryToCorrupt.id,
    evidenceId: targetId,
    seq: entryToCorrupt.seq,
  };
}

/**
 * Dev test helper: repairs/recalculates a corrupted custody entry back to valid cryptographic hash.
 */
export async function repairCustodyEntryForDevTest(entryId: string): Promise<boolean> {
  const db = await getDatabase();
  const entry = await db.get('custodyLogs', entryId);
  if (!entry) return false;

  entry.remarks = entry.remarks.replace(' [TAMPERED_BY_DEV_TEST]', '');
  entry.entryHash = await computeCustodyEntryHash({
    evidenceId: entry.evidenceId,
    seq: entry.seq,
    action: entry.action,
    fromPerson: entry.fromPerson,
    toPerson: entry.toPerson,
    location: entry.location,
    remarks: entry.remarks,
    timestamp: entry.timestamp,
    prevHash: entry.prevHash,
  });

  await db.put('custodyLogs', entry);
  notifyStoreChange('custodyLogs');
  return true;
}
