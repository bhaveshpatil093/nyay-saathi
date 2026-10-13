import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getSetting, setSetting, addAuditLog } from '../lib/db/index.ts';
import { hashPin, verifyPin } from '../lib/security/crypto.ts';

export type AutoLockOption = 1 | 5 | 15 | 0; // 0 = never

interface SecurityContextType {
  isPinConfigured: boolean;
  isLocked: boolean;
  autoLockMinutes: AutoLockOption;
  failedAttempts: number;
  lockoutRemainingSeconds: number;
  isLockoutActive: boolean;
  unlockWithPin: (pin: string) => Promise<{ success: boolean; error?: string }>;
  setNewPin: (pin: string) => Promise<{ success: boolean; error?: string }>;
  changeExistingPin: (oldPin: string, newPin: string) => Promise<{ success: boolean; error?: string }>;
  removeExistingPin: (pin: string) => Promise<{ success: boolean; error?: string }>;
  setAutoLockMinutes: (mins: AutoLockOption) => Promise<void>;
  lockNow: () => void;
}

const SecurityContext = createContext<SecurityContextType | null>(null);

const SESSION_LOCKOUT_KEY = 'nyay_saathi_lockout_until';
const SESSION_FAILED_KEY = 'nyay_saathi_failed_attempts';

export const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPinConfigured, setIsPinConfigured] = useState<boolean>(false);
  const [storedHash, setStoredHash] = useState<string | null>(null);
  const [storedSalt, setStoredSalt] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [autoLockMinutes, setAutoLockState] = useState<AutoLockOption>(5);
  const [failedAttempts, setFailedAttempts] = useState<number>(() => {
    try {
      return parseInt(sessionStorage.getItem(SESSION_FAILED_KEY) || '0', 10) || 0;
    } catch {
      return 0;
    }
  });

  const [lockoutRemainingSeconds, setLockoutRemainingSeconds] = useState<number>(0);
  const lastActiveRef = useRef<number>(Date.now());

  // Load PIN settings from DB at startup
  useEffect(() => {
    async function loadSecuritySettings() {
      try {
        const [pinHash, pinSalt, autoLock] = await Promise.all([
          getSetting<string>('pinHash'),
          getSetting<string>('pinSalt'),
          getSetting<AutoLockOption>('autoLockMinutes'),
        ]);

        if (pinHash && pinSalt) {
          setStoredHash(pinHash);
          setStoredSalt(pinSalt);
          setIsPinConfigured(true);
          setIsLocked(true); // Lock on app start if PIN configured
        } else {
          setIsPinConfigured(false);
          setIsLocked(false);
        }

        if (typeof autoLock === 'number') {
          setAutoLockState(autoLock);
        }
      } catch (err) {
        console.error('[SecurityContext] Failed to load settings:', err);
      }
    }

    loadSecuritySettings();
  }, []);

  // Lockout countdown timer
  useEffect(() => {
    const updateCountdown = () => {
      try {
        const untilStr = sessionStorage.getItem(SESSION_LOCKOUT_KEY);
        if (!untilStr) {
          setLockoutRemainingSeconds(0);
          return;
        }
        const until = parseInt(untilStr, 10);
        const diff = Math.ceil((until - Date.now()) / 1000);
        if (diff > 0) {
          setLockoutRemainingSeconds(diff);
        } else {
          setLockoutRemainingSeconds(0);
          sessionStorage.removeItem(SESSION_LOCKOUT_KEY);
        }
      } catch {
        setLockoutRemainingSeconds(0);
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, []);

  // Return from background / visibility change listener
  useEffect(() => {
    if (!isPinConfigured) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // App went to background
      } else {
        // App returned from background
        setIsLocked(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isPinConfigured]);

  // Inactivity auto-lock timer
  useEffect(() => {
    if (!isPinConfigured || autoLockMinutes === 0) return;

    const recordActivity = () => {
      lastActiveRef.current = Date.now();
    };

    window.addEventListener('mousemove', recordActivity, { passive: true });
    window.addEventListener('keydown', recordActivity, { passive: true });
    window.addEventListener('touchstart', recordActivity, { passive: true });
    window.addEventListener('click', recordActivity, { passive: true });

    const checkInterval = setInterval(() => {
      const elapsed = Date.now() - lastActiveRef.current;
      const timeoutMs = autoLockMinutes * 60 * 1000;
      if (elapsed >= timeoutMs) {
        setIsLocked(true);
      }
    }, 10000);

    return () => {
      window.removeEventListener('mousemove', recordActivity);
      window.removeEventListener('keydown', recordActivity);
      window.removeEventListener('touchstart', recordActivity);
      window.removeEventListener('click', recordActivity);
      clearInterval(checkInterval);
    };
  }, [isPinConfigured, autoLockMinutes]);

  const unlockWithPin = useCallback(
    async (pin: string): Promise<{ success: boolean; error?: string }> => {
      if (lockoutRemainingSeconds > 0) {
        return {
          success: false,
          error: `कृपया ${lockoutRemainingSeconds} सेकंद प्रतीक्षा करा / Please wait ${lockoutRemainingSeconds}s`,
        };
      }

      if (!storedHash || !storedSalt) {
        setIsLocked(false);
        return { success: true };
      }

      const isValid = await verifyPin(pin, storedHash, storedSalt);
      if (isValid) {
        setIsLocked(false);
        setFailedAttempts(0);
        sessionStorage.removeItem(SESSION_FAILED_KEY);
        sessionStorage.removeItem(SESSION_LOCKOUT_KEY);
        lastActiveRef.current = Date.now();
        await addAuditLog('auth_success', 'Device unlocked with officer PIN');
        return { success: true };
      }

      // Wrong attempt handling
      const nextFailed = failedAttempts + 1;
      setFailedAttempts(nextFailed);
      sessionStorage.setItem(SESSION_FAILED_KEY, String(nextFailed));
      await addAuditLog('auth_failed', `Incorrect PIN attempt (#${nextFailed})`);

      if (nextFailed >= 5) {
        const lockoutUntil = Date.now() + 30000; // 30 seconds
        sessionStorage.setItem(SESSION_LOCKOUT_KEY, String(lockoutUntil));
        setLockoutRemainingSeconds(30);
        return {
          success: false,
          error: '५ अयशस्वी प्रयत्न! ३० सेकंदांसाठी लॉक केले आहे. / 5 failed attempts! Locked for 30 seconds.',
        };
      }

      return {
        success: false,
        error: `चुकीचा पिन! (${5 - nextFailed} प्रयत्न शिल्लक) / Incorrect PIN! (${5 - nextFailed} attempts remaining)`,
      };
    },
    [storedHash, storedSalt, failedAttempts, lockoutRemainingSeconds]
  );

  const setNewPin = useCallback(
    async (pin: string): Promise<{ success: boolean; error?: string }> => {
      if (pin.length < 4 || pin.length > 6 || !/^\d+$/.test(pin)) {
        return { success: false, error: 'पिन ४ ते ६ अंकी असावा / PIN must be 4 to 6 digits' };
      }

      const { hashHex, saltHex } = await hashPin(pin);
      await setSetting('pinHash', hashHex);
      await setSetting('pinSalt', saltHex);
      setStoredHash(hashHex);
      setStoredSalt(saltHex);
      setIsPinConfigured(true);
      await addAuditLog('pin_configured', 'Officer PIN set successfully (salted PBKDF2)');
      return { success: true };
    },
    []
  );

  const changeExistingPin = useCallback(
    async (oldPin: string, newPin: string): Promise<{ success: boolean; error?: string }> => {
      if (!storedHash || !storedSalt) {
        return setNewPin(newPin);
      }

      const isOldValid = await verifyPin(oldPin, storedHash, storedSalt);
      if (!isOldValid) {
        return { success: false, error: 'जुना पिन चुकीचा आहे / Old PIN is incorrect' };
      }

      return setNewPin(newPin);
    },
    [storedHash, storedSalt, setNewPin]
  );

  const removeExistingPin = useCallback(
    async (pin: string): Promise<{ success: boolean; error?: string }> => {
      if (!storedHash || !storedSalt) {
        setIsPinConfigured(false);
        return { success: true };
      }

      const isValid = await verifyPin(pin, storedHash, storedSalt);
      if (!isValid) {
        return { success: false, error: 'चुकीचा पिन! / Incorrect PIN!' };
      }

      await setSetting('pinHash', null);
      await setSetting('pinSalt', null);
      setStoredHash(null);
      setStoredSalt(null);
      setIsPinConfigured(false);
      setIsLocked(false);
      await addAuditLog('pin_removed', 'Officer PIN removed from device');
      return { success: true };
    },
    [storedHash, storedSalt]
  );

  const setAutoLockMinutes = useCallback(async (mins: AutoLockOption) => {
    setAutoLockState(mins);
    await setSetting('autoLockMinutes', mins);
  }, []);

  const lockNow = useCallback(() => {
    if (isPinConfigured) {
      setIsLocked(true);
    }
  }, [isPinConfigured]);

  return (
    <SecurityContext.Provider
      value={{
        isPinConfigured,
        isLocked,
        autoLockMinutes,
        failedAttempts,
        lockoutRemainingSeconds,
        isLockoutActive: lockoutRemainingSeconds > 0,
        unlockWithPin,
        setNewPin,
        changeExistingPin,
        removeExistingPin,
        setAutoLockMinutes,
        lockNow,
      }}
    >
      {children}
    </SecurityContext.Provider>
  );
};

export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
};
