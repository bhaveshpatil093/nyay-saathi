import React from 'react';

export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  icon?: React.ReactNode;
}

export const Chip: React.FC<ChipProps> = ({
  children,
  selected = false,
  icon,
  className = '',
  ...props
}) => {
  return (
    <button
      type="button"
      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors select-none min-h-[40px] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron active:scale-95 border ${
        selected
          ? 'bg-saffron text-navy-950 border-saffron font-bold shadow-xs'
          : 'bg-navy-800 text-slate-200 border-navy-700 hover:bg-navy-700 hover:text-white'
      } ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
};
