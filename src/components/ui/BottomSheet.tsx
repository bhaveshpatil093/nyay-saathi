import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { IconButton } from './IconButton.tsx';

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxHeight?: string;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxHeight = 'max-h-[85vh]',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
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

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end justify-center bg-navy-950/80 backdrop-blur-xs transition-opacity"
    >
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`relative z-10 w-full max-w-lg bg-navy-700 border-t border-x border-navy-600 rounded-t-3xl shadow-2xl flex flex-col ${maxHeight} overflow-hidden pb-[env(safe-area-inset-bottom,0px)] animate-in slide-in-from-bottom duration-250`}
      >
        {/* Grab Handle */}
        <div className="w-full flex items-center justify-center pt-3 pb-1" onClick={onClose}>
          <div className="w-12 h-1.5 rounded-full bg-navy-600" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-navy-600">
          <h2 className="text-lg font-semibold text-white truncate">{title}</h2>
          <IconButton
            icon={<X className="w-5 h-5" />}
            ariaLabel="Close sheet"
            onClick={onClose}
            className="w-10 h-10 min-h-[40px] min-w-[40px] -mr-2 text-muted hover:text-white"
          />
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1 text-white">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-5 py-3.5 border-t border-navy-600 bg-navy-900/50 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
