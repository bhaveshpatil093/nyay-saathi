import React from 'react';
import { Check } from 'lucide-react';
import { FieldError } from './FieldError.tsx';

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: React.ReactNode;
  description?: string;
  error?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, error, id, className = '', checked, disabled, onChange, ...props }, ref) => {
    const checkId = id || React.useId();

    return (
      <div className="flex flex-col">
        <label
          htmlFor={checkId}
          className={`flex items-start gap-3 min-h-[48px] py-1 cursor-pointer select-none group ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <div className="relative flex items-center justify-center shrink-0 mt-0.5">
            <input
              id={checkId}
              ref={ref}
              type="checkbox"
              checked={checked}
              disabled={disabled}
              onChange={onChange}
              className="peer sr-only"
              {...props}
            />
            <div
              className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors bg-navy-900 ${
                checked
                  ? 'bg-saffron border-saffron text-navy-900'
                  : 'border-navy-600 group-hover:border-saffron/60'
              } peer-focus-visible:ring-2 peer-focus-visible:ring-saffron peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-navy-900`}
            >
              {checked && <Check className="w-4 h-4 stroke-[3]" />}
            </div>
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-base font-medium text-white leading-snug">{label}</span>
            {description && <span className="text-sm text-muted mt-0.5">{description}</span>}
          </div>
        </label>
        <FieldError error={error} />
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
