import React from 'react';
import { FieldError } from './FieldError.tsx';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  rightSlot?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, rightSlot, id, className = '', ...props }, ref) => {
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
          {icon && (
            <div className="absolute left-3.5 pointer-events-none text-muted">
              {icon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={`w-full min-h-[48px] px-4 py-3 bg-navy-900 border rounded-xl text-white placeholder:text-muted/60 text-base transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron disabled:opacity-50 disabled:bg-navy-950 ${
              icon ? 'pl-11' : ''
            } ${rightSlot ? 'pr-11' : ''} ${
              error ? 'border-danger focus-visible:ring-danger' : 'border-navy-600 focus-visible:border-saffron'
            } ${className}`}
            {...props}
          />
          {rightSlot && (
            <div className="absolute right-3.5 text-muted flex items-center">
              {rightSlot}
            </div>
          )}
        </div>
        {hint && !error && <span className="text-xs text-muted mt-1">{hint}</span>}
        <FieldError error={error} />
      </div>
    );
  }
);

Input.displayName = 'Input';
