import React, { useEffect } from 'react';
import { Logo } from '../Logo.tsx';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 1200);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      onClick={onComplete}
      className="fixed inset-0 z-50 bg-navy-900 flex flex-col items-center justify-center p-6 cursor-pointer select-none animate-in fade-in duration-300"
    >
      <div className="flex flex-col items-center gap-4 transition-all duration-700 ease-out transform scale-100">
        <Logo size={120} withWordmark layout="vertical" />
        <div className="flex items-center gap-2 mt-4 text-xs font-mono text-muted tracking-wider uppercase">
          <div className="w-1.5 h-1.5 rounded-full bg-saffron animate-ping" />
          <span>Maharashtra Police Companion</span>
        </div>
      </div>
    </div>
  );
};
