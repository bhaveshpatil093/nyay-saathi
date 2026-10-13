import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  getProfile as dbGetProfile,
  saveProfile as dbSaveProfile,
  getSetting,
  setSetting,
} from '../lib/db/index.ts';

export type UserMode = 'officer' | 'citizen';
export type AppLanguage = 'en' | 'mr';
export type FontSizeScale = 'small' | 'medium' | 'large';

export interface OfficerProfile {
  fullName: string;
  rank: string;
  stationName: string;
  district: string;
  badgeNumber?: string;
  mobile?: string;
}

interface AppContextType {
  mode: UserMode;
  language: AppLanguage;
  onboardingComplete: boolean;
  isOnline: boolean;
  profile: OfficerProfile | null;
  fontSize: FontSizeScale;
  highContrast: boolean;
  devanagariDigits: boolean;
  setMode: (mode: UserMode) => void;
  toggleMode: () => void;
  setLanguage: (lang: AppLanguage) => void;
  toggleLanguage: () => void;
  setProfile: (profile: OfficerProfile | null) => void;
  setFontSize: (size: FontSizeScale) => void;
  setHighContrast: (enabled: boolean) => void;
  setDevanagariDigits: (enabled: boolean) => void;
  completeOnboarding: (
    preferredMode?: UserMode,
    preferredLang?: AppLanguage,
    officerProfile?: OfficerProfile
  ) => void;
  resetOnboarding: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEYS = {
  MODE: 'nyay_saathi_mode',
  LANG: 'nyay_saathi_lang',
  ONBOARDED: 'nyay_saathi_onboarded',
  PROFILE: 'nyay_saathi_profile',
  FONT_SIZE: 'nyay_saathi_font_size',
  HIGH_CONTRAST: 'nyay_saathi_high_contrast',
  DEVANAGARI_DIGITS: 'nyay_saathi_devanagari_digits',
};


export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Synchronous initial state from localStorage for zero-flicker first paint
  const [mode, setModeState] = useState<UserMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MODE);
    return saved === 'citizen' ? 'citizen' : 'officer';
  });

  const [language, setLanguageState] = useState<AppLanguage>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LANG);
    return saved === 'mr' ? 'mr' : 'en';
  });

  const [onboardingComplete, setOnboardingCompleteState] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEYS.ONBOARDED) === 'true';
  });

  const [profile, setProfileState] = useState<OfficerProfile | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (!saved) return null;
    try {
      return JSON.parse(saved) as OfficerProfile;
    } catch {
      return null;
    }
  });

  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  const [fontSize, setFontSizeState] = useState<FontSizeScale>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.FONT_SIZE);
    return saved === 'small' || saved === 'large' ? saved : 'medium';
  });

  const [highContrast, setHighContrastState] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEYS.HIGH_CONTRAST) === 'true';
  });

  const [devanagariDigits, setDevanagariDigitsState] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEYS.DEVANAGARI_DIGITS) === 'true';
  });

  // Apply root font scale and high contrast class
  useEffect(() => {
    const root = document.documentElement;
    if (fontSize === 'small') {
      root.style.fontSize = '14px';
    } else if (fontSize === 'large') {
      root.style.fontSize = '18px';
    } else {
      root.style.fontSize = '16px';
    }
  }, [fontSize]);

  useEffect(() => {
    if (highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [highContrast]);

  // Initialize and migrate data from IndexedDB
  useEffect(() => {
    async function initFromDb() {
      try {
        const [
          dbMode,
          dbLang,
          dbOnboarding,
          dbProfileRecord,
          dbFontSize,
          dbHighContrast,
          dbDevDigits,
        ] = await Promise.all([
          getSetting<UserMode>('mode'),
          getSetting<AppLanguage>('language'),
          getSetting<boolean>('onboardingDone'),
          dbGetProfile(),
          getSetting<FontSizeScale>('fontScale'),
          getSetting<boolean>('highContrast'),
          getSetting<boolean>('devanagariDigits'),
        ]);

        if (dbFontSize) {
          setFontSizeState(dbFontSize);
          localStorage.setItem(STORAGE_KEYS.FONT_SIZE, dbFontSize);
        }

        if (typeof dbHighContrast === 'boolean') {
          setHighContrastState(dbHighContrast);
          localStorage.setItem(STORAGE_KEYS.HIGH_CONTRAST, String(dbHighContrast));
        }

        if (typeof dbDevDigits === 'boolean') {
          setDevanagariDigitsState(dbDevDigits);
          localStorage.setItem(STORAGE_KEYS.DEVANAGARI_DIGITS, String(dbDevDigits));
        }

        if (dbMode) {
          setModeState(dbMode);
          localStorage.setItem(STORAGE_KEYS.MODE, dbMode);
        } else {
          // Initial migration from localStorage to IndexedDB
          const localMode = localStorage.getItem(STORAGE_KEYS.MODE) as UserMode | null;
          if (localMode) await setSetting('mode', localMode);
        }

        if (dbLang) {
          setLanguageState(dbLang);
          localStorage.setItem(STORAGE_KEYS.LANG, dbLang);
        } else {
          const localLang = localStorage.getItem(STORAGE_KEYS.LANG) as AppLanguage | null;
          if (localLang) await setSetting('language', localLang);
        }

        if (typeof dbOnboarding === 'boolean') {
          setOnboardingCompleteState(dbOnboarding);
          localStorage.setItem(STORAGE_KEYS.ONBOARDED, String(dbOnboarding));
        } else {
          const localOnboarded = localStorage.getItem(STORAGE_KEYS.ONBOARDED) === 'true';
          await setSetting('onboardingDone', localOnboarded);
        }


        if (dbProfileRecord) {
          const mappedProfile: OfficerProfile = {
            fullName: dbProfileRecord.name,
            rank: dbProfileRecord.rank,
            stationName: dbProfileRecord.station,
            district: dbProfileRecord.district,
            badgeNumber: dbProfileRecord.badgeNo,
            mobile: dbProfileRecord.mobile,
          };
          setProfileState(mappedProfile);
          localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(mappedProfile));
        } else {
          const localProfileStr = localStorage.getItem(STORAGE_KEYS.PROFILE);
          if (localProfileStr) {
            try {
              const parsed = JSON.parse(localProfileStr) as OfficerProfile;
              await dbSaveProfile({
                name: parsed.fullName,
                rank: parsed.rank,
                station: parsed.stationName,
                district: parsed.district,
                badgeNo: parsed.badgeNumber,
                mobile: parsed.mobile,
              });
            } catch {
              // Ignore parse errors
            }
          }
        }
      } catch (err) {
        console.error('[AppContext] Failed to load from IndexedDB:', err);
      }
    }

    initFromDb();
  }, []);

  // HTML lang sync
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  // Online / offline network listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const setMode = (newMode: UserMode) => {
    setModeState(newMode);
    localStorage.setItem(STORAGE_KEYS.MODE, newMode);
    setSetting('mode', newMode).catch(console.error);
  };

  const toggleMode = () => {
    const nextMode = mode === 'officer' ? 'citizen' : 'officer';
    setMode(nextMode);
  };

  const setLanguage = (newLang: AppLanguage) => {
    setLanguageState(newLang);
    localStorage.setItem(STORAGE_KEYS.LANG, newLang);
    setSetting('language', newLang).catch(console.error);
  };

  const toggleLanguage = () => {
    const nextLang = language === 'en' ? 'mr' : 'en';
    setLanguage(nextLang);
  };

  const setProfile = (newProfile: OfficerProfile | null) => {
    setProfileState(newProfile);
    if (newProfile) {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(newProfile));
      dbSaveProfile({
        name: newProfile.fullName,
        rank: newProfile.rank,
        station: newProfile.stationName,
        district: newProfile.district,
        badgeNo: newProfile.badgeNumber,
        mobile: newProfile.mobile,
      }).catch(console.error);
    } else {
      localStorage.removeItem(STORAGE_KEYS.PROFILE);
    }
  };

  const completeOnboarding = (
    preferredMode?: UserMode,
    preferredLang?: AppLanguage,
    officerProfile?: OfficerProfile
  ) => {
    const m = preferredMode || mode;
    const l = preferredLang || language;

    if (preferredMode) setMode(preferredMode);
    if (preferredLang) setLanguage(preferredLang);
    if (officerProfile) setProfile(officerProfile);

    setOnboardingCompleteState(true);
    localStorage.setItem(STORAGE_KEYS.ONBOARDED, 'true');

    // Persist all to IndexedDB
    Promise.all([
      setSetting('mode', m),
      setSetting('language', l),
      setSetting('onboardingDone', true),
    ]).catch(console.error);
  };

  const resetOnboarding = () => {
    setOnboardingCompleteState(false);
    localStorage.removeItem(STORAGE_KEYS.ONBOARDED);
    setSetting('onboardingDone', false).catch(console.error);
  };

  const setFontSize = (newSize: FontSizeScale) => {
    setFontSizeState(newSize);
    localStorage.setItem(STORAGE_KEYS.FONT_SIZE, newSize);
    setSetting('fontScale', newSize).catch(console.error);
  };

  const setHighContrast = (enabled: boolean) => {
    setHighContrastState(enabled);
    localStorage.setItem(STORAGE_KEYS.HIGH_CONTRAST, String(enabled));
    setSetting('highContrast', enabled).catch(console.error);
  };

  const setDevanagariDigits = (enabled: boolean) => {
    setDevanagariDigitsState(enabled);
    localStorage.setItem(STORAGE_KEYS.DEVANAGARI_DIGITS, String(enabled));
    setSetting('devanagariDigits', enabled).catch(console.error);
  };

  return (
    <AppContext.Provider
      value={{
        mode,
        language,
        onboardingComplete,
        isOnline,
        profile,
        fontSize,
        highContrast,
        devanagariDigits,
        setMode,
        toggleMode,
        setLanguage,
        toggleLanguage,
        setProfile,
        setFontSize,
        setHighContrast,
        setDevanagariDigits,
        completeOnboarding,
        resetOnboarding,
      }}
    >
      {children}
    </AppContext.Provider>
  );

};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
