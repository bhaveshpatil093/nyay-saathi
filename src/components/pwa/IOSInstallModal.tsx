import React from 'react';
import { Share, PlusSquare, X, Shield, Smartphone } from 'lucide-react';
import { usePWA } from '../../context/PWAContext.tsx';
import { useApp } from '../../context/AppContext.tsx';

export const IOSInstallModal: React.FC = () => {
  const { showIOSModal, setShowIOSModal } = usePWA();
  const { language } = useApp();

  if (!showIOSModal) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="bg-navy-900 border border-saffron/40 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-white">
        <div className="flex items-center justify-between border-b border-navy-700 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-navy-700 flex items-center justify-center text-saffron border border-saffron/30">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {language === 'mr' ? 'iPhone वर इन्स्टॉल करा' : 'Install on iPhone / iPad'}
              </h3>
              <p className="text-[10px] text-muted">Nyay Saathi PWA</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowIOSModal(false)}
            className="p-1 rounded-lg text-muted hover:text-white hover:bg-navy-700"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-navy-700/40 border border-muted/15">
            <div className="w-7 h-7 rounded-lg bg-navy-600 flex items-center justify-center text-saffron shrink-0 font-bold text-xs">
              1
            </div>
            <div>
              <div className="font-semibold text-white flex items-center gap-1.5">
                <span>{language === 'mr' ? 'शेअर आयकॉन दाबा' : 'Tap the Share Button'}</span>
                <Share className="w-3.5 h-3.5 text-saffron" />
              </div>
              <p className="text-[11px] text-muted mt-0.5">
                {language === 'mr'
                  ? 'सफारी ब्राउझरच्या खालच्या टूलबारमधील शेअर (Share) बटणावर टॅप करा.'
                  : 'Tap the Share icon in the Safari toolbar at the bottom of the screen.'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-navy-700/40 border border-muted/15">
            <div className="w-7 h-7 rounded-lg bg-navy-600 flex items-center justify-center text-saffron shrink-0 font-bold text-xs">
              2
            </div>
            <div>
              <div className="font-semibold text-white flex items-center gap-1.5">
                <span>{language === 'mr' ? 'होम स्क्रीनवर जोडा' : 'Add to Home Screen'}</span>
                <PlusSquare className="w-3.5 h-3.5 text-india-green" />
              </div>
              <p className="text-[11px] text-muted mt-0.5">
                {language === 'mr'
                  ? 'शेअर मेनू खाली स्क्रोल करा आणि "Add to Home Screen" निवडा.'
                  : 'Scroll down the menu list and tap "Add to Home Screen".'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-navy-700/40 border border-muted/15">
            <div className="w-7 h-7 rounded-lg bg-navy-600 flex items-center justify-center text-saffron shrink-0 font-bold text-xs">
              3
            </div>
            <div>
              <div className="font-semibold text-white">
                {language === 'mr' ? '"Add" बटणावर टॅप करा' : 'Tap "Add" in Top Right'}
              </div>
              <p className="text-[11px] text-muted mt-0.5">
                {language === 'mr'
                  ? 'न्यायसाथी थेट तुमच्या होम स्क्रीनवर अॅपप्रमाणे उघडेल.'
                  : 'Nyay Saathi will now appear on your home screen and run standalone offline.'}
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowIOSModal(false)}
          className="w-full py-2.5 rounded-xl bg-saffron hover:bg-saffron-600 font-bold text-navy-900 text-xs shadow-md transition-all active:scale-98"
        >
          {language === 'mr' ? 'समजले (Close)' : 'Got It'}
        </button>
      </div>
    </div>
  );
};
