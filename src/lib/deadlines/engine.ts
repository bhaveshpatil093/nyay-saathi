import { CaseRecord, CaseEventRecord, LegalProvision, CaseEventType } from '../../types/database.ts';
import { SAMPLE_OFFENCES } from '../../data/offences.ts';
import { SEED_DEADLINE_RULES } from '../../data/deadlines.ts';
import {
  DeadlineRule,
  DeadlineSeverity,
  Provision,
  ActiveCaseFacts,
  Offence,
} from '../../data/types.ts';
import { evaluateCondition } from '../procedure/conditions.ts';

export type DeadlineStatus = 'upcoming' | 'due_soon' | 'overdue' | 'completed';

export interface DeadlineItem {
  ruleId: string;
  caseId: string;
  caseNo: string;
  firNo: string;
  policeStation: string;
  district?: string;
  offenceTitle_en: string;
  offenceTitle_mr: string;
  bnsSection: string;
  label: string; // Direct accessible label
  label_en: string;
  label_mr: string;
  triggerEvent: string;
  triggerDateTime: string;
  dueAt: string; // ISO date string
  status: DeadlineStatus;
  completedAt?: string;
  completedNote?: string;
  completedEventId?: string;
  isManuallyCompleted: boolean;
  hoursRemaining: number;
  remainingTimeText: string; // Direct accessible human-readable text
  remainingTimeText_en: string;
  remainingTimeText_mr: string;
  legalRef: Provision;
  severity: DeadlineSeverity;
  verified: boolean;
  canCompleteWithEvent?: {
    eventType: CaseEventType;
    suggestedNote_en: string;
    suggestedNote_mr: string;
  };
}

/**
 * Formats a duration in hours into human-readable text (bilingual).
 */
export function formatRemainingHours(
  hours: number,
  isOverdue: boolean = false
): { en: string; mr: string } {
  const absHours = Math.abs(hours);
  const totalMinutes = Math.round(absHours * 60);

  const days = Math.floor(absHours / 24);
  const remHours = Math.floor(absHours % 24);
  const remMinutes = totalMinutes % 60;

  let durationTextEn = '';
  let durationTextMr = '';

  if (days >= 2) {
    if (remHours > 0) {
      durationTextEn = `${days} days ${remHours} h`;
      durationTextMr = `${days} दिवस ${remHours} तास`;
    } else {
      durationTextEn = `${days} days`;
      durationTextMr = `${days} दिवस`;
    }
  } else if (days === 1) {
    if (remHours > 0) {
      durationTextEn = `1 day ${remHours} h`;
      durationTextMr = `१ दिवस ${remHours} तास`;
    } else {
      durationTextEn = `1 day`;
      durationTextMr = `१ दिवस`;
    }
  } else if (remHours >= 1) {
    if (remMinutes > 0) {
      durationTextEn = `${remHours} h ${remMinutes} min`;
      durationTextMr = `${remHours} तास ${remMinutes} मिनिटे`;
    } else {
      durationTextEn = `${remHours} h`;
      durationTextMr = `${remHours} तास`;
    }
  } else {
    durationTextEn = `${Math.max(1, remMinutes)} min`;
    durationTextMr = `${Math.max(1, remMinutes)} मिनिटे`;
  }

  if (isOverdue) {
    return {
      en: `Overdue by ${durationTextEn}`,
      mr: `${durationTextMr} ने मुदत संपली`,
    };
  }

  return {
    en: `${durationTextEn} left`,
    mr: `${durationTextMr} शिल्लक`,
  };
}

/**
 * Computes all statutory deadlines for a single case given its events.
 */
