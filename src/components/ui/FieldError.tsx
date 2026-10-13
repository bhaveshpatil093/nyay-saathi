import React from 'react';
import { AlertCircle } from 'lucide-react';

export interface FieldErrorProps {
  error?: string | null;
  className?: string;
}

export const FieldError: React.FC<FieldErrorProps> = ({ error, className = '' }) => {
  if (!error) return null;

  return (
    <div className={`flex items-center gap-1.5 mt-1.5 text-xs text-danger font-medium ${className}`}>
      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
      <span>{error}</span>
    </div>
  );
};
