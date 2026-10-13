import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AppHeader } from './AppHeader.tsx';
import { BottomNav } from './BottomNav.tsx';
import { ScrollToTop } from './ScrollToTop.tsx';
import { OfflineBanner } from './OfflineBanner.tsx';
import { PWAUpdateToast } from '../pwa/PWAUpdateToast.tsx';
import { IOSInstallModal } from '../pwa/IOSInstallModal.tsx';

const NO_BOTTOM_NAV_PATHS = [
  '/welcome',
  '/cases/new',
  '/evidence/new',
];

export const AppLayout: React.FC = () => {
  const location = useLocation();
  const isFullscreen =
    NO_BOTTOM_NAV_PATHS.some((path) => location.pathname === path) ||
    location.pathname.startsWith('/checklist/');

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col text-white antialiased">
      {/* Scroll manager */}
      <ScrollToTop />

      {/* PWA Update notification & iOS guidance modals */}
      <PWAUpdateToast />
      <IOSInstallModal />

      {/* Main App Container */}
      <div
        id="main-scroll-container"
        className="w-full min-h-screen bg-navy-900 flex flex-col relative"
      >
        {/* Offline connectivity banner */}
        <OfflineBanner />

        {/* Persistent Top Header (hidden on welcome screen if preferred, but keep unless welcome) */}
        {location.pathname !== '/welcome' && <AppHeader />}


        {/* Page Content with 150ms subtle fade animation */}
        <main
          key={location.pathname}
          className={`flex-1 flex flex-col animate-in fade-in duration-150 ${
            isFullscreen ? 'pb-6' : 'pb-24 lg:pb-8'
          }`}
        >
          <Outlet />
        </main>

        {/* Persistent Bottom Nav */}
        <BottomNav />
      </div>
    </div>
  );
};
