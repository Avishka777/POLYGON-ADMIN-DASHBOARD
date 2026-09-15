'use client';

import React from 'react';

import {
  Moon,
  RefreshCw,
  Sun,
} from 'lucide-react';
import { DbConnectionConfig } from '@/lib/db/types';
import { DevilWomanIcon } from './icons/DevilWomanIcon';
import { KingDeveloperIcon } from './icons/KingDeveloperIcon';

interface HeaderProps {
  config?: DbConnectionConfig | null;
  isConnected?: boolean;
  onOpenConnectionModal?: () => void;
  selectedDatabase?: string;
  totalTablesCount?: number;
  onShowSplash?: () => void;
  userRole?: 'qa' | 'developer' | null;
  onSwitchRole?: () => void;
  isLightTheme?: boolean;
  onToggleTheme?: () => void;
  onGoToMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  isConnected,
  onOpenConnectionModal,
  selectedDatabase,
  totalTablesCount = 0,
  onShowSplash,
  userRole = 'qa',
  onSwitchRole,
  isLightTheme = false,
  onToggleTheme,
  onGoToMenu,
}) => {
  const isQa = userRole === 'qa';

  return (
    <header
      className={`border-b sticky top-0 z-30 px-6 py-3 flex items-center justify-between transition-colors backdrop-blur-md ${
        isLightTheme
          ? 'bg-white/90 border-slate-200 shadow-xs'
          : 'bg-slate-950/90 border-slate-800'
      }`}
    >
      {/* Brand & Role Badge */}
      <div className="flex items-center gap-3">
        <button
          onClick={onGoToMenu || onShowSplash}
          title="Return to Menu Dashboard"
          className="group relative focus:outline-none"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-rose-600 flex items-center justify-center shadow-md overflow-hidden group-hover:scale-105 transition-transform p-0.5">
            {isQa ? <DevilWomanIcon size={44} /> : <KingDeveloperIcon size={34} />}
          </div>
        </button>

        <div>
          <div className="flex items-center gap-2">
            <button
              onClick={onGoToMenu}
              className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100 tracking-tight hover:underline cursor-pointer"
            >
              Mobile App Manager
            </button>
            <span
              className={`px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full border ${
                isQa
                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
              }`}
            >
              {isQa ? 'Napuru QA' : 'King of Developer'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
            PostgreSQL & MySQL Database Table to Excel (.xlsx) Exporter
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2.5">

        {/* Menu Navigation Button */}
        {onGoToMenu && (
          <button
            onClick={onGoToMenu}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border transition-all shadow-xs ${
              isLightTheme
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            <span>Menu Hub</span>
          </button>
        )}

        {/* Switch Role Button */}
        {onSwitchRole && (
          <button
            onClick={onSwitchRole}
            className={`p-2 rounded-xl border transition-all shadow-xs ${
              isLightTheme
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
            title="Switch User Role"
          >
            <RefreshCw className="w-4 h-4 text-indigo-500" />
          </button>
        )}

        {/* Theme Toggle Button */}
        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            className={`p-2 rounded-xl border transition-all shadow-xs ${
              isLightTheme
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
            title="Toggle White / Dark Theme"
          >
            {isLightTheme ? (
              <Sun className="w-4 h-4 text-amber-500 fill-amber-500" />
            ) : (
              <Moon className="w-4 h-4 text-purple-400" />
            )}
          </button>
        )}
      </div>
    </header>
  );
};
