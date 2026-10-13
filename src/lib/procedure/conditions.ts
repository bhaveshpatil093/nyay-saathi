import {
  ConditionPredicate,
  AtomicPredicate,
  AllPredicate,
  AnyPredicate,
  NotPredicate,
  ActiveCaseFacts,
  Offence,
} from '../../data/types.ts';

/**
 * Extracts a fact value from either facts or offence object
 */
export function getFactValue(
  factName: string,
  facts: ActiveCaseFacts,
  offence?: Offence
): unknown {
  if (factName in facts) {
    return facts[factName];
  }
  if (offence && factName in offence) {
    return (offence as unknown as Record<string, unknown>)[factName];
  }
  return undefined;
}

/**
 * Evaluates an atomic predicate against current context
 */
function evaluateAtomic(
  pred: AtomicPredicate,
  facts: ActiveCaseFacts,
  offence?: Offence
): boolean {
  const actualValue = getFactValue(pred.fact, facts, offence);

  if ('eq' in pred) {
    return actualValue === pred.eq;
  }
  if ('ne' in pred) {
    return actualValue !== pred.ne;
  }
  if ('gt' in pred) {
    return typeof actualValue === 'number' && typeof pred.gt === 'number' && actualValue > pred.gt;
  }
  if ('gte' in pred) {
    return typeof actualValue === 'number' && typeof pred.gte === 'number' && actualValue >= pred.gte;
  }
  if ('lt' in pred) {
    return typeof actualValue === 'number' && typeof pred.lt === 'number' && actualValue < pred.lt;
  }
  if ('lte' in pred) {
    return typeof actualValue === 'number' && typeof pred.lte === 'number' && actualValue <= pred.lte;
  }
  if ('in' in pred) {
    return Array.isArray(pred.in) && pred.in.includes(actualValue);
  }

  return false;
}

/**
 * Evaluates a condition predicate (atomic or compound)
 */
export function evaluateCondition(
  predicate: ConditionPredicate | undefined,
  facts: ActiveCaseFacts,
  offence?: Offence
): boolean {
  // If no condition specified, step applies unconditionally
  if (!predicate) {
    return true;
  }

  // Check 'all'
  if ('all' in predicate) {
    const allPred = predicate as AllPredicate;
    if (!Array.isArray(allPred.all) || allPred.all.length === 0) return true;
    return allPred.all.every((subPred) => evaluateCondition(subPred, facts, offence));
  }

  // Check 'any'
  if ('any' in predicate) {
    const anyPred = predicate as AnyPredicate;
    if (!Array.isArray(anyPred.any) || anyPred.any.length === 0) return false;
    return anyPred.any.some((subPred) => evaluateCondition(subPred, facts, offence));
  }

  // Check 'not'
  if ('not' in predicate) {
    const notPred = predicate as NotPredicate;
    return !evaluateCondition(notPred.not, facts, offence);
  }

  // Atomic condition
  if ('fact' in predicate) {
    return evaluateAtomic(predicate as AtomicPredicate, facts, offence);
  }

  return false;
}

export interface SelfTestResult {
  name: string;
  passed: boolean;
  expected: boolean;
  received: boolean;
}

/**
 * Self-test suite verifying operators: eq, ne, gt, gte, lt, lte, in, any, all, not
 */
export function runConditionEngineSelfTests(): SelfTestResult[] {
  const mockFacts: ActiveCaseFacts = {
    cognizable: true,
    womanVictim: true,
    childVictim: false,
    arrestMade: true,
    searchConducted: true,
    electronicEvidence: false,
    seizureMade: true,
    rapeCase: false,
    injuryOrDeath: true,
    maxPunishmentYears: 7,
  };

  const tests: { name: string; predicate: ConditionPredicate; expected: boolean }[] = [
    {
      name: 'eq operator (boolean match)',
      predicate: { fact: 'cognizable', eq: true },
      expected: true,
    },
    {
      name: 'eq operator (boolean mismatch)',
      predicate: { fact: 'childVictim', eq: true },
      expected: false,
    },
    {
      name: 'ne operator (value not equal)',
      predicate: { fact: 'childVictim', ne: true },
      expected: true,
    },
    {
      name: 'gte operator (7 >= 7)',
      predicate: { fact: 'maxPunishmentYears', gte: 7 },
      expected: true,
    },
    {
      name: 'gt operator (7 > 7)',
      predicate: { fact: 'maxPunishmentYears', gt: 7 },
      expected: false,
    },
    {
      name: 'lte operator (7 <= 10)',
      predicate: { fact: 'maxPunishmentYears', lte: 10 },
      expected: true,
    },
    {
      name: 'lt operator (7 < 10)',
      predicate: { fact: 'maxPunishmentYears', lt: 10 },
      expected: true,
    },
    {
      name: 'in operator (value in list)',
      predicate: { fact: 'maxPunishmentYears', in: [3, 5, 7, 10] },
      expected: true,
    },
    {
      name: 'all operator (all conditions true)',
      predicate: {
        all: [
          { fact: 'cognizable', eq: true },
          { fact: 'womanVictim', eq: true },
        ],
      },
      expected: true,
    },
    {
      name: 'all operator (one condition false)',
      predicate: {
        all: [
          { fact: 'cognizable', eq: true },
          { fact: 'electronicEvidence', eq: true },
        ],
      },
      expected: false,
    },
    {
      name: 'any operator (at least one condition true)',
      predicate: {
        any: [
          { fact: 'childVictim', eq: true },
          { fact: 'womanVictim', eq: true },
        ],
      },
      expected: true,
    },
    {
      name: 'not operator (negating false gives true)',
      predicate: {
        not: { fact: 'childVictim', eq: true },
      },
      expected: true,
    },
    {
      name: 'compound nested (all + not)',
      predicate: {
        all: [
          { fact: 'arrestMade', eq: true },
          { not: { fact: 'rapeCase', eq: true } },
        ],
      },
      expected: true,
    },
  ];

  return tests.map((t) => {
    const received = evaluateCondition(t.predicate, mockFacts);
    return {
      name: t.name,
      passed: received === t.expected,
      expected: t.expected,
      received,
    };
  });
}
