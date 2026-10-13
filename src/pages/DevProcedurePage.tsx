import React, { useState, useMemo } from 'react';
import { SAMPLE_OFFENCES, validateOffencesData } from '../data/offences.ts';
import { ActiveCaseFacts, Offence, ProcedurePhase } from '../data/types.ts';
import { generateChecklist, generateDeadlines } from '../lib/procedure/generate.ts';
import { runConditionEngineSelfTests } from '../lib/procedure/conditions.ts';
import {
  Card,
  SectionTitle,
  Badge,
  Select,
  Switch,
  DisclaimerBanner,
} from '../components/ui/index.ts';
import { useI18n } from '../i18n/index.ts';
import {
  BookOpen,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Shield,
  FileText,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

export const DevProcedurePage: React.FC = () => {
  const { language } = useI18n();
  const isMr = language === 'mr';

  const [selectedOffenceId, setSelectedOffenceId] = useState<string>(SAMPLE_OFFENCES[0].id);

  const selectedOffence = useMemo(
    () => SAMPLE_OFFENCES.find((o) => o.id === selectedOffenceId) || SAMPLE_OFFENCES[0],
    [selectedOffenceId]
  );

  // Dynamic Case Facts state
  const [facts, setFacts] = useState<ActiveCaseFacts>({
    cognizable: selectedOffence.cognizable,
    womanVictim: selectedOffence.factsDefaults.womanVictim ?? false,
    childVictim: selectedOffence.factsDefaults.childVictim ?? false,
    arrestMade: selectedOffence.factsDefaults.arrestLikely ?? false,
    searchConducted: selectedOffence.factsDefaults.searchLikely ?? true,
    electronicEvidence: selectedOffence.factsDefaults.electronicEvidenceLikely ?? false,
    seizureMade: selectedOffence.factsDefaults.searchLikely ?? true,
    rapeCase: selectedOffence.id.includes('rape'),
    injuryOrDeath: selectedOffence.id.includes('murder'),
    cyberFraud: selectedOffence.id.includes('cyber'),
    isEFIR: false,
  });

  // When offence changes, sync defaults
  const handleOffenceChange = (id: string) => {
    setSelectedOffenceId(id);
    const newOffence = SAMPLE_OFFENCES.find((o) => o.id === id) || SAMPLE_OFFENCES[0];
    setFacts((prev) => ({
      ...prev,
      cognizable: newOffence.cognizable,
      womanVictim: newOffence.factsDefaults.womanVictim ?? false,
      childVictim: newOffence.factsDefaults.childVictim ?? false,
      arrestMade: newOffence.factsDefaults.arrestLikely ?? false,
      searchConducted: newOffence.factsDefaults.searchLikely ?? false,
      electronicEvidence: newOffence.factsDefaults.electronicEvidenceLikely ?? false,
      seizureMade: newOffence.factsDefaults.searchLikely ?? false,
      rapeCase: Boolean(newOffence.factsDefaults.rapeCase || newOffence.id.includes('rape')),
      injuryOrDeath: Boolean(newOffence.factsDefaults.injuryOrDeath || newOffence.id.includes('murder') || newOffence.id.includes('hurt') || newOffence.id.includes('death')),
      cyberFraud: Boolean(newOffence.factsDefaults.cyberLikely || newOffence.category === 'Cyber' || newOffence.id.includes('cyber')),
    }));
  };

  // Run Generator
  const checklist = useMemo(
    () => generateChecklist(selectedOffence, facts),
    [selectedOffence, facts]
  );

  const deadlines = useMemo(
    () => generateDeadlines(selectedOffence, facts),
    [selectedOffence, facts]
  );

  // Group checklist by Phase
  const groupedChecklist = useMemo(() => {
    const map = new Map<ProcedurePhase, typeof checklist>();
    for (const step of checklist) {
      if (!map.has(step.phase)) {
        map.set(step.phase, []);
      }
      map.get(step.phase)!.push(step);
    }
    return Array.from(map.entries());
  }, [checklist]);

  // Run Condition Engine Self Tests
  const selfTestResults = useMemo(() => runConditionEngineSelfTests(), []);
  const allTestsPassed = selfTestResults.every((t) => t.passed);

  // Validate statutory offence dataset (all 10 offences verified: false, 3 tips each, valid step IDs)
  const offenceValidation = useMemo(() => validateOffencesData(SAMPLE_OFFENCES), []);

  return (
    <div className="flex-1 flex flex-col p-4 gap-6 text-white max-w-4xl mx-auto">
      {/* Top Title */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <SectionTitle
            title="Rule-Based Procedure Engine (#/dev/procedure)"
            subtitle="Deterministic procedural checklist generator under BNSS & BSA 2023"
            badge={<Badge variant="pendingReview">Rule Engine • Verified: False</Badge>}
          />
        </div>
        <DisclaimerBanner type="legal" compact />
      </div>

      {/* Offence Selector & Statutory Classification */}
      <Card
        header={
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-saffron" />
            <span>Select Offence &amp; Statutory Classification</span>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <Select
            label="Sample Offence"
            options={SAMPLE_OFFENCES.map((o) => ({
              value: o.id,
              label: `${isMr ? o.title_mr : o.title_en} (${o.bnsSection} • ${o.oldIpcSection || 'New'})`,
            }))}
            value={selectedOffenceId}
            onChange={(e) => handleOffenceChange(e.target.value)}
          />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-navy-900 rounded-xl border border-navy-600 flex flex-col">
              <span className="text-xs text-muted">BNS Section</span>
              <span className="text-base font-bold text-saffron mt-0.5">
                {selectedOffence.bnsSection}
              </span>
            </div>
            <div className="p-3 bg-navy-900 rounded-xl border border-navy-600 flex flex-col">
              <span className="text-xs text-muted">Old IPC Section</span>
              <span className="text-base font-bold text-white mt-0.5">
                {selectedOffence.oldIpcSection || 'N/A'}
              </span>
            </div>
            <div className="p-3 bg-navy-900 rounded-xl border border-navy-600 flex flex-col">
              <span className="text-xs text-muted">Max Punishment</span>
              <span className="text-base font-bold text-white mt-0.5">
                {selectedOffence.maxPunishmentYears >= 99 ? 'Life / Death' : `${selectedOffence.maxPunishmentYears} Years`}
              </span>
            </div>
            <div className="p-3 bg-navy-900 rounded-xl border border-navy-600 flex flex-col">
              <span className="text-xs text-muted">Cognizance</span>
              <span
                className={`text-base font-bold mt-0.5 ${
                  selectedOffence.cognizable ? 'text-india-green' : 'text-warning'
                }`}
              >
                {selectedOffence.cognizable ? 'Cognizable' : 'Non-Cognizable'}
              </span>
            </div>
          </div>

          {/* Watchout warnings from legal brief */}
          {selectedOffence.watchOut_en.length > 0 && (
            <div className="p-3.5 bg-warning/10 border border-warning/30 rounded-xl flex flex-col gap-1.5 text-xs text-white">
              <div className="flex items-center gap-1.5 text-warning font-semibold">
                <AlertCircle className="w-4 h-4" />
                <span>Statutory Watchouts (BNSS 2023)</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-muted">
                {(isMr ? selectedOffence.watchOut_mr : selectedOffence.watchOut_en).map((w, idx) => (
                  <li key={idx} className="text-white/90">{w}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Card>

      {/* Case Facts Interactive Toggles */}
      <Card
        header={
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-saffron" />
              <span>Toggle Case Facts (Inputs to Condition Engine)</span>
            </div>
            <Badge variant="info" size="sm">Predicates Input</Badge>
          </div>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-navy-900 border border-navy-600">
            <Switch
              label="Cognizable Offence"
              checked={facts.cognizable}
              onChange={(v) => setFacts((f) => ({ ...f, cognizable: v }))}
            />
          </div>
          <div className="p-3 rounded-xl bg-navy-900 border border-navy-600">
            <Switch
              label="Woman Victim"
              checked={facts.womanVictim}
              onChange={(v) => setFacts((f) => ({ ...f, womanVictim: v }))}
            />
          </div>
          <div className="p-3 rounded-xl bg-navy-900 border border-navy-600">
            <Switch
              label="Arrest Made / Active"
              checked={facts.arrestMade}
              onChange={(v) => setFacts((f) => ({ ...f, arrestMade: v }))}
            />
          </div>
          <div className="p-3 rounded-xl bg-navy-900 border border-navy-600">
            <Switch
              label="Search Conducted"
              checked={facts.searchConducted}
              onChange={(v) => setFacts((f) => ({ ...f, searchConducted: v }))}
            />
          </div>
          <div className="p-3 rounded-xl bg-navy-900 border border-navy-600">
            <Switch
              label="Seizure Made (Panchnama)"
              checked={facts.seizureMade}
              onChange={(v) => setFacts((f) => ({ ...f, seizureMade: v }))}
            />
          </div>
          <div className="p-3 rounded-xl bg-navy-900 border border-navy-600">
            <Switch
              label="Electronic Evidence Present"
              checked={facts.electronicEvidence}
              onChange={(v) => setFacts((f) => ({ ...f, electronicEvidence: v }))}
            />
          </div>
          <div className="p-3 rounded-xl bg-navy-900 border border-navy-600">
            <Switch
              label="Rape Case Allegations"
              checked={facts.rapeCase}
              onChange={(v) => setFacts((f) => ({ ...f, rapeCase: v }))}
            />
          </div>
          <div className="p-3 rounded-xl bg-navy-900 border border-navy-600">
            <Switch
              label="Cyber / Online Fraud"
              checked={Boolean(facts.cyberFraud)}
              onChange={(v) => setFacts((f) => ({ ...f, cyberFraud: v }))}
            />
          </div>
          <div className="p-3 rounded-xl bg-navy-900 border border-navy-600">
            <Switch
              label="e-FIR (Electronic Info)"
              checked={Boolean(facts.isEFIR)}
              onChange={(v) => setFacts((f) => ({ ...f, isEFIR: v }))}
            />
          </div>
        </div>
      </Card>

      {/* Generated Procedural Checklist */}
      <Card
        header={
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-saffron" />
              <span>Generated Checklist ({checklist.length} Steps Applicable)</span>
            </div>
            <Badge variant="success" size="sm">Rule-Based Output</Badge>
          </div>
        }
      >
        <div className="flex flex-col gap-6">
          {groupedChecklist.map(([phase, steps]) => (
            <div key={phase} className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2 pb-1 border-b border-navy-600">
                <span className="text-xs uppercase tracking-wider font-bold text-saffron">
                  Phase: {phase}
                </span>
                <span className="text-[11px] text-muted">({steps.length} steps)</span>
              </div>

              <div className="flex flex-col gap-3">
                {steps.map((step) => (
                  <div
                    key={step.id}
                    className="p-3.5 rounded-xl bg-navy-900 border border-navy-600 flex flex-col gap-2"
                  >
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {step.mandatory ? (
                          <Badge variant="warning" size="sm">Mandatory</Badge>
                        ) : (
                          <Badge variant="neutral" size="sm">Discretionary</Badge>
                        )}
                        {step.legalRefs.map((ref, idx) => (
                          <Badge key={idx} variant="info" size="sm">
                            {ref.act} {ref.section}{ref.subSection ? `(${ref.subSection})` : ''}
                          </Badge>
                        ))}
                        <Badge variant="pendingReview" size="sm">Pending review</Badge>
                      </div>
                    </div>

                    <p className="text-sm text-white font-medium leading-relaxed">
                      {isMr ? step.text_mr : step.text_en}
                    </p>

                    {/* Plain Reason Why Included */}
                    <div className="p-2.5 rounded-lg bg-navy-700/60 border border-navy-600/70 text-xs flex items-start gap-2">
                      <HelpCircle className="w-3.5 h-3.5 text-saffron shrink-0 mt-0.5" />
                      <div className="flex flex-col">
                        <span className="text-[11px] text-muted font-medium">Why included:</span>
                        <span className="text-white/90">
                          {isMr ? step.inclusionReason_mr : step.inclusionReason_en}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Generated Statutory Deadlines */}
      <Card
        header={
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-saffron" />
              <span>Calculated Statutory Deadlines ({deadlines.length} Active Rules)</span>
            </div>
            <Badge variant="danger" size="sm">Statutory Clocks</Badge>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {deadlines.map((rule) => (
            <div
              key={rule.id}
              className="p-3.5 rounded-xl bg-navy-900 border border-navy-600 flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">
                  {isMr ? rule.label_mr : rule.label_en}
                </span>
                <Badge
                  variant={
                    rule.severity === 'danger'
                      ? 'danger'
                      : rule.severity === 'warning'
                      ? 'warning'
                      : 'info'
                  }
                  size="sm"
                >
                  {rule.duration} {rule.unit.toUpperCase()}
                </Badge>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <Badge variant="info" size="sm">
                  {rule.legalRef.act} {rule.legalRef.section}
                  {rule.legalRef.subSection ? `(${rule.legalRef.subSection})` : ''}
                </Badge>
                <Badge variant="pendingReview" size="sm">Pending review</Badge>
              </div>

              <p className="text-xs text-muted leading-relaxed">
                {isMr ? rule.legalRef.summary_mr : rule.legalRef.summary_en}
              </p>

              <div className="text-[11px] font-mono text-saffron/90 pt-1 border-t border-navy-600/60">
                Trigger: {rule.triggerEvent}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Condition Engine Unit-Style Self Tests */}
      <Card
        highlighted={allTestsPassed}
        header={
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              {allTestsPassed ? (
                <CheckCircle2 className="w-5 h-5 text-india-green" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-danger" />
              )}
              <span>Condition Engine Self-Test Suite ({selfTestResults.length} Tests)</span>
            </div>
            <Badge variant={allTestsPassed ? 'success' : 'danger'} size="sm">
              {allTestsPassed ? '100% Passed' : 'Tests Failed'}
            </Badge>
          </div>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
          {selfTestResults.map((t, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-lg bg-navy-900 border border-navy-600/80 flex items-center justify-between"
            >
              <span className="text-muted">{t.name}</span>
              <span className={t.passed ? 'text-india-green font-bold' : 'text-danger font-bold'}>
                {t.passed ? 'PASS ✓' : 'FAIL ✗'}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Offence Dataset Validation Suite */}
      <Card
        highlighted={offenceValidation.valid}
        header={
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              {offenceValidation.valid ? (
                <CheckCircle2 className="w-5 h-5 text-india-green" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-danger" />
              )}
              <span>Offence Dataset Integrity ({offenceValidation.totalOffences} Statutory Offences)</span>
            </div>
            <Badge variant={offenceValidation.valid ? 'success' : 'danger'} size="sm">
              {offenceValidation.valid ? 'Valid • All verified: false' : `${offenceValidation.errors.length} Errors`}
            </Badge>
          </div>
        }
      >
        <div className="flex flex-col gap-4 text-xs">
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
            <div className="p-2.5 rounded-lg bg-navy-900 border border-navy-600 flex flex-col">
              <span className="text-muted">Total Offences</span>
              <span className="font-bold text-saffron text-base mt-0.5">{offenceValidation.totalOffences}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-navy-900 border border-navy-600 flex flex-col">
              <span className="text-muted">Categories</span>
              <span className="font-bold text-white text-base mt-0.5">{Object.keys(offenceValidation.offencesByCategory).length}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-navy-900 border border-navy-600 flex flex-col">
              <span className="text-muted">Checked Step References</span>
              <span className="font-bold text-india-green text-base mt-0.5">{offenceValidation.checkedStepIdsCount}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-navy-900 border border-navy-600 flex flex-col">
              <span className="text-muted">Validation Status</span>
              <span className={`font-bold text-base mt-0.5 ${offenceValidation.valid ? 'text-india-green' : 'text-danger'}`}>
                {offenceValidation.valid ? '0 Errors ✓' : `${offenceValidation.errors.length} Failed ✗`}
              </span>
            </div>
          </div>

          {/* Counts Per Category Breakdown */}
          <div className="flex flex-col gap-2 p-3 bg-navy-900/80 rounded-xl border border-navy-600">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">
              Offences Per Category Breakdown
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(offenceValidation.offencesByCategory).map(([cat, count]) => (
                <div
                  key={cat}
                  className="p-2 rounded-lg bg-navy-800 border border-navy-600/70 flex items-center justify-between"
                >
                  <span className="text-white font-medium truncate">{cat}</span>
                  <Badge variant="neutral" size="sm">
                    {count}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Validation Errors or Clean Pass */}
          {offenceValidation.errors.length > 0 ? (
            <div className="p-3 rounded-lg bg-danger/10 border border-danger/40 text-danger space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                Validation Errors ({offenceValidation.errors.length}):
              </p>
              <ul className="list-disc list-inside space-y-0.5 font-mono">
                {offenceValidation.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-india-green/10 border border-india-green/30 text-india-green flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>
                All {offenceValidation.totalOffences} offences passed validation: strictly bilingual, verified: false, valid step references, and conforming fact defaults.
              </span>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
