'use client';

import React from 'react';
import { Database, FileSpreadsheet, Server, Settings2, Sparkles } from 'lucide-react';
import { DbConnectionConfig } from '@/lib/db/types';
import { DevilWomanIcon } from './DevilWomanIcon';

interface HeaderProps {
  config: DbConnectionConfig | null;
  isConnected: boolean;
  onOpenConnectionModal: () => void;
  selectedDatabase?: string;
  totalTablesCount?: number;
  onShowSplash?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  isConnected,
  onOpenConnectionModal,
  selectedDatabase,
  totalTablesCount = 0,
  onShowSplash,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30 px-6 py-3 flex items-center justify-between">
      {/* Brand & QA Badge */}
      <div className="flex items-center gap-3">
        <button
          onClick={onShowSplash}
          title="Click to view Splash Screen"
          className="group relative focus:outline-none"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 via-red-600 to-purple-800 flex items-center justify-center shadow-lg shadow-rose-950/60 overflow-hidden group-hover:scale-105 transition-transform">
            <DevilWomanIcon size={34} />
          </div>
        </button>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm sm:text-base font-bold text-slate-100 tracking-tight">
              DataFlow Excel Exporter
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-extrabold bg-gradient-to-r from-rose-950 to-red-950 text-rose-300 border border-rose-500/40 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.3)] tracking-wider">
              For Napuru QA Team
            </span>
          </div>
          <p className="text-[11px] text-slate-400 hidden sm:block">
            PostgreSQL & MySQL Database Table to Excel (.xlsx) Exporter
          </p>
        </div>
      </div>

      {/* Connection Status & Trigger */}
      <div className="flex items-center gap-3">
        {isConnected && config ? (
          <div className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50" />
            <span className="font-semibold uppercase tracking-wider text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
              {config.type}
            </span>
            <span className="text-slate-400 font-mono">
              {config.host || 'remote'}:{config.port || (config.type === 'postgres' ? 5432 : 3306)}
            </span>
            <span className="text-slate-600">/</span>
            <span className="text-emerald-400 font-medium font-mono">
              {selectedDatabase || config.database || 'default'}
            </span>
            <span className="text-slate-500">
              ({totalTablesCount} {totalTablesCount === 1 ? 'table' : 'tables'})
            </span>
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Not Connected</span>
          </div>
        )}

        <button
          onClick={onOpenConnectionModal}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition-all shadow-sm hover:shadow"
        >
          <Settings2 className="w-4 h-4 text-emerald-400" />
          <span>{isConnected ? 'Change Connection' : 'Connect Database'}</span>
        </button>
      </div>
    </header>
  );
};
