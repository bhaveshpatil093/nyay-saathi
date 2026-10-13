import { getDatabase, addAuditLog } from '../db/index.ts';
import { dbEvents } from '../db/events.ts';
import { encryptBackupData, decryptBackupData } from '../security/crypto.ts';

export interface BackupMetadata {
  format: 'nyay_saathi_backup';
  version: number;
  createdAt: string;
  encrypted: boolean;
  includesMedia: boolean;
  appVersion: string;
}

export interface BackupStores {
  profile: unknown[];
  settings: unknown[];
  cases: unknown[];
  caseEvents: unknown[];
  checklistRuns: unknown[];
  evidence: unknown[];
  evidenceBlobs?: unknown[];
  custodyLogs: unknown[];
  documents: unknown[];
  bookmarks: unknown[];
  auditLog: unknown[];
}

export interface UnencryptedBackupFile extends BackupMetadata {
  stores: BackupStores;
}

export interface EncryptedBackupFile extends BackupMetadata {
  saltBase64: string;
  ivBase64: string;
  ciphertextBase64: string;
}

export interface BackupSummary {
  createdAt: string;
  version: number;
  encrypted: boolean;
  includesMedia: boolean;
  casesCount: number;
  evidenceCount: number;
  documentsCount: number;
  eventsCount: number;
  checklistRunsCount: number;
  bookmarksCount: number;
  auditLogsCount: number;
}

const ALL_STORE_NAMES = [
  'profile',
  'settings',
  'cases',
  'caseEvents',
  'checklistRuns',
  'evidence',
  'evidenceBlobs',
  'custodyLogs',
  'documents',
  'bookmarks',
  'auditLog',
] as const;

/**
 * Exports a full database backup as a JSON file blob
 */
export async function exportDatabaseBackup(options: {
  passphrase?: string;
  includeMediaBlobs?: boolean;
}): Promise<{ blob: Blob; filename: string }> {
  const db = await getDatabase();
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];

  const storesData: Partial<BackupStores> = {};

  for (const storeName of ALL_STORE_NAMES) {
    if (storeName === 'evidenceBlobs' && !options.includeMediaBlobs) {
      storesData[storeName] = [];
      continue;
    }
    const records = await db.getAll(storeName);
    storesData[storeName] = records;
  }

  const isEncrypted = Boolean(options.passphrase && options.passphrase.trim().length > 0);
  let fileContentStr: string;

  if (isEncrypted) {
    const storesJson = JSON.stringify(storesData);
    const encResult = await encryptBackupData(storesJson, options.passphrase!.trim());
    const encryptedFile: EncryptedBackupFile = {
      format: 'nyay_saathi_backup',
      version: 1,
      createdAt: now.toISOString(),
      encrypted: true,
      includesMedia: Boolean(options.includeMediaBlobs),
      appVersion: '1.0.0',
      saltBase64: encResult.saltBase64,
      ivBase64: encResult.ivBase64,
      ciphertextBase64: encResult.ciphertextBase64,
    };
    fileContentStr = JSON.stringify(encryptedFile, null, 2);
  } else {
    const unencryptedFile: UnencryptedBackupFile = {
      format: 'nyay_saathi_backup',
      version: 1,
      createdAt: now.toISOString(),
      encrypted: false,
      includesMedia: Boolean(options.includeMediaBlobs),
      appVersion: '1.0.0',
      stores: storesData as BackupStores,
    };
    fileContentStr = JSON.stringify(unencryptedFile, null, 2);
  }

  await addAuditLog(
    'backup_exported',
    `Database backup exported (${isEncrypted ? 'Encrypted AES-GCM' : 'Unencrypted'}, ${
      options.includeMediaBlobs ? 'with media blobs' : 'metadata only'
    })`
  );

  const filename = `nyaysaathi_backup_${dateStr}_${isEncrypted ? 'enc' : 'plain'}.json`;
  const blob = new Blob([fileContentStr], { type: 'application/json' });
  return { blob, filename };
}

/**
 * Validates an uploaded backup file and returns summary counts or passphrase requirement
 */
