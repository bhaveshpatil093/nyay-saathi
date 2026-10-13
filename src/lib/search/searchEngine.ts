import { Offence, ProcedureStep, Provision } from '../../data/types.ts';
import { CaseRecord, EvidenceRecord } from '../../types/database.ts';
import { CitizenRightItem } from '../../data/rights.ts';

export type SearchResultType = 'offence' | 'step' | 'right' | 'case' | 'evidence';

export interface SearchResultItem {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle: string;
  badge?: string;
  legalChip?: string;
  url: string;
  matchFields: string[];
  rawItem: any;
}

export interface SearchIndexData {
  offences: Offence[];
  steps: ProcedureStep[];
  rights: CitizenRightItem[];
  cases: CaseRecord[];
  evidence: EvidenceRecord[];
}

/**
 * Pre-compiled searchable tokens for static reference items
 */
interface StaticIndexItem {
  type: 'offence' | 'step' | 'right';
  id: string;
  tokens: string; // pre-lowercased concatenated string
  item: any;
}

class GlobalSearchEngine {
  private staticItems: StaticIndexItem[] = [];
  private isInitialized = false;

  public initialize(offences: Offence[], steps: ProcedureStep[], rights: CitizenRightItem[]) {
    if (this.isInitialized) return;

    this.staticItems = [];

    // Index offences
    for (const off of offences) {
      const tokens = [
        off.id,
        off.title_en,
        off.title_mr,
        off.bnsSection,
        off.oldIpcSection,
        off.category,
        off.description_en,
        off.description_mr,
        ...(off.tags || []),
        ...(off.watchOut_en || []),
        ...(off.watchOut_mr || []),
      ]
        .join(' ')
        .toLowerCase();

      this.staticItems.push({
        type: 'offence',
        id: off.id,
        tokens,
        item: off,
      });
    }

    // Index steps
    for (const step of steps) {
      const legalTokens = step.legalRefs
        .map((r: Provision) => `${r.act} ${r.section} ${r.subSection || ''} ${r.title_en} ${r.title_mr}`)
        .join(' ');

      const tokens = [
        step.id,
        step.phase,
        step.text_en,
        step.text_mr,
        step.why_en,
        step.why_mr,
        legalTokens,
      ]
        .join(' ')
        .toLowerCase();

      this.staticItems.push({
        type: 'step',
        id: step.id,
        tokens,
        item: step,
      });
    }

    // Index rights
    for (const right of rights) {
      const tokens = [
        right.id,
        right.title_en,
        right.title_mr,
        right.summary_en,
        right.summary_mr,
        right.legalRef,
        right.act,
        ...(right.details_en || []),
        ...(right.details_mr || []),
        ...(right.tags || []),
      ]
        .join(' ')
        .toLowerCase();

      this.staticItems.push({
        type: 'right',
        id: right.id,
        tokens,
        item: right,
      });
    }

    this.isInitialized = true;
  }

  public search(
    query: string,
    cases: CaseRecord[],
    evidence: EvidenceRecord[],
    language: 'en' | 'mr' = 'en'
  ): {
    offences: SearchResultItem[];
    steps: SearchResultItem[];
    rights: SearchResultItem[];
    cases: SearchResultItem[];
    evidence: SearchResultItem[];
    totalCount: number;
  } {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return {
        offences: [],
        steps: [],
        rights: [],
        cases: [],
        evidence: [],
        totalCount: 0,
      };
    }

    const words = trimmed.split(/\s+/).filter(Boolean);

    const offenceResults: SearchResultItem[] = [];
    const stepResults: SearchResultItem[] = [];
    const rightResults: SearchResultItem[] = [];
    const caseResults: SearchResultItem[] = [];
    const evidenceResults: SearchResultItem[] = [];

