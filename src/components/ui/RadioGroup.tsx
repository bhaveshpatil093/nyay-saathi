import React from 'react';
import { FieldError } from './FieldError.tsx';

export interface RadioOption {
  value: string;
  label: React.ReactNode;
  description?: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  name: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: RadioOption[];
  error?: string;
  className?: string;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  name,
  label,
  value,
  onChange,
  options,
  error,
  className = '',
}) => {
  return (
    <div className={`flex flex-col ${className}`}>
      {label && <span className="text-sm font-medium text-white mb-2">{label}</span>}
      <div className="flex flex-col gap-2">
        {options.map((opt) => {
          const isChecked = value === opt.value;
          return (
            <label
              key={opt.value}
              className={`flex items-start gap-3 min-h-[48px] p-3 rounded-xl border transition-colors cursor-pointer select-none ${
                isChecked
                  ? 'border-saffron bg-saffron/10'
                  : 'border-navy-600 bg-navy-900/60 hover:bg-navy-900'
              } ${opt.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="relative flex items-center justify-center shrink-0 mt-0.5">
                <input
                  type="radio"
                  name={name}
                  value={opt.value}
                  checked={isChecked}
                  disabled={opt.disabled}
                  onChange={() => onChange(opt.value)}
                  className="peer sr-only"
                />
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    isChecked ? 'border-saffron' : 'border-navy-600'
                  }`}
                >
                  {isChecked && <div className="w-2.5 h-2.5 rounded-full bg-saffron" />}
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-base font-medium text-white leading-snug">{opt.label}</span>
                {opt.description && (
                  <span className="text-sm text-muted mt-0.5">{opt.description}</span>
                )}
              </div>
            </label>
          );
        })}
      </div>
      <FieldError error={error} />
    </div>
  );
};
