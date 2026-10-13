import React from 'react';

export interface ProgressRingProps {
  value: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  color?: 'saffron' | 'green' | 'danger' | 'warning';
  children?: React.ReactNode;
  className?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  value,
  size = 64,
  strokeWidth = 6,
  color = 'saffron',
  children,
  className = '',
}) => {
  const normalizedValue = Math.min(100, Math.max(0, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedValue / 100) * circumference;

  const strokeColors = {
    saffron: '#FF9933',
    green: '#138808',
    danger: '#E5484D',
    warning: '#F5B301',
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#1B3F73"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColors[color]}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-300 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold">
        {children ?? <span className="font-mono text-white">{Math.round(normalizedValue)}%</span>}
      </div>
    </div>
  );
};
