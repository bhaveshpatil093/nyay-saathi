import React from 'react';

export interface TabItem {
  id: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  variant?: 'underline' | 'pill';
  fullWidth?: boolean;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'underline',
  fullWidth = true,
  className = '',
}) => {
  return (
    <div
      role="tablist"
      className={`flex items-center gap-1.5 border-b border-navy-700 overflow-x-auto no-scrollbar scroll-smooth ${
        variant === 'pill' ? 'bg-navy-900/80 p-1.5 rounded-2xl border-none' : ''
      } ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        if (variant === 'pill') {
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all min-h-[40px] select-none whitespace-nowrap shrink-0 ${
                fullWidth ? 'flex-1 min-w-max' : ''
              } ${
                isActive
                  ? 'bg-saffron text-navy-950 font-bold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-navy-800'
              }`}
            >
              {tab.icon && <span className="shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge && <span className="ml-1 shrink-0">{tab.badge}</span>}
            </button>
          );
        }

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`relative flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium transition-colors min-h-[44px] select-none whitespace-nowrap shrink-0 ${
              fullWidth ? 'sm:flex-1' : ''
            } ${isActive ? 'text-saffron font-bold' : 'text-slate-400 hover:text-slate-200'}`}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge && <span className="ml-1.5 shrink-0">{tab.badge}</span>}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-saffron rounded-t-full shadow-xs shadow-saffron" />
            )}
          </button>
        );
      })}
    </div>
  );
};
