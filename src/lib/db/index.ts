import { openDB, IDBPDatabase } from 'idb';
import {
  NyaySaathiDB,
  ProfileRecord,
  SettingsRecord,
  SettingKey,
  CaseRecord,
  CaseEventRecord,
  ChecklistRunRecord,
  EvidenceRecord,
  CustodyLogRecord,
  DocumentRecord,
  BookmarkRecord,
  BookmarkKind,
  AuditLogRecord,
} from '../../types/database.ts';
import { generateId, getIsoTimestamp } from './id.ts';
import { notifyStoreChange } from './events.ts';

const DB_NAME = 'nyay_saathi';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<NyaySaathiDB>> | null = null;

export function getDatabase(): Promise<IDBPDatabase<NyaySaathiDB>> {
  if (!dbPromise) {
    dbPromise = openDB<NyaySaathiDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        // Version 1 Migration
        if (oldVersion < 1) {
          // 1. Profile Store
          if (!db.objectStoreNames.contains('profile')) {
            db.createObjectStore('profile', { keyPath: 'id' });
          }

          // 2. Settings Store
          if (!db.objectStoreNames.contains('settings')) {
            db.createObjectStore('settings', { keyPath: 'key' });
          }

          // 3. Cases Store
          if (!db.objectStoreNames.contains('cases')) {
            const caseStore = db.createObjectStore('cases', { keyPath: 'id' });
            caseStore.createIndex('by-caseNo', 'caseNo', { unique: false });
            caseStore.createIndex('by-status', 'status', { unique: false });
            caseStore.createIndex('by-createdAt', 'createdAt', { unique: false });
          }

          // 4. Case Events
          if (!db.objectStoreNames.contains('caseEvents')) {
            const eventStore = db.createObjectStore('caseEvents', { keyPath: 'id' });
            eventStore.createIndex('by-caseId', 'caseId', { unique: false });
            eventStore.createIndex('by-dateTime', 'dateTime', { unique: false });
          }

          // 5. Checklist Runs
          if (!db.objectStoreNames.contains('checklistRuns')) {
            const runStore = db.createObjectStore('checklistRuns', { keyPath: 'id' });
            runStore.createIndex('by-caseId', 'caseId', { unique: false });
          }

          // 6. Evidence Metadata
          if (!db.objectStoreNames.contains('evidence')) {
            const evStore = db.createObjectStore('evidence', { keyPath: 'id' });
            evStore.createIndex('by-caseId', 'caseId', { unique: false });
            evStore.createIndex('by-loggedAt', 'loggedAt', { unique: false });
          }

          // 7. Evidence Blobs (Separated for fast metadata queries)
          if (!db.objectStoreNames.contains('evidenceBlobs')) {
            db.createObjectStore('evidenceBlobs', { keyPath: 'evidenceId' });
          }

          // 8. Custody Logs (Chain of Custody)
          if (!db.objectStoreNames.contains('custodyLogs')) {
            const clStore = db.createObjectStore('custodyLogs', { keyPath: 'id' });
            clStore.createIndex('by-evidenceId', 'evidenceId', { unique: false });
            clStore.createIndex('by-timestamp', 'timestamp', { unique: false });
          }

          // 9. Documents (Memos & Notices)
          if (!db.objectStoreNames.contains('documents')) {
            const docStore = db.createObjectStore('documents', { keyPath: 'id' });
            docStore.createIndex('by-caseId', 'caseId', { unique: false });
            docStore.createIndex('by-createdAt', 'createdAt', { unique: false });
          }

          // 10. Bookmarks
          if (!db.objectStoreNames.contains('bookmarks')) {
            const bmStore = db.createObjectStore('bookmarks', { keyPath: 'id' });
            bmStore.createIndex('by-kind', 'kind', { unique: false });
            bmStore.createIndex('by-refId', 'refId', { unique: false });
          }

          // 11. Audit Log
          if (!db.objectStoreNames.contains('auditLog')) {
            const alStore = db.createObjectStore('auditLog', { keyPath: 'id' });
            alStore.createIndex('by-timestamp', 'timestamp', { unique: false });
          }
        }
      },
    });
  }
  return dbPromise;
}

/**
 * Storage usage estimate
 */
export async function getStorageEstimate(): Promise<{
  usageBytes: number;
  quotaBytes: number;
  percentageUsed: number;
}> {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
    try {
      const { usage = 0, quota = 1 } = await navigator.storage.estimate();
      return {
        usageBytes: usage,
        quotaBytes: quota,
        percentageUsed: Math.min(100, Math.round((usage / quota) * 100)),
      };
    } catch {
      // Fallback
    }
  }
  return { usageBytes: 0, quotaBytes: 0, percentageUsed: 0 };
}

/**
 * Audit Log Service
 */
