import React from 'react';

export interface ProgressBarProps {
  value: number; // 0 to 100
  max?: number;
  label?: string;
  showValue?: boolean;
  color?: 'saffron' | 'green' | 'danger' | 'warning';
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  showValue = true,
  color = 'saffron',
  className = '',
}) => {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  const colorStyles = {
    saffron: 'bg-saffron',
    green: 'bg-india-green',
    danger: 'bg-danger',
    warning: 'bg-warning',
  };

  return (
    <div className={`w-full flex flex-col gap-1.5 ${className}`}>
      {(label || showValue) && (
        <div className="flex items-center justify-between text-xs font-medium">
          {label && <span className="text-muted">{label}</span>}
          {showValue && <span className="text-white font-mono">{percentage}%</span>}
        </div>
      )}
      <div className="w-full h-2.5 bg-navy-900 rounded-full overflow-hidden border border-navy-600/60 p-0.5">
        <div
          className={`h-full rounded-full transition-all duration-300 ${colorStyles[color]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
