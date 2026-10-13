import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Type,
  Lock,
  Database,
  HardDrive,
  ClipboardList,
  AlertOctagon,
  Clock,
  ShieldCheck,
  Download,
  Upload,
  Check,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Info,
  ChevronRight,
  Eye,
  EyeOff,
  Trash2,
  Key,
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { useApp, FontSizeScale, OfficerProfile } from '../../context/AppContext.tsx';
import { useSecurity, AutoLockOption } from '../../context/SecurityContext.tsx';
import { useI18n } from '../../i18n/index.ts';
import { useToast } from '../../components/ui/Toast.tsx';
import {
  saveProfile,
  getProfile,
  getSetting,
  setSetting,
  listAuditLogs,
  getStorageEstimate,
  clearSampleData,
  addAuditLog,
} from '../../lib/db/index.ts';
import { seedSampleStationData } from '../../lib/db/sampleData.ts';
import { useDemo } from '../../context/DemoContext.tsx';
import {
  exportDatabaseBackup,
  validateBackupFile,
  restoreBackup,
  clearAllDeviceData,
  BackupSummary,
  BackupStores,
} from '../../lib/backup/backupManager.ts';
import { AuditLogRecord } from '../../types/database.ts';

type SettingsTab =
  | 'profile'
  | 'display'
  | 'security'
  | 'backup'
  | 'storage'
  | 'audit'
  | 'controls'
  | 'assumptions'
  | 'privacy';

