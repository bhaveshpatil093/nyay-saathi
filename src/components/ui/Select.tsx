import React from 'react';
import { ChevronDown } from 'lucide-react';
import { FieldError } from './FieldError.tsx';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, options, placeholder, id, className = '', ...props }, ref) => {
    const selectId = id || React.useId();

    return (
      <div className="w-full flex flex-col">
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-white mb-1.5 select-none">
            {label}
            {props.required && <span className="text-saffron ml-1">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          <select
            id={selectId}
            ref={ref}
            className={`w-full min-h-[48px] px-4 py-3 pr-10 bg-navy-900 border rounded-xl text-white appearance-none text-base transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron disabled:opacity-50 disabled:bg-navy-950 ${
              error ? 'border-danger focus-visible:ring-danger' : 'border-navy-600 focus-visible:border-saffron'
            } ${className}`}
            {...props}
          >
            {placeholder && (
              <option value="" disabled className="bg-navy-900 text-muted">
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option
                key={opt.value}
                value={opt.value}
                disabled={opt.disabled}
                className="bg-navy-900 text-white py-2"
              >
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3.5 pointer-events-none text-muted">
            <ChevronDown className="w-5 h-5" />
          </div>
        </div>
        {hint && !error && <span className="text-xs text-muted mt-1">{hint}</span>}
        <FieldError error={error} />
      </div>
    );
  }
);

Select.displayName = 'Select';