export async function addAuditLog(action: string, detail: string): Promise<AuditLogRecord> {
  const db = await getDatabase();
  const entry: AuditLogRecord = {
    id: generateId('audit'),
    timestamp: getIsoTimestamp(),
    action,
    detail,
  };
  await db.put('auditLog', entry);
  notifyStoreChange('auditLog');
  return entry;
}

export async function listAuditLogs(limit = 100): Promise<AuditLogRecord[]> {
  const db = await getDatabase();
  const logs = await db.getAllFromIndex('auditLog', 'by-timestamp');
  return logs.reverse().slice(0, limit);
}

/**
 * Profile Service
 */
export async function getProfile(): Promise<ProfileRecord | null> {
  const db = await getDatabase();
  const profile = await db.get('profile', 'current_officer');
  return profile || null;
}

export async function saveProfile(
  data: Omit<ProfileRecord, 'id' | 'createdAt'> & { id?: string; createdAt?: string }
): Promise<ProfileRecord> {
  const db = await getDatabase();
  const record: ProfileRecord = {
    id: 'current_officer',
    createdAt: data.createdAt || getIsoTimestamp(),
    ...data,
  };
  await db.put('profile', record);
  await addAuditLog('profile_updated', `Officer profile updated: ${record.name} (${record.rank})`);
  notifyStoreChange('profile');
  return record;
}

/**
 * Settings Service
 */
export async function getSetting<T = unknown>(key: SettingKey | string, defaultValue?: T): Promise<T> {
  const db = await getDatabase();
  const record = await db.get('settings', key);
  return record ? (record.value as T) : (defaultValue as T);
}

export async function setSetting(key: SettingKey | string, value: unknown): Promise<void> {
  const db = await getDatabase();
  await db.put('settings', { key, value });
  notifyStoreChange('settings');
}

export async function getAllSettings(): Promise<Record<string, unknown>> {
  const db = await getDatabase();
  const records = await db.getAll('settings');
  const result: Record<string, unknown> = {};
  for (const r of records) {
    result[r.key] = r.value;
  }
  return result;
}

/**
 * Case Service
 */
export async function createCase(
  data: Omit<CaseRecord, 'id' | 'createdAt' | 'updatedAt'>
): Promise<CaseRecord> {
  const db = await getDatabase();
  const now = getIsoTimestamp();
  const record: CaseRecord = {
    id: generateId('case'),
    createdAt: now,
    updatedAt: now,
    ...data,
  };
  await db.put('cases', record);
  await addAuditLog('case_created', `Case registered: ${record.caseNo} (${record.firNo})`);
  notifyStoreChange('cases');
  return record;
}

export async function getCase(id: string): Promise<CaseRecord | null> {
  const db = await getDatabase();
  const item = await db.get('cases', id);
  return item || null;
}

export async function updateCase(id: string, patch: Partial<CaseRecord>): Promise<CaseRecord> {
  const db = await getDatabase();
  const existing = await db.get('cases', id);
  if (!existing) throw new Error(`Case with id ${id} not found`);

  const updated: CaseRecord = {
    ...existing,
    ...patch,
    updatedAt: getIsoTimestamp(),
  };
  await db.put('cases', updated);
  await addAuditLog('case_updated', `Case updated: ${updated.caseNo}`);
  notifyStoreChange('cases');
  return updated;
}

export async function deleteCase(id: string): Promise<void> {
  const db = await getDatabase();
  const existing = await db.get('cases', id);
  await db.delete('cases', id);
  await addAuditLog('case_deleted', `Case deleted: ${existing?.caseNo || id}`);
  notifyStoreChange('cases');
}

export async function listCases(statusFilter?: string): Promise<CaseRecord[]> {
  const db = await getDatabase();
  if (statusFilter && statusFilter !== 'all') {
    return db.getAllFromIndex('cases', 'by-status', statusFilter);
  }
  return db.getAllFromIndex('cases', 'by-createdAt');
}

export async function markCaseDeadlineComplete(
  caseId: string,
  ruleId: string,
  completedAt?: string,
  note?: string,
  eventId?: string
): Promise<CaseRecord> {
  const db = await getDatabase();
  const existing = await db.get('cases', caseId);
  if (!existing) throw new Error(`Case with id ${caseId} not found`);

  const completions = { ...(existing.deadlineCompletions || {}) };
  completions[ruleId] = {
    ruleId,
    completedAt: completedAt || getIsoTimestamp(),
    note,
    eventId,
  };

  const updated: CaseRecord = {
    ...existing,
    deadlineCompletions: completions,
    updatedAt: getIsoTimestamp(),
  };

  await db.put('cases', updated);
  await addAuditLog('deadline_completed', `Statutory deadline marked completed: ${ruleId} for case ${existing.caseNo}`);
  notifyStoreChange('cases');
  return updated;
}

