import React, { useState } from 'react';
import { useI18n } from '../../i18n/index.ts';
import { OfficerProfile } from '../../context/AppContext.tsx';
import { MAHARASHTRA_DISTRICTS, POLICE_RANKS } from '../../data/districts.ts';
import { Input, Select, Button, SectionTitle } from '../ui/index.ts';
import { Shield, ArrowRight, UserCheck } from 'lucide-react';

interface OfficerProfileFormProps {
  initialProfile?: OfficerProfile | null;
  onSubmit: (profile: OfficerProfile) => void;
  onBack: () => void;
}

export const OfficerProfileForm: React.FC<OfficerProfileFormProps> = ({
  initialProfile,
  onSubmit,
  onBack,
}) => {
  const { language, t } = useI18n();

  const [fullName, setFullName] = useState(initialProfile?.fullName || '');
  const [rank, setRank] = useState(initialProfile?.rank || '');
  const [stationName, setStationName] = useState(initialProfile?.stationName || '');
  const [district, setDistrict] = useState(initialProfile?.district || '');
  const [badgeNumber, setBadgeNumber] = useState(initialProfile?.badgeNumber || '');
  const [mobile, setMobile] = useState(initialProfile?.mobile || '');

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};

    if (!fullName.trim()) {
      errs.fullName = t('welcome.profile.errFullName');
    }
    if (!rank) {
      errs.rank = t('welcome.profile.errRank');
    }
    if (!stationName.trim()) {
      errs.stationName = t('welcome.profile.errStation');
    }
    if (!district) {
      errs.district = t('welcome.profile.errDistrict');
    }
    if (mobile.trim()) {
      const cleanMobile = mobile.replace(/\D/g, '');
      if (cleanMobile.length !== 10) {
        errs.mobile = t('welcome.profile.errMobile');
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      fullName: fullName.trim(),
      rank,
      stationName: stationName.trim(),
      district,
      badgeNumber: badgeNumber.trim() || undefined,
      mobile: mobile.trim() || undefined,
    });
  };

  const rankOptions = POLICE_RANKS.map((r) => ({
    value: r.value,
    label: language === 'mr' ? r.labelMr : r.labelEn,
  }));

  const districtOptions = MAHARASHTRA_DISTRICTS.map((d) => ({
    value: d.value,
    label: language === 'mr' ? d.labelMr : d.labelEn,
  }));

  return (
    <div className="flex-1 flex flex-col justify-between p-5 max-w-[480px] mx-auto w-full animate-in fade-in duration-200">
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center gap-3 pb-2 border-b border-navy-600/80">
          <div className="w-10 h-10 rounded-xl bg-saffron text-navy-900 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide leading-tight">
              {t('welcome.profile.title')}
            </h2>
            <p className="text-xs text-muted mt-0.5 leading-snug">
              {t('welcome.profile.subtitle')}
            </p>
          </div>
        </div>

        {/* Form fields */}
        <form id="officer-form" onSubmit={handleSubmit} className="flex flex-col gap-3.5 pt-1">
          <Input
            label={t('welcome.profile.fullName')}
            placeholder={t('welcome.profile.fullNamePlaceholder')}
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: '' }));
            }}
            error={errors.fullName}
            required
          />

          <Select
            label={t('welcome.profile.rank')}
            placeholder={t('welcome.profile.selectRank')}
            options={rankOptions}
            value={rank}
            onChange={(e) => {
              setRank(e.target.value);
              if (errors.rank) setErrors((prev) => ({ ...prev, rank: '' }));
            }}
            error={errors.rank}
            required
          />

          <Input
            label={t('welcome.profile.station')}
            placeholder={t('welcome.profile.stationPlaceholder')}
            value={stationName}
            onChange={(e) => {
              setStationName(e.target.value);
              if (errors.stationName) setErrors((prev) => ({ ...prev, stationName: '' }));
            }}
            error={errors.stationName}
            required
          />

          <Select
            label={t('welcome.profile.district')}
            placeholder={t('welcome.profile.selectDistrict')}
            options={districtOptions}
            value={district}
            onChange={(e) => {
              setDistrict(e.target.value);
              if (errors.district) setErrors((prev) => ({ ...prev, district: '' }));
            }}
            error={errors.district}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label={t('welcome.profile.badgeNumber')}
              placeholder={t('welcome.profile.badgePlaceholder')}
              value={badgeNumber}
              onChange={(e) => setBadgeNumber(e.target.value)}
            />

            <Input
              label={t('welcome.profile.mobile')}
              placeholder={t('welcome.profile.mobilePlaceholder')}
              type="tel"
              value={mobile}
              onChange={(e) => {
                setMobile(e.target.value);
                if (errors.mobile) setErrors((prev) => ({ ...prev, mobile: '' }));
              }}
              error={errors.mobile}
            />
          </div>
        </form>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 pt-6 border-t border-navy-600/60 mt-4">
        <Button type="button" variant="ghost" onClick={onBack} className="min-w-[80px]">
          {t('common.back')}
        </Button>
        <Button
          type="submit"
          form="officer-form"
          variant="primary"
          size="lg"
          fullWidth
          icon={<ArrowRight className="w-5 h-5" />}
          iconPosition="right"
        >
          {t('welcome.profile.continueBtn')}
        </Button>
      </div>
    </div>
  );
};
