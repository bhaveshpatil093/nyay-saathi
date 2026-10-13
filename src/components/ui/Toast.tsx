import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  description?: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toast: (item: Omit<ToastItem, 'id'>) => string;
  success: (message: string, description?: string) => string;
  error: (message: string, description?: string) => string;
  warning: (message: string, description?: string) => string;
  info: (message: string, description?: string) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({ message, description, type = 'info', duration = 3500 }: Omit<ToastItem, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastItem = { id, message, description, type, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          dismiss(id);
        }, duration);
      }

      return id;
    },
    [dismiss]
  );

  const success = useCallback(
    (message: string, description?: string) => toast({ message, description, type: 'success' }),
    [toast]
  );
  const error = useCallback(
    (message: string, description?: string) => toast({ message, description, type: 'error' }),
    [toast]
  );
  const warning = useCallback(
    (message: string, description?: string) => toast({ message, description, type: 'warning' }),
    [toast]
  );
  const info = useCallback(
    (message: string, description?: string) => toast({ message, description, type: 'info' }),
    [toast]
  );

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-india-green shrink-0" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-danger shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-warning shrink-0" />;
      case 'info':
        return <Info className="w-5 h-5 text-saffron shrink-0" />;
    }
  };

  const getBorder = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'border-india-green/40';
      case 'error':
        return 'border-danger/40';
      case 'warning':
        return 'border-warning/40';
      case 'info':
        return 'border-saffron/40';
    }
  };

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info, dismiss }}>
      {children}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2.5 w-[92%] max-w-md pointer-events-none pb-[env(safe-area-inset-bottom,0px)]">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl bg-navy-700/95 border backdrop-blur-md shadow-xl text-white transition-all animate-in slide-in-from-bottom-2 duration-200 ${getBorder(
              t.type
            )}`}
          >
            <div className="mt-0.5">{getIcon(t.type)}</div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-white leading-tight">{t.message}</p>
              {t.description && (
                <p className="text-xs text-muted mt-1 leading-snug">{t.description}</p>
              )}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="text-muted hover:text-white p-1 -mr-1 -mt-1 rounded-lg"
              aria-label="Dismiss toast"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
