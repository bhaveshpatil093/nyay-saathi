import React from 'react';

export interface SwitchProps {
  id?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: React.ReactNode;
  description?: string;
  disabled?: boolean;
  className?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  id,
  checked,
  onChange,
  label,
  description,
  disabled = false,
  className = '',
}) => {
  const switchId = id || React.useId();

  return (
    <label
      htmlFor={switchId}
      className={`flex items-center justify-between gap-4 min-h-[48px] py-1 cursor-pointer select-none ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
    >
      {(label || description) && (
        <div className="flex flex-col">
          {label && <span className="text-base font-medium text-white">{label}</span>}
          {description && <span className="text-sm text-muted">{description}</span>}
        </div>
      )}
      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron ${
          checked ? 'bg-saffron' : 'bg-navy-600'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-navy-900 shadow-md ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5 bg-navy-950' : 'translate-x-0 bg-white'
          }`}
        />
      </button>
    </label>
  );
};
