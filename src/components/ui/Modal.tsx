import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { IconButton } from './IconButton.tsx';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | 'full';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'md',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-xl',
    xl: 'max-w-2xl',
    '2xl': 'max-w-3xl',
    '3xl': 'max-w-4xl',
    '4xl': 'max-w-5xl',
    full: 'max-w-full m-2 sm:m-4',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-navy-950/80 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`relative z-10 w-full ${maxWidthStyles[maxWidth]} bg-navy-900 border border-navy-700 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-navy-700/80">
          <h2 className="text-lg font-semibold text-white tracking-wide truncate">
            {title}
          </h2>
          <IconButton
            icon={<X className="w-5 h-5" />}
            ariaLabel="Close modal"
            onClick={onClose}
            className="w-10 h-10 min-h-[40px] min-w-[40px] -mr-2 text-muted hover:text-white"
          />
        </div>
        <div className="p-5 overflow-y-auto flex-1 text-white">
          {children}
        </div>
        {footer && (
          <div className="px-5 py-3.5 border-t border-navy-600 bg-navy-900/40 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
