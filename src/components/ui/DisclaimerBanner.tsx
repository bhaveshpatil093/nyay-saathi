import React from 'react';
import { ShieldAlert, Info, Lock } from 'lucide-react';
import { useI18n } from '../../i18n/index.ts';

export interface DisclaimerBannerProps {
  type?: 'legal' | 'privacy' | 'warning' | 'info';
  compact?: boolean;
  message?: React.ReactNode;
  className?: string;
}

export const DisclaimerBanner: React.FC<DisclaimerBannerProps> = ({
  type = 'legal',
  compact = false,
  message,
  className = '',
}) => {
  const { t } = useI18n();

  const getDefaultMessage = () => {
    switch (type) {
      case 'legal':
        return t('common.decisionSupport');
      case 'privacy':
        return t('common.privacyNotice');
      case 'warning':
        return t('common.warningNotice');
      case 'info':
        return t('common.offlineNotice');
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'legal':
      case 'warning':
        return <ShieldAlert className="w-4 h-4 text-warning shrink-0" />;
      case 'privacy':
        return <Lock className="w-4 h-4 text-india-green shrink-0" />;
      case 'info':
        return <Info className="w-4 h-4 text-saffron shrink-0" />;
    }
  };

  const borderStyles = {
    legal: 'border-warning/40 bg-warning/10 text-white',
    warning: 'border-warning/50 bg-warning/15 text-white',
    privacy: 'border-india-green/40 bg-india-green/10 text-white',
    info: 'border-saffron/40 bg-saffron/10 text-white',
  };

  return (
    <div
      role="note"
      className={`rounded-xl border flex items-start gap-2.5 transition-colors ${
        compact ? 'p-2.5 text-xs' : 'p-3.5 text-sm'
      } ${borderStyles[type]} ${className}`}
    >
      <div className="mt-0.5">{getIcon()}</div>
      <div className="flex-1 leading-relaxed font-normal">
        {message || getDefaultMessage()}
      </div>
    </div>
  );
};
