'use client';

import React, { useState } from 'react';

import {
  ArrowRight,
  CheckCircle2,
  Code2,
  Crown,
  Database,
  Flame,
  Layers,
  Moon,
  PackageCheck,
  ShieldCheck,
  Sparkles,
  Sun,
  Terminal,
  Zap,
} from 'lucide-react';
import { DeveloperPasscodeModal } from '@/components/developer/DeveloperPasscodeModal';
import { DevilWomanIcon } from './icons/DevilWomanIcon';
import { KingDeveloperIcon } from './icons/KingDeveloperIcon';

interface RoleSelectScreenProps {
  onSelectRole: (role: 'qa' | 'developer') => void;
  isLightTheme: boolean;
  onToggleTheme: () => void;
}

export const RoleSelectScreen: React.FC<RoleSelectScreenProps> = ({
  onSelectRole,
  isLightTheme,
  onToggleTheme,
}) => {
  const [isPasscodeModalOpen, setIsPasscodeModalOpen] = useState(false);
  return (
    <div className="min-h-screen flex flex-col justify-between p-6 sm:p-10 font-sans transition-colors duration-300">
      {/* Top Header & Theme Switcher */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between py-2 glass-header rounded-2xl px-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-rose-600 flex items-center justify-center text-white font-black shadow-md">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight flex items-center gap-2">
              Mobile App Manager
              <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                Polygon Ecosystem
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Unified Mobile Operations & Developer Portal
            </p>
          </div>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={onToggleTheme}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all glass-card hover:bg-slate-200 dark:hover:bg-slate-800"
          title="Toggle Light / Dark Theme"
        >
          {isLightTheme ? (
            <>
              <Sun className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>White Theme</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-purple-400" />
              <span>Dark Theme</span>
            </>
          )}
        </button>
      </header>

      {/* Main Role Selection Area */}
      <main className="max-w-5xl w-full mx-auto my-auto py-8 space-y-10 text-center">
        {/* Title & Subtitle */}
        <div className="space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-300 text-xs font-bold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-purple-500 animate-pulse" />
            <span>Select Workspace Mode</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            How would you like to continue?
          </h2>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 font-normal leading-relaxed">
            Select your user role to enter your specialized dashboard workspace with built-in DB Exporter, Scale Simulator, and application operations.
          </p>
        </div>

        {/* 2 BIG ROLE CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
          {/* QA CARD */}
          <div
            onClick={() => onSelectRole('qa')}
            className="group relative rounded-3xl p-8 cursor-pointer transition-all duration-300 glass-card flex flex-col justify-between overflow-hidden shadow-xl hover:-translate-y-1.5 hover:shadow-rose-500/20"
          >
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-rose-500/20 transition-colors" />

            <div className="space-y-6 relative z-10">
              {/* Header Badge & Avatar */}
              <div className="flex items-start justify-between">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center text-white shadow-lg shadow-rose-500/30 group-hover:scale-105 transition-transform overflow-hidden p-0.5">
                  <DevilWomanIcon size={76} />
                </div>
                <span className="px-3 py-1 text-xs font-black uppercase tracking-wider rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/30 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-rose-500" />
                  Napuru QA
                </span>
              </div>

              {/* Title & Description */}
              <div className="space-y-2">
                <h3 className="text-2xl font-black tracking-tight group-hover:text-rose-500 transition-colors">
                  QA (Quality Assurance)
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Tailored for the <strong>Napuru QA Team</strong>. Inspect databases, preview live table data, export styled Excel sheets, and test Wi-Fi scale streams.
                </p>
              </div>

              {/* Feature Highlights */}
              <ul className="space-y-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>DB Exporter (PostgreSQL & MySQL to Excel)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>Wi-Fi Scale Hardware Simulator</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>Multi-Sheet Workbook Generation & Preview</span>
                </li>
              </ul>
            </div>

            {/* Launch Button */}
            <div className="pt-6 mt-6 border-t border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between relative z-10">
              <span className="text-xs font-bold text-slate-400 group-hover:text-rose-500 transition-colors">
                Enter QA Workspace
              </span>
              <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center group-hover:translate-x-1 transition-transform shadow-md">
                <ArrowRight className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* DEVELOPER CARD */}
          <div
            onClick={() => setIsPasscodeModalOpen(true)}
            className="group relative rounded-3xl p-8 cursor-pointer transition-all duration-300 glass-card flex flex-col justify-between overflow-hidden shadow-xl hover:-translate-y-1.5 hover:shadow-indigo-500/20"
          >
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-500/20 transition-colors" />

            <div className="space-y-6 relative z-10">
              {/* Header Badge & Avatar */}
              <div className="flex items-start justify-between">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 via-indigo-600 to-purple-700 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform p-1">
                  <KingDeveloperIcon size={52} />
                </div>
                <span className="px-3 py-1 text-xs font-black uppercase tracking-wider rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/30 flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-amber-500" />
                  King of Developer
                </span>
              </div>

              {/* Title & Description */}
              <div className="space-y-2">
                <h3 className="text-2xl font-black tracking-tight group-hover:text-indigo-500 transition-colors">
                  Developer
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Full developer operations suite. Access DB Exporter, Wi-Fi Scale socket broadcast, and browse the 6 Polygon mobile applications.
                </p>
              </div>

              {/* Feature Highlights */}
              <ul className="space-y-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>DB Exporter & Schema Inspector</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>Wi-Fi Scale Protocol Emulator (TCP & HTTP)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>Polygon 6 Routes Suite (App Version & Probes)</span>
                </li>
              </ul>
            </div>

            {/* Launch Button */}
            <div className="pt-6 mt-6 border-t border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between relative z-10">
              <span className="text-xs font-bold text-slate-400 group-hover:text-indigo-500 transition-colors">
                Enter Developer Workspace (Passcode Protected)
              </span>
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center group-hover:translate-x-1 transition-transform shadow-md">
                <ArrowRight className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Developer Passcode Modal */}
      <DeveloperPasscodeModal
        isOpen={isPasscodeModalOpen}
        onClose={() => setIsPasscodeModalOpen(false)}
        onSuccess={() => {
          setIsPasscodeModalOpen(false);
          onSelectRole('developer');
        }}
        isLightTheme={isLightTheme}
      />

      {/* Footer */}
      <footer className="max-w-6xl w-full mx-auto py-3 text-center text-xs text-slate-400 border-t border-slate-200/50 dark:border-slate-800/50">
        © 2026 Polygon Mobile App Management Platform • Built for Developers & QA Team
      </footer>
    </div>
  );
};
