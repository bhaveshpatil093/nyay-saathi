import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  icon,
  iconPosition = 'left',
  disabled,
  className = '',
  ...props
}) => {
  const baseStyles =
    'relative inline-flex items-center justify-center font-medium transition-colors select-none rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 min-h-[40px]';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1.5 min-h-[36px]',
    md: 'px-4 py-2.5 text-base gap-2 min-h-[48px]',
    lg: 'px-6 py-3.5 text-lg font-semibold gap-3 min-h-[52px]',
  };

  const variantStyles = {
    primary:
      'bg-saffron text-navy-900 font-semibold hover:bg-saffron-600 active:bg-saffron-600 shadow-sm shadow-black/20',
    secondary:
      'border-2 border-saffron text-saffron bg-transparent hover:bg-saffron/10 active:bg-saffron/20',
    ghost:
      'bg-transparent text-white hover:bg-navy-700 active:bg-navy-600 border border-transparent',
    danger:
      'bg-danger text-white hover:bg-danger/90 active:bg-danger/80 shadow-sm shadow-black/20',
  };

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <button
      disabled={disabled || loading}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${widthStyle} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>{children}</span>
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>}
          <span>{children}</span>
          {icon && iconPosition === 'right' && <span className="shrink-0">{icon}</span>}
        </>
      )}
    </button>
  );
};
