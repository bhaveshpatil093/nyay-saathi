import React, { useState, useEffect } from 'react';
import { Shield, Lock, X, AlertCircle, Check } from 'lucide-react';
import { getSetting } from '../../lib/db/index.ts';

interface OfficerPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title_en?: string;
  title_mr?: string;
}

export const OfficerPinModal: React.FC<OfficerPinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title_en = 'Officer Authentication',
  title_mr = 'अधिकारी प्रमाणीकरण',
}) => {
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [expectedPin, setExpectedPin] = useState<string | null>(null);
  const [hasCheckedPin, setHasCheckedPin] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError('');
      // Check stored PIN in settings or localStorage
      const loadPin = async () => {
        try {
          const dbPin = await getSetting<string>('pinHash');
          const localPin = localStorage.getItem('nyay_saathi_officer_pin');
          const effectivePin = dbPin || localPin;
          setExpectedPin(effectivePin || null);
          setHasCheckedPin(true);

          // If no PIN has been set anywhere, permit instant transition
          if (!effectivePin) {
            onSuccess();
          }
        } catch {
          setHasCheckedPin(true);
          onSuccess();
        }
      };
      loadPin();
    }
  }, [isOpen]);

  if (!isOpen || !expectedPin) return null;

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const next = pin + digit;
      setPin(next);
      setError('');
      if (next.length === 4) {
        // Verify
        if (next === expectedPin || expectedPin === '1234') {
          onSuccess();
        } else {
          setError('Incorrect PIN. Try again. / चुकीचा पिन. पुन्हा प्रयत्न करा.');
          setPin('');
        }
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError('');
  };

  const handleClear = () => {
    setPin('');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-navy-800 border border-navy-600 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center">
        {/* Close button */}
        <div className="w-full flex justify-end">
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-navy-700 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Header Icon */}
        <div className="w-16 h-16 rounded-2xl bg-saffron/15 border border-saffron/30 flex items-center justify-center text-saffron mb-3">
          <Lock className="w-8 h-8" />
        </div>

        <h3 className="text-xl font-bold text-white tracking-wide">
          {title_mr}
        </h3>
        <p className="text-sm text-slate-300 font-medium mt-0.5">
          {title_en}
        </p>
        <p className="text-xs text-slate-400 mt-2 px-2">
          पोलीस अधिकारी मोडमध्ये जाण्यासाठी ४ अंकी पिन प्रविष्ट करा.
          <br />
          Enter 4-digit PIN to switch to Officer mode.
        </p>

        {/* PIN Dots */}
        <div className="flex gap-4 my-6">
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = pin.length > idx;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full border-2 transition-all ${
                  isFilled
                    ? 'bg-saffron border-saffron scale-110 shadow-md shadow-saffron/40'
                    : 'border-slate-600 bg-navy-900'
                }`}
              />
            );
          })}
        </div>

        {error && (
          <div className="flex items-center gap-1.5 text-xs text-rose-400 bg-rose-950/60 border border-rose-800/60 px-3 py-1.5 rounded-xl mb-4">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[260px] mb-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              onClick={() => handleDigit(num)}
              className="h-14 rounded-2xl bg-navy-700/80 hover:bg-navy-600 active:scale-95 text-xl font-bold text-white border border-navy-600/80 transition-all flex items-center justify-center shadow-xs"
            >
              {num}
            </button>
          ))}
          <button
            onClick={handleClear}
            className="h-14 rounded-2xl bg-navy-900 hover:bg-navy-800 active:scale-95 text-xs font-semibold text-slate-400 border border-navy-700/50 transition-all flex items-center justify-center uppercase"
          >
            Clear
          </button>
          <button
            onClick={() => handleDigit('0')}
            className="h-14 rounded-2xl bg-navy-700/80 hover:bg-navy-600 active:scale-95 text-xl font-bold text-white border border-navy-600/80 transition-all flex items-center justify-center shadow-xs"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            className="h-14 rounded-2xl bg-navy-900 hover:bg-navy-800 active:scale-95 text-sm font-semibold text-slate-300 border border-navy-700/50 transition-all flex items-center justify-center"
          >
            ⌫
          </button>
        </div>

        {/* Bypass / Forgot option for demo ease */}
        <p className="text-[11px] text-slate-400">
          डेमो पिन: <span className="text-saffron font-mono font-bold">1234</span>
        </p>
      </div>
    </div>
  );
};
