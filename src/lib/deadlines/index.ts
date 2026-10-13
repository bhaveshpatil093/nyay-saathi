export * from './engine.ts';

// Maintain backwards compatibility with legacy calculateCaseDeadlines signature
import { CaseRecord, CaseEventRecord } from '../../types/database.ts';
import { computeAllDeadlines, DeadlineItem } from './engine.ts';

export function calculateCaseDeadlines(
  cases: CaseRecord[],
  now: Date = new Date()
): {
  ruleId: string;
  label_en: string;
  label_mr: string;
  caseId: string;
  caseNo: string;
  firNo: string;
  offenceTitle_en: string;
  offenceTitle_mr: string;
  triggerEvent: string;
  targetDateTime: string;
  hoursRemaining: number;
  isOverdue: boolean;
  isDueSoon24h: boolean;
  isDueThisWeek: boolean;
  severity: 'info' | 'warning' | 'danger';
  legalRefText: string;
}[] {
  const items = computeAllDeadlines(cases, {}, now);
  return items.map((item) => ({
    ruleId: item.ruleId,
    label_en: item.label_en,
    label_mr: item.label_mr,
    caseId: item.caseId,
    caseNo: item.caseNo,
    firNo: item.firNo,
    offenceTitle_en: item.offenceTitle_en,
    offenceTitle_mr: item.offenceTitle_mr,
    triggerEvent: item.triggerEvent,
    targetDateTime: item.dueAt,
    hoursRemaining: item.hoursRemaining,
    isOverdue: item.status === 'overdue',
    isDueSoon24h: item.status === 'due_soon',
    isDueThisWeek: item.hoursRemaining <= 24 * 7 && item.status !== 'completed',
    severity: item.severity,
    legalRefText: `${item.legalRef.act} ${item.legalRef.section}${item.legalRef.subSection ? `(${item.legalRef.subSection})` : ''}`,
  }));
}
