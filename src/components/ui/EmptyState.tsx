import React from 'react';
import { FolderOpen } from 'lucide-react';
import { Button } from './Button.tsx';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 rounded-2xl bg-navy-700/60 border border-dashed border-navy-600/80 min-h-[220px] ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-navy-600/60 flex items-center justify-center text-muted mb-3.5">
        {icon || <FolderOpen className="w-7 h-7 text-saffron" />}
      </div>
      <h3 className="text-base font-semibold text-white tracking-wide">{title}</h3>
      {description && (
        <p className="text-sm text-muted max-w-sm mt-1.5 leading-relaxed">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button
          variant="secondary"
          size="md"
          onClick={onAction}
          className="mt-4"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