export async function validateBackupFile(
  fileContent: string,
  passphrase?: string
): Promise<{
  valid: boolean;
  needsPassphrase?: boolean;
  error?: string;
  summary?: BackupSummary;
  parsedStores?: BackupStores;
}> {
  try {
    let parsed: any;
    try {
      parsed = JSON.parse(fileContent);
    } catch {
      return { valid: false, error: 'Invalid JSON file format. Could not parse.' };
    }

    if (parsed.format !== 'nyay_saathi_backup') {
      return {
        valid: false,
        error: 'Unrecognized backup format. File is not a valid NyaySaathi backup.',
      };
    }

    if (parsed.encrypted) {
      if (!passphrase || passphrase.trim().length === 0) {
        return {
          valid: false,
          needsPassphrase: true,
          error: 'This backup is encrypted with a passphrase. Please provide the passphrase.',
        };
      }

      try {
        const decryptedJson = await decryptBackupData(
          parsed.ciphertextBase64,
          passphrase.trim(),
          parsed.saltBase64,
          parsed.ivBase64
        );
        parsed.stores = JSON.parse(decryptedJson);
      } catch {
        return {
          valid: false,
          needsPassphrase: true,
          error: 'Decryption failed. Incorrect passphrase or corrupted backup file.',
        };
      }
    }

    if (!parsed.stores || typeof parsed.stores !== 'object') {
      return { valid: false, error: 'Backup data stores are missing or invalid.' };
    }

    const stores: BackupStores = parsed.stores;
    const summary: BackupSummary = {
      createdAt: parsed.createdAt || new Date().toISOString(),
      version: parsed.version || 1,
      encrypted: Boolean(parsed.encrypted),
      includesMedia: Boolean(parsed.includesMedia),
      casesCount: Array.isArray(stores.cases) ? stores.cases.length : 0,
      evidenceCount: Array.isArray(stores.evidence) ? stores.evidence.length : 0,
      documentsCount: Array.isArray(stores.documents) ? stores.documents.length : 0,
      eventsCount: Array.isArray(stores.caseEvents) ? stores.caseEvents.length : 0,
      checklistRunsCount: Array.isArray(stores.checklistRuns) ? stores.checklistRuns.length : 0,
      bookmarksCount: Array.isArray(stores.bookmarks) ? stores.bookmarks.length : 0,
      auditLogsCount: Array.isArray(stores.auditLog) ? stores.auditLog.length : 0,
    };

    return {
      valid: true,
      summary,
      parsedStores: stores,
    };
  } catch (err: any) {
    return {
      valid: false,
      error: err?.message || 'Failed to inspect backup file.',
    };
  }
}

/**
 * Restores stores into IndexedDB with either 'merge' or 'replace' mode
 */
export async function restoreBackup(
  stores: BackupStores,
  mode: 'merge' | 'replace'
): Promise<{
  casesRestored: number;
  evidenceRestored: number;
  totalRecordsRestored: number;
}> {
  const db = await getDatabase();
  let totalRestored = 0;

  if (mode === 'replace') {
    // Clear stores before replacing (preserve current auditLog to append import event)
    for (const storeName of ALL_STORE_NAMES) {
      if (storeName === 'auditLog') continue;
      await db.clear(storeName);
    }
  }

  for (const storeName of ALL_STORE_NAMES) {
    const records = (stores as any)[storeName];
    if (Array.isArray(records)) {
      for (const rec of records) {
        if (!rec) continue;
        try {
          await db.put(storeName, rec);
          totalRestored++;
        } catch (e) {
          console.warn(`Failed to restore record in ${storeName}:`, e);
        }
      }
    }
  }

  await addAuditLog(
    'backup_imported',
    `Database backup restored in ${mode.toUpperCase()} mode. Total records: ${totalRestored}`
  );

  // Notify all stores
  for (const s of ALL_STORE_NAMES) {
    dbEvents.notify(s);
  }

  return {
    casesRestored: Array.isArray(stores.cases) ? stores.cases.length : 0,
    evidenceRestored: Array.isArray(stores.evidence) ? stores.evidence.length : 0,
    totalRecordsRestored: totalRestored,
  };
}

/**
 * Deletes all database stores and resets onboarding on this device
 */
export async function clearAllDeviceData(): Promise<void> {
  const db = await getDatabase();
  for (const storeName of ALL_STORE_NAMES) {
    await db.clear(storeName);
  }

  // Clear local storage keys
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('nyay_saathi_mode');
    localStorage.removeItem('nyay_saathi_lang');
    localStorage.removeItem('nyay_saathi_onboarded');
    localStorage.removeItem('nyay_saathi_profile');
  }

  for (const s of ALL_STORE_NAMES) {
    dbEvents.notify(s);
  }
}