    // Search static items (offences, steps, rights) in-memory
    for (const entry of this.staticItems) {
      const matchesAll = words.every((w) => entry.tokens.includes(w));
      if (!matchesAll) continue;

      if (entry.type === 'offence') {
        const off = entry.item as Offence;
        const title = language === 'mr' ? off.title_mr : off.title_en;
        const sub = `${off.bnsSection} • Old: ${off.oldIpcSection || '—'} • ${off.cognizable ? (language === 'mr' ? 'दखलपात्र' : 'Cognizable') : (language === 'mr' ? 'अदखलपात्र' : 'Non-Cognizable')}`;
        offenceResults.push({
          id: off.id,
          type: 'offence',
          title,
          subtitle: sub,
          badge: off.oldIpcSection || 'BNS',
          legalChip: off.bnsSection,
          url: `/guide/${off.id}`,
          matchFields: [off.bnsSection, off.oldIpcSection || '', title],
          rawItem: off,
        });
      } else if (entry.type === 'step') {
        const step = entry.item as ProcedureStep;
        const text = language === 'mr' ? step.text_mr : step.text_en;
        const primaryRef = step.legalRefs[0]
          ? `${step.legalRefs[0].act} Sec ${step.legalRefs[0].section}`
          : 'Procedure Step';
        stepResults.push({
          id: step.id,
          type: 'step',
          title: text,
          subtitle: `${step.phase} • ${language === 'mr' ? step.why_mr : step.why_en}`,
          legalChip: primaryRef,
          badge: step.mandatory ? (language === 'mr' ? 'अनिवार्य' : 'Mandatory') : (language === 'mr' ? 'विवेकाधीन' : 'Discretionary'),
          url: `/guide?stepId=${step.id}`,
          matchFields: [text, primaryRef],
          rawItem: step,
        });
      } else if (entry.type === 'right') {
        const right = entry.item as CitizenRightItem;
        const title = language === 'mr' ? right.title_mr : right.title_en;
        const summary = language === 'mr' ? right.summary_mr : right.summary_en;
        rightResults.push({
          id: right.id,
          type: 'right',
          title,
          subtitle: summary,
          legalChip: right.legalRef,
          badge: language === 'mr' ? 'नागरिक हक्क' : 'Citizen Right',
          url: `/citizen#${right.id}`,
          matchFields: [title, right.legalRef],
          rawItem: right,
        });
      }
    }

    // Search dynamic cases in-memory
    for (const c of cases) {
      const cTokens = [
        c.caseNo,
        c.firNo || '',
        c.policeStation || '',
        c.summary || '',
        c.status,
        c.complainantName || '',
        c.ioName || '',
        ...(c.accusedNames || []),
        ...(c.offenceIds || []),
      ]
        .join(' ')
        .toLowerCase();

      const matchesAll = words.every((w) => cTokens.includes(w));
      if (matchesAll) {
        caseResults.push({
          id: c.id,
          type: 'case',
          title: `Case ${c.caseNo} ${c.firNo ? `(FIR: ${c.firNo})` : ''}`,
          subtitle: `${c.policeStation || 'Station'} • Accused: ${(c.accusedNames || []).join(', ') || 'Unknown'} • Status: ${c.status}`,
          badge: c.status.toUpperCase(),
          legalChip: c.firNo || 'CR',
          url: `/cases/${c.id}`,
          matchFields: [c.caseNo, c.firNo || '', ...(c.accusedNames || [])],
          rawItem: c,
        });
      }
    }

    // Search dynamic evidence in-memory
    for (const ev of evidence) {
      const evTokens = [
        ev.exhibitNo || '',
        ev.fileName || '',
        ev.description || '',
        ev.source || '',
        ev.handlerName || '',
        ev.sha256 || '',
        ev.deviceInfo || '',
      ]
        .join(' ')
        .toLowerCase();

      const matchesAll = words.every((w) => evTokens.includes(w));
      if (matchesAll) {
        evidenceResults.push({
          id: ev.id,
          type: 'evidence',
          title: `${ev.exhibitNo ? `Exhibit ${ev.exhibitNo}: ` : ''}${ev.fileName}`,
          subtitle: `${ev.description || 'Digital Exhibit'} • Logged by: ${ev.handlerName || 'IO'} • SHA-256: ${ev.sha256 ? ev.sha256.substring(0, 16) + '...' : 'Intact'}`,
          badge: ev.sealed ? 'SEALED' : 'EVIDENCE',
          legalChip: 'Sec 63 BSA',
          url: `/evidence/${ev.id}`,
          matchFields: [ev.fileName, ev.exhibitNo || ''],
          rawItem: ev,
        });
      }
    }

    const totalCount =
      offenceResults.length +
      stepResults.length +
      rightResults.length +
      caseResults.length +
      evidenceResults.length;

    return {
      offences: offenceResults,
      steps: stepResults,
      rights: rightResults,
      cases: caseResults,
      evidence: evidenceResults,
      totalCount,
    };
  }
}

export const globalSearch = new GlobalSearchEngine();