export async function unmarkCaseDeadlineComplete(
  caseId: string,
  ruleId: string
): Promise<CaseRecord> {
  const db = await getDatabase();
  const existing = await db.get('cases', caseId);
  if (!existing) throw new Error(`Case with id ${caseId} not found`);

  const completions = { ...(existing.deadlineCompletions || {}) };
  delete completions[ruleId];

  const updated: CaseRecord = {
    ...existing,
    deadlineCompletions: completions,
    updatedAt: getIsoTimestamp(),
  };

  await db.put('cases', updated);
  await addAuditLog('deadline_reopened', `Statutory deadline reopened: ${ruleId} for case ${existing.caseNo}`);
  notifyStoreChange('cases');
  return updated;
}

/**
 * Case Events Service
 */
export async function addCaseEvent(
  data: Omit<CaseEventRecord, 'id'>
): Promise<CaseEventRecord> {
  const db = await getDatabase();
  const record: CaseEventRecord = {
    id: generateId('event'),
    ...data,
  };
  await db.put('caseEvents', record);
  notifyStoreChange('caseEvents');
  return record;
}

export async function listCaseEvents(caseId: string): Promise<CaseEventRecord[]> {
  const db = await getDatabase();
  return db.getAllFromIndex('caseEvents', 'by-caseId', caseId);
}

export async function deleteCaseEvent(id: string): Promise<void> {
  const db = await getDatabase();
  await db.delete('caseEvents', id);
  notifyStoreChange('caseEvents');
}

/**
 * Checklist Runs Service
 */
export async function saveChecklistRun(
  data: Omit<ChecklistRunRecord, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
): Promise<ChecklistRunRecord> {
  const db = await getDatabase();
  const now = getIsoTimestamp();
  const id = data.id || generateId('chk');
  const existing = data.id ? await db.get('checklistRuns', data.id) : null;

  const record: ChecklistRunRecord = {
    id,
    createdAt: existing ? existing.createdAt : now,
    updatedAt: now,
    ...data,
  };
  await db.put('checklistRuns', record);
  notifyStoreChange('checklistRuns');
  return record;
}

export async function getChecklistRun(id: string): Promise<ChecklistRunRecord | null> {
  const db = await getDatabase();
  const item = await db.get('checklistRuns', id);
  return item || null;
}

export async function listChecklistRunsByCase(caseId: string): Promise<ChecklistRunRecord[]> {
  const db = await getDatabase();
  return db.getAllFromIndex('checklistRuns', 'by-caseId', caseId);
}

export async function listAllChecklistRuns(): Promise<ChecklistRunRecord[]> {
  const db = await getDatabase();
  return db.getAll('checklistRuns');
}

/**
 * Digital Evidence Service
 */
export async function createEvidence(
  meta: Omit<EvidenceRecord, 'id' | 'loggedAt'>,
  blob?: Blob
): Promise<EvidenceRecord> {
  const db = await getDatabase();
  const id = generateId('ev');
  const loggedAt = getIsoTimestamp();

  const record: EvidenceRecord = {
    id,
    loggedAt,
    ...meta,
  };

  const tx = db.transaction(['evidence', 'evidenceBlobs'], 'readwrite');
  await tx.objectStore('evidence').put(record);
  if (blob) {
    await tx.objectStore('evidenceBlobs').put({ evidenceId: id, blob });
  }
  await tx.done;

  await addAuditLog('evidence_added', `Evidence added: ${record.fileName} (SHA-256: ${record.sha256.slice(0, 10)}...)`);
  notifyStoreChange('evidence');
  return record;
}

export async function getEvidence(id: string): Promise<EvidenceRecord | null> {
  const db = await getDatabase();
  const item = await db.get('evidence', id);
  return item || null;
}

export async function updateEvidence(
  id: string,
  patch: Partial<EvidenceRecord>
): Promise<EvidenceRecord> {
  const db = await getDatabase();
  const existing = await db.get('evidence', id);
  if (!existing) throw new Error(`Evidence ${id} not found`);
  const updated: EvidenceRecord = { ...existing, ...patch };
  await db.put('evidence', updated);
  notifyStoreChange('evidence');
  return updated;
}

export async function getEvidenceBlob(evidenceId: string): Promise<Blob | null> {
  const db = await getDatabase();
  const record = await db.get('evidenceBlobs', evidenceId);
  return record ? record.blob : null;
}

export async function listEvidenceByCase(caseId: string): Promise<EvidenceRecord[]> {
  const db = await getDatabase();
  return db.getAllFromIndex('evidence', 'by-caseId', caseId);
}

export async function listAllEvidence(): Promise<EvidenceRecord[]> {
  const db = await getDatabase();
  return db.getAll('evidence');
}

