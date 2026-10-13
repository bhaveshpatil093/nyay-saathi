import React from 'react';
import { AlertCircle } from 'lucide-react';
import { useI18n } from '../../i18n/index.ts';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'pendingReview';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
  ...props
}) => {
  const { t } = useI18n();

  const sizeStyles = {
    sm: 'text-xs px-2.5 py-0.5',
    md: 'text-sm px-3 py-1',
  };

  const variantStyles = {
    neutral: 'bg-navy-600 text-muted border border-navy-600',
    success: 'bg-india-green/20 text-india-green border border-india-green/40 font-medium',
    warning: 'bg-warning/20 text-warning border border-warning/40 font-medium',
    danger: 'bg-danger/20 text-danger border border-danger/40 font-medium',
    info: 'bg-navy-600 text-saffron border border-saffron/30 font-medium',
    pendingReview:
      'bg-warning/15 text-warning border border-warning/50 font-medium inline-flex items-center gap-1.5',
  };

  if (variant === 'pendingReview') {
    return (
      <span
        className={`inline-flex items-center rounded-full tracking-wide whitespace-nowrap shrink-0 ${sizeStyles[size]} ${variantStyles.pendingReview} ${className}`}
        {...props}
      >
        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
        <span>{children || t('common.pendingReview')}</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-medium tracking-wide whitespace-nowrap shrink-0 ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
