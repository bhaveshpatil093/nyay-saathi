import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext.tsx';
import { useI18n } from '../../i18n/index.ts';
import { OfficerPinModal } from './OfficerPinModal.tsx';

interface OfficerSwitchBannerProps {
  compact?: boolean;
}

export const OfficerSwitchBanner: React.FC<OfficerSwitchBannerProps> = ({ compact = false }) => {
  const { setMode } = useApp();
  const { language } = useI18n();
  const navigate = useNavigate();
  const [showPinModal, setShowPinModal] = useState<boolean>(false);

  const handleSwitchSuccess = () => {
    setShowPinModal(false);
    setMode('officer');
    navigate('/');
  };

  if (compact) {
    return (
      <>
        <button
          onClick={() => setShowPinModal(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-navy-800 hover:bg-navy-700 border border-navy-600 text-xs font-semibold text-slate-200 hover:text-saffron transition-all active:scale-95"
        >
          <Shield className="w-3.5 h-3.5 text-saffron shrink-0" />
          <span>{language === 'mr' ? 'पोलीस अधिकारी मोड' : 'Switch to Officer Mode'}</span>
        </button>
        <OfficerPinModal
          isOpen={showPinModal}
          onClose={() => setShowPinModal(false)}
          onSuccess={handleSwitchSuccess}
        />
      </>
    );
  }

  return (
    <>
      <div className="w-full p-4 rounded-2xl bg-gradient-to-r from-navy-800 to-navy-900 border border-saffron/30 shadow-lg flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-saffron/15 border border-saffron/40 flex items-center justify-center text-saffron shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white tracking-wide">
              {language === 'mr' ? 'पोलीस अधिकारी आहात का?' : 'Are you a Police Officer?'}
            </span>
            <span className="text-xs text-slate-300">
              {language === 'mr'
                ? 'तपास आणि पुरावा नोंदणीसाठी अधिकारी मोडवर जा'
                : 'Switch to Officer Mode for investigations & evidence'}
            </span>
          </div>
        </div>
        <button
          onClick={() => setShowPinModal(true)}
          className="px-3.5 py-2 rounded-xl bg-saffron hover:bg-saffron-600 text-navy-950 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 shrink-0 shadow-md shadow-saffron/20"
        >
          <span>{language === 'mr' ? 'अधिकारी मोड' : 'Officer'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <OfficerPinModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSuccess={handleSwitchSuccess}
      />
    </>
  );
};
