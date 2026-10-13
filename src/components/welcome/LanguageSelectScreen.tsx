import React from 'react';
import { Logo } from '../Logo.tsx';
import { useI18n } from '../../i18n/index.ts';
import { AppLanguage } from '../../context/AppContext.tsx';
import { Check, User, ArrowRight } from 'lucide-react';

interface LanguageSelectScreenProps {
  onSelectLanguage: (lang: AppLanguage) => void;
  onContinueCitizen: () => void;
}

export const LanguageSelectScreen: React.FC<LanguageSelectScreenProps> = ({
  onSelectLanguage,
  onContinueCitizen,
}) => {
  const { language, setLanguage, t } = useI18n();

  const handleSelect = (lang: AppLanguage) => {
    setLanguage(lang);
    onSelectLanguage(lang);
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-6 max-w-[480px] mx-auto w-full animate-in fade-in duration-200">
      {/* Top Branding */}
      <div className="flex flex-col items-center text-center pt-4">
        <Logo size={76} withWordmark layout="vertical" />
        <p className="text-muted text-sm mt-3 max-w-xs leading-relaxed">
          {t('welcome.description')}
        </p>
      </div>

      {/* Language Selection Buttons */}
      <div className="flex flex-col gap-4 my-6">
        <span className="text-xs uppercase tracking-wider text-muted font-bold text-center">
          {t('welcome.selectLanguage')}
        </span>

        <div className="grid grid-cols-1 gap-3.5">
          <button
            type="button"
            onClick={() => handleSelect('en')}
            className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all min-h-[64px] active:scale-[0.98] ${
              language === 'en'
                ? 'bg-navy-700 border-saffron ring-2 ring-saffron shadow-lg'
                : 'bg-navy-700/70 border-navy-600 hover:bg-navy-700 hover:border-navy-500'
            }`}
          >
            <div className="flex flex-col">
              <span className="text-lg font-bold text-white tracking-wide">English</span>
              <span className="text-xs text-muted">Primary Legal Interface</span>
            </div>
            {language === 'en' ? (
              <div className="w-8 h-8 rounded-full bg-saffron text-navy-900 flex items-center justify-center shrink-0">
                <Check className="w-5 h-5 stroke-[3]" />
              </div>
            ) : (
              <ArrowRight className="w-5 h-5 text-muted" />
            )}
          </button>

          <button
            type="button"
            onClick={() => handleSelect('mr')}
            className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all min-h-[64px] active:scale-[0.98] ${
              language === 'mr'
                ? 'bg-navy-700 border-saffron ring-2 ring-saffron shadow-lg'
                : 'bg-navy-700/70 border-navy-600 hover:bg-navy-700 hover:border-navy-500'
            }`}
          >
            <div className="flex flex-col">
              <span className="text-lg font-bold text-white tracking-wide">मराठी (Marathi)</span>
              <span className="text-xs text-muted">महाराष्ट्र पोलीस अधिकृत प्रमाण भाषा</span>
            </div>
            {language === 'mr' ? (
              <div className="w-8 h-8 rounded-full bg-saffron text-navy-900 flex items-center justify-center shrink-0">
                <Check className="w-5 h-5 stroke-[3]" />
              </div>
            ) : (
              <ArrowRight className="w-5 h-5 text-muted" />
            )}
          </button>
        </div>
      </div>

      {/* Citizen Escape Route */}
      <div className="flex flex-col items-center gap-3 pt-4 border-t border-navy-600/60">
        <button
          type="button"
          onClick={onContinueCitizen}
          className="flex items-center gap-2 px-4 py-3 text-sm text-saffron hover:text-saffron-600 font-semibold rounded-xl hover:bg-navy-700/50 transition-colors min-h-[48px]"
        >
          <User className="w-4 h-4" />
          <span>{t('welcome.continueAsCitizen')}</span>
          <ArrowRight className="w-4 h-4 ml-0.5" />
        </button>
        <span className="text-[11px] text-muted text-center">
          {language === 'mr'
            ? 'झिरो एफआयआर, ई-एफआयआर आणि तक्रार नाकारल्यास कायदेशीर हक्क पाहण्यासाठी'
            : 'For Zero FIR rights, e-FIR, and citizen remedies without police login'}
        </span>
      </div>
    </div>
  );
};
