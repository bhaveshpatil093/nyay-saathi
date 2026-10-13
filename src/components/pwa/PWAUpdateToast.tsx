import React from 'react';
import { RefreshCw, Sparkles } from 'lucide-react';
import { usePWA } from '../../context/PWAContext.tsx';
import { useApp } from '../../context/AppContext.tsx';

export const PWAUpdateToast: React.FC = () => {
  const { updateAvailable, applyUpdate } = usePWA();
  const { language } = useApp();

  if (!updateAvailable) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-bounce-short">
      <div className="bg-navy-700 border-2 border-saffron rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-3 text-white">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-saffron/20 border border-saffron/40 flex items-center justify-center shrink-0 text-saffron">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">
              {language === 'mr' ? 'नवीन आवृत्ती उपलब्ध आहे' : 'New version available'}
            </div>
            <div className="text-[11px] text-muted">
              {language === 'mr'
                ? 'नवीन सुधारणा मिळवण्यासाठी रीफ्रेश करा.'
                : 'Refresh now to load the latest legal updates.'}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={applyUpdate}
          className="px-3.5 py-2 rounded-xl bg-saffron hover:bg-saffron-600 font-bold text-navy-900 text-xs shrink-0 flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{language === 'mr' ? 'रीफ्रेश' : 'Refresh'}</span>
        </button>
      </div>
    </div>
  );
};
