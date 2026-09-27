'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Crown,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  ShieldAlert,
  Sparkles,
  X,
} from 'lucide-react';
import { verifyDeveloperPasscode, setDeveloperAuthenticated } from '@/lib/developer/security';
import { KingDeveloperIcon } from '@/components/common/icons/KingDeveloperIcon';

interface DeveloperPasscodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  isLightTheme?: boolean;
}

export const DeveloperPasscodeModal: React.FC<DeveloperPasscodeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  isLightTheme = false,
}) => {
  const [passcode, setPasscode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPasscode('');
      setError(null);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!passcode.trim()) {
      setError('Please enter the Developer Passcode');
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const isValid = await verifyDeveloperPasscode(passcode);
      if (isValid) {
        setDeveloperAuthenticated(true);
        onSuccess();
      } else {
        setError('Access Denied: Invalid Developer Passcode');
        setPasscode('');
        inputRef.current?.focus();
      }
    } catch {
      setError('Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md rounded-3xl glass-panel shadow-2xl p-6 sm:p-8 space-y-6 transition-all">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl glass-card text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-indigo-600 to-purple-700 flex items-center justify-center text-white shadow-xl shadow-indigo-500/30 p-1">
            <KingDeveloperIcon size={52} />
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-wider">
              <Lock className="w-3 h-3 text-amber-500" />
              <span>Authentication Required</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              King of Developer Access
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Enter the encrypted developer passcode to unlock the workspace and diagnostic tools.
            </p>
          </div>
        </div>

        {/* Passcode Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Developer Passcode:
            </label>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4 text-indigo-500" />
              </div>

              <input
                ref={inputRef}
                type={showPassword ? 'text' : 'password'}
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Enter passcode..."
                className={`w-full pl-10 pr-10 py-3 rounded-2xl border text-sm font-medium transition-all focus:outline-none focus:ring-2 ${
                  error
                    ? 'border-rose-500 bg-rose-50/20 text-rose-600 focus:ring-rose-500/30'
                    : isLightTheme
                    ? 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-indigo-500/30 focus:border-indigo-500'
                    : 'bg-slate-950 border-slate-800 text-white focus:ring-indigo-500/30 focus:border-indigo-500'
                }`}
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                title={showPassword ? 'Hide passcode' : 'Show passcode'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit & Cancel Buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all border ${
                isLightTheme
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isVerifying || !passcode}
              className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <Crown className="w-4 h-4 text-amber-300" />
                  <span>Unlock</span>
                </>
              )}
            </button>
          </div>
        </form>

        <p className="text-[11px] text-center text-slate-400">
          Security policy: Passcodes are cryptographically hashed using salted SHA-256.
        </p>
      </div>
    </div>
  );
};
