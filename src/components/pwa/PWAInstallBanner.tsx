import React from 'react';
import { Download, X, Smartphone, ShieldCheck } from 'lucide-react';
import { usePWA } from '../../context/PWAContext.tsx';
import { useApp } from '../../context/AppContext.tsx';

interface PWAInstallBannerProps {
  variant?: 'banner' | 'card' | 'inline';
}

export const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({ variant = 'banner' }) => {
  const { isInstalled, isHomeBannerDismissed, promptInstall, dismissHomeBanner } = usePWA();
  const { language } = useApp();

  // If already installed as standalone PWA or user dismissed the home banner, hide
  if (isInstalled || (variant === 'banner' && isHomeBannerDismissed)) {
    return null;
  }

  if (variant === 'inline') {
    return (
      <button
        type="button"
        onClick={promptInstall}
        className="w-full flex items-center justify-between p-3 rounded-xl bg-navy-700/60 hover:bg-navy-700 border border-saffron/30 text-white text-xs font-semibold transition-all group"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-saffron/20 border border-saffron/40 flex items-center justify-center text-saffron shrink-0">
            <Smartphone className="w-4 h-4" />
          </div>
          <div className="text-left">
            <div className="text-white font-bold">
              {language === 'mr' ? 'अॅप इन्स्टॉल करा' : 'Install Nyay Saathi App'}
            </div>
            <div className="text-[10px] text-muted">
              {language === 'mr' ? 'होम स्क्रीनवरून थेट १-टॅप ऑफलाइन वापरा' : 'Fast 1-tap offline access from Home Screen'}
            </div>
          </div>
        </div>
        <div className="px-2.5 py-1 rounded-lg bg-saffron text-navy-900 font-bold text-[11px] flex items-center gap-1 shrink-0">
          <Download className="w-3 h-3" />
          <span>{language === 'mr' ? 'इन्स्टॉल' : 'Install'}</span>
        </div>
      </button>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-navy-700 to-navy-900 border border-saffron/40 p-3.5 shadow-lg flex items-center justify-between gap-3 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-navy-900 border border-saffron/40 flex items-center justify-center text-saffron shrink-0 shadow-sm">
          <Smartphone className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs font-bold text-white flex items-center gap-1.5">
            <span>{language === 'mr' ? 'न्यायसाथी अॅप इन्स्टॉल करा' : 'Install Nyay Saathi PWA'}</span>
            <span className="text-[10px] bg-india-green/20 text-india-green border border-india-green/40 px-1.5 py-0.2 rounded font-semibold">
              100% Offline
            </span>
          </div>
          <p className="text-[11px] text-muted mt-0.5 line-clamp-1">
            {language === 'mr'
              ? 'नेटवर्क नसतानाही थेट होम स्क्रीनवरून वापरा'
              : 'Add to home screen for instant offline standalone access'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={promptInstall}
          className="px-3.5 py-1.5 rounded-xl bg-saffron hover:bg-saffron-600 font-bold text-navy-900 text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{language === 'mr' ? 'इन्स्टॉल करा' : 'Install'}</span>
        </button>
        {variant === 'banner' && (
          <button
            type="button"
            onClick={dismissHomeBanner}
            className="p-1.5 rounded-lg text-muted/70 hover:text-white hover:bg-navy-700/60 transition-colors"
            title="Dismiss banner"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
