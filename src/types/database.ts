import { DBSchema } from 'idb';

export type UserRank = 'pc' | 'hc' | 'asi' | 'psi' | 'api' | 'pi' | 'other' | string;

export interface ProfileRecord {
  id: string; // usually 'current_officer'
  name: string;
  rank: UserRank;
  station: string;
  district: string;
  badgeNo?: string;
  mobile?: string;
  createdAt: string;
}

export type SettingKey =
  | 'language'
  | 'mode'
  | 'fontScale'
  | 'highContrast'
  | 'pinHash'
  | 'pinSalt'
  | 'autoLockMinutes'
  | 'onboardingDone'
  | 'demoMode';

export interface SettingsRecord {
  key: SettingKey | string;
  value: unknown;
}

export interface LegalProvision {
  act: 'BNS' | 'BNSS' | 'BSA' | string;
  section: string;
  subSection?: string;
}

export interface CaseFacts {
  cognizable: boolean;
  womanVictim: boolean;
  childVictim: boolean;
  arrestMade: boolean;
  searchConducted: boolean;
  electronicEvidence: boolean;
  seizureMade: boolean;
  rapeCase: boolean;
  injuryOrDeath: boolean;
  [key: string]: unknown;
}

export type CaseStatus = 'open' | 'chargesheeted' | 'closed';

export interface DeadlineCompletion {
  ruleId: string;
  completedAt: string;
  note?: string;
  eventId?: string;
}

export interface CaseRecord {
  id: string;
  caseNo: string;
  firNo: string;
  firDateTime: string;
  policeStation: string;
  district: string;
  offenceIds: string[];
  provisions: LegalProvision[];
  facts: CaseFacts;
  ioName: string;
  ioRank: string;
  complainantName: string;
  accusedNames: string[];
  summary: string;
  status: CaseStatus;
  isSample: boolean;
  createdAt: string;
  updatedAt: string;
  deadlineCompletions?: Record<string, DeadlineCompletion>;
}

export type CaseEventType =
  | 'fir_registered'
  | 'arrest_made'
  | 'search_started'
  | 'seizure_made'
  | 'medical_exam'
  | 'chargesheet_filed'
  | 'custom';

export interface CaseEventRecord {
  id: string;
  caseId: string;
  type: CaseEventType;
  dateTime: string;
  note: string;
}

export interface ChecklistStepState {
  stepId: string;
  done: boolean;
  doneAt?: string;
  note?: string;
  evidenceIds?: string[];
  isNew?: boolean;
}

export interface ChecklistRunRecord {
  id: string;
  caseId: string;
  offenceId: string;
  steps: ChecklistStepState[];
  createdAt: string;
  updatedAt: string;
}

export interface EvidenceRecord {
  id: string;
  caseId: string;
  exhibitNo: string;
  fileName: string;
  mimeType: string;
  size: number;
  lastModified: string;
  sha256: string;
  algorithm: 'SHA-256';
  description: string;
  source: string;
  handlerName: string;
  loggedAt: string;
  geo?: {
    lat: number;
    lng: number;
    accuracy?: number;
  };
  deviceInfo: string;
  sealed: boolean;
  isSample?: boolean;
}

export interface EvidenceBlobRecord {
  evidenceId: string;
  blob: Blob;
}

export interface CustodyLogRecord {
  id: string;
  evidenceId: string;
  seq: number;
  action: string;
  fromPerson: string;
  toPerson: string;
  location: string;
  remarks: string;
  timestamp: string;
  prevHash: string;
  entryHash: string;
}

export interface DocumentVersion {
  version: number;
  savedAt: string;
  fields: Record<string, unknown>;
  language: 'en' | 'mr';
  savedBy?: string;
}

export interface DocumentRecord {
  id: string;
  caseId: string;
  templateId: string;
  language: 'en' | 'mr';
  fields: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  version?: number;
  versions?: DocumentVersion[];
  isSample?: boolean;
}


export type BookmarkKind = 'offence' | 'step' | 'right';

export interface BookmarkRecord {
  id: string;
  kind: BookmarkKind;
  refId: string;
  createdAt: string;
}

export interface AuditLogRecord {
  id: string;
  timestamp: string;
  action: string;
  detail: string;
}

export interface NyaySaathiDB extends DBSchema {
  profile: {
    key: string;
    value: ProfileRecord;
  };
  settings: {
    key: string;
    value: SettingsRecord;
  };
  cases: {
    key: string;
    value: CaseRecord;
    indexes: {
      'by-caseNo': string;
      'by-status': string;
      'by-createdAt': string;
    };
  };
  caseEvents: {
    key: string;
    value: CaseEventRecord;
    indexes: {
      'by-caseId': string;
      'by-dateTime': string;
    };
  };
  checklistRuns: {
    key: string;
    value: ChecklistRunRecord;
    indexes: {
      'by-caseId': string;
    };
  };
  evidence: {
    key: string;
    value: EvidenceRecord;
    indexes: {
      'by-caseId': string;
      'by-loggedAt': string;
    };
  };
  evidenceBlobs: {
    key: string;
    value: EvidenceBlobRecord;
  };
  custodyLogs: {
    key: string;
    value: CustodyLogRecord;
    indexes: {
      'by-evidenceId': string;
      'by-timestamp': string;
    };
  };
  documents: {
    key: string;
    value: DocumentRecord;
    indexes: {
      'by-caseId': string;
      'by-createdAt': string;
    };
  };
  bookmarks: {
    key: string;
    value: BookmarkRecord;
    indexes: {
      'by-kind': string;
      'by-refId': string;
    };
  };
  auditLog: {
    key: string;
    value: AuditLogRecord;
    indexes: {
      'by-timestamp': string;
    };
  };
}
