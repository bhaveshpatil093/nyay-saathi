import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HelpCircle } from 'lucide-react';
import { EmptyState, DisclaimerBanner } from '../components/ui/index.ts';
import { useApp } from '../context/AppContext.tsx';
import { useI18n } from '../i18n/index.ts';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const { mode } = useApp();
  const { t } = useI18n();

  return (
    <div className="flex-1 flex flex-col p-4 gap-4 justify-between">
      <div className="flex-1 flex flex-col justify-center">
        <EmptyState
          icon={<HelpCircle className="w-8 h-8 text-saffron" />}
          title={t('pages.notFound.title')}
          description={t('pages.notFound.subtitle')}
          actionLabel={t('pages.notFound.action')}
          onAction={() => navigate(mode === 'citizen' ? '/citizen' : '/')}
        />
      </div>

      <DisclaimerBanner type="legal" compact />
    </div>
  );
};
