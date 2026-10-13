import React, { useState, useEffect, useCallback } from 'react';
import { Lock, Shield, Delete, AlertCircle, Clock } from 'lucide-react';
import { useSecurity } from '../../context/SecurityContext.tsx';
import { useApp } from '../../context/AppContext.tsx';

export const LockScreen: React.FC = () => {
  const {
    isLocked,
    isPinConfigured,
    unlockWithPin,
    isLockoutActive,
    lockoutRemainingSeconds,
  } = useSecurity();
  const { language, profile } = useApp();

  const [enteredPin, setEnteredPin] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  // Clear entered PIN when locked status changes
  useEffect(() => {
    if (isLocked) {
      setEnteredPin('');
      setErrorMessage(null);
    }
  }, [isLocked]);

  const handleKeyPress = useCallback((digit: string) => {
    if (isLockoutActive || isVerifying) return;
    setErrorMessage(null);
    setEnteredPin((prev) => {
      if (prev.length < 6) return prev + digit;
      return prev;
    });
  }, [isLockoutActive, isVerifying]);

  const handleDelete = useCallback(() => {
    if (isLockoutActive || isVerifying) return;
    setErrorMessage(null);
    setEnteredPin((prev) => prev.slice(0, -1));
  }, [isLockoutActive, isVerifying]);

  const handleClear = useCallback(() => {
    if (isLockoutActive || isVerifying) return;
    setErrorMessage(null);
    setEnteredPin('');
  }, [isLockoutActive, isVerifying]);

  const handleVerify = useCallback(async (pinToVerify: string) => {
    if (pinToVerify.length < 4 || isLockoutActive || isVerifying) return;
    setIsVerifying(true);
    setErrorMessage(null);

    const res = await unlockWithPin(pinToVerify);
    setIsVerifying(false);

    if (!res.success) {
      setErrorMessage(res.error || (language === 'mr' ? 'चुकीचा पिन!' : 'Incorrect PIN!'));
      setEnteredPin('');
    }
  }, [isLockoutActive, isVerifying, unlockWithPin, language]);

  // Physical keyboard support
  useEffect(() => {
    if (!isLocked || !isPinConfigured) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Enter') {
        if (enteredPin.length >= 4) {
          handleVerify(enteredPin);
        }
      } else if (e.key === 'Escape') {
        handleClear();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isLocked, isPinConfigured, enteredPin, handleKeyPress, handleDelete, handleVerify, handleClear]);

  // Auto-verify when 6 digits entered
  useEffect(() => {
    if (enteredPin.length === 6) {
      handleVerify(enteredPin);
    }
  }, [enteredPin, handleVerify]);

  if (!isLocked || !isPinConfigured) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-navy-900 text-white p-6 select-none overflow-y-auto">
      {/* Header & Logo */}
      <div className="flex flex-col items-center text-center mt-6 max-w-sm">
        <div className="w-16 h-16 rounded-2xl bg-navy-700 border-2 border-saffron/40 flex items-center justify-center shadow-lg shadow-navy-950 mb-3 text-saffron">
          <Shield className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-white tracking-wide">
          {language === 'mr' ? 'महाराष्ट्र पोलीस • न्यायसाथी' : 'MAHARASHTRA POLICE • NYAYSAATHI'}
        </h1>
        <p className="text-xs text-muted mt-1">
          {profile?.stationName
            ? `${profile.stationName} (${profile.district || 'MH'})`
            : language === 'mr'
            ? 'सुरक्षित ऑफलाइन अन्वेषण टर्मिनल'
            : 'Secure Offline Investigation Terminal'}
        </p>
      </div>

      {/* PIN Dots & Status */}
      <div className="flex flex-col items-center my-4 w-full max-w-xs">
        <div className="flex items-center gap-2 mb-2">
          <Lock className="w-4 h-4 text-saffron" />
          <span className="text-sm font-semibold tracking-wider text-muted">
            {language === 'mr' ? 'अधिकारी पिन टाका' : 'ENTER OFFICER PIN'}
          </span>
        </div>

        {/* 6 Dot indicators */}
        <div className="flex items-center justify-center gap-3.5 my-4">
          {[0, 1, 2, 3, 4, 5].map((index) => {
            const isFilled = index < enteredPin.length;
            return (
              <div
                key={index}
                className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-150 ${
                  isFilled
                    ? 'bg-saffron border-saffron scale-110 shadow-sm shadow-saffron/50'
                    : 'border-muted/40 bg-navy-700/50'
                }`}
              />
            );
          })}
        </div>

        {/* Error / Lockout notification */}
        {isLockoutActive ? (
          <div className="w-full bg-danger/20 border border-danger/40 text-danger text-xs p-2.5 rounded-lg flex items-center gap-2 text-center animate-pulse">
            <Clock className="w-4 h-4 shrink-0" />
            <span>
              {language === 'mr'
                ? `खूप चुकीचे प्रयत्न! कृपया ${lockoutRemainingSeconds} सेकंद थांबा.`
                : `Too many wrong attempts! Locked for ${lockoutRemainingSeconds}s.`}
            </span>
          </div>
        ) : errorMessage ? (
          <div className="w-full bg-danger/20 border border-danger/40 text-danger text-xs p-2 rounded-lg flex items-center gap-2 text-center">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="flex-1">{errorMessage}</span>
          </div>
        ) : (
          <p className="text-xs text-muted/70 text-center min-h-[1.5rem]">
            {language === 'mr' ? '४ ते ६ अंकी सुरक्षा पिन' : '4 to 6 digit security PIN'}
          </p>
        )}
      </div>

      {/* Numeric Keypad */}
      <div className="w-full max-w-xs">
        <div className="grid grid-cols-3 gap-3 mb-3">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              disabled={isLockoutActive || isVerifying}
              onClick={() => handleKeyPress(digit)}
              className="h-14 rounded-xl bg-navy-700/80 hover:bg-navy-600 active:bg-saffron/20 active:scale-95 border border-muted/20 text-xl font-bold text-white flex items-center justify-center transition-all disabled:opacity-40 disabled:pointer-events-none"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            disabled={isLockoutActive || isVerifying || enteredPin.length === 0}
            onClick={handleClear}
            className="h-14 rounded-xl bg-navy-700/40 hover:bg-navy-700 active:scale-95 border border-muted/10 text-xs font-semibold text-muted flex items-center justify-center transition-all disabled:opacity-30 disabled:pointer-events-none"
          >
            {language === 'mr' ? 'रद्द' : 'CLEAR'}
          </button>
          <button
            type="button"
            disabled={isLockoutActive || isVerifying}
            onClick={() => handleKeyPress('0')}
            className="h-14 rounded-xl bg-navy-700/80 hover:bg-navy-600 active:bg-saffron/20 active:scale-95 border border-muted/20 text-xl font-bold text-white flex items-center justify-center transition-all disabled:opacity-40 disabled:pointer-events-none"
          >
            0
          </button>
          <button
            type="button"
            disabled={isLockoutActive || isVerifying || enteredPin.length === 0}
            onClick={handleDelete}
            className="h-14 rounded-xl bg-navy-700/40 hover:bg-navy-700 active:scale-95 border border-muted/10 text-muted flex items-center justify-center transition-all disabled:opacity-30 disabled:pointer-events-none"
            aria-label="Delete"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Enter / Unlock button for 4 or 5 digit PINs */}
        {enteredPin.length >= 4 && enteredPin.length < 6 && (
          <button
            type="button"
            disabled={isLockoutActive || isVerifying}
            onClick={() => handleVerify(enteredPin)}
            className="w-full py-2.5 mb-2 rounded-xl bg-saffron hover:bg-saffron-600 text-navy-900 font-bold text-sm flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-98 disabled:opacity-50"
          >
            {isVerifying
              ? (language === 'mr' ? 'तपासत आहे...' : 'Verifying...')
              : (language === 'mr' ? 'उघडा (Unlock)' : 'Unlock Terminal')}
          </button>
        )}
      </div>

      {/* Mandatory Plain Words Explanation Banner */}
      <div className="mt-4 max-w-sm w-full bg-navy-700/40 border border-muted/20 rounded-xl p-3 text-center">
        <p className="text-[11px] text-muted leading-relaxed">
          <strong className="text-white block mb-0.5">
            {language === 'mr' ? 'सुरक्षा स्पष्टीकरण' : 'Security Notice'}:
          </strong>
          {language === 'mr'
            ? 'हा पिन अनधिकृत किंवा सहज प्रवेश रोखतो, परंतु फोनवरील स्थानिक डेटा कूटबद्ध (encrypt) करत नाही.'
            : 'The PIN stops casual access but does not encrypt the data on the phone.'}
        </p>
      </div>
    </div>
  );
};
