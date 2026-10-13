import React from 'react';
import { AlertTriangle, HelpCircle } from 'lucide-react';
import { Modal } from './Modal.tsx';
import { Button } from './Button.tsx';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2.5">
          {variant === 'danger' && <AlertTriangle className="w-5 h-5 text-danger shrink-0" />}
          {variant === 'warning' && <AlertTriangle className="w-5 h-5 text-warning shrink-0" />}
          {variant === 'primary' && <HelpCircle className="w-5 h-5 text-saffron shrink-0" />}
          <span>{title}</span>
        </div>
      }
      footer={
        <div className="flex items-center justify-end gap-3 w-full sm:w-auto">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={loading}
            className="flex-1 sm:flex-initial"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            loading={loading}
            className="flex-1 sm:flex-initial"
          >
            {confirmText}
          </Button>
        </div>
      }
    >
      <div className="text-muted text-base leading-relaxed py-2">
        {message}
      </div>
    </Modal>
  );
};
