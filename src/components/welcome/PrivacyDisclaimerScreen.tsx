import React, { useState } from 'react';
import { useI18n } from '../../i18n/index.ts';
import { Checkbox, Button } from '../ui/index.ts';
import { ShieldCheck, HardDrive, TestTube, Scale, ArrowRight } from 'lucide-react';

interface PrivacyDisclaimerScreenProps {
  onConfirm: () => void;
  onBack: () => void;
}

export const PrivacyDisclaimerScreen: React.FC<PrivacyDisclaimerScreenProps> = ({
  onConfirm,
  onBack,
}) => {
  const { t } = useI18n();
  const [agreed, setAgreed] = useState(false);
  const [showError, setShowError] = useState(false);

  const handleStart = () => {
    if (!agreed) {
      setShowError(true);
      return;
    }
    onConfirm();
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-5 max-w-[480px] mx-auto w-full animate-in fade-in duration-200">
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center gap-3 pb-3 border-b border-navy-600/80">
          <div className="w-10 h-10 rounded-xl bg-india-green/20 border border-india-green/40 text-india-green flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide leading-tight">
              {t('welcome.disclaimer.title')}
            </h2>
            <p className="text-xs text-muted mt-0.5 leading-snug">
              {t('welcome.disclaimer.subtitle')}
            </p>
          </div>
        </div>

        {/* 3 Core Points */}
        <div className="flex flex-col gap-3 py-1">
          {/* Point 1: Storage */}
          <div className="p-3.5 rounded-2xl bg-navy-700/80 border border-navy-600 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-navy-600 flex items-center justify-center shrink-0 text-saffron mt-0.5">
              <HardDrive className="w-4 h-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-white">
                {t('welcome.disclaimer.point1Title')}
              </span>
              <p className="text-xs text-muted mt-0.5 leading-relaxed">
                {t('welcome.disclaimer.point1Desc')}
              </p>
            </div>
          </div>

          {/* Point 2: Synthetic Data */}
          <div className="p-3.5 rounded-2xl bg-navy-700/80 border border-navy-600 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-navy-600 flex items-center justify-center shrink-0 text-india-green mt-0.5">
              <TestTube className="w-4 h-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-white">
                {t('welcome.disclaimer.point2Title')}
              </span>
              <p className="text-xs text-muted mt-0.5 leading-relaxed">
                {t('welcome.disclaimer.point2Desc')}
              </p>
            </div>
          </div>

          {/* Point 3: Decision Support */}
          <div className="p-3.5 rounded-2xl bg-navy-700/80 border border-navy-600 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-navy-600 flex items-center justify-center shrink-0 text-warning mt-0.5">
              <Scale className="w-4 h-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-white">
                {t('welcome.disclaimer.point3Title')}
              </span>
              <p className="text-xs text-muted mt-0.5 leading-relaxed">
                {t('welcome.disclaimer.point3Desc')}
              </p>
            </div>
          </div>
        </div>

        {/* Required Agreement Checkbox */}
        <div className="p-3.5 rounded-2xl bg-navy-900 border border-navy-600/90 mt-1">
          <Checkbox
            label={
              <span className="text-sm font-medium text-white">
                {t('welcome.disclaimer.understandCheckbox')}
              </span>
            }
            checked={agreed}
            onChange={(e) => {
              setAgreed(e.target.checked);
              if (showError) setShowError(false);
            }}
            error={showError ? t('welcome.disclaimer.errAgree') : undefined}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 pt-6 border-t border-navy-600/60 mt-4">
        <Button type="button" variant="ghost" onClick={onBack} className="min-w-[80px]">
          {t('common.back')}
        </Button>
        <Button
          type="button"
          variant="primary"
          size="lg"
          fullWidth
          onClick={handleStart}
          icon={<ArrowRight className="w-5 h-5" />}
          iconPosition="right"
        >
          {t('welcome.disclaimer.startBtn')}
        </Button>
      </div>
    </div>
  );
};
