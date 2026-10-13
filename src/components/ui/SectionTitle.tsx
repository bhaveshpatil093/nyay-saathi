import React from 'react';

export interface SectionTitleProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({
  title,
  subtitle,
  action,
  badge,
  className = '',
}) => {
  return (
    <div className={`flex items-start justify-between gap-3 mb-3 ${className}`}>
      <div className="flex flex-col">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-lg font-bold text-white tracking-wide">{title}</h2>
          {badge}
        </div>
        {subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};
