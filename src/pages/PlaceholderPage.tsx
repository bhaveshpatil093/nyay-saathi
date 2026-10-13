import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { EmptyState, SectionTitle, Badge, DisclaimerBanner, Card } from '../components/ui/index.ts';
import { useI18n } from '../i18n/index.ts';
import { useApp } from '../context/AppContext.tsx';
import { Shield, MapPin, Award } from 'lucide-react';

export interface PlaceholderConfig {
  pageKey: string;
  icon: React.ReactNode;
  actionPath?: string;
  customBadge?: string;
}

interface PlaceholderPageProps {
  config: PlaceholderConfig;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ config }) => {
  const { t, language } = useI18n();
  const { profile } = useApp();
  const navigate = useNavigate();
  const params = useParams();

  const title = t(`pages.${config.pageKey}.title`);
  const subtitle = t(`pages.${config.pageKey}.subtitle`);
  const badgeText = config.customBadge || t(`pages.${config.pageKey}.badge`);
  const actionText = t(`pages.${config.pageKey}.action`);

  const paramKeys = Object.keys(params);
  const paramInfo = paramKeys.length > 0 ? `(${paramKeys.map((k) => `${k}: ${params[k]}`).join(', ')})` : '';

  return (
    <div className="flex-1 flex flex-col p-4 gap-4">
      {/* Officer Header Card if on Home workspace */}
      {config.pageKey === 'home' && profile && (
        <Card
          className="border-saffron/40 bg-gradient-to-br from-navy-700 to-navy-800 shadow-md p-4"
        >
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-saffron text-navy-900 flex items-center justify-center shrink-0 font-bold">
              <Shield className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="font-bold text-white text-base leading-snug truncate">
                  {profile.fullName}
                </span>
                {profile.badgeNumber && (
                  <Badge variant="info" size="sm">
                    #{profile.badgeNumber}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-saffron mt-0.5 font-medium uppercase tracking-wider">
                <Award className="w-3.5 h-3.5 shrink-0" />
                <span>{profile.rank.toUpperCase()}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted mt-1 truncate">
                <MapPin className="w-3.5 h-3.5 shrink-0 text-muted" />
                <span>
                  {profile.stationName}, {profile.district}
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="flex items-center justify-between gap-2">
        <SectionTitle
          title={`${title} ${paramInfo}`}
          subtitle={subtitle}
          badge={badgeText ? <Badge variant="pendingReview">{badgeText}</Badge> : undefined}
        />
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <EmptyState
          icon={config.icon}
          title={title}
          description={t('common.emptyModuleDesc')}
          actionLabel={config.actionPath && actionText ? actionText : undefined}
          onAction={config.actionPath ? () => navigate(config.actionPath!) : undefined}
        />
      </div>

      <DisclaimerBanner type="legal" compact />
    </div>
  );
};
