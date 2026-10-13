import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface AccordionItemData {
  id: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  content: React.ReactNode;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
}

export interface AccordionProps {
  items: AccordionItemData[];
  allowMultiple?: boolean;
  className?: string;
}

export const Accordion: React.FC<AccordionProps> = ({
  items,
  allowMultiple = false,
  className = '',
}) => {
  const [openIds, setOpenIds] = useState<string[]>(() =>
    items.filter((item) => item.defaultOpen).map((item) => item.id)
  );

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      return allowMultiple ? [...prev, id] : [id];
    });
  };

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {items.map((item) => {
        const isOpen = openIds.includes(item.id);
        return (
          <div
            key={item.id}
            className="border border-navy-600 rounded-2xl bg-navy-700 overflow-hidden transition-colors"
          >
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => toggle(item.id)}
              className="w-full flex items-center justify-between p-4 text-left select-none min-h-[52px] hover:bg-navy-600/40 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0 pr-2">
                {item.icon && <div className="text-saffron shrink-0">{item.icon}</div>}
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-white text-base leading-snug">
                      {item.title}
                    </span>
                    {item.badge}
                  </div>
                  {item.subtitle && (
                    <span className="text-xs text-muted mt-0.5">{item.subtitle}</span>
                  )}
                </div>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-muted shrink-0 transition-transform duration-200 ${
                  isOpen ? 'rotate-180 text-saffron' : ''
                }`}
              />
            </button>
            {isOpen && (
              <div className="px-5 pb-5 pt-1 text-white text-base border-t border-navy-600/60 animate-in fade-in duration-200">
                {item.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
