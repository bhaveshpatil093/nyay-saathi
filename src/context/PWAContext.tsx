import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface PWAContextType {
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  isHomeBannerDismissed: boolean;
  updateAvailable: boolean;
  showIOSModal: boolean;
  setShowIOSModal: (show: boolean) => void;
  promptInstall: () => Promise<boolean>;
  dismissHomeBanner: () => void;
  applyUpdate: () => void;
}

const PWAContext = createContext<PWAContextType | null>(null);

const STORAGE_DISMISSED_KEY = 'nyay_saathi_pwa_install_dismissed';

export const PWAProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [updateAvailable, setUpdateAvailable] = useState<boolean>(false);
  const [showIOSModal, setShowIOSModal] = useState<boolean>(false);
  const waitingWorkerRef = useRef<ServiceWorker | null>(null);

  const [isHomeBannerDismissed, setIsHomeBannerDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_DISMISSED_KEY) === 'true';
    } catch {
      return false;
    }
  });

  // 1. Detect Standalone Mode and iOS device
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkStandalone = () => {
      const matchMediaStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const navigatorStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      return matchMediaStandalone || navigatorStandalone;
    };

    setIsInstalled(checkStandalone());

    const ua = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(ua) && !(window as unknown as { MSStream?: boolean }).MSStream;
    setIsIOS(isIOSDevice);

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      setIsInstalled(e.matches);
    };

    try {
      mediaQuery.addEventListener('change', handleDisplayModeChange);
    } catch {
      // older browsers
      mediaQuery.addListener(handleDisplayModeChange);
    }

    return () => {
      try {
        mediaQuery.removeEventListener('change', handleDisplayModeChange);
      } catch {
        mediaQuery.removeListener(handleDisplayModeChange);
      }
    };
  }, []);

  // 2. Capture beforeinstallprompt & appinstalled
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // 3. Register Service Worker only on HTTPS or Localhost with try-catch
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const isLocalhost = Boolean(
      window.location.hostname === 'localhost' ||
      window.location.hostname === '[::1]' ||
      window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
    );
    const isHttps = window.location.protocol === 'https:';

    // Register only on HTTPS or localhost
    if (!isHttps && !isLocalhost) {
      return;
    }

    try {
      navigator.serviceWorker
        .register('./sw.js', { scope: './' })
        .then((reg) => {
          // If a waiting worker already exists
          if (reg.waiting) {
            waitingWorkerRef.current = reg.waiting;
            setUpdateAvailable(true);
          }

          // Listen for update found
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (!newWorker) return;

            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                waitingWorkerRef.current = newWorker;
                setUpdateAvailable(true);
              }
            });
          });
        })
        .catch((err) => {
          // AI Studio preview environment or sandbox may disallow service worker registration
          console.info('[PWA] Service worker registration bypassed or not permitted in this frame:', err?.message || err);
        });

      // Handle controller change (reloads on update skipWaiting)
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    } catch (err) {
      console.info('[PWA] Service worker initialization caught error:', err);
    }
  }, []);

  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (isIOS) {
      setShowIOSModal(true);
      return false;
    }

    if (!deferredPrompt) {
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        return true;
      }
      return false;
    } catch (err) {
      console.error('[PWA] Install prompt error:', err);
      return false;
    }
  }, [deferredPrompt, isIOS]);

  const dismissHomeBanner = useCallback(() => {
    setIsHomeBannerDismissed(true);
    try {
      localStorage.setItem(STORAGE_DISMISSED_KEY, 'true');
    } catch {
      // ignore
    }
  }, []);

  const applyUpdate = useCallback(() => {
    if (waitingWorkerRef.current) {
      waitingWorkerRef.current.postMessage({ type: 'SKIP_WAITING' });
    } else {
      window.location.reload();
    }
  }, []);

  return (
    <PWAContext.Provider
      value={{
        isInstallable: !!deferredPrompt || isIOS,
        isInstalled,
        isIOS,
        isHomeBannerDismissed,
        updateAvailable,
        showIOSModal,
        setShowIOSModal,
        promptInstall,
        dismissHomeBanner,
        applyUpdate,
      }}
    >
      {children}
    </PWAContext.Provider>
  );
};

export const usePWA = () => {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error('usePWA must be used within a PWAProvider');
  }
  return context;
};
