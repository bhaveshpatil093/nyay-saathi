import React from 'react';
import { Check, AlertCircle } from 'lucide-react';

export interface StepItem {
  id: string | number;
  title: string;
  subtitle?: string;
  description?: string;
}

export interface StepperProps {
  steps: StepItem[];
  currentStepIndex: number;
  onStepClick?: (index: number) => void;
  orientation?: 'vertical' | 'horizontal';
  className?: string;
}

export const Stepper: React.FC<StepperProps> = ({
  steps,
  currentStepIndex,
  onStepClick,
  orientation = 'vertical',
  className = '',
}) => {
  if (orientation === 'horizontal') {
    const activeStep = steps[currentStepIndex];

    return (
      <div className={`w-full flex flex-col gap-2 ${className}`}>
        <div className="w-full flex items-center justify-between overflow-x-auto no-scrollbar py-1">
          {steps.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            return (
              <React.Fragment key={step.id}>
                <div
                  onClick={() => onStepClick?.(idx)}
                  className={`flex flex-col items-center cursor-pointer group min-w-0 shrink-0 ${
                    !onStepClick ? 'cursor-default' : ''
                  }`}
                >
                  <div
                    className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all ${
                      isCompleted
                        ? 'bg-india-green text-white shadow-xs shadow-india-green/50'
                        : isCurrent
                        ? 'bg-saffron text-navy-950 font-black ring-2 sm:ring-4 ring-saffron/30 scale-105'
                        : 'bg-navy-800 text-slate-400 border border-navy-700'
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : idx + 1}
                  </div>
                  <span
                    className={`text-[10px] sm:text-xs mt-1 text-center font-medium max-w-[60px] sm:max-w-[100px] truncate leading-tight hidden xs:block ${
                      isCurrent ? 'text-saffron font-bold' : isCompleted ? 'text-slate-200' : 'text-slate-400'
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-1 sm:mx-2 min-w-[8px] sm:min-w-[16px] transition-colors ${
                      idx < currentStepIndex ? 'bg-india-green' : 'bg-navy-700'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Mobile current step indicator banner */}
        {activeStep && (
          <div className="xs:hidden flex items-center justify-between text-[11px] px-2 py-1 bg-navy-950/60 rounded-lg border border-navy-800">
            <span className="text-muted">
              पायरी {currentStepIndex + 1} / {steps.length}:
            </span>
            <span className="font-bold text-saffron truncate max-w-[200px]">
              {activeStep.title}
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col w-full ${className}`}>
      {steps.map((step, idx) => {
        const isCompleted = idx < currentStepIndex;
        const isCurrent = idx === currentStepIndex;
        const isLast = idx === steps.length - 1;

        return (
          <div key={step.id} className="flex items-start gap-3.5 relative group">
            {!isLast && (
              <div
                className={`absolute left-5 top-10 bottom-0 w-0.5 -translate-x-1/2 ${
                  isCompleted ? 'bg-india-green' : 'bg-navy-600'
                }`}
              />
            )}
            <button
              type="button"
              onClick={() => onStepClick?.(idx)}
              disabled={!onStepClick}
              className="flex items-start gap-3.5 text-left w-full py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron rounded-lg"
            >
              <div
                className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center font-bold text-sm transition-all z-10 ${
                  isCompleted
                    ? 'bg-india-green text-white shadow-sm shadow-india-green/30'
                    : isCurrent
                    ? 'bg-saffron text-navy-900 ring-4 ring-saffron/25 font-bold'
                    : 'bg-navy-700 text-muted border border-navy-600'
                }`}
              >
                {isCompleted ? <Check className="w-5 h-5 stroke-[2.5]" /> : idx + 1}
              </div>
              <div className="flex flex-col min-w-0 pt-1">
                <span
                  className={`text-base font-semibold leading-snug ${
                    isCurrent ? 'text-saffron' : isCompleted ? 'text-white' : 'text-muted'
                  }`}
                >
                  {step.title}
                </span>
                {step.subtitle && (
                  <span className="text-sm text-muted mt-0.5">{step.subtitle}</span>
                )}
                {step.description && (
                  <p className="text-xs text-muted/80 mt-1 leading-relaxed">{step.description}</p>
                )}
              </div>
            </button>
          </div>
        );
      })}
    </div>
  );
};