export const SettingsPage: React.FC = () => {
  const {
    language,
    setLanguage,
    profile,
    setProfile,
    fontSize,
    setFontSize,
    highContrast,
    setHighContrast,
    devanagariDigits,
    setDevanagariDigits,
    resetOnboarding,
  } = useApp();

  const {
    isPinConfigured,
    autoLockMinutes,
    setAutoLockMinutes,
    setNewPin,
    changeExistingPin,
    removeExistingPin,
    lockNow,
  } = useSecurity();

  const { t, formatDateTime, formatNumber } = useI18n();
  const { success: toastSuccess, error: toastError, info: toastInfo } = useToast();
  const navigate = useNavigate();
  const { startDemo } = useDemo();

  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  // --- Profile State ---
  const [profileForm, setProfileForm] = useState<OfficerProfile>({
    fullName: profile?.fullName || '',
    rank: profile?.rank || 'PSI',
    stationName: profile?.stationName || '',
    district: profile?.district || '',
    badgeNumber: profile?.badgeNumber || '',
    mobile: profile?.mobile || '',
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    if (profile) {
      setProfileForm({
        fullName: profile.fullName || '',
        rank: profile.rank || 'PSI',
        stationName: profile.stationName || '',
        district: profile.district || '',
        badgeNumber: profile.badgeNumber || '',
        mobile: profile.mobile || '',
      });
    }
  }, [profile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.fullName.trim() || !profileForm.stationName.trim()) {
      toastError(
        language === 'mr'
          ? 'कृपया नाव आणि पोलीस ठाणे प्रविष्ट करा'
          : 'Please enter officer name and police station'
      );
      return;
    }
    setIsSavingProfile(true);
    try {
      await saveProfile({
        name: profileForm.fullName.trim(),
        rank: profileForm.rank,
        station: profileForm.stationName.trim(),
        district: profileForm.district.trim(),
        badgeNo: profileForm.badgeNumber?.trim(),
        mobile: profileForm.mobile?.trim(),
      });
      setProfile({
        fullName: profileForm.fullName.trim(),
        rank: profileForm.rank,
        stationName: profileForm.stationName.trim(),
        district: profileForm.district.trim(),
        badgeNumber: profileForm.badgeNumber?.trim(),
        mobile: profileForm.mobile?.trim(),
      });
      toastSuccess(
        language === 'mr' ? 'अधिकारी तपशील जतन केले!' : 'Officer profile updated successfully!'
      );
    } catch (err: any) {
      toastError(err?.message || 'Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // --- Security Modal States ---
  const [pinModalMode, setPinModalMode] = useState<'set' | 'change' | 'remove' | null>(null);
  const [pinOld, setPinOld] = useState('');
  const [pinNew, setPinNew] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [pinModalError, setPinModalError] = useState<string | null>(null);
  const [isPinSubmitting, setIsPinSubmitting] = useState(false);

  const openPinModal = (mode: 'set' | 'change' | 'remove') => {
    setPinModalMode(mode);
    setPinOld('');
    setPinNew('');
    setPinConfirm('');
    setPinModalError(null);
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinModalError(null);
    setIsPinSubmitting(true);

    try {
      if (pinModalMode === 'set') {
        if (pinNew.length < 4 || pinNew.length > 6 || !/^\d+$/.test(pinNew)) {
          setPinModalError(
            language === 'mr'
              ? 'पिन ४ ते ६ अंकी असावा (फक्त अंक)'
              : 'PIN must be 4 to 6 numeric digits'
          );
          setIsPinSubmitting(false);
          return;
        }
        if (pinNew !== pinConfirm) {
          setPinModalError(
            language === 'mr'
              ? 'दोन्ही पिन जुळत नाहीत'
              : 'New PIN and confirmation do not match'
          );
          setIsPinSubmitting(false);
          return;
        }
        const res = await setNewPin(pinNew);
        if (!res.success) {
          setPinModalError(res.error || 'Failed to set PIN');
        } else {
          toastSuccess(
            language === 'mr' ? 'सुरक्षा पिन सक्रिय केला!' : 'Security PIN configured successfully!'
          );
          setPinModalMode(null);
        }
      } else if (pinModalMode === 'change') {
        if (pinNew.length < 4 || pinNew.length > 6 || !/^\d+$/.test(pinNew)) {
          setPinModalError(
            language === 'mr' ? 'नवीन पिन ४ ते ६ अंकी असावा' : 'New PIN must be 4 to 6 digits'
          );
          setIsPinSubmitting(false);
          return;
        }
        if (pinNew !== pinConfirm) {
          setPinModalError(
            language === 'mr'
              ? 'नवीन पिन जुळत नाही'
              : 'New PIN and confirmation do not match'
          );
          setIsPinSubmitting(false);
          return;
        }
        const res = await changeExistingPin(pinOld, pinNew);
        if (!res.success) {
          setPinModalError(res.error || 'Failed to change PIN');
        } else {
          toastSuccess(
            language === 'mr' ? 'पिन यशस्वीरित्या बदलला!' : 'Security PIN changed successfully!'
          );
          setPinModalMode(null);
        }
      } else if (pinModalMode === 'remove') {
        const res = await removeExistingPin(pinOld);
        if (!res.success) {
          setPinModalError(res.error || 'Failed to remove PIN');
        } else {
          toastSuccess(
            language === 'mr' ? 'पिन काढला गेला आहे.' : 'Security PIN removed.'
          );
          setPinModalMode(null);
        }
      }
    } catch (err: any) {
      setPinModalError(err?.message || 'Error executing PIN action');
    } finally {
      setIsPinSubmitting(false);
    }
  };

  // --- Backup & Restore State ---
  const [includeMediaBlobs, setIncludeMediaBlobs] = useState(false);
  const [useBackupPassphrase, setUseBackupPassphrase] = useState(false);
  const [backupPassphrase, setBackupPassphrase] = useState('');
  const [isExportingBackup, setIsExportingBackup] = useState(false);

  // Import State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importSummaryModal, setImportSummaryModal] = useState<BackupSummary | null>(null);
  const [importedParsedStores, setImportedParsedStores] = useState<BackupStores | null>(null);
  const [pendingRawFileContent, setPendingRawFileContent] = useState<string | null>(null);
  const [importPassphrasePrompt, setImportPassphrasePrompt] = useState(false);
  const [importPassphraseInput, setImportPassphraseInput] = useState('');
  const [importPassError, setImportPassError] = useState<string | null>(null);
  const [restoreMode, setRestoreMode] = useState<'merge' | 'replace'>('merge');
  const [isRestoring, setIsRestoring] = useState(false);

  const handleExportBackup = async () => {
    if (useBackupPassphrase && (!backupPassphrase || backupPassphrase.length < 4)) {
      toastError(
        language === 'mr'
          ? 'पासफ्रेज किमान ४ अक्षरांचा असावा'
          : 'Passphrase must be at least 4 characters'
      );
      return;
    }
    setIsExportingBackup(true);
    try {
      const { blob, filename } = await exportDatabaseBackup({
        passphrase: useBackupPassphrase ? backupPassphrase : undefined,
        includeMediaBlobs,
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toastSuccess(
        language === 'mr'
          ? 'बॅकअप फाइल यशस्वीरित्या डाऊनलोड झाली!'
          : 'Backup JSON downloaded successfully!'
      );
    } catch (err: any) {
      toastError(err?.message || 'Export backup failed');
    } finally {
      setIsExportingBackup(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      setPendingRawFileContent(text);
      const val = await validateBackupFile(text);

      if (val.needsPassphrase) {
        setImportPassphrasePrompt(true);
        setImportPassError(null);
        setImportPassphraseInput('');
      } else if (!val.valid) {
        toastError(val.error || 'Invalid backup file');
      } else {
        setImportSummaryModal(val.summary || null);
        setImportedParsedStores(val.parsedStores || null);
      }
    } catch (err: any) {
      toastError(err?.message || 'Failed to read backup file');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDecryptImport = async () => {
    if (!pendingRawFileContent) return;
    setImportPassError(null);
    const val = await validateBackupFile(pendingRawFileContent, importPassphraseInput);
    if (!val.valid) {
      setImportPassError(val.error || 'Decryption failed. Check passphrase.');
    } else {
      setImportPassphrasePrompt(false);
      setImportSummaryModal(val.summary || null);
      setImportedParsedStores(val.parsedStores || null);
    }
  };

  const handleConfirmRestore = async () => {
    if (!importedParsedStores) return;
    setIsRestoring(true);
    try {
      const result = await restoreBackup(importedParsedStores, restoreMode);
      toastSuccess(
        language === 'mr'
          ? `बॅकअप पूर्ववत केला! (${result.totalRecordsRestored} नोंदी)`
          : `Backup restored successfully! (${result.totalRecordsRestored} records applied)`
      );
      setImportSummaryModal(null);
      setImportedParsedStores(null);
      setPendingRawFileContent(null);
    } catch (err: any) {
      toastError(err?.message || 'Restore failed');
    } finally {
      setIsRestoring(false);
    }
  };

  // --- Storage State ---
  const [storageEstimate, setStorageEstimate] = useState<{
    usageBytes: number;
    quotaBytes: number;
    percentageUsed: number;
  }>({ usageBytes: 0, quotaBytes: 0, percentageUsed: 0 });
  const [isPersisted, setIsPersisted] = useState<boolean>(false);
  const [isRequestingPersist, setIsRequestingPersist] = useState(false);

  const loadStorageInfo = async () => {
    const est = await getStorageEstimate();
    setStorageEstimate(est);
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persisted) {
      try {
        const persisted = await navigator.storage.persisted();
        setIsPersisted(persisted);
      } catch {
        // ignore
      }
    }
  };

  useEffect(() => {
    if (activeTab === 'storage') {
      loadStorageInfo();
    }
  }, [activeTab]);

  const handleRequestPersist = async () => {
    if (typeof navigator === 'undefined' || !navigator.storage || !navigator.storage.persist) {
      toastInfo(
        language === 'mr'
          ? 'या ब्राउझरमध्ये पर्सिस्टंट स्टोरेज समर्थित नाही'
          : 'Persistent storage API is not supported in this browser'
      );
      return;
    }
    setIsRequestingPersist(true);
    try {
      const granted = await navigator.storage.persist();
      setIsPersisted(granted);
      if (granted) {
        toastSuccess(
          language === 'mr'
            ? 'पर्सिस्टंट स्टोरेज परवानगी मिळाली!'
            : 'Persistent storage granted! Browser will not clear data.'
        );
      } else {
        toastInfo(
          language === 'mr'
            ? 'ब्राउझरने मानक कोटा मंजूर केला आहे.'
            : 'Browser maintained standard storage quota.'
        );
      }
    } catch (err: any) {
      toastError(err?.message || 'Failed to request persistence');
    } finally {
      setIsRequestingPersist(false);
    }
  };

  // --- Audit Log Viewer State ---
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);
  const [auditFilterType, setAuditFilterType] = useState<string>('all');
  const [auditSearchQuery, setAuditSearchQuery] = useState<string>('');
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);

  const loadAuditData = async () => {
    setIsLoadingAudit(true);
    try {
      const logs = await listAuditLogs(200);
      setAuditLogs(logs);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingAudit(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'audit') {
      loadAuditData();
    }
  }, [activeTab]);

  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      if (auditFilterType !== 'all') {
        if (!log.action.toLowerCase().startsWith(auditFilterType.toLowerCase())) {
          return false;
        }
      }
      if (auditSearchQuery.trim()) {
        const q = auditSearchQuery.toLowerCase();
        return (
          log.action.toLowerCase().includes(q) ||
          log.detail.toLowerCase().includes(q) ||
          log.timestamp.includes(q)
        );
      }
      return true;
    });
  }, [auditLogs, auditFilterType, auditSearchQuery]);

  const handleExportAuditLogs = () => {
    const jsonStr = JSON.stringify(auditLogs, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nyaysaathi_audit_log_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toastSuccess(language === 'mr' ? 'ऑडिट लॉग निर्यात केला!' : 'Audit log exported as JSON!');
  };

  // --- Data Controls State ---
  const [clearSampleModal, setClearSampleModal] = useState(false);
  const [isClearingSample, setIsClearingSample] = useState(false);

  const [deleteAllModal, setDeleteAllModal] = useState(false);
  const [deletePinInput, setDeletePinInput] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [isSeedingSample, setIsSeedingSample] = useState(false);

  const handleLoadSampleSettings = async () => {
    setIsSeedingSample(true);
    try {
      const res = await seedSampleStationData();
      await addAuditLog('sample_data_seeded', `Loaded ${res.casesCount} sample cases for demonstration`);
      toastSuccess(
        language === 'mr'
          ? `${res.casesCount} नमुना प्रकरणे यशस्वीरित्या लोड केली!`
          : `Loaded ${res.casesCount} sample cases with evidence and custody logs!`
      );
    } catch (err: any) {
      toastError(err?.message || 'Failed to seed sample data');
    } finally {
      setIsSeedingSample(false);
    }
  };

  const handleClearSampleConfirm = async () => {
    setIsClearingSample(true);
    try {
      const count = await clearSampleData();
      await addAuditLog('sample_data_cleared', `Removed ${count} sample station cases`);
      toastSuccess(
        language === 'mr'
          ? `${count} नमुना प्रकरणे यशस्वीरित्या हटवली!`
          : `Cleared ${count} sample cases and linked records!`
      );
      setClearSampleModal(false);
    } catch (err: any) {
      toastError(err?.message || 'Failed to clear sample data');
    } finally {
      setIsClearingSample(false);
    }
  };

  const handleDeleteAllConfirm = async () => {
    setDeleteError(null);
    if (deleteConfirmText.trim().toUpperCase() !== 'DELETE') {
      setDeleteError(
        language === 'mr'
          ? 'कृपया खात्रीसाठी DELETE टाईप करा'
          : 'Please type the confirmation word "DELETE"'
      );
      return;
    }

    if (isPinConfigured) {
      const pinRes = await (async () => {
        const storedHash = await getSetting<string>('pinHash');
        const storedSalt = await getSetting<string>('pinSalt');
        if (!storedHash || !storedSalt) return true;
        const { verifyPin } = await import('../../lib/security/crypto.ts');
        return verifyPin(deletePinInput, storedHash, storedSalt);
      })();

      if (!pinRes) {
        setDeleteError(
          language === 'mr' ? 'चुकीचा अधिकारी पिन!' : 'Incorrect Officer PIN!'
        );
        return;
      }
    }

    setIsDeletingAll(true);
    try {
      await clearAllDeviceData();
      resetOnboarding();
      toastSuccess(
        language === 'mr'
          ? 'सर्व स्थानिक डेटा यशस्वीरित्या हटवला!'
          : 'All local data wiped. Reset to initial onboarding.'
      );
      setDeleteAllModal(false);
      navigate('/welcome', { replace: true });
    } catch (err: any) {
      setDeleteError(err?.message || 'Failed to wipe device data');
      setIsDeletingAll(false);
    }
  };

  // --- Assumptions State ---
  const [timeEstManualMins, setTimeEstManualMins] = useState<number>(45);
  const [timeEstAppMins, setTimeEstAppMins] = useState<number>(5);
  const [isSavingAssumptions, setIsSavingAssumptions] = useState(false);

  useEffect(() => {
    async function loadAssumptions() {
      const m = await getSetting<number>('timeEstManualMins', 45);
      const a = await getSetting<number>('timeEstAppMins', 5);
      setTimeEstManualMins(m);
      setTimeEstAppMins(a);
    }
    loadAssumptions();
  }, []);

  const handleSaveAssumptions = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAssumptions(true);
    try {
      await setSetting('timeEstManualMins', Number(timeEstManualMins));
      await setSetting('timeEstAppMins', Number(timeEstAppMins));
      await addAuditLog(
        'assumptions_updated',
        `Time saved assumptions set: manual=${timeEstManualMins}m, app=${timeEstAppMins}m`
      );
      toastSuccess(
        language === 'mr'
          ? 'वेळ बचत गृहीतके जतन केली! डॅशबोर्डवर त्वरित लागू झाली.'
          : 'Time saved assumptions updated and active on Dashboard!'
      );
    } catch (err: any) {
      toastError(err?.message || 'Failed to save assumptions');
    } finally {
      setIsSavingAssumptions(false);
    }
  };

  // Tab definitions
  const tabs = [
    {
      id: 'profile' as SettingsTab,
      label_en: 'Officer Profile',
      label_mr: 'अधिकारी प्रोफाइल',
      icon: <User className="w-4 h-4" />,
    },
    {
      id: 'display' as SettingsTab,
      label_en: 'Language & Display',
      label_mr: 'भाषा आणि प्रदर्शन',
      icon: <Type className="w-4 h-4" />,
    },
    {
      id: 'security' as SettingsTab,
      label_en: 'Security & PIN',
      label_mr: 'सुरक्षा आणि पिन',
      icon: <Lock className="w-4 h-4" />,
    },
    {
      id: 'backup' as SettingsTab,
      label_en: 'Backup & Restore',
      label_mr: 'बॅकअप आणि पूर्ववत',
      icon: <Database className="w-4 h-4" />,
    },
    {
      id: 'storage' as SettingsTab,
      label_en: 'Storage & Persistence',
      label_mr: 'स्टोरेज माहिती',
      icon: <HardDrive className="w-4 h-4" />,
    },
    {
      id: 'audit' as SettingsTab,
      label_en: 'Audit Log Viewer',
      label_mr: 'ऑडिट लॉग दर्शक',
      icon: <ClipboardList className="w-4 h-4" />,
    },
    {
      id: 'controls' as SettingsTab,
      label_en: 'Data Controls',
      label_mr: 'डेटा नियंत्रणे',
      icon: <AlertOctagon className="w-4 h-4" />,
    },
    {
      id: 'assumptions' as SettingsTab,
      label_en: 'Dashboard Assumptions',
      label_mr: 'डॅशबोर्ड गृहीतके',
      icon: <Clock className="w-4 h-4" />,
    },
    {
      id: 'privacy' as SettingsTab,
      label_en: 'Privacy & Legal',
      label_mr: 'गोपनीयता व कायदेशीर',
      icon: <ShieldCheck className="w-4 h-4" />,
    },
  ];

  return (
    <div className="flex-1 flex flex-col p-4 max-w-5xl mx-auto w-full gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-navy-700 pb-3">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-saffron">⚙</span>
            {language === 'mr' ? 'सेटिंग्ज आणि सुरक्षा व्यवस्थापन' : 'Settings & Security'}
          </h1>
          <p className="text-xs text-muted mt-0.5">
            {language === 'mr'
              ? 'स्थानिक डेटा, अधिकारी माहिती, वेब क्रिप्टो सुरक्षा आणि प्रदर्शन पर्याय'
              : 'Configure local storage, officer profile, Web Crypto security, and display options'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isPinConfigured && (
            <button
              type="button"
              onClick={lockNow}
              className="px-3 py-1.5 rounded-lg bg-navy-700 hover:bg-navy-600 border border-muted/20 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors shadow-sm"
              title="Lock application screen immediately"
            >
              <Lock className="w-3.5 h-3.5 text-saffron" />
              {language === 'mr' ? 'आत्ता लॉक करा' : 'Lock App Now'}
            </button>
          )}
          <button
            type="button"
            onClick={() => navigate('/about')}
            className="px-3 py-1.5 rounded-lg bg-navy-700/60 hover:bg-navy-600 border border-muted/20 text-xs font-semibold text-muted hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <Info className="w-3.5 h-3.5 text-saffron" />
            {language === 'mr' ? 'अॅपबद्दल' : 'About App'}
          </button>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="flex flex-col md:flex-row gap-4 items-start">
        {/* Navigation Sidebar */}
        <div className="w-full md:w-60 flex md:flex-col gap-1.5 overflow-x-auto pb-2 md:pb-0 shrink-0 border-b md:border-b-0 md:border-r border-navy-700 pr-0 md:pr-3">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap text-left ${
                  isActive
                    ? 'bg-saffron text-navy-900 font-bold shadow-sm'
                    : 'bg-navy-700/40 text-muted hover:text-white hover:bg-navy-700'
                }`}
              >
                <span className={isActive ? 'text-navy-900' : 'text-saffron'}>{tab.icon}</span>
                <span>{language === 'mr' ? tab.label_mr : tab.label_en}</span>
              </button>
            );
          })}
        </div>

        {/* Content Pane */}
        <div className="flex-1 w-full bg-navy-700/20 border border-navy-700 rounded-2xl p-4 sm:p-6 min-h-[460px]">
          {/* TAB 1: PROFILE */}
          {activeTab === 'profile' && (
            <div className="space-y-5">
              <div className="border-b border-navy-700 pb-3">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <User className="w-4 h-4 text-saffron" />
                  {language === 'mr' ? 'अधिकारी तपशील संपादन' : 'Officer Details'}
                </h2>
                <p className="text-xs text-muted mt-0.5">
                  {language === 'mr'
                    ? 'हे तपशील पंचनामे, जप्ती पावत्या आणि अहवालांमध्ये आपोआप मुद्रित केले जातात.'
                    : 'Used automatically on Panchnamas, Seizure certificates, and PDF notices.'}
                </p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted mb-1">
                      {language === 'mr' ? 'अधिकार्याचे नाव *' : 'Officer Full Name *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={profileForm.fullName}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, fullName: e.target.value })
                      }
                      className="w-full bg-navy-900 border border-muted/30 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-saffron"
                      placeholder="e.g. Ramesh S. Patil"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted mb-1">
                      {language === 'mr' ? 'पद / हुद्दा *' : 'Rank / Designation *'}
                    </label>
                    <select
                      value={profileForm.rank}
                      onChange={(e) => setProfileForm({ ...profileForm, rank: e.target.value })}
                      className="w-full bg-navy-900 border border-muted/30 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-saffron"
                    >
                      <option value="PC">Police Constable (PC)</option>
                      <option value="HC">Head Constable (HC)</option>
                      <option value="ASI">Assistant Sub-Inspector (ASI)</option>
                      <option value="PSI">Police Sub-Inspector (PSI)</option>
                      <option value="API">Assistant Police Inspector (API)</option>
                      <option value="PI">Police Inspector (PI)</option>
                      <option value="ACP">Assistant Commissioner of Police (ACP / DySP)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted mb-1">
                      {language === 'mr' ? 'पोलीस ठाणे *' : 'Police Station Name *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={profileForm.stationName}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, stationName: e.target.value })
                      }
                      className="w-full bg-navy-900 border border-muted/30 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-saffron"
                      placeholder="e.g. Shivaji Nagar Police Station"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted mb-1">
                      {language === 'mr' ? 'जिल्हा / आयुक्तालय' : 'District / Commissionerate'}
                    </label>
                    <input
                      type="text"
                      value={profileForm.district}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, district: e.target.value })
                      }
                      className="w-full bg-navy-900 border border-muted/30 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-saffron"
                      placeholder="e.g. Pune City / Thane"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted mb-1">
                      {language === 'mr' ? 'बकल नंबर (Badge No.)' : 'Badge / Buckle Number'}
                    </label>
                    <input
                      type="text"
                      value={profileForm.badgeNumber}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, badgeNumber: e.target.value })
                      }
                      className="w-full bg-navy-900 border border-muted/30 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-saffron"
                      placeholder="e.g. MH-PN-4029"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted mb-1">
                      {language === 'mr' ? 'अधिकृत संपर्क क्रमांक' : 'Official Contact Mobile'}
                    </label>
                    <input
                      type="tel"
                      value={profileForm.mobile}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, mobile: e.target.value })
                      }
                      className="w-full bg-navy-900 border border-muted/30 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-saffron"
                      placeholder="e.g. 9822001122"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="px-5 py-2.5 rounded-xl bg-saffron hover:bg-saffron-600 font-bold text-navy-900 text-xs shadow-md transition-all active:scale-98 disabled:opacity-50"
                  >
                    {isSavingProfile
                      ? (language === 'mr' ? 'जतन करत आहे...' : 'Saving...')
                      : (language === 'mr' ? 'बदल जतन करा' : 'Save Officer Profile')}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: LANGUAGE & DISPLAY */}
          {activeTab === 'display' && (
            <div className="space-y-6">
              <div className="border-b border-navy-700 pb-3">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Type className="w-4 h-4 text-saffron" />
                  {language === 'mr' ? 'भाषा आणि प्रदर्शन पर्याय' : 'Language & Display'}
                </h2>
                <p className="text-xs text-muted mt-0.5">
                  {language === 'mr'
                    ? 'वाचनीयता, फॉन्ट आकार, उच्च कॉन्ट्रास्ट आणि अंक स्वरूप समायोजित करा.'
                    : 'Adjust language, root font scale, high contrast mode, and Devanagari numerals.'}
                </p>
              </div>

              {/* 1. Language Toggle */}
              <div className="p-4 rounded-xl bg-navy-900/60 border border-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    {language === 'mr' ? 'अॅप भाषा (Application Language)' : 'Application Language'}
                  </h3>
                  <p className="text-xs text-muted mt-0.5">
                    {language === 'mr'
                      ? 'मराठी व इंग्रजी यांमध्ये त्वरित स्विच करा.'
                      : 'Toggle between Marathi and English across all forms and legal guides.'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setLanguage('mr')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      language === 'mr'
                        ? 'bg-saffron text-navy-900 shadow-sm'
                        : 'bg-navy-700 text-muted hover:text-white'
                    }`}
                  >
                    मराठी
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage('en')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      language === 'en'
                        ? 'bg-saffron text-navy-900 shadow-sm'
                        : 'bg-navy-700 text-muted hover:text-white'
                    }`}
                  >
                    English
                  </button>
                </div>
              </div>

              {/* 2. Font Size Scale */}
              <div className="p-4 rounded-xl bg-navy-900/60 border border-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    {language === 'mr' ? 'फॉन्ट आकार (Font Scale)' : 'Font Size Scale'}
                  </h3>
                  <p className="text-xs text-muted mt-0.5">
                    {language === 'mr'
                      ? 'रूट फॉन्ट स्केल द्वारे सर्व मजकूराचा आकार लहान, मध्यम किंवा मोठा करा.'
                      : 'Adjust the root font scale across the entire interface.'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {(['small', 'medium', 'large'] as FontSizeScale[]).map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setFontSize(size)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                        fontSize === size
                          ? 'bg-saffron text-navy-900 font-bold shadow-sm'
                          : 'bg-navy-700 text-muted hover:text-white'
                      }`}
                    >
                      {size === 'small'
                        ? (language === 'mr' ? 'लहान (14px)' : 'Small (14px)')
                        : size === 'large'
                        ? (language === 'mr' ? 'मोठा (18px)' : 'Large (18px)')
                        : (language === 'mr' ? 'मध्यम (16px)' : 'Medium (16px)')}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. High Contrast Mode */}
              <div className="p-4 rounded-xl bg-navy-900/60 border border-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    {language === 'mr' ? 'उच्च कॉन्ट्रास्ट मोड (High Contrast)' : 'High Contrast Mode'}
                  </h3>
                  <p className="text-xs text-muted mt-0.5">
                    {language === 'mr'
                      ? 'कडक सूर्यप्रकाशात किंवा बाह्य अन्वेषणादरम्यान वाचनीयतेसाठी पांढरा मजकूर व ठळक बॉर्डर्स.'
                      : 'White text and strong solid borders for maximum readability outdoors and in sunlight.'}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={highContrast}
                    onChange={(e) => setHighContrast(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-navy-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-saffron"></div>
                </label>
              </div>

              {/* 4. Devanagari Digits */}
              <div className="p-4 rounded-xl bg-navy-900/60 border border-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    {language === 'mr'
                      ? 'देवनागरी अंक (Devanagari Digits ०-९)'
                      : 'Devanagari Numerals (०-९)'}
                  </h3>
                  <p className="text-xs text-muted mt-0.5">
                    {language === 'mr'
                      ? 'मराठी मोडमध्ये संख्या देवनागरी अंकात दाखवा (कायदेशीर कलमे जसे BNS 303 इंग्रजी अंकात राहतील).'
                      : 'Display general counts in Devanagari numerals. Legal sections (e.g. BNS 303) always remain Latin.'}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={devanagariDigits}
                    onChange={(e) => setDevanagariDigits(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-navy-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-saffron"></div>
                </label>
              </div>
            </div>
          )}

          {/* TAB 3: SECURITY & PIN */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="border-b border-navy-700 pb-3">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Lock className="w-4 h-4 text-saffron" />
                  {language === 'mr' ? 'सुरक्षा आणि ४-६ अंकी पिन' : 'Security & PIN Protection'}
                </h2>
                <p className="text-xs text-muted mt-0.5">
                  {language === 'mr'
                    ? 'स्थानिक PBKDF2 हॅश सह अनपेक्षित प्रवेश रोखा. ५ चुकीच्या प्रयत्नांनंतर ३० सेकंद लॉक होतो.'
                    : 'Prevent casual access using salted PBKDF2 Web Crypto hash. 30s throttle after 5 wrong attempts.'}
                </p>
              </div>

              {/* Status Box */}
              <div className="p-4 rounded-xl bg-navy-900/60 border border-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isPinConfigured
                        ? 'bg-india-green/20 text-india-green border border-india-green/40'
                        : 'bg-muted/10 text-muted border border-muted/20'
                    }`}
                  >
                    {isPinConfigured ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Key className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {isPinConfigured
                        ? language === 'mr'
                          ? 'अधिकारी सुरक्षा पिन सक्रिय आहे'
                          : 'Officer Security PIN Active'
                        : language === 'mr'
                        ? 'कोणताही पिन सेट केलेला नाही'
                        : 'No Security PIN Configured'}
                    </h3>
                    <p className="text-xs text-muted">
                      {isPinConfigured
                        ? language === 'mr'
                          ? 'अॅप उघडताना व बॅकग्राउंडमधून परतताना स्क्रीन लॉक केली जाते.'
                          : 'Locked on start, after inactivity, and when returning from background.'
                        : language === 'mr'
                        ? 'टर्मिनल सुरक्षित करण्यासाठी ४ ते ६ अंकी पिन सेट करा.'
                        : 'Set a 4 to 6 digit numeric PIN to guard against unauthorized access.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isPinConfigured ? (
                    <>
                      <button
                        type="button"
                        onClick={() => openPinModal('change')}
                        className="px-3 py-1.5 rounded-lg bg-navy-700 hover:bg-navy-600 text-xs font-semibold text-white transition-colors"
                      >
                        {language === 'mr' ? 'पिन बदला' : 'Change PIN'}
                      </button>
                      <button
                        type="button"
                        onClick={() => openPinModal('remove')}
                        className="px-3 py-1.5 rounded-lg bg-danger/20 hover:bg-danger/30 text-danger border border-danger/30 text-xs font-semibold transition-colors"
                      >
                        {language === 'mr' ? 'पिन काढा' : 'Remove PIN'}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openPinModal('set')}
                      className="px-4 py-2 rounded-xl bg-saffron hover:bg-saffron-600 text-navy-900 text-xs font-bold shadow-md transition-all active:scale-98"
                    >
                      {language === 'mr' ? 'पिन सेट करा' : 'Set Security PIN'}
                    </button>
                  )}
                </div>
              </div>

              {/* Auto-lock Settings */}
              {isPinConfigured && (
                <div className="p-4 rounded-xl bg-navy-900/60 border border-muted/20 space-y-3">
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      {language === 'mr' ? 'ऑटो-लॉक कालावधी' : 'Auto-Lock Inactivity Timeout'}
                    </h3>
                    <p className="text-xs text-muted mt-0.5">
                      {language === 'mr'
                        ? 'कोणतीही हालचाल न झाल्यास निवडलेल्या वेळेनंतर स्क्रीन लॉक होते.'
                        : 'Automatically locks the app when idle for the selected duration.'}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {[
                      { val: 1 as AutoLockOption, label_en: '1 Minute', label_mr: '१ मिनिट' },
                      { val: 5 as AutoLockOption, label_en: '5 Minutes', label_mr: '५ मिनिटे' },
                      { val: 15 as AutoLockOption, label_en: '15 Minutes', label_mr: '१५ मिनिटे' },
                      { val: 0 as AutoLockOption, label_en: 'Never', label_mr: 'कधीही नाही (Never)' },
                    ].map((opt) => (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => setAutoLockMinutes(opt.val)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          autoLockMinutes === opt.val
                            ? 'bg-saffron text-navy-900 font-bold shadow-sm'
                            : 'bg-navy-700 text-muted hover:text-white'
                        }`}
                      >
                        {language === 'mr' ? opt.label_mr : opt.label_en}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Security Plain Words Explanation */}
              <div className="p-4 rounded-xl bg-navy-900/40 border border-saffron/30 flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-saffron shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    {language === 'mr' ? 'महत्त्वाचे सुरक्षा स्पष्टीकरण' : 'Important Security Notice'}
                  </h4>
                  <p className="text-xs text-muted leading-relaxed">
                    {language === 'mr'
                      ? 'हा पिन फोनमधील सहकाऱ्यांचा किंवा अनपेक्षित लोकांचा तात्पुरता प्रवेश रोखण्यासाठी आहे. वेब क्रिप्टो PBKDF2 सॉल्टेड हॅश मुळे पिन कुठेही साध्या अक्षरात सेव्ह केला जात नाही. परंतु हा पिन फोनच्या अंतर्गत स्टोरेजवरील संपूर्ण फाइल प्रणाली कूटबद्ध (encrypt) करत नाही.'
                      : 'The PIN stops casual access by bystanders or colleagues, but does not encrypt the raw data files on the phone. Only a salted PBKDF2 hash is stored in IndexedDB (never the PIN itself).'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BACKUP & RESTORE */}
          {activeTab === 'backup' && (
            <div className="space-y-6">
              <div className="border-b border-navy-700 pb-3">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-saffron" />
                  {language === 'mr' ? 'डेटा बॅकअप आणि पूर्ववत' : 'Backup & Restore'}
                </h2>
                <p className="text-xs text-muted mt-0.5">
                  {language === 'mr'
                    ? 'सर्व ११ डेटा स्टोअर्स एका JSON फाइलमध्ये निर्यात करा. AES-GCM एनक्रिप्शन पर्याय उपलब्ध.'
                    : 'Export all 11 database stores to JSON. Optional AES-GCM passphrase encryption.'}
                </p>
              </div>

              {/* Export Card */}
              <div className="p-4 rounded-xl bg-navy-900/60 border border-muted/20 space-y-4">
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-saffron" />
                  <h3 className="text-sm font-bold text-white">
                    {language === 'mr' ? 'बॅकअप निर्यात करा (Export Backup)' : 'Export Backup JSON'}
                  </h3>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center gap-2.5 text-xs text-white cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={includeMediaBlobs}
                      onChange={(e) => setIncludeMediaBlobs(e.target.checked)}
                      className="rounded border-muted/40 text-saffron focus:ring-0"
                    />
                    <span>
                      {language === 'mr'
                        ? 'पुरावा फाइल्स / छायाचित्रे समाविष्ट करा'
                        : 'Include evidence files and media blobs'}
                    </span>
                  </label>

                  {includeMediaBlobs && (
                    <div className="text-[11px] text-amber-300/90 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                      <span>
                        {language === 'mr'
                          ? 'सूचना: पुरावा मीडिया समाविष्ट केल्यास बॅकअप फाइलचा आकार खूप मोठा होऊ शकतो.'
                          : 'Warning: Including media blobs will significantly increase backup file size.'}
                      </span>
                    </div>
                  )}

                  <label className="flex items-center gap-2.5 text-xs text-white cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={useBackupPassphrase}
                      onChange={(e) => setUseBackupPassphrase(e.target.checked)}
                      className="rounded border-muted/40 text-saffron focus:ring-0"
                    />
                    <span>
                      {language === 'mr'
                        ? 'पासफ्रेजसह सुरक्षित करा (AES-GCM Web Crypto)'
                        : 'Protect backup with a passphrase (AES-GCM 256-bit encryption)'}
                    </span>
                  </label>

                  {useBackupPassphrase && (
                    <div className="max-w-sm pt-1">
                      <input
                        type="password"
                        value={backupPassphrase}
                        onChange={(e) => setBackupPassphrase(e.target.value)}
                        placeholder={
                          language === 'mr'
                            ? 'मजबूत पासफ्रेज प्रविष्ट करा (किमान ४ अक्षरे)'
                            : 'Enter backup encryption passphrase'
                        }
                        className="w-full bg-navy-900 border border-muted/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-saffron"
                      />
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  disabled={isExportingBackup}
                  onClick={handleExportBackup}
                  className="px-4 py-2 rounded-xl bg-saffron hover:bg-saffron-600 text-navy-900 text-xs font-bold flex items-center gap-2 shadow-md transition-all active:scale-98 disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  {isExportingBackup
                    ? (language === 'mr' ? 'तयार करत आहे...' : 'Generating...')
                    : (language === 'mr' ? 'बॅकअप डाऊनलोड करा' : 'Download Backup File')}
                </button>
              </div>

              {/* Import Card */}
              <div className="p-4 rounded-xl bg-navy-900/60 border border-muted/20 space-y-4">
                <div className="flex items-center gap-2">
                  <Upload className="w-4 h-4 text-saffron" />
                  <h3 className="text-sm font-bold text-white">
                    {language === 'mr' ? 'बॅकअप पूर्ववत करा (Import Backup)' : 'Restore from Backup'}
                  </h3>
                </div>
                <p className="text-xs text-muted">
                  {language === 'mr'
                    ? 'स्थानिक JSON फाइल निवडा. फाइलचे प्रमाणीकरण करून सारांश दाखवला जाईल.'
                    : 'Select a previously exported NyaySaathi JSON file to restore case and evidence data.'}
                </p>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json,application/json"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-navy-700 hover:bg-navy-600 border border-muted/30 text-white text-xs font-bold flex items-center gap-2 transition-all active:scale-98"
                >
                  <Upload className="w-4 h-4 text-saffron" />
                  {language === 'mr' ? 'बॅकअप फाइल निवडा' : 'Choose Backup JSON File'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: STORAGE & PERSISTENCE */}
          {activeTab === 'storage' && (
            <div className="space-y-6">
              <div className="border-b border-navy-700 pb-3">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-saffron" />
                  {language === 'mr' ? 'स्टोरेज वापर आणि पर्सिस्टन्स' : 'Storage Usage & Quota'}
                </h2>
                <p className="text-xs text-muted mt-0.5">
                  {language === 'mr'
                    ? 'स्थानिक IndexedDB द्वारे वापरलेली जागा आणि पर्सिस्टंट स्टोरेज परवानग्या.'
                    : 'Local browser storage quota and persistent retention status.'}
                </p>
              </div>

              {/* Storage Stats Box */}
              <div className="p-4 rounded-xl bg-navy-900/60 border border-muted/20 space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-white">
                    {language === 'mr' ? 'वापरलेले स्टोरेज' : 'Current Storage Usage'}
                  </span>
                  <span className="text-saffron font-bold">
                    {(storageEstimate.usageBytes / (1024 * 1024)).toFixed(2)} MB /{' '}
                    {(storageEstimate.quotaBytes / (1024 * 1024 * 1024)).toFixed(2)} GB (
                    {storageEstimate.percentageUsed}%)
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-navy-700 h-3 rounded-full overflow-hidden">
                  <div
                    className="bg-saffron h-full transition-all duration-300"
                    style={{ width: `${Math.max(2, storageEstimate.percentageUsed)}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 rounded-lg bg-navy-700/40 border border-muted/10">
                    <div className="text-[11px] text-muted">{language === 'mr' ? 'वापर' : 'Used'}</div>
                    <div className="text-sm font-bold text-white mt-0.5">
                      {(storageEstimate.usageBytes / (1024 * 1024)).toFixed(2)} MB
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-navy-700/40 border border-muted/10">
                    <div className="text-[11px] text-muted">{language === 'mr' ? 'एकूण कोटा' : 'Total Quota'}</div>
                    <div className="text-sm font-bold text-white mt-0.5">
                      {(storageEstimate.quotaBytes / (1024 * 1024 * 1024)).toFixed(2)} GB
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-navy-700/40 border border-muted/10 col-span-2 sm:col-span-1">
                    <div className="text-[11px] text-muted">{language === 'mr' ? 'स्थिती' : 'Status'}</div>
                    <div className="text-sm font-bold text-india-green mt-0.5 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      {language === 'mr' ? '100% ऑफलाइन' : '100% Offline'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Persistent Storage Request */}
              <div className="p-4 rounded-xl bg-navy-900/60 border border-muted/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      {language === 'mr' ? 'पर्सिस्टंट स्टोरेज (Persistent Storage)' : 'Persistent Storage'}
                    </h3>
                    <p className="text-xs text-muted mt-0.5">
                      {isPersisted
                        ? language === 'mr'
                          ? 'सक्रिय: डिव्हाइसवर जागा कमी असली तरी ब्राउझर डेटा हटवणार नाही.'
                          : 'Active: Browser is instructed not to clear NyaySaathi data during low storage.'
                        : language === 'mr'
                        ? 'डिव्हाइस क्लीनर किंवा कॅशे क्लिनअप द्वारे डेटा जाण्यापासून वाचवण्यासाठी परवानगी घ्या.'
                        : 'Request the browser never evict police records during disk cleanups.'}
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      isPersisted
                        ? 'bg-india-green/20 text-india-green border border-india-green/40'
                        : 'bg-muted/20 text-muted'
                    }`}
                  >
                    {isPersisted
                      ? (language === 'mr' ? 'मंजूर (Granted)' : 'Granted')
                      : (language === 'mr' ? 'मानक (Standard)' : 'Standard')}
                  </span>
                </div>

                {!isPersisted && (
                  <button
                    type="button"
                    disabled={isRequestingPersist}
                    onClick={handleRequestPersist}
                    className="px-4 py-2 rounded-xl bg-saffron hover:bg-saffron-600 text-navy-900 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-98 disabled:opacity-50"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    {isRequestingPersist
                      ? (language === 'mr' ? 'विनंती करत आहे...' : 'Requesting...')
                      : (language === 'mr' ? 'पर्सिस्टंट स्टोरेज विनंती करा' : 'Request Persistent Storage')}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: AUDIT LOG VIEWER */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="border-b border-navy-700 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-saffron" />
                    {language === 'mr' ? 'ऑडिट लॉग दर्शक' : 'Audit Log Viewer'}
                  </h2>
                  <p className="text-xs text-muted mt-0.5">
                    {language === 'mr'
                      ? 'अन्वेषण कृती, पुराव्याची साखळी आणि सुरक्षा घटनांची केवळ-वाचनीय नोंद.'
                      : 'Read-only chronological trail of procedural, evidence, and security events.'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={loadAuditData}
                    className="p-2 rounded-lg bg-navy-700 hover:bg-navy-600 text-muted hover:text-white transition-colors"
                    title="Refresh Logs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAudit ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    type="button"
                    onClick={handleExportAuditLogs}
                    className="px-3 py-1.5 rounded-lg bg-navy-700 hover:bg-navy-600 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-saffron" />
                    {language === 'mr' ? 'लॉग निर्यात करा' : 'Export JSON'}
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-muted absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={auditSearchQuery}
                    onChange={(e) => setAuditSearchQuery(e.target.value)}
                    placeholder={
                      language === 'mr' ? 'कृती किंवा तपशील शोधा...' : 'Search action or detail...'
                    }
                    className="w-full bg-navy-900 border border-muted/20 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-saffron"
                  />
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Filter className="w-3.5 h-3.5 text-muted" />
                  <select
                    value={auditFilterType}
                    onChange={(e) => setAuditFilterType(e.target.value)}
                    className="bg-navy-900 border border-muted/20 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-saffron"
                  >
                    <option value="all">{language === 'mr' ? 'सर्व कृती' : 'All Actions'}</option>
                    <option value="case">{language === 'mr' ? 'प्रकरणे (Cases)' : 'Cases'}</option>
                    <option value="evidence">{language === 'mr' ? 'पुरावे (Evidence)' : 'Evidence'}</option>
                    <option value="auth">{language === 'mr' ? 'सुरक्षा/पिन (Auth)' : 'Security & Auth'}</option>
                    <option value="backup">{language === 'mr' ? 'बॅकअप (Backup)' : 'Backup'}</option>
                    <option value="profile">{language === 'mr' ? 'प्रोफाइल (Profile)' : 'Profile'}</option>
                  </select>
                </div>
              </div>

              {/* Logs Table / List */}
              <div className="bg-navy-900/60 border border-muted/20 rounded-xl overflow-hidden max-h-[380px] overflow-y-auto">
                {filteredAuditLogs.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted">
                    {language === 'mr'
                      ? 'कोणतीही ऑडिट नोंद सापडली नाही'
                      : 'No audit log entries found matching criteria'}
                  </div>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-navy-700/60 text-muted sticky top-0 border-b border-muted/20">
                      <tr>
                        <th className="p-2.5 font-semibold">{language === 'mr' ? 'वेळ' : 'Timestamp'}</th>
                        <th className="p-2.5 font-semibold">{language === 'mr' ? 'कृती' : 'Action'}</th>
                        <th className="p-2.5 font-semibold">{language === 'mr' ? 'तपशील' : 'Detail'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-muted/10">
                      {filteredAuditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-navy-700/20">
                          <td className="p-2.5 whitespace-nowrap text-muted text-[11px]">
                            {formatDateTime(log.timestamp)}
                          </td>
                          <td className="p-2.5 whitespace-nowrap font-mono text-[11px] text-saffron">
                            {log.action}
                          </td>
                          <td className="p-2.5 text-white/90 text-xs">{log.detail}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* TAB 7: DATA CONTROLS */}
          {activeTab === 'controls' && (
            <div className="space-y-6">
              <div className="border-b border-navy-700 pb-3">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 text-danger" />
                  {language === 'mr' ? 'डेटा नियंत्रण आणि स्वच्छता' : 'Data Controls'}
                </h2>
                <p className="text-xs text-muted mt-0.5">
                  {language === 'mr'
                    ? 'नमुना डेटा काढणे किंवा डिव्हाइसवरील सर्व माहिती सुरक्षितपणे पुसणे.'
                    : 'Clear demonstration sample records or securely wipe all local database stores.'}
                </p>
              </div>

              {/* 1. Start Guided 2-Minute Demo */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-navy-900 to-navy-800 border-2 border-saffron/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-saffron/20 border border-saffron/40 flex items-center justify-center text-saffron shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {language === 'mr' ? '२-मिनिटांचे प्रात्यक्षिक (Pitch Demo)' : 'Start 2-Minute Guided Demo'}
                    </h3>
                    <p className="text-xs text-muted mt-0.5">
                      {language === 'mr'
                        ? 'मार्गदर्शक, चेकलिस्ट, पुरावा हॅश, छेडछाड चाचणी व डॅशबोर्डचे परस्परसंवादी प्रात्यक्षिक सुरू करा.'
                        : 'Launch the coach-mark tour walking through offences, checklists, SHA-256 tamper demo & dashboard.'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={startDemo}
                  className="px-4 py-2 rounded-xl bg-saffron text-navy-900 text-xs font-bold hover:bg-amber-400 transition-all flex items-center gap-1.5 shrink-0 shadow-md cursor-pointer active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5 text-navy-950" />
                  <span>{language === 'mr' ? 'प्रात्यक्षिक सुरू करा' : 'Start Demo'}</span>
                </button>
              </div>

              {/* 2. Load Sample Data */}
              <div className="p-4 rounded-xl bg-navy-900/60 border border-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    {language === 'mr' ? 'नमुना ठाणे डेटा लोड करा' : 'Load Demo Police Caseload'}
                  </h3>
                  <p className="text-xs text-muted mt-0.5">
                    {language === 'mr'
                      ? '३ वास्तववादी काल्पनिक प्रकरणे (चोरी, सायबर फसवणूक, दरोडा), पुरावे आणि मुदती लोड करा.'
                      : 'Seeds 3 fictional cases (Theft, Cyber, Robbery) with chain of custody, Sec 63 BSA cert & deadlines.'}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isSeedingSample}
                  onClick={handleLoadSampleSettings}
                  className="px-3.5 py-2 rounded-xl bg-navy-700 hover:bg-navy-600 border border-muted/30 text-xs font-semibold text-white transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSeedingSample ? 'animate-spin' : ''}`} />
                  <span>{language === 'mr' ? 'नमुना डेटा जोडा' : 'Load Sample Data'}</span>
                </button>
              </div>

              {/* 3. Clear Sample Data Only */}
              <div className="p-4 rounded-xl bg-navy-900/60 border border-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    {language === 'mr' ? 'फक्त नमुना डेटा हटवा' : 'Clear Sample Data Only'}
                  </h3>
                  <p className="text-xs text-muted mt-0.5">
                    {language === 'mr'
                      ? 'डेमो आणि चाचणीसाठी लोड केलेला नमुना डेटा काढून टाका. तुमचे स्वतःचे प्रकरणे सुरक्षित राहतील.'
                      : 'Deletes only seeded demonstration cases and evidence. Your real cases remain intact.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setClearSampleModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-navy-700 hover:bg-navy-600 border border-muted/30 text-xs font-semibold text-white transition-colors shrink-0"
                >
                  {language === 'mr' ? 'नमुना डेटा काढा' : 'Clear Sample Data'}
                </button>
              </div>

              {/* Danger Zone: Delete All Data */}
              <div className="p-4 rounded-xl bg-danger/10 border border-danger/40 space-y-3">
                <div className="flex items-center gap-2 text-danger">
                  <Trash2 className="w-4 h-4" />
                  <h3 className="text-sm font-bold">
                    {language === 'mr'
                      ? 'धोकादायक क्षेत्र: डिव्हाइसवरील सर्व डेटा हटवा'
                      : 'Danger Zone: Delete All Data on This Device'}
                  </h3>
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  {language === 'mr'
                    ? 'हे या डिव्हाइसवरील सर्व प्रकरणे, डिजिटल पंचनामे, पुरावे आणि सेटिंग्ज कायमचे हटवेल. यासाठी अधिकारी पिन आणि पुष्टीकरण आवश्यक आहे. त्यानंतर अॅप मूळ ऑनबोर्डिंग स्क्रीनवर परत जाईल.'
                    : 'Permanently wipes all IndexedDB records, custody chains, and local files on this browser. Requires your PIN and typed confirmation word. Resets to onboarding.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setDeleteAllModal(true);
                    setDeletePinInput('');
                    setDeleteConfirmText('');
                    setDeleteError(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-danger hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-98"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {language === 'mr' ? 'सर्व डेटा कायमचा हटवा' : 'Delete All Data on This Device'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 8: ASSUMPTIONS (FOR DASHBOARD) */}
          {activeTab === 'assumptions' && (
            <div className="space-y-5">
              <div className="border-b border-navy-700 pb-3">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-saffron" />
                  {language === 'mr' ? 'डॅशबोर्ड वेळ बचत गृहीतके' : 'Compliance Dashboard Assumptions'}
                </h2>
                <p className="text-xs text-muted mt-0.5">
                  {language === 'mr'
                    ? 'सुपरवायझर डॅशबोर्डवरील "बचत झालेला वेळ" (Time Saved) अंदाजासाठी गृहीतके.'
                    : 'Configures time estimates used by the supervisor compliance dashboard at /dashboard.'}
                </p>
              </div>

              <form onSubmit={handleSaveAssumptions} className="space-y-4 max-w-lg">
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">
                    {language === 'mr'
                      ? 'हाताने प्रमाणपत्र/पंचनामा करण्यासाठी लागणारा वेळ (मिनिटे)'
                      : 'Minutes per evidence certificate / memo by hand'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={180}
                    required
                    value={timeEstManualMins}
                    onChange={(e) => setTimeEstManualMins(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-navy-900 border border-muted/30 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-saffron"
                  />
                  <p className="text-[11px] text-muted/70 mt-1">
                    {language === 'mr'
                      ? 'पारंपारिक हस्तलिखित पद्धतीने ६५ब किंवा जप्ती पत्रक तयार करण्यास लागणारा सरासरी वेळ (डीफॉल्ट: ४५ मिनिटे).'
                      : 'Typical manual paper drafting time per electronic certificate or seizure memo (Default: 45 min).'}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">
                    {language === 'mr'
                      ? 'न्यायसाथी अॅप वापरून लागणारा वेळ (मिनिटे)'
                      : 'Minutes per certificate / memo with NyaySaathi app'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    required
                    value={timeEstAppMins}
                    onChange={(e) => setTimeEstAppMins(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-navy-900 border border-muted/30 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-saffron"
                  />
                  <p className="text-[11px] text-muted/70 mt-1">
                    {language === 'mr'
                      ? 'स्वयंचलित हॅश गणना आणि पूर्व-तयार टेम्प्लेट्स वापरून लागणारा वेळ (डीफॉल्ट: ५ मिनिटे).'
                      : 'Digital generation with automated SHA-256 calculation and formatted templates (Default: 5 min).'}
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSavingAssumptions}
                    className="px-5 py-2.5 rounded-xl bg-saffron hover:bg-saffron-600 font-bold text-navy-900 text-xs shadow-md transition-all active:scale-98 disabled:opacity-50"
                  >
                    {isSavingAssumptions
                      ? (language === 'mr' ? 'जतन करत आहे...' : 'Saving...')
                      : (language === 'mr' ? 'गृहीतके जतन करा' : 'Save Assumptions')}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 9: PRIVACY & LEGAL */}
          {activeTab === 'privacy' && (
            <div className="space-y-5">
              <div className="border-b border-navy-700 pb-3">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-saffron" />
                  {language === 'mr' ? 'गोपनीयता आणि कायदेशीर अस्वीकरण' : 'Privacy & Legal Disclaimer'}
                </h2>
                <p className="text-xs text-muted mt-0.5">
                  {language === 'mr'
                    ? 'स्थानिक डेटा धोरण, शून्य ट्रॅकिंग आणि कायदेशीर पुनरावलोकन स्थिती.'
                    : 'Plain language privacy statement, decision-support disclaimer, and BNS legal review status.'}
                </p>
              </div>

              {/* Privacy Statement */}
              <div className="p-4 rounded-xl bg-navy-900/60 border border-muted/20 space-y-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-india-green" />
                  {language === 'mr' ? 'स्थानिक गोपनीयता धोरण' : '100% On-Device Privacy Policy'}
                </h3>
                <p className="text-xs text-muted leading-relaxed">
                  {language === 'mr'
                    ? 'न्यायसाथी पूर्णपणे स्थानिक (offline-first) चालते. सर्व एफआयआर नोंदी, पुरावे, छायाचित्रे आणि पंचनामे फक्त तुमच्या डिव्हाइसच्या ब्राउझर IndexedDB मध्ये साठवले जातात. कोणतेही टेलिमेट्री, विश्लेषण (analytics), कुकीज किंवा बाह्य नेटवर्क कॉल्स केले जात नाहीत.'
                    : 'NyaySaathi is completely offline-first. All case records, evidence files, hashes, and custody logs remain strictly on this device in browser IndexedDB. Zero analytics, zero tracking cookies, and zero external server transmission.'}
                </p>
              </div>

              {/* Decision Support Disclaimer */}
              <div className="p-4 rounded-xl bg-navy-900/60 border border-muted/20 space-y-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-saffron" />
                  {language === 'mr' ? 'प्रशासकीय निर्णय-सहाय्य अस्वीकरण' : 'Decision-Support Tool Disclaimer'}
                </h3>
                <p className="text-xs text-muted leading-relaxed">
                  {language === 'mr'
                    ? 'हे अॅप महाराष्ट्र पोलीस अधिकाऱ्यांसाठी प्रक्रियात्मक आणि प्रशासकीय निर्णय-सहायक (Decision Support System) साधन आहे. हे कोणत्याही न्यायिक अधिकाराचा किंवा अधिकृत विधी सल्ल्याचा पर्याय नाही. अंतिम कायदेशीर निर्णय संबंधित तपास अधिकारी आणि न्यायालयाच्या अखत्यारीत राहील.'
                    : 'NyaySaathi is an administrative and procedural decision-support aid designed for Maharashtra Police officers. It does not replace judicial discretion or official legal advice. Investigating officers must verify all facts according to statutory codes and police standing orders.'}
                </p>
              </div>

              {/* Legal Review Status */}
              <div className="p-4 rounded-xl bg-navy-900/60 border border-muted/20 space-y-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-400" />
                  {language === 'mr' ? 'कायदेशीर पुनरावलोकन स्थिती' : 'Statutory Review Status'}
                </h3>
                <p className="text-xs text-muted leading-relaxed">
                  {language === 'mr'
                    ? 'या प्रोटोटाइपमध्ये संदर्भित भारतीय न्याय संहिता (BNS 2023), भारतीय नागरिक सुरक्षा संहिता (BNSS 2023) आणि भारतीय साक्ष अधिनियम (BSA 2023) च्या तरतुदी अधिसूचित राजपत्रावर आधारित आहेत. राज्य पोलीस महासंचालनालयाचे परिपत्रक व स्थायी आदेशांनुसार अद्यतने केली जातात.'
                    : 'Provisions for Bharatiya Nyaya Sanhita (BNS 2023), Bharatiya Nagarik Suraksha Sanhita (BNSS 2023), and Bharatiya Sakshya Adhiniyam (BSA 2023) included in this prototype reflect notified statutory texts and remain subject to evolving administrative standing orders.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- MODAL 1: PIN Set / Change / Remove --- */}
      {pinModalMode && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-navy-900 border border-navy-700 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-navy-700 pb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-saffron" />
                {pinModalMode === 'set' && (language === 'mr' ? 'नवीन पिन सेट करा' : 'Set New PIN')}
                {pinModalMode === 'change' && (language === 'mr' ? 'पिन बदला' : 'Change PIN')}
                {pinModalMode === 'remove' && (language === 'mr' ? 'पिन काढा' : 'Remove PIN')}
              </h3>
              <button
                type="button"
                onClick={() => setPinModalMode(null)}
                className="text-muted hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePinSubmit} className="space-y-3">
              {(pinModalMode === 'change' || pinModalMode === 'remove') && (
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">
                    {language === 'mr' ? 'सध्याचा पिन (Current PIN)' : 'Current PIN'}
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    required
                    value={pinOld}
                    onChange={(e) => setPinOld(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-navy-700 border border-muted/30 rounded-xl px-3 py-2 text-center text-sm font-mono tracking-widest text-white focus:outline-none focus:border-saffron"
                    placeholder="••••"
                  />
                </div>
              )}

              {(pinModalMode === 'set' || pinModalMode === 'change') && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-muted mb-1">
                      {language === 'mr'
                        ? 'नवीन ४ ते ६ अंकी पिन (New PIN)'
                        : 'New 4 to 6 Digit PIN'}
                    </label>
                    <input
                      type="password"
                      maxLength={6}
                      required
                      value={pinNew}
                      onChange={(e) => setPinNew(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-navy-700 border border-muted/30 rounded-xl px-3 py-2 text-center text-sm font-mono tracking-widest text-white focus:outline-none focus:border-saffron"
                      placeholder="••••"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted mb-1">
                      {language === 'mr' ? 'पिन पुष्टी करा (Confirm PIN)' : 'Confirm PIN'}
                    </label>
                    <input
                      type="password"
                      maxLength={6}
                      required
                      value={pinConfirm}
                      onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-navy-700 border border-muted/30 rounded-xl px-3 py-2 text-center text-sm font-mono tracking-widest text-white focus:outline-none focus:border-saffron"
                      placeholder="••••"
                    />
                  </div>
                </>
              )}

              {pinModalError && (
                <div className="p-2.5 rounded-lg bg-danger/20 border border-danger/40 text-danger text-xs text-center">
                  {pinModalError}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPinModalMode(null)}
                  className="flex-1 py-2 rounded-xl bg-navy-700 hover:bg-navy-600 text-xs font-semibold text-muted hover:text-white"
                >
                  {language === 'mr' ? 'रद्द करा' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isPinSubmitting}
                  className="flex-1 py-2 rounded-xl bg-saffron hover:bg-saffron-600 text-navy-900 text-xs font-bold shadow-md transition-all active:scale-98 disabled:opacity-50"
                >
                  {isPinSubmitting
                    ? (language === 'mr' ? 'प्रक्रिया...' : 'Processing...')
                    : (language === 'mr' ? 'लागू करा' : 'Submit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: Backup Passphrase Prompt for Encrypted Import --- */}
      {importPassphrasePrompt && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-navy-900 border border-navy-700 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-saffron" />
              {language === 'mr' ? 'एनक्रिप्टेड बॅकअप पासवर्ड' : 'Encrypted Backup Passphrase'}
            </h3>
            <p className="text-xs text-muted">
              {language === 'mr'
                ? 'हा बॅकअप पासफ्रेजने संरक्षित आहे. पूर्ववत करण्यासाठी पासफ्रेज प्रविष्ट करा.'
                : 'This backup is encrypted with AES-GCM. Please enter the decryption passphrase.'}
            </p>

            <input
              type="password"
              value={importPassphraseInput}
              onChange={(e) => setImportPassphraseInput(e.target.value)}
              placeholder="Passphrase"
              className="w-full bg-navy-700 border border-muted/30 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-saffron"
            />

            {importPassError && (
              <div className="p-2 rounded-lg bg-danger/20 border border-danger/40 text-danger text-xs">
                {importPassError}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setImportPassphrasePrompt(false)}
                className="flex-1 py-2 rounded-xl bg-navy-700 hover:bg-navy-600 text-xs font-semibold text-muted"
              >
                {language === 'mr' ? 'रद्द करा' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleDecryptImport}
                className="flex-1 py-2 rounded-xl bg-saffron hover:bg-saffron-600 text-navy-900 text-xs font-bold"
              >
                {language === 'mr' ? 'डिक्रिप्ट करा' : 'Decrypt'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 3: Backup Restore Summary & Confirmation --- */}
      {importSummaryModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-navy-900 border border-navy-700 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-navy-700 pb-2">
              <Database className="w-4 h-4 text-saffron" />
              {language === 'mr' ? 'बॅकअप फाइल सारांश' : 'Backup File Inspection'}
            </h3>

            <div className="bg-navy-700/40 border border-muted/20 rounded-xl p-3 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-muted">{language === 'mr' ? 'तयार दिनांक' : 'Created At'}:</span>
                <span className="text-white font-medium">
                  {formatDateTime(importSummaryModal.createdAt)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">{language === 'mr' ? 'एनक्रिप्शन' : 'Encrypted'}:</span>
                <span className="text-white font-medium">
                  {importSummaryModal.encrypted ? 'AES-GCM 256-bit' : 'Unencrypted'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">{language === 'mr' ? 'प्रकरणे (Cases)' : 'Cases'}:</span>
                <span className="text-saffron font-bold">{importSummaryModal.casesCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">{language === 'mr' ? 'पुरावे (Evidence)' : 'Evidence Items'}:</span>
                <span className="text-saffron font-bold">{importSummaryModal.evidenceCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">{language === 'mr' ? 'कागदपत्रे (Documents)' : 'Documents'}:</span>
                <span className="text-saffron font-bold">{importSummaryModal.documentsCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">{language === 'mr' ? 'चेकलिस्ट रन्स' : 'Checklist Runs'}:</span>
                <span className="text-saffron font-bold">{importSummaryModal.checklistRunsCount}</span>
              </div>
            </div>

            {/* Restore Mode Choice */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-white block">
                {language === 'mr' ? 'पुनर्संचयित पद्धत निवडा' : 'Select Restore Strategy'}:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRestoreMode('merge')}
                  className={`p-2.5 rounded-xl border text-xs text-left transition-all ${
                    restoreMode === 'merge'
                      ? 'border-saffron bg-saffron/15 text-white font-bold'
                      : 'border-muted/20 bg-navy-700/40 text-muted'
                  }`}
                >
                  <div className="font-bold text-saffron">
                    {language === 'mr' ? 'मर्ज करा (Merge)' : 'Merge Data'}
                  </div>
                  <div className="text-[10px] text-muted mt-0.5">
                    {language === 'mr' ? 'विद्यमान नोंदी ठेवते' : 'Keeps existing records'}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setRestoreMode('replace')}
                  className={`p-2.5 rounded-xl border text-xs text-left transition-all ${
                    restoreMode === 'replace'
                      ? 'border-danger bg-danger/15 text-white font-bold'
                      : 'border-muted/20 bg-navy-700/40 text-muted'
                  }`}
                >
                  <div className="font-bold text-danger">
                    {language === 'mr' ? 'बदला (Replace)' : 'Replace Data'}
                  </div>
                  <div className="text-[10px] text-muted mt-0.5">
                    {language === 'mr' ? 'सध्याचा डेटा पुसून टाकेल' : 'Overwrites current stores'}
                  </div>
                </button>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={isRestoring}
                onClick={() => setImportSummaryModal(null)}
                className="flex-1 py-2 rounded-xl bg-navy-700 hover:bg-navy-600 text-xs font-semibold text-muted"
              >
                {language === 'mr' ? 'रद्द करा' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={isRestoring}
                onClick={handleConfirmRestore}
                className="flex-1 py-2 rounded-xl bg-saffron hover:bg-saffron-600 text-navy-900 text-xs font-bold shadow-md transition-all active:scale-98 disabled:opacity-50"
              >
                {isRestoring
                  ? (language === 'mr' ? 'पूर्ववत करत आहे...' : 'Restoring...')
                  : (language === 'mr' ? 'आता लागू करा' : 'Confirm Restore')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 4: Clear Sample Data Confirmation --- */}
      {clearSampleModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-navy-900 border border-navy-700 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-saffron" />
              {language === 'mr' ? 'नमुना डेटा काढायचा का?' : 'Clear Sample Data?'}
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              {language === 'mr'
                ? 'हे फक्त चाचणीसाठी तयार केलेले नमुना खटले आणि बनावट पुरावे काढून टाकेल. तुमची खरी प्रकरणे आणि प्रोफाइल सुरक्षित राहील.'
                : 'This will delete all seeded sample cases and demo evidence. Your real cases and officer profile will not be touched.'}
            </p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={isClearingSample}
                onClick={() => setClearSampleModal(false)}
                className="flex-1 py-2 rounded-xl bg-navy-700 hover:bg-navy-600 text-xs font-semibold text-muted"
              >
                {language === 'mr' ? 'रद्द करा' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={isClearingSample}
                onClick={handleClearSampleConfirm}
                className="flex-1 py-2 rounded-xl bg-saffron hover:bg-saffron-600 text-navy-900 text-xs font-bold shadow-md transition-all active:scale-98 disabled:opacity-50"
              >
                {isClearingSample
                  ? (language === 'mr' ? 'काढत आहे...' : 'Clearing...')
                  : (language === 'mr' ? 'होय, नमुना डेटा काढा' : 'Confirm Clear')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 5: Delete All Data On Device Confirmation --- */}
      {deleteAllModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-navy-900 border-2 border-danger rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-danger flex items-center gap-2 border-b border-navy-700 pb-2">
              <AlertTriangle className="w-5 h-5 text-danger shrink-0" />
              {language === 'mr'
                ? 'अंतिम पुष्टी: सर्व डेटा नष्ट करा'
                : 'Confirm Total Device Wipe'}
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              {language === 'mr'
                ? 'हा पर्याय अपरिवर्तनीय आहे! सर्व प्रकरणे, डिजिटल पंचनामे आणि लॉग नष्ट केले जातील.'
                : 'This action is irreversible. All IndexedDB stores will be permanently wiped.'}
            </p>

            <div className="space-y-3">
              {isPinConfigured && (
                <div>
                  <label className="block text-xs font-semibold text-white mb-1">
                    {language === 'mr'
                      ? 'अधिकारी सुरक्षा पिन प्रविष्ट करा *'
                      : 'Enter Officer Security PIN *'}
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    value={deletePinInput}
                    onChange={(e) => setDeletePinInput(e.target.value)}
                    placeholder="PIN"
                    className="w-full bg-navy-700 border border-muted/30 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-danger"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-white mb-1">
                  {language === 'mr'
                    ? 'पुष्टीकरणासाठी DELETE असे टाईप करा *'
                    : 'Type "DELETE" to confirm *'}
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full bg-navy-700 border border-muted/30 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-danger"
                />
              </div>

              {deleteError && (
                <div className="p-2 rounded-lg bg-danger/20 border border-danger/40 text-danger text-xs text-center">
                  {deleteError}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={isDeletingAll}
                onClick={() => setDeleteAllModal(false)}
                className="flex-1 py-2 rounded-xl bg-navy-700 hover:bg-navy-600 text-xs font-semibold text-muted"
              >
                {language === 'mr' ? 'रद्द करा' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={isDeletingAll}
                onClick={handleDeleteAllConfirm}
                className="flex-1 py-2 rounded-xl bg-danger hover:bg-red-700 text-white text-xs font-bold shadow-md transition-all active:scale-98 disabled:opacity-50"
              >
                {isDeletingAll
                  ? (language === 'mr' ? 'हटवत आहे...' : 'Wiping...')
                  : (language === 'mr' ? 'सर्व डेटा हटवा' : 'Wipe All Data')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
