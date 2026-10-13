import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  FileText,
  Search,
  LayoutDashboard,
  Settings,
  Info,
  Palette,
  RotateCcw,
  Shield,
  User,
  Wrench,
  Database,
  CheckSquare,
  Sparkles,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { ListItem, SectionTitle, DisclaimerBanner, Button } from '../components/ui/index.ts';
import { useApp } from '../context/AppContext.tsx';
import { useI18n } from '../i18n/index.ts';
import { PWAInstallBanner } from '../components/pwa/PWAInstallBanner.tsx';
import { usePWA } from '../context/PWAContext.tsx';
import { useDemo } from '../context/DemoContext.tsx';
import { seedSampleStationData, clearSampleData } from '../lib/db/sampleData.ts';
import { useToast } from '../components/ui/Toast.tsx';

export const MorePage: React.FC = () => {
  const { mode, toggleMode, resetOnboarding, language } = useApp();
  const { t } = useI18n();
  const navigate = useNavigate();
  const { startDemo } = useDemo();
  const { success, error } = useToast();

  const menuItems = [
    {
      to: '/deadlines',
      title: t('more.deadlinesTitle'),
      subtitle: t('more.deadlinesDesc'),
      icon: <Clock className="w-5 h-5" />,
    },
    {
      to: '/documents',
      title: t('more.documentsTitle'),
      subtitle: t('more.documentsDesc'),
      icon: <FileText className="w-5 h-5" />,
    },
    {
      to: '/search',
      title: t('more.searchTitle'),
      subtitle: t('more.searchDesc'),
      icon: <Search className="w-5 h-5" />,
    },
    {
      to: '/dashboard',
      title: t('more.dashboardTitle'),
      subtitle: t('more.dashboardDesc'),
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      to: '/settings',
      title: t('more.settingsTitle'),
      subtitle: t('more.settingsDesc'),
      icon: <Settings className="w-5 h-5" />,
    },
    {
      to: '/about',
      title: t('more.aboutTitle'),
      subtitle: t('more.aboutDesc'),
      icon: <Info className="w-5 h-5" />,
    },
    {
      to: '/styleguide',
      title: t('more.styleguideTitle'),
      subtitle: t('more.styleguideDesc'),
      icon: <Palette className="w-5 h-5" />,
    },
    {
      to: '/dev/i18n',
      title: t('more.devI18nTitle'),
      subtitle: t('more.devI18nDesc'),
      icon: <Wrench className="w-5 h-5" />,
    },
    {
      to: '/dev/db',
      title: t('more.devDbTitle'),
      subtitle: t('more.devDbDesc'),
      icon: <Database className="w-5 h-5" />,
    },
    {
      to: '/dev/procedure',
      title: t('more.devProcedureTitle'),
      subtitle: t('more.devProcedureDesc'),
      icon: <CheckSquare className="w-5 h-5" />,
    },
  ];

  const handleLoadSample = async () => {
    try {
      const res = await seedSampleStationData();
      success(
        language === 'mr' ? 'नमुना डेटा जोडला' : 'Sample Data Loaded',
        language === 'mr' ? `${res.casesCount} नमुना प्रकरणे जोडली.` : `Loaded ${res.casesCount} sample cases.`
      );
    } catch (err) {
      error('Failed to load sample data', String(err));
    }
  };

  const handleClearSample = async () => {
    try {
      const count = await clearSampleData();
      success(
        language === 'mr' ? 'नमुना डेटा काढला' : 'Sample Data Cleared',
        language === 'mr' ? `${count} नमुना नोंदी काढल्या.` : `Cleared ${count} sample records.`
      );
    } catch (err) {
      error('Failed to clear sample data', String(err));
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 max-w-5xl mx-auto w-full gap-5 pb-16">
      <SectionTitle
        title={t('more.title')}
        subtitle={t('more.subtitle')}
      />

      {/* 2-Minute Pitch Guided Demo Hero Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-navy-800 to-navy-900 border-2 border-saffron/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-saffron/20 border border-saffron/40 flex items-center justify-center text-saffron shrink-0 shadow-inner">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-black text-white truncate">
              {language === 'mr' ? '२-मिनिटांचे प्रात्यक्षिक' : 'Start 2-Minute Demo'}
            </span>
            <span className="text-xs text-slate-300 line-clamp-1">
              {language === 'mr'
                ? 'मूल्यांकनासाठी संपूर्ण तपास प्रक्रिया प्रात्यक्षिक'
                : 'Interactive 7-step walkthrough for pitch jury'}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={startDemo}
          className="py-2.5 px-4 rounded-xl bg-saffron text-navy-900 font-bold text-xs hover:bg-amber-400 transition-all flex items-center gap-1.5 shrink-0 shadow-md active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <Sparkles className="w-3.5 h-3.5 text-navy-950" />
          <span>{language === 'mr' ? 'सुरू करा' : 'Start Demo'}</span>
        </button>
      </div>

      {/* PWA Install Button (hidden when standalone) */}
      <PWAInstallBanner variant="inline" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {menuItems.map((item) => (
          <ListItem
            key={item.to}
            icon={item.icon}
            title={item.title}
            subtitle={item.subtitle}
            showChevron
            onClick={() => navigate(item.to)}
          />
        ))}
      </div>

      {/* Mode Switch Card */}
      <div className="p-4 rounded-2xl bg-navy-700 border border-navy-600 flex items-center justify-between gap-3 mt-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-navy-600 flex items-center justify-center text-saffron">
            {mode === 'officer' ? <Shield className="w-5 h-5" /> : <User className="w-5 h-5" />}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-white">
              {t('more.currentMode')}: {mode === 'officer' ? t('header.officer') : t('header.citizen')}
            </span>
            <span className="text-xs text-muted">
              {t('more.switchModePrompt')}
            </span>
          </div>
        </div>
        <Button variant="secondary" size="md" onClick={toggleMode}>
          {t('more.switchBtn')}
        </Button>
      </div>

      {/* Sample Data Quick Controls */}
      <div className="p-4 rounded-2xl bg-navy-800/80 border border-navy-700 space-y-3">
        <div className="flex items-center gap-2.5">
          <Database className="w-4 h-4 text-saffron" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            {language === 'mr' ? 'नमुना ठाणे डेटा' : 'Demo Caseload Data'}
          </span>
        </div>
        <p className="text-xs text-muted leading-relaxed">
          {language === 'mr'
            ? '३ वास्तववादी काल्पनिक प्रकरणे (चोरी, सायबर फसवणूक, दरोडा) आणि पुरावे लोड किंवा साफ करा.'
            : 'Load or remove 3 realistic fictional cases (Theft, Cyber, Robbery) with chain of custody and deadlines.'}
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleLoadSample}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            {language === 'mr' ? 'नमुना डेटा लोड करा' : 'Load Sample Data'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearSample}
            icon={<Trash2 className="w-3.5 h-3.5 text-rose-400" />}
            className="text-rose-300 hover:text-rose-200"
          >
            {language === 'mr' ? 'नमुना डेटा काढा' : 'Remove Sample Data'}
          </Button>
        </div>
      </div>

      {/* Reset Onboarding Option */}
      <div className="pt-2">
        <Button
          variant="ghost"
          fullWidth
          icon={<RotateCcw className="w-4 h-4 text-muted" />}
          onClick={() => {
            resetOnboarding();
            navigate('/welcome');
          }}
          className="text-xs text-muted hover:text-white"
        >
          {t('more.resetOnboarding')}
        </Button>
      </div>

      <DisclaimerBanner type="legal" compact />
    </div>
  );
};
