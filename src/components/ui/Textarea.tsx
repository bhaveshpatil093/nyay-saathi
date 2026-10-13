import React from 'react';
import { FieldError } from './FieldError.tsx';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, id, className = '', ...props }, ref) => {
    const inputId = id || React.useId();

    return (
      <div className="w-full flex flex-col">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-white mb-1.5 select-none">
            {label}
            {props.required && <span className="text-saffron ml-1">*</span>}
          </label>
        )}
        <textarea
          id={inputId}
          ref={ref}
          className={`w-full min-h-[96px] px-4 py-3 bg-navy-900 border rounded-xl text-white placeholder:text-muted/60 text-base transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron disabled:opacity-50 disabled:bg-navy-950 resize-y ${
            error ? 'border-danger focus-visible:ring-danger' : 'border-navy-600 focus-visible:border-saffron'
          } ${className}`}
          {...props}
        />
        {hint && !error && <span className="text-xs text-muted mt-1">{hint}</span>}
        <FieldError error={error} />
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
