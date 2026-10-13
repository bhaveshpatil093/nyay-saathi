import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  highlighted?: boolean;
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  header,
  footer,
  highlighted = false,
  noPadding = false,
  className = '',
  ...props
}) => {
  const hasHeaderOrFooter = Boolean(header || footer);

  // When no header or footer is used, render a clean single div so layout classes (grid, flex, space-y, padding) work as intended on children
  if (!hasHeaderOrFooter) {
    const hasCustomPadding = /\bp[xytrbl]?-\d+/.test(className);
    return (
      <div
        className={`rounded-2xl bg-navy-800 border transition-all ${
          highlighted ? 'border-saffron shadow-md shadow-saffron/10' : 'border-navy-700'
        } ${!hasCustomPadding && !noPadding ? 'p-4 sm:p-5' : ''} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl bg-navy-800 border transition-all overflow-hidden ${
        highlighted ? 'border-saffron shadow-md shadow-saffron/10' : 'border-navy-700'
      } ${className}`}
      {...props}
    >
      {header && (
        <div className="px-5 py-3.5 border-b border-navy-700 font-semibold text-white flex items-center justify-between">
          {header}
        </div>
      )}
      <div className={noPadding ? '' : 'p-4 sm:p-5'}>{children}</div>
      {footer && (
        <div className="px-5 py-3.5 border-t border-navy-700 bg-navy-900/40 rounded-b-2xl flex items-center justify-between">
          {footer}
        </div>
      )}
    </div>
  );
};