export async function deleteEvidence(id: string): Promise<void> {
  const db = await getDatabase();
  const tx = db.transaction(['evidence', 'evidenceBlobs'], 'readwrite');
  await tx.objectStore('evidence').delete(id);
  await tx.objectStore('evidenceBlobs').delete(id);
  await tx.done;

  await addAuditLog('evidence_deleted', `Evidence deleted: ${id}`);
  notifyStoreChange('evidence');
}

/**
 * Custody Logs Service
 */
export async function addCustodyLog(
  data: Omit<CustodyLogRecord, 'id' | 'timestamp'>
): Promise<CustodyLogRecord> {
  const db = await getDatabase();
  const record: CustodyLogRecord = {
    id: generateId('custody'),
    timestamp: getIsoTimestamp(),
    ...data,
  };
  await db.put('custodyLogs', record);
  notifyStoreChange('custodyLogs');
  return record;
}

export async function listCustodyLogs(evidenceId: string): Promise<CustodyLogRecord[]> {
  const db = await getDatabase();
  return db.getAllFromIndex('custodyLogs', 'by-evidenceId', evidenceId);
}

/**
 * Document Service
 */
export async function saveDocument(
  data: Omit<DocumentRecord, 'id' | 'createdAt' | 'updatedAt'> & { id?: string; savedBy?: string }
): Promise<DocumentRecord> {
  const db = await getDatabase();
  const now = getIsoTimestamp();
  const id = data.id || generateId('doc');
  const existing = data.id ? await db.get('documents', data.id) : null;

  const currentVersion = existing?.version || 1;
  const nextVersion = existing ? currentVersion + 1 : 1;
  const prevVersions = existing?.versions || [];

  const versions = existing
    ? [
        ...prevVersions,
        {
          version: currentVersion,
          savedAt: existing.updatedAt || existing.createdAt,
          fields: existing.fields,
          language: existing.language,
          savedBy: data.savedBy,
        },
      ]
    : [];

  const record: DocumentRecord = {
    id,
    createdAt: existing ? existing.createdAt : now,
    updatedAt: now,
    caseId: data.caseId,
    templateId: data.templateId,
    language: data.language,
    fields: data.fields,
    version: nextVersion,
    versions,
  };
  await db.put('documents', record);
  await addAuditLog('document_saved', `Legal document saved: ${record.templateId} (v${record.version})`);
  notifyStoreChange('documents');
  return record;
}

export async function getDocument(id: string): Promise<DocumentRecord | null> {
  const db = await getDatabase();
  const item = await db.get('documents', id);
  return item || null;
}

export async function listDocumentsByCase(caseId: string): Promise<DocumentRecord[]> {
  const db = await getDatabase();
  return db.getAllFromIndex('documents', 'by-caseId', caseId);
}

export async function listAllDocuments(): Promise<DocumentRecord[]> {
  const db = await getDatabase();
  return db.getAll('documents');
}

export async function deleteDocument(id: string): Promise<void> {
  const db = await getDatabase();
  await db.delete('documents', id);
  await addAuditLog('document_deleted', `Document deleted: ${id}`);
  notifyStoreChange('documents');
}

/**
 * Bookmarks Service
 */
export async function toggleBookmark(kind: BookmarkKind, refId: string): Promise<boolean> {
  const db = await getDatabase();
  const bookmarks = await db.getAllFromIndex('bookmarks', 'by-kind', kind);
  const existing = bookmarks.find((b) => b.refId === refId);

  if (existing) {
    await db.delete('bookmarks', existing.id);
    notifyStoreChange('bookmarks');
    return false;
  } else {
    const record: BookmarkRecord = {
      id: generateId('bm'),
      kind,
      refId,
      createdAt: getIsoTimestamp(),
    };
    await db.put('bookmarks', record);
    notifyStoreChange('bookmarks');
    return true;
  }
}

export async function isBookmarked(kind: BookmarkKind, refId: string): Promise<boolean> {
  const db = await getDatabase();
  const bookmarks = await db.getAllFromIndex('bookmarks', 'by-kind', kind);
  return bookmarks.some((b) => b.refId === refId);
}

export async function listBookmarks(kind?: BookmarkKind): Promise<BookmarkRecord[]> {
  const db = await getDatabase();
  if (kind) {
    return db.getAllFromIndex('bookmarks', 'by-kind', kind);
  }
  return db.getAll('bookmarks');
}

/**
 * Clear All Local Database Records
 */
export async function clearAllData(): Promise<void> {
  const db = await getDatabase();
  const stores = db.objectStoreNames;
  const tx = db.transaction(stores, 'readwrite');
  for (const store of stores) {
    await tx.objectStore(store).clear();
  }
  await tx.done;
  notifyStoreChange('*');
}

export * from './id.ts';
export * from './events.ts';
export * from './sampleData.ts';
