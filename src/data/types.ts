export type LegalAct =
  | 'BNS'
  | 'BNSS'
  | 'BSA'
  | 'ITAct'
  | 'Constitution'
  | 'Other';

export interface Provision {
  act: LegalAct;
  section: string;
  subSection?: string;
  title_en: string;
  title_mr: string;
  summary_en: string;
  summary_mr: string;
  verified: boolean; // Must be false until official legal review
  sourceNote?: string;
}

export type ProcedurePhase =
  | 'Registration'
  | 'Investigation'
  | 'Arrest'
  | 'SearchSeizure'
  | 'Evidence'
  | 'Medical'
  | 'Statements'
  | 'Chargesheet'
  | 'VictimRights'
  | 'Cyber';

export interface OffenceFactsDefaults {
  womanVictim?: boolean;
  childVictim?: boolean;
  electronicEvidenceLikely?: boolean;
  searchLikely?: boolean;
  arrestLikely?: boolean;
  forensicVisitLikely?: boolean;
  medicalExamLikely?: boolean;
  rapeCase?: boolean;
  injuryOrDeath?: boolean;
  cyberLikely?: boolean;
  [key: string]: boolean | undefined;
}

export interface Offence {
  id: string;
  title_en: string;
  title_mr: string;
  bnsSection: string;
  oldIpcSection?: string;
  maxPunishmentYears: number; // Use 99 for Life or Death penalty
  cognizable: boolean;
  category: string;
  tags: string[];
  factsDefaults: OffenceFactsDefaults;
  description_en: string;
  description_mr: string;
  watchOut_en: string[];
  watchOut_mr: string[];
  extraStepIds: string[];
  verified: boolean;
}

export type Operator =
  | 'eq'
  | 'ne'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'in';

export interface AtomicPredicate {
  fact: string;
  eq?: unknown;
  ne?: unknown;
  gt?: number;
  gte?: number;
  lt?: number;
  lte?: number;
  in?: unknown[];
}

export interface AllPredicate {
  all: ConditionPredicate[];
}

export interface AnyPredicate {
  any: ConditionPredicate[];
}

export interface NotPredicate {
  not: ConditionPredicate;
}

export type ConditionPredicate =
  | AtomicPredicate
  | AllPredicate
  | AnyPredicate
  | NotPredicate;

export interface ProcedureStep {
  id: string;
  phase: ProcedurePhase;
  text_en: string;
  text_mr: string;
  why_en: string;
  why_mr: string;
  legalRefs: Provision[];
  mandatory: boolean;
  condition?: ConditionPredicate;
  documentTemplateId?: string;
  needsEvidence: boolean;
  verified: boolean;
}

export type DeadlineUnit = 'hours' | 'days';
export type DeadlineSeverity = 'info' | 'warning' | 'danger';

export interface DeadlineRule {
  id: string;
  label_en: string;
  label_mr: string;
  triggerEvent: string;
  duration: number;
  unit: DeadlineUnit;
  legalRef: Provision;
  condition?: ConditionPredicate;
  severity: DeadlineSeverity;
  verified: boolean;
}

export interface ActiveCaseFacts {
  cognizable: boolean;
  womanVictim: boolean;
  childVictim: boolean;
  arrestMade: boolean;
  searchConducted: boolean;
  electronicEvidence: boolean;
  seizureMade: boolean;
  rapeCase: boolean;
  injuryOrDeath: boolean;
  cyberFraud?: boolean;
  isEFIR?: boolean;
  maxPunishmentYears?: number;
  [key: string]: unknown;
}

export interface GeneratedStep extends ProcedureStep {
  inclusionReason_en: string;
  inclusionReason_mr: string;
}