export function computeDeadlines(
  caseRecord: CaseRecord,
  events: CaseEventRecord[],
  now: Date = new Date()
): DeadlineItem[] {
  // If case is closed, do not recompute unless explicitly looking for completed
  const nowMs = now.getTime();

  // Find primary offence
  const primaryOffenceId = caseRecord.offenceIds?.[0] || 'offence_theft_bns_303';
  const offence: Offence =
    SAMPLE_OFFENCES.find((o) => o.id === primaryOffenceId) || SAMPLE_OFFENCES[0];

  // Derive fact flags from case events
  const hasArrestEvent = events.some((e) => e.type === 'arrest_made');
  const hasSearchEvent = events.some(
    (e) => e.type === 'search_started' || e.type === 'seizure_made'
  );
  const hasMedicalEvent = events.some((e) => e.type === 'medical_exam');
  const hasChargesheetEvent =
    caseRecord.status === 'chargesheeted' ||
    events.some((e) => e.type === 'chargesheet_filed');

  const effectiveFacts: ActiveCaseFacts = {
    ...(caseRecord.facts || {}),
    cognizable: Boolean(offence.cognizable),
    womanVictim: Boolean(caseRecord.facts?.womanVictim ?? offence.factsDefaults?.womanVictim ?? false),
    childVictim: Boolean(caseRecord.facts?.childVictim ?? offence.factsDefaults?.childVictim ?? false),
    arrestMade: Boolean(hasArrestEvent || caseRecord.facts?.arrestMade || offence.factsDefaults?.arrestLikely),
    searchConducted: Boolean(hasSearchEvent || caseRecord.facts?.searchConducted || offence.factsDefaults?.searchLikely),
    electronicEvidence: Boolean(caseRecord.facts?.electronicEvidence ?? offence.factsDefaults?.electronicEvidenceLikely ?? false),
    seizureMade: Boolean(hasSearchEvent || caseRecord.facts?.seizureMade || offence.factsDefaults?.searchLikely),
    rapeCase: Boolean(caseRecord.facts?.rapeCase ?? offence.factsDefaults?.rapeCase ?? false),
    injuryOrDeath: Boolean(caseRecord.facts?.injuryOrDeath ?? offence.factsDefaults?.injuryOrDeath ?? false),
    cyberFraud: Boolean(caseRecord.facts?.cyberFraud ?? offence.factsDefaults?.cyberLikely ?? false),
    isEFIR: Boolean(caseRecord.facts?.isEFIR ?? false),
    maxPunishmentYears: offence.maxPunishmentYears,
  };

  // Find relevant event timestamps from case events
  // 1. FIR date and time
  const firEvent = events.find((e) => e.type === 'fir_registered');
  const firTimeStr = firEvent?.dateTime || caseRecord.firDateTime || caseRecord.createdAt;
  const firTimeMs = new Date(firTimeStr).getTime() || nowMs;

  // 2. Arrest time
  const arrestEvent = events.find((e) => e.type === 'arrest_made');
  const arrestTimeMs = arrestEvent
    ? new Date(arrestEvent.dateTime).getTime()
    : effectiveFacts.arrestMade
    ? firTimeMs
    : null;

  // 3. Remand date
  const remandEvent = events.find((e) =>
    e.note.toLowerCase().includes('remand') ||
    e.note.includes('रिमांड') ||
    e.note.toLowerCase().includes('police custody') ||
    e.note.toLowerCase().includes('judicial custody')
  );
  const remandTimeMs = remandEvent ? new Date(remandEvent.dateTime).getTime() : null;

  // 4. Information recorded date (especially for rape cases under BNSS 193(2))
  const infoRecordedEvent = events.find((e) =>
    e.note.toLowerCase().includes('information recorded') ||
    e.note.toLowerCase().includes('complaint recorded') ||
    e.note.includes('तक्रार नोंद') ||
    e.note.includes('माहिती नोंद')
  );
  const infoRecordedTimeMs = infoRecordedEvent
    ? new Date(infoRecordedEvent.dateTime).getTime()
    : firTimeMs;
  const infoRecordedTimeStr = infoRecordedEvent ? infoRecordedEvent.dateTime : firTimeStr;

  // 5. Search time / seizure time
  const searchEvent = events.find(
    (e) =>
      e.type === 'search_started' ||
      e.type === 'seizure_made' ||
      e.note.toLowerCase().includes('search') ||
      e.note.toLowerCase().includes('seizure') ||
      e.note.includes('झडती') ||
      e.note.includes('जप्ती')
  );
  const searchTimeMs = searchEvent
    ? new Date(searchEvent.dateTime).getTime()
    : (effectiveFacts.searchConducted || effectiveFacts.seizureMade)
    ? firTimeMs
    : null;

  // 6. Medical exam request date
  const medicalEvent = events.find(
    (e) =>
      e.type === 'medical_exam' ||
      e.note.toLowerCase().includes('medical') ||
      e.note.includes('वैद्यकीय')
  );
  const medicalTimeMs = medicalEvent
    ? new Date(medicalEvent.dateTime).getTime()
    : effectiveFacts.rapeCase
    ? firTimeMs
    : null;

  const results: DeadlineItem[] = [];

  for (const rule of SEED_DEADLINE_RULES) {
    // 1. Evaluate condition
    const isApplicable = evaluateCondition(rule.condition, effectiveFacts, offence);
    if (!isApplicable) continue;

    // 2. Determine trigger timestamp
    let triggerMs: number | null = null;
    let triggerDateTime = firTimeStr;

    switch (rule.triggerEvent) {
      case 'information_received_electronic':
      case 'information_received':
      case 'fir_registered':
        triggerMs = firTimeMs;
        triggerDateTime = firTimeStr;
        break;

      case 'information_recorded':
        triggerMs = infoRecordedTimeMs;
        triggerDateTime = infoRecordedTimeStr;
        break;

      case 'arrest_made':
        if (arrestTimeMs !== null) {
          triggerMs = arrestTimeMs;
          triggerDateTime = arrestEvent ? arrestEvent.dateTime : firTimeStr;
        }
        break;

      case 'arrest_or_remand':
        // Remand date or arrest date as trigger
        if (remandTimeMs !== null) {
          triggerMs = remandTimeMs;
          triggerDateTime = remandEvent ? remandEvent.dateTime : firTimeStr;
        } else if (arrestTimeMs !== null) {
          triggerMs = arrestTimeMs;
          triggerDateTime = arrestEvent ? arrestEvent.dateTime : firTimeStr;
        }
        break;

      case 'search_seizure_completed':
        if (searchTimeMs !== null) {
          triggerMs = searchTimeMs;
          triggerDateTime = searchEvent ? searchEvent.dateTime : firTimeStr;
        }
        break;

      case 'medical_examination_commenced':
        if (medicalTimeMs !== null) {
          triggerMs = medicalTimeMs;
          triggerDateTime = medicalEvent ? medicalEvent.dateTime : firTimeStr;
        }
        break;

      default:
        triggerMs = firTimeMs;
        triggerDateTime = firTimeStr;
    }

    // If trigger event has not occurred yet, skip this deadline
    if (triggerMs === null) continue;

    // 3. Compute Target Due Time
    let targetMs = triggerMs;
    if (rule.unit === 'hours') {
      targetMs += rule.duration * 60 * 60 * 1000;
    } else if (rule.unit === 'days') {
      targetMs += rule.duration * 24 * 60 * 60 * 1000;
    }

    const dueAt = new Date(targetMs).toISOString();

    // 4. Check for Completion
    let completedAt: string | undefined = undefined;
    let completedNote: string | undefined = undefined;
    let completedEventId: string | undefined = undefined;
    let isManuallyCompleted = false;

    // Check manual completion record on case
    const manualCompletion = caseRecord.deadlineCompletions?.[rule.id];
    if (manualCompletion) {
      completedAt = manualCompletion.completedAt;
      completedNote = manualCompletion.note;
      completedEventId = manualCompletion.eventId;
      isManuallyCompleted = true;
    }

    // Check automatic event-based completion
    if (!completedAt) {
      if (rule.id.includes('chargesheet') || rule.id.includes('bail')) {
        if (hasChargesheetEvent) {
          const csEvent = events.find((e) => e.type === 'chargesheet_filed');
          completedAt = csEvent ? csEvent.dateTime : caseRecord.updatedAt;
          completedNote = csEvent ? csEvent.note : 'Chargesheet filed in Court';
          completedEventId = csEvent?.id;
        }
      } else if (rule.id === 'deadline_magistrate_production_24h') {
        const prodEvent = events.find(
          (e) =>
            e.note.toLowerCase().includes('magistrate') ||
            e.note.includes('दंडाधिकारी') ||
            e.note.toLowerCase().includes('produced')
        );
        if (prodEvent) {
          completedAt = prodEvent.dateTime;
          completedNote = prodEvent.note;
          completedEventId = prodEvent.id;
        }
      } else if (rule.id === 'deadline_seizure_video_transmission_24h') {
        const transEvent = events.find(
          (e) =>
            e.note.toLowerCase().includes('video') ||
            e.note.toLowerCase().includes('magistrate') ||
            e.note.includes('चित्रीकरण')
        );
        if (transEvent && transEvent.type !== 'search_started') {
          completedAt = transEvent.dateTime;
          completedNote = transEvent.note;
          completedEventId = transEvent.id;
        }
      }
    }

    // 5. Determine Status & Remaining Time
    const hoursRemaining = (targetMs - nowMs) / (1000 * 60 * 60);
    let status: DeadlineStatus = 'upcoming';

    if (completedAt) {
      status = 'completed';
    } else if (hoursRemaining < 0) {
      status = 'overdue';
    } else if (hoursRemaining <= 24) {
      status = 'due_soon';
    } else {
      status = 'upcoming';
    }

    // 6. Human readable time text
    let remainingTimeText_en = '';
    let remainingTimeText_mr = '';

    if (status === 'completed') {
      remainingTimeText_en = 'Completed';
      remainingTimeText_mr = 'पूर्ण झाले';
    } else {
      const formatted = formatRemainingHours(hoursRemaining, status === 'overdue');
      remainingTimeText_en = formatted.en;
      remainingTimeText_mr = formatted.mr;
    }

    // 7. Completion event suggestion
    let canCompleteWithEvent: DeadlineItem['canCompleteWithEvent'] = undefined;
    if (rule.id === 'deadline_magistrate_production_24h') {
      canCompleteWithEvent = {
        eventType: 'custom',
        suggestedNote_en: 'Accused produced before Judicial Magistrate within 24 hours (BNSS 58)',
        suggestedNote_mr: 'आरोपीला २४ तासांच्या आत दंडाधिकाऱ्यांसमोर हजर केले (BNSS ५८)',
      };
    } else if (rule.id.includes('chargesheet') || rule.id.includes('bail')) {
      canCompleteWithEvent = {
        eventType: 'chargesheet_filed',
        suggestedNote_en: 'Police Report / Chargesheet filed in Court',
        suggestedNote_mr: 'न्यायालयात दोषारोपपत्र दाखल केले',
      };
    } else if (rule.id === 'deadline_seizure_video_transmission_24h') {
      canCompleteWithEvent = {
        eventType: 'custom',
        suggestedNote_en: 'Search and seizure audio-video recording transmitted to Magistrate (BNSS 105)',
        suggestedNote_mr: 'झडती-जप्ती ऑडिओ-व्हिडिओ चित्रीकरण दंडाधिकाऱ्यांना सादर केले (BNSS १०५)',
      };
    } else if (rule.id === 'deadline_rape_medical_report_7d') {
      canCompleteWithEvent = {
        eventType: 'medical_exam',
        suggestedNote_en: 'Rape victim medical examination report received from Medical Officer (BNSS 184)',
        suggestedNote_mr: 'बलात्कार पीडितेचा वैद्यकीय अहवाल वैद्यकीय अधिकाऱ्याकडून प्राप्त झाला (BNSS १८४)',
      };
    }

    results.push({
      ruleId: rule.id,
      caseId: caseRecord.id,
      caseNo: caseRecord.caseNo,
      firNo: caseRecord.firNo,
      policeStation: caseRecord.policeStation,
      district: caseRecord.district,
      offenceTitle_en: offence.title_en,
      offenceTitle_mr: offence.title_mr,
      bnsSection: offence.bnsSection,
      label: rule.label_en,
      label_en: rule.label_en,
      label_mr: rule.label_mr,
      triggerEvent: rule.triggerEvent,
      triggerDateTime,
      dueAt,
      status,
      completedAt,
      completedNote,
      completedEventId,
      isManuallyCompleted,
      hoursRemaining,
      remainingTimeText: remainingTimeText_en,
      remainingTimeText_en,
      remainingTimeText_mr,
      legalRef: rule.legalRef,
      severity: rule.severity,
      verified: rule.verified,
      canCompleteWithEvent,
    });
  }

  // Sort by urgency:
  // 1. overdue (most overdue first)
  // 2. due_soon (closest first)
  // 3. upcoming (closest first)
  // 4. completed (latest completed first)
  return results.sort((a, b) => {
    if (a.status === 'completed' && b.status !== 'completed') return 1;
    if (a.status !== 'completed' && b.status === 'completed') return -1;
    if (a.status === 'completed' && b.status === 'completed') {
      return (
        new Date(b.completedAt || 0).getTime() -
        new Date(a.completedAt || 0).getTime()
      );
    }
    return a.hoursRemaining - b.hoursRemaining;
  });
}

/**
 * Computes statutory deadlines across multiple cases.
 */
export function computeAllDeadlines(
  cases: CaseRecord[],
  eventsByCase: Record<string, CaseEventRecord[]> = {},
  now: Date = new Date()
): DeadlineItem[] {
  const allDeadlines: DeadlineItem[] = [];

  for (const c of cases) {
    if (c.status === 'closed') continue;
    const caseEvents = eventsByCase[c.id] || [];
    const deadlines = computeDeadlines(c, caseEvents, now);
    allDeadlines.push(...deadlines);
  }

  // Sort all deadlines by urgency
  return allDeadlines.sort((a, b) => {
    if (a.status === 'completed' && b.status !== 'completed') return 1;
    if (a.status !== 'completed' && b.status === 'completed') return -1;
    return a.hoursRemaining - b.hoursRemaining;
  });
}
