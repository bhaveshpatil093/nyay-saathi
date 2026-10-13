import React from 'react';
import { WifiOff, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext.tsx';

export const OfflineBanner: React.FC = () => {
  const { isOnline, language } = useApp();

  if (isOnline) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full bg-amber-500/15 border-b border-amber-500/30 text-amber-300 py-1.5 px-3 flex items-center justify-center gap-2 text-xs font-medium z-40 transition-all animate-fade-in shadow-sm select-none"
    >
      <WifiOff className="w-3.5 h-3.5 shrink-0 text-amber-400" />
      <span className="leading-tight sm:truncate">
        {language === 'mr'
          ? 'तुम्ही ऑफलाइन आहात. सर्व वैशिष्ट्ये सुरू आहेत. डेटा या फोनवर सुरक्षित आहे.'
          : 'You are offline. Everything still works. Data is on this phone.'}
      </span>
      <span className="hidden sm:inline-flex items-center gap-1 text-[11px] bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30 text-amber-200 shrink-0 font-semibold">
        <ShieldCheck className="w-3 h-3 text-india-green" />
        Local DB
      </span>
    </div>
  );
};
