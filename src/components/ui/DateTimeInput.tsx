import React from 'react';
import { Calendar } from 'lucide-react';
import { FieldError } from './FieldError.tsx';

export interface DateTimeInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  hint?: string;
  type?: 'date' | 'datetime-local' | 'time';
}

export const DateTimeInput = React.forwardRef<HTMLInputElement, DateTimeInputProps>(
  ({ label, error, hint, type = 'datetime-local', id, className = '', ...props }, ref) => {
    const inputId = id || React.useId();

    return (
      <div className="w-full flex flex-col">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-white mb-1.5 select-none">
            {label}
            {props.required && <span className="text-saffron ml-1">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          <input
            id={inputId}
            ref={ref}
            type={type}
            className={`w-full min-h-[48px] px-4 py-3 bg-navy-900 border rounded-xl text-white text-base transition-colors [color-scheme:dark] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron disabled:opacity-50 disabled:bg-navy-950 ${
              error ? 'border-danger focus-visible:ring-danger' : 'border-navy-600 focus-visible:border-saffron'
            } ${className}`}
            {...props}
          />
          <div className="absolute right-3.5 pointer-events-none text-muted">
            <Calendar className="w-5 h-5" />
          </div>
        </div>
        {hint && !error && <span className="text-xs text-muted mt-1">{hint}</span>}
        <FieldError error={error} />
      </div>
    );
  }
);

DateTimeInput.displayName = 'DateTimeInput';
