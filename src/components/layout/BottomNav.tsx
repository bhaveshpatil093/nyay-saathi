import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  Briefcase,
  BookOpen,
  Camera,
  MoreHorizontal,
  Scale,
  ListChecks,
  FileText,
  HelpCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.tsx';
import { useI18n } from '../../i18n/index.ts';

// Routes where bottom navigation should be hidden for full-screen flows
const FULLSCREEN_ROUTES = [
  '/welcome',
  '/cases/new',
  '/evidence/new',
];

export const BottomNav: React.FC = () => {
  const { mode } = useApp();
  const { t } = useI18n();
  const location = useLocation();

  // Check if route starts with any fullscreen prefix
  const isHidden =
    FULLSCREEN_ROUTES.some((route) => location.pathname === route) ||
    location.pathname.startsWith('/checklist/');

  if (isHidden) return null;

  const officerTabs = [
    {
      to: '/',
      label: t('nav.home'),
      icon: Home,
      end: true,
    },
    {
      to: '/cases',
      label: t('nav.cases'),
      icon: Briefcase,
    },
    {
      to: '/guide',
      label: t('nav.guide'),
      icon: BookOpen,
    },
    {
      to: '/evidence',
      label: t('nav.evidence'),
      icon: Camera,
    },
    {
      to: '/more',
      label: t('nav.more'),
      icon: MoreHorizontal,
    },
  ];

  const citizenTabs = [
    {
      to: '/citizen',
      label: t('nav.rights'),
      icon: Scale,
      end: true,
    },
    {
      to: '/citizen/steps',
      label: t('nav.steps'),
      icon: ListChecks,
    },
    {
      to: '/citizen/complaint',
      label: t('nav.complaint'),
      icon: FileText,
    },
    {
      to: '/citizen/help',
      label: t('nav.help'),
      icon: HelpCircle,
    },
  ];

  const tabs = mode === 'officer' ? officerTabs : citizenTabs;

  return (
    <nav
      role="navigation"
      aria-label="Bottom Navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-navy-900/95 backdrop-blur-md border-t border-navy-700/80 safe-bottom select-none"
    >
      <div className="max-w-md sm:max-w-xl mx-auto flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 h-full min-w-0 py-1 transition-colors relative group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron rounded-lg ${
                  isActive
                    ? 'text-saffron font-semibold'
                    : 'text-muted hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <Icon
                      className={`w-5 h-5 transition-transform duration-150 ${
                        isActive ? 'scale-110 stroke-[2.4]' : 'scale-100 stroke-[1.8]'
                      }`}
                    />
                    {isActive && (
                      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-saffron rounded-full" />
                    )}
                  </div>
                  <span className="text-[11px] mt-1 truncate tracking-tight font-medium">
                    {tab.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
