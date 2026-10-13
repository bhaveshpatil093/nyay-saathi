import React from 'react';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'md' | 'lg';
  ariaLabel: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  variant = 'ghost',
  size = 'md',
  ariaLabel,
  disabled,
  className = '',
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center rounded-xl transition-colors select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron active:scale-95 disabled:pointer-events-none disabled:opacity-50 min-h-[48px] min-w-[48px]';

  const sizeStyles = {
    md: 'w-12 h-12 p-2.5',
    lg: 'w-14 h-14 p-3.5',
  };

  const variantStyles = {
    primary: 'bg-saffron text-navy-900 hover:bg-saffron-600',
    secondary: 'border border-saffron text-saffron hover:bg-saffron/10',
    ghost: 'text-white hover:bg-navy-700 active:bg-navy-600',
    danger: 'bg-danger text-white hover:bg-danger/90',
  };

  return (
    <button
      aria-label={ariaLabel}
      disabled={disabled}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {icon}
    </button>
  );
};
