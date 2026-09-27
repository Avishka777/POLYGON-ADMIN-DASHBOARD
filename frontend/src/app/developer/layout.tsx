'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, KeyRound, Lock, ShieldAlert, Sparkles } from 'lucide-react';
import { isDeveloperAuthenticated, setDeveloperAuthenticated } from '@/lib/developer/security';
import { DeveloperPasscodeModal } from '@/components/developer/DeveloperPasscodeModal';
import { KingDeveloperIcon } from '@/components/common/icons/KingDeveloperIcon';
import { useTheme } from '@/context/ThemeContext';

export default function DeveloperLayout({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isLightTheme } = useTheme();

  useEffect(() => {
    const auth = isDeveloperAuthenticated();
    setIsAuthenticated(auth);
    if (!auth) {
      setIsModalOpen(true);
    }
  }, []);

  // While determining auth state
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="glass-panel p-8 rounded-3xl flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-500">Checking developer access...</span>
        </div>
      </div>
    );
  }

  // If not authenticated, block content and show unlock gate
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col justify-between p-6 sm:p-10 font-sans">
        <header className="max-w-4xl w-full mx-auto flex items-center justify-between py-2 glass-header rounded-2xl px-6">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <span className="text-xs font-black uppercase tracking-wider text-rose-500">
              Access Restricted
            </span>
          </div>

          <Link
            href="/select-role"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold glass-card hover:bg-slate-200 dark:hover:bg-slate-800 transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Select Role</span>
          </Link>
        </header>

        <main className="max-w-md w-full mx-auto my-auto p-8 glass-panel rounded-3xl text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-indigo-600 to-purple-700 flex items-center justify-center text-white shadow-xl shadow-indigo-500/30 p-1 mx-auto">
            <KingDeveloperIcon size={52} />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-black uppercase tracking-wider">
              <Lock className="w-3 h-3 text-rose-500" />
              <span>Passcode Required</span>
            </div>
            <h2 className="text-2xl font-black">Developer Access Locked</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Direct URL navigation to developer workspaces requires active authentication. Please unlock with your passcode.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              <span>Enter Developer Passcode</span>
            </button>

            <Link
              href="/select-role"
              className="w-full py-2.5 rounded-2xl glass-card text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all text-slate-500"
            >
              <span>Return to Role Selection</span>
            </Link>
          </div>
        </main>

        <footer className="text-center text-xs text-slate-400 py-3">
          Mobile App Manager • Security Gate
        </footer>

        {/* Passcode Modal */}
        <DeveloperPasscodeModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            setDeveloperAuthenticated(true);
            setIsAuthenticated(true);
          }}
          isLightTheme={isLightTheme}
        />
      </div>
    );
  }

  // When authenticated, render the developer workspace children
  return <>{children}</>;
}
