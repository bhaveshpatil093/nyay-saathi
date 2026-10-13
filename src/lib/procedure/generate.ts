import {
  Offence,
  ActiveCaseFacts,
  ProcedureStep,
  ProcedurePhase,
  GeneratedStep,
  DeadlineRule,
} from '../../data/types.ts';
import { GENERAL_PROCEDURE_STEPS } from '../../data/steps.ts';
import { SEED_DEADLINE_RULES } from '../../data/deadlines.ts';
import { evaluateCondition } from './conditions.ts';

// Statutory procedural phase order
const PHASE_ORDER: Record<ProcedurePhase, number> = {
  Registration: 1,
  Investigation: 2,
  Arrest: 3,
  SearchSeizure: 4,
  Evidence: 5,
  Medical: 6,
  Statements: 7,
  Cyber: 8,
  VictimRights: 9,
  Chargesheet: 10,
};

/**
 * Computes plain-language explanation of why a step is included
 */
function getInclusionReason(
  step: ProcedureStep,
  facts: ActiveCaseFacts,
  offence: Offence
): { en: string; mr: string } {
  if (!step.condition) {
    return {
      en: 'Standard statutory duty applicable to all criminal investigations under BNSS 2023.',
      mr: 'BNSS 2023 अंतर्गत सर्व गुन्हे तपासांसाठी अनिवार्य सामान्य वैधानिक कर्तव्य.',
    };
  }

  if (step.id === 'step_bnss_176_3_forensic_visit') {
    return {
      en: `Triggered because maximum punishment is ${offence.maxPunishmentYears} years (>= 7 years statutory forensic threshold under BNSS 176(3)).`,
      mr: `गुन्ह्याची शिक्षा ${offence.maxPunishmentYears} वर्षे (७ वर्षे किंवा अधिक) असल्याने BNSS १७६(३) अन्वये फॉरेन्सिक भेट अनिवार्य झाली.`,
    };
  }

  if (step.id === 'step_bnss_35_3_notice') {
    return {
      en: `Triggered because maximum punishment is ${offence.maxPunishmentYears} years (< 7 years arrest threshold under BNSS 35(3)).`,
      mr: `गुन्ह्याची शिक्षा ${offence.maxPunishmentYears} वर्षे (७ वर्षांपेक्षा कमी) असल्याने BNSS ३५(३) अन्वये हजेरीची नोटीस देण्याचा नियम लागू झाला.`,
    };
  }

  if (step.id.includes('woman')) {
    return {
      en: 'Triggered because victim is recorded as a woman under BNSS special protection provisos.',
      mr: 'पीडित व्यक्ती महिला म्हणून नोंदवली असल्याने BNSS मधील महिला संरक्षण परंतुक लागू झाले.',
    };
  }

  if (step.id.includes('search') || step.id.includes('seizure')) {
    return {
      en: 'Triggered because search and seizure operations are indicated for this case.',
      mr: 'या प्रकरणात झडती व जप्ती कारवाई नमूद असल्याने लागू झाले.',
    };
  }

  if (step.id.includes('arrest') || step.id.includes('magistrate_24h') || step.id.includes('medical_arrestee')) {
    return {
      en: 'Triggered because arrest of the accused person has been made or is active.',
      mr: 'आरोपीला अटक केली असल्याने किंवा प्रस्तावित असल्याने कायदेशीर संरक्षणाचा नियम लागू झाला.',
    };
  }

  if (step.id.includes('electronic') || step.id.includes('bsa_63')) {
    return {
      en: 'Triggered because digital or electronic evidence is present in this investigation.',
      mr: 'या प्रकरणात इलेक्ट्रॉनिक किंवा डिजिटल पुरावा समाविष्ट असल्याने BSA कलम ६३ नियम लागू झाला.',
    };
  }

  if (step.id.includes('rape')) {
    return {
      en: 'Triggered because this case involves sexual assault / rape allegations with statutory fast-track mandates.',
      mr: 'बलात्कार प्रकरण असल्याने BNSS मधील जलदगती तपास व वैद्यकीय नियम लागू झाले.',
    };
  }

  if (step.id.includes('cyber')) {
    return {
      en: 'Triggered because financial cybercrime or online fraud is indicated.',
      mr: 'सायबर आर्थिक फसवणूक नमूद असल्याने तातडीने बँक खाते गोठवण्याची पायरी लागू झाली.',
    };
  }

  if (step.id.includes('efir')) {
    return {
      en: 'Triggered because information was received via electronic communication (e-FIR).',
      mr: 'माहिती इलेक्ट्रॉनिक संप्रेषणाद्वारे (ई-एफआयआर) आल्याने ३ दिवसांत स्वाक्षरीची अट लागू झाली.',
    };
  }

  return {
    en: 'Triggered based on matched case facts and offence classification.',
    mr: 'गुन्ह्याची वैशिष्ट्ये आणि वस्तुस्थिती जुळल्यामुळे ही पायरी समाविष्ट करण्यात आली.',
  };
}

/**
 * Procedural Checklist Generator
 * Evaluates conditions and returns ordered, deduplicated steps with plain reasons.
 */
export function generateChecklist(
  offence: Offence,
  facts: ActiveCaseFacts,
  extraStepsPool: ProcedureStep[] = []
): GeneratedStep[] {
  // Merge effective facts with offence attributes
  const effectiveFacts: ActiveCaseFacts = {
    ...facts,
    maxPunishmentYears: offence.maxPunishmentYears,
    cognizable: offence.cognizable,
  };

  // Combine general steps with any extra pool steps
  const allCandidateSteps = [...GENERAL_PROCEDURE_STEPS, ...extraStepsPool];

  // De-duplicate candidates by id
  const seenIds = new Set<string>();
  const uniqueCandidates: ProcedureStep[] = [];
  for (const step of allCandidateSteps) {
    if (!seenIds.has(step.id)) {
      seenIds.add(step.id);
      uniqueCandidates.push(step);
    }
  }

  // Filter steps using condition engine
  const applicableSteps = uniqueCandidates.filter((step) =>
    evaluateCondition(step.condition, effectiveFacts, offence)
  );

  // Attach plain reasons
  const generatedSteps: GeneratedStep[] = applicableSteps.map((step) => {
    const reasons = getInclusionReason(step, effectiveFacts, offence);
    return {
      ...step,
      inclusionReason_en: reasons.en,
      inclusionReason_mr: reasons.mr,
    };
  });

  // Sort by phase order, then by library position
  return generatedSteps.sort((a, b) => {
    const phaseDiff = (PHASE_ORDER[a.phase] || 99) - (PHASE_ORDER[b.phase] || 99);
    if (phaseDiff !== 0) return phaseDiff;
    return 0;
  });
}

/**
 * Statutory Deadlines Generator
 * Returns all active deadlines applicable to the case facts.
 */
export function generateDeadlines(
  offence: Offence,
  facts: ActiveCaseFacts,
  deadlineRulesPool: DeadlineRule[] = SEED_DEADLINE_RULES
): DeadlineRule[] {
  const effectiveFacts: ActiveCaseFacts = {
    ...facts,
    maxPunishmentYears: offence.maxPunishmentYears,
    cognizable: offence.cognizable,
  };

  return deadlineRulesPool.filter((rule) =>
    evaluateCondition(rule.condition, effectiveFacts, offence)
  );
}
