import React from 'react';
import { useNavigate, useLocation, Link, NavLink } from 'react-router-dom';
import { ArrowLeft, Shield, User, Globe } from 'lucide-react';
import { Logo } from '../Logo.tsx';
import { useApp } from '../../context/AppContext.tsx';
import { useI18n } from '../../i18n/index.ts';
import { OfficerPinModal } from '../citizen/OfficerPinModal.tsx';

// Top-level tab paths that don't need back button
const ROOT_TAB_PATHS = [
  '/',
  '/cases',
  '/guide',
  '/evidence',
  '/more',
  '/citizen',
  '/citizen/steps',
  '/citizen/complaint',
  '/citizen/help',
  '/welcome',
];

export const AppHeader: React.FC = () => {
  const { mode, language, isOnline, toggleMode, toggleLanguage, setMode } = useApp();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPinModal, setShowPinModal] = React.useState<boolean>(false);

  const isNested = !ROOT_TAB_PATHS.includes(location.pathname);

  const handleModeToggleClick = () => {
    if (mode === 'citizen') {
      setShowPinModal(true);
    } else {
      setMode('citizen');
      navigate('/citizen');
    }
  };

  const handlePinSuccess = () => {
    setShowPinModal(false);
    setMode('officer');
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-navy-900/95 backdrop-blur-md border-b border-navy-700/80 px-3 sm:px-6 py-2.5 min-h-[58px] select-none safe-top shadow-sm">
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left side: Back Button or App Logo */}
        <div className="flex items-center gap-2 min-w-0 shrink-0">
          {isNested ? (
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label={t('header.ariaGoBack')}
              className="flex items-center justify-center w-10 h-10 -ml-1 text-white hover:text-saffron hover:bg-navy-800 rounded-xl transition-colors active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : null}

          <Link
            to={mode === 'citizen' ? '/citizen' : '/'}
            className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron rounded-lg px-1 py-0.5"
          >
            <Logo size={30} />
            <div className="flex flex-col">
              <span className="font-bold text-white text-sm sm:text-base tracking-tight leading-none group-hover:text-saffron transition-colors">
                न्याय <span className="text-saffron">SAATHI</span>
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isOnline ? 'bg-india-green shadow-xs shadow-india-green/50' : 'bg-saffron'
                  }`}
                  title={isOnline ? t('header.systemOnline') : t('header.systemOffline')}
                />
                <span className="text-[10px] text-muted font-medium uppercase tracking-wider">
                  {isOnline ? t('common.online') : t('common.offline')}
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Center: Desktop Navigation Bar */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5">
          {mode === 'officer' ? (
            <>
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'text-saffron bg-navy-800 shadow-xs font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-navy-800/60'
                  }`
                }
              >
                {t('nav.home')}
              </NavLink>
              <NavLink
                to="/cases"
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'text-saffron bg-navy-800 shadow-xs font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-navy-800/60'
                  }`
                }
              >
                {t('nav.cases')}
              </NavLink>
              <NavLink
                to="/guide"
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'text-saffron bg-navy-800 shadow-xs font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-navy-800/60'
                  }`
                }
              >
                {t('nav.guide')}
              </NavLink>
              <NavLink
                to="/evidence"
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'text-saffron bg-navy-800 shadow-xs font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-navy-800/60'
                  }`
                }
              >
                {t('nav.evidence')}
              </NavLink>
              <NavLink
                to="/deadlines"
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'text-saffron bg-navy-800 shadow-xs font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-navy-800/60'
                  }`
                }
              >
                {language === 'mr' ? 'मुदत ट्रॅकर' : 'Deadlines'}
              </NavLink>
              <NavLink
                to="/documents"
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'text-saffron bg-navy-800 shadow-xs font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-navy-800/60'
                  }`
                }
              >
                {language === 'mr' ? 'कागदपत्रे' : 'Documents'}
              </NavLink>
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'text-saffron bg-navy-800 shadow-xs font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-navy-800/60'
                  }`
                }
              >
                {language === 'mr' ? 'डॅशबोर्ड' : 'Dashboard'}
              </NavLink>
              <NavLink
                to="/settings"
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'text-saffron bg-navy-800 shadow-xs font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-navy-800/60'
                  }`
                }
              >
                {language === 'mr' ? 'सेटिंग्ज' : 'Settings'}
              </NavLink>
              <NavLink
                to="/more"
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'text-saffron bg-navy-800 shadow-xs font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-navy-800/60'
                  }`
                }
              >
                {t('nav.more')}
              </NavLink>
            </>
          ) : (
            <>
              <NavLink
                to="/citizen"
                end
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'text-saffron bg-navy-800 shadow-xs font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-navy-800/60'
                  }`
                }
              >
                {t('nav.rights')}
              </NavLink>
              <NavLink
                to="/citizen/steps"
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'text-saffron bg-navy-800 shadow-xs font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-navy-800/60'
                  }`
                }
              >
                {t('nav.steps')}
              </NavLink>
              <NavLink
                to="/citizen/complaint"
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'text-saffron bg-navy-800 shadow-xs font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-navy-800/60'
                  }`
                }
              >
                {t('nav.complaint')}
              </NavLink>
              <NavLink
                to="/citizen/help"
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'text-saffron bg-navy-800 shadow-xs font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-navy-800/60'
                  }`
                }
              >
                {t('nav.help')}
              </NavLink>
            </>
          )}
        </nav>

        {/* Right side: Language Toggle + Mode Switch */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Language switch button */}
          <button
            type="button"
            onClick={toggleLanguage}
            aria-label={t('common.switchLang')}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 h-10 rounded-xl bg-navy-800 hover:bg-navy-700 border border-navy-700 text-xs font-semibold text-white hover:border-saffron active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron"
          >
            <Globe className="w-3.5 h-3.5 text-saffron shrink-0" />
            <span>{language === 'en' ? 'मराठी' : 'EN'}</span>
          </button>

          {/* Mode switch button */}
          <button
            type="button"
            onClick={handleModeToggleClick}
            aria-label={t('header.ariaToggleMode')}
            className={`flex items-center gap-1.5 px-3 py-1.5 h-10 rounded-xl text-xs font-semibold border transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron ${
              mode === 'officer'
                ? 'bg-navy-800 hover:bg-navy-700 border-navy-700 text-white hover:border-saffron'
                : 'bg-saffron/15 border-saffron text-saffron hover:bg-saffron/25'
            }`}
          >
            {mode === 'officer' ? (
              <>
                <Shield className="w-3.5 h-3.5 text-saffron shrink-0" />
                <span>{t('header.officer')}</span>
              </>
            ) : (
              <>
                <User className="w-3.5 h-3.5 text-saffron shrink-0" />
                <span>{t('header.citizen')}</span>
              </>
            )}
          </button>
        </div>
      </div>

      <OfficerPinModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSuccess={handlePinSuccess}
      />
    </header>
  );
};
