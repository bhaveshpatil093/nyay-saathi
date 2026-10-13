import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  CheckCircle2,
  Shield,
  FileCheck,
  Clock,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  Smartphone,
} from 'lucide-react';
import { useDemo, DEMO_STEPS } from '../../context/DemoContext.tsx';
import { useApp } from '../../context/AppContext.tsx';
import { toDevanagariDigits } from '../../i18n/index.ts';

export const GuidedDemoOverlay: React.FC = () => {
  const {
    isDemoActive,
    currentStepIndex,
    totalSteps,
    currentStep,
    nextStep,
    prevStep,
    endDemo,
    startDemo,
    isEndScreen,
  } = useDemo();

  const { language, devanagariDigits } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  // Automatically navigate to the corresponding route when step changes
  useEffect(() => {
    if (!isDemoActive || isEndScreen) return;
    if (location.pathname !== currentStep.route) {
      navigate(currentStep.route);
    }
  }, [isDemoActive, isEndScreen, currentStep, location.pathname, navigate]);

  if (!isDemoActive) return null;

  const stepNumberDisplay = devanagariDigits
    ? `${toDevanagariDigits(currentStepIndex + 1)} / ${toDevanagariDigits(totalSteps)}`
    : `${currentStepIndex + 1} of ${totalSteps}`;

  // End Screen Modal
  if (isEndScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm animate-fadeIn">
        <div className="w-full max-w-lg bg-navy-800 border-2 border-saffron/40 rounded-3xl p-6 sm:p-8 shadow-2xl text-white space-y-6 animate-scaleUp">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-saffron/20 border border-saffron/50 text-saffron flex items-center justify-center mx-auto shadow-inner">
              <Sparkles className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-white">
              {language === 'mr' ? '२-मिनिटांचे प्रात्यक्षिक पूर्ण झाले!' : '2-Minute Guided Demo Complete!'}
            </h2>
            <p className="text-sm text-slate-300 max-w-sm mx-auto">
              {language === 'mr'
                ? 'न्याय साथीने तपासातील सर्व वैधानिक गरजा सुलभ केल्या आहेत. खालील ठळक वैशिष्ट्ये पहा:'
                : 'Nyay Saathi delivers end-to-end statutory assurance for field police officers under the new criminal laws.'}
            </p>
          </div>

          {/* Key Value Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-navy-900 border border-navy-700 space-y-1">
              <div className="flex items-center gap-2 text-saffron font-bold">
                <Shield className="w-4 h-4" />
                <span>100% Offline & Private</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-tight">
                Runs fully inside IndexedDB & Web Crypto. Zero server calls, zero data leakage.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-navy-900 border border-navy-700 space-y-1">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <FileCheck className="w-4 h-4" />
                <span>Zero Tampering & BSA 63</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-tight">
                SHA-256 local hashing + automated Section 63 BSA electronic evidence certificates.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-navy-900 border border-navy-700 space-y-1">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <Clock className="w-4 h-4" />
                <span>Statutory Deadlines</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-tight">
                24-hr remand alerts & 60/90-day chargesheet counters prevent procedural defaults.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-navy-900 border border-navy-700 space-y-1">
              <div className="flex items-center gap-2 text-sky-400 font-bold">
                <Smartphone className="w-4 h-4" />
                <span>Bilingual Grounding</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-tight">
                Native Marathi & English terms, Devanagari numerals, and district templates.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={endDemo}
              className="flex-1 py-3 px-4 rounded-xl bg-saffron text-navy-900 font-bold text-sm hover:bg-amber-400 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{language === 'mr' ? 'अॅप वापरा' : 'Explore Nyay Saathi'}</span>
            </button>

            <button
              type="button"
              onClick={startDemo}
              className="py-3 px-4 rounded-xl bg-navy-700 hover:bg-navy-600 border border-navy-600 text-slate-200 font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{language === 'mr' ? 'पुन्हा पहा' : 'Replay Demo'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active Step Floating Coach-mark Card
  return (
    <aside
      aria-label="Guided Tour"
      className="fixed bottom-20 left-3 right-3 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md z-50 animate-slideUp pointer-events-auto"
    >
      <div className="bg-navy-900/95 border-2 border-saffron/70 rounded-3xl p-5 shadow-2xl backdrop-blur-md text-white space-y-4">
        {/* Header Bar */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-saffron text-navy-900 font-black text-xs flex items-center justify-center shadow-xs">
              {currentStepIndex + 1}
            </span>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-saffron">
                {language === 'mr' ? '२-मिनिटांचे प्रात्यक्षिक' : 'Pitch Guided Demo'} • {stepNumberDisplay}
              </span>
              <h3 className="text-sm font-bold text-white line-clamp-1">
                {language === 'mr' ? currentStep.titleMr : currentStep.titleEn}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={endDemo}
            title={language === 'mr' ? 'प्रात्यक्षिक बंद करा' : 'Exit Demo'}
            aria-label={language === 'mr' ? 'प्रात्यक्षिक बंद करा' : 'Exit Demo'}
            className="w-7 h-7 rounded-lg hover:bg-navy-800 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-navy-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-saffron h-full transition-all duration-300"
            style={{ width: `${((currentStepIndex + 1) / totalSteps) * 100}%` }}
          />
        </div>

        {/* Content Box */}
        <div className="space-y-2">
          <p className="text-xs text-slate-200 leading-relaxed font-normal">
            {language === 'mr' ? currentStep.captionMr : currentStep.captionEn}
          </p>

          {(currentStep.actionHintEn || currentStep.actionHintMr) && (
            <div className="p-2.5 rounded-xl bg-navy-800/80 border border-saffron/20 flex items-start gap-2 text-[11px] text-amber-200">
              <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5 text-saffron" />
              <span>{language === 'mr' ? currentStep.actionHintMr : currentStep.actionHintEn}</span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-navy-800">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStepIndex === 0}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              currentStepIndex === 0
                ? 'opacity-30 cursor-not-allowed text-slate-500'
                : 'text-slate-300 hover:bg-navy-800 hover:text-white'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{language === 'mr' ? 'मागे' : 'Back'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={endDemo}
              className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-navy-800 font-medium transition-all cursor-pointer"
            >
              {language === 'mr' ? 'वगळा' : 'Skip'}
            </button>

            <button
              type="button"
              onClick={nextStep}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-saffron text-navy-900 hover:bg-amber-400 transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <span>
                {currentStepIndex === totalSteps - 1
                  ? language === 'mr'
                    ? 'पूर्ण करा'
                    : 'Finish'
                  : language === 'mr'
                  ? 'पुढे'
                  : 'Next'}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
