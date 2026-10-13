import React from 'react';
import { Search, X } from 'lucide-react';

export interface SearchBarProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
  onValueChange: (val: string) => void;
  onClear?: () => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onValueChange,
  onClear,
  placeholder = 'Search by Section, Act, Case ID...',
  className = '',
  ...props
}) => {
  return (
    <div className={`relative flex items-center w-full ${className}`}>
      <div className="absolute left-3.5 pointer-events-none text-muted">
        <Search className="w-5 h-5" />
      </div>
      <input
        type="search"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder={placeholder}
        className="w-full min-h-[48px] pl-11 pr-11 py-3 bg-navy-900 border border-navy-600 rounded-xl text-white placeholder:text-muted/60 text-base transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron focus-visible:border-saffron"
        {...props}
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            onValueChange('');
            onClear?.();
          }}
          aria-label="Clear search"
          className="absolute right-2.5 p-2 text-muted hover:text-white rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
