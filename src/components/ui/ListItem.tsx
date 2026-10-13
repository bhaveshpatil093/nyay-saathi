import React from 'react';
import { ChevronRight } from 'lucide-react';

export interface ListItemProps {
  icon?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  trailing?: React.ReactNode;
  showChevron?: boolean;
  onClick?: () => void;
  className?: string;
}

export const ListItem: React.FC<ListItemProps> = ({
  icon,
  title,
  subtitle,
  trailing,
  showChevron = false,
  onClick,
  className = '',
}) => {
  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`w-full flex items-center justify-between gap-3.5 p-3.5 rounded-2xl border border-navy-700/80 bg-navy-800/80 transition-all text-left min-h-[56px] ${
        onClick
          ? 'hover:bg-navy-750 hover:border-navy-600 active:scale-[0.99] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron'
          : ''
      } ${className}`}
    >
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        {icon && (
          <div className="w-10 h-10 rounded-xl bg-navy-900 border border-navy-700/80 flex items-center justify-center shrink-0 text-saffron shadow-xs">
            {icon}
          </div>
        )}
        <div className="flex flex-col min-w-0 flex-1">
          <div className="text-base font-semibold text-white leading-snug truncate">
            {title}
          </div>
          {subtitle && (
            <div className="text-xs text-muted mt-0.5 truncate leading-tight">
              {subtitle}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {trailing}
        {showChevron && <ChevronRight className="w-5 h-5 text-muted" />}
      </div>
    </Component>
  );
};
