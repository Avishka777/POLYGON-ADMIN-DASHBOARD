'use client';

import React from 'react';

import {
  Activity,
  ArrowRight,
  Crown,
  Database,
  FileSpreadsheet,
  Flame,
  Moon,
  Radio,
  RefreshCw,
  Scale,
  Sun,
  Table,
} from 'lucide-react';
import { DbConnectionConfig } from '@/lib/db/types';
import { DevilWomanIcon } from './icons/DevilWomanIcon';
import { KingDeveloperIcon } from './icons/KingDeveloperIcon';

interface RoleMenuDashboardProps {
  userRole: 'qa' | 'developer';
  onSwitchRole: () => void;
  onOpenDbExporter: () => void;
  onOpenScaleSimulator?: () => void;
  onOpenBackendHealth?: () => void;
  isLightTheme: boolean;
  onToggleTheme: () => void;
  config?: DbConnectionConfig | null;
  isConnected?: boolean;
  onOpenConnectionModal?: () => void;
}

export const RoleMenuDashboard: React.FC<RoleMenuDashboardProps> = ({
  userRole,
  onSwitchRole,
  onOpenDbExporter,
  onOpenScaleSimulator,
  onOpenBackendHealth,
  isLightTheme,
  onToggleTheme,
  config,
  isConnected,
  onOpenConnectionModal,
}) => {
  const isQa = userRole === 'qa';

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${
        isLightTheme
          ? 'bg-slate-50 text-slate-900'
          : 'bg-slate-950 text-slate-100'
      }`}
    >
      {/* Top Header Navigation */}
      <header
        className={`sticky top-0 z-40 border-b backdrop-blur-md px-6 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4 transition-colors ${
          isLightTheme
            ? 'bg-white/90 border-slate-200 shadow-xs'
            : 'bg-slate-900/90 border-slate-800'
        }`}
      >
        {/* Brand & Role Indicator */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-rose-600 flex items-center justify-center text-white shadow-md overflow-hidden p-0.5">
            {isQa ? <DevilWomanIcon size={44} /> : <KingDeveloperIcon size={34} />}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
                Mobile App Manager
              </h1>
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
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {isQa ? 'QA Operations Hub' : 'Developer Ops & Management Console'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Switch Role Button */}
          <button
            onClick={onSwitchRole}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border shadow-xs ${
              isLightTheme
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
            title="Switch between Developer and QA roles"
          >
            <RefreshCw className="w-4 h-4 text-indigo-500" />
            <span>Switch Role</span>
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={onToggleTheme}
            className={`p-2 rounded-xl border text-xs font-bold transition-all shadow-xs ${
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
        </div>
      </header>

      {/* Main Content Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-10 space-y-10">
        {/* Banner */}
        <section
          className={`p-8 rounded-3xl border shadow-xl relative overflow-hidden ${
            isQa
              ? isLightTheme
                ? 'bg-gradient-to-r from-rose-50/80 via-white to-purple-50/80 border-rose-100'
                : 'bg-gradient-to-r from-rose-950/40 via-slate-900 to-slate-900 border-rose-900/30'
              : isLightTheme
              ? 'bg-gradient-to-r from-indigo-50/80 via-white to-amber-50/80 border-indigo-100'
              : 'bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-900 border-indigo-900/30'
          }`}
        >
          <div className="max-w-3xl space-y-3 relative z-10">
            <div
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${
                isQa
                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
              }`}
            >
              {isQa ? <Flame className="w-3.5 h-3.5 text-rose-500" /> : <Crown className="w-3.5 h-3.5 text-amber-500" />}
              <span>{isQa ? 'Napuru QA Environment Active' : 'King of Developer Mode Active'}</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {isQa ? 'Napuru QA Operations Hub' : 'King of Developer Control Center'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
              {isQa
                ? 'Welcome to the QA Operations Portal. Inspect databases, export styled Excel spreadsheets, and test live Wi-Fi scale data streams.'
                : 'Welcome to Developer Control. Inspect database schemas, stream multi-sheet Excel exports, and broadcast live Wi-Fi scale data to CoDiNet mobile app.'}
            </p>
          </div>
        </section>

        {/* QA: 2-CARD GRID | DEVELOPER: 3-CARD GRID */}
        {isQa ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* CARD 1: DB EXPORTER */}
            <div
              onClick={onOpenDbExporter}
              className={`group p-8 rounded-3xl border transition-all duration-300 flex flex-col justify-between space-y-6 cursor-pointer shadow-xl hover:-translate-y-1.5 ${
                isLightTheme
                  ? 'bg-white border-slate-200 hover:border-purple-300 hover:shadow-purple-100/70'
                  : 'bg-slate-900 border-slate-800 hover:border-purple-500/50 shadow-black/40'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 via-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform">
                    <Database className="w-7 h-7" />
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                    Database Tools
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    DB Exporter
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    Inspect PostgreSQL & MySQL live databases. Preview table rows, search columns, examine schemas, and export single or multi-sheet Excel (.xlsx) & CSV files.
                  </p>
                </div>

                <div
                  className={`p-3 rounded-xl border space-y-1 text-xs ${
                    isLightTheme ? 'bg-slate-50 border-slate-100' : 'bg-slate-950/60 border-slate-800/80'
                  }`}
                >
                  <div className="flex items-center justify-between font-medium">
                    <span className="text-slate-500 dark:text-slate-400">Supported Databases:</span>
                    <span className="text-slate-700 dark:text-slate-300 font-semibold">PostgreSQL & MySQL</span>
                  </div>
                  <div className="flex items-center justify-between font-medium">
                    <span className="text-slate-500 dark:text-slate-400">Export Formats:</span>
                    <span className="text-purple-600 dark:text-purple-400 font-bold">Excel (.xlsx) & CSV</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-purple-600 dark:text-purple-400">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Open DB Exporter Workspace</span>
                </div>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* CARD 2: SCALE SIMULATOR */}
            <div
              onClick={onOpenScaleSimulator}
              className={`group p-8 rounded-3xl border transition-all duration-300 flex flex-col justify-between space-y-6 cursor-pointer shadow-xl hover:-translate-y-1.5 ${
                isLightTheme
                  ? 'bg-white border-slate-200 hover:border-rose-300 hover:shadow-rose-100/70'
                  : 'bg-slate-900 border-slate-800 hover:border-rose-500/50 shadow-black/40'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 via-pink-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-rose-500/20 group-hover:scale-105 transition-transform">
                    <Scale className="w-7 h-7" />
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20">
                    Hardware Simulator
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white transition-colors group-hover:text-rose-600 dark:group-hover:text-rose-400">
                    Wi-Fi Scale Simulator
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    BUDRY MFD-300 scale protocol emulator. Broadcasts live weight streams over TCP socket & HTTP bridge to CoDiNet app with random weight generation for QA testing.
                  </p>
                </div>

                <div
                  className={`p-3 rounded-xl border space-y-1 text-xs ${
                    isLightTheme ? 'bg-slate-50 border-slate-100' : 'bg-slate-950/60 border-slate-800/80'
                  }`}
                >
                  <div className="flex items-center justify-between font-medium">
                    <span className="text-slate-500 dark:text-slate-400">Scale Protocols:</span>
                    <span className="font-bold font-mono text-rose-600 dark:text-rose-400">
                      TCP (33581) • HTTP (3001)
                    </span>
                  </div>
                  <div className="flex items-center justify-between font-medium">
                    <span className="text-slate-500 dark:text-slate-400">Features:</span>
                    <span className="text-slate-700 dark:text-slate-300 font-semibold">Random Weight Stream & Live IP</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-rose-600 dark:text-rose-400">
                <div className="flex items-center gap-1.5">
                  <Radio className="w-4 h-4" />
                  <span>Open Scale Simulator</span>
                </div>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        ) : (
          /* DEVELOPER: 3-CARD GRID */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* CARD 1: DB EXPORTER */}
            <div
              onClick={onOpenDbExporter}
              className={`group p-7 rounded-3xl border transition-all duration-300 flex flex-col justify-between space-y-6 cursor-pointer shadow-xl hover:-translate-y-1.5 ${
                isLightTheme
                  ? 'bg-white border-slate-200 hover:border-purple-300 hover:shadow-purple-100/70'
                  : 'bg-slate-900 border-slate-800 hover:border-purple-500/50 shadow-black/40'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-rose-500 via-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform">
                    <Database className="w-6 h-6" />
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                    Database Tools
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    DB Exporter
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Inspect PostgreSQL & MySQL databases. Preview table rows, search schemas, and export single or multi-sheet Excel files.
                  </p>
                </div>

                <div
                  className={`p-3 rounded-xl border space-y-1 text-xs ${
                    isLightTheme ? 'bg-slate-50 border-slate-100' : 'bg-slate-950/60 border-slate-800/80'
                  }`}
                >
                  <div className="flex items-center justify-between font-medium">
                    <span className="text-slate-500 dark:text-slate-400">Databases:</span>
                    <span className="text-slate-700 dark:text-slate-300 font-semibold">Postgres & MySQL</span>
                  </div>
                  <div className="flex items-center justify-between font-medium">
                    <span className="text-slate-500 dark:text-slate-400">Formats:</span>
                    <span className="text-purple-600 dark:text-purple-400 font-bold">Excel (.xlsx) & CSV</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-purple-600 dark:text-purple-400">
                <div className="flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Open DB Exporter</span>
                </div>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* CARD 2: SCALE SIMULATOR */}
            <div
              onClick={onOpenScaleSimulator}
              className={`group p-7 rounded-3xl border transition-all duration-300 flex flex-col justify-between space-y-6 cursor-pointer shadow-xl hover:-translate-y-1.5 ${
                isLightTheme
                  ? 'bg-white border-slate-200 hover:border-amber-300 hover:shadow-amber-100/70'
                  : 'bg-slate-900 border-slate-800 hover:border-amber-500/50 shadow-black/40'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
                    <Scale className="w-6 h-6" />
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    Hardware Simulator
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    Wi-Fi Scale Simulator
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    BUDRY MFD-300 scale protocol emulator. Broadcasts live weight streams over TCP & HTTP to CoDiNet mobile app.
                  </p>
                </div>

                <div
                  className={`p-3 rounded-xl border space-y-1 text-xs ${
                    isLightTheme ? 'bg-slate-50 border-slate-100' : 'bg-slate-950/60 border-slate-800/80'
                  }`}
                >
                  <div className="flex items-center justify-between font-medium">
                    <span className="text-slate-500 dark:text-slate-400">Protocols:</span>
                    <span className="text-amber-600 dark:text-amber-400 font-bold font-mono">TCP:33581 • HTTP:3001</span>
                  </div>
                  <div className="flex items-center justify-between font-medium">
                    <span className="text-slate-500 dark:text-slate-400">Features:</span>
                    <span className="text-slate-700 dark:text-slate-300 font-semibold">Random Stream & IP</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-amber-600 dark:text-amber-400">
                <div className="flex items-center gap-1.5">
                  <Radio className="w-4 h-4" />
                  <span>Open Scale Simulator</span>
                </div>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* CARD 3: BACKEND HEALTH HUB (DEVELOPER ONLY) */}
            <div
              onClick={onOpenBackendHealth}
              className={`group p-7 rounded-3xl border transition-all duration-300 flex flex-col justify-between space-y-6 cursor-pointer shadow-xl hover:-translate-y-1.5 ${
                isLightTheme
                  ? 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-indigo-100/70'
                  : 'bg-slate-900 border-slate-800 hover:border-indigo-500/50 shadow-black/40'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                    <Activity className="w-6 h-6" />
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                    Developer Only
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      Backend Health
                    </h3>
                    {/* App Icons Ribbon */}
                    <div className="flex items-center -space-x-1.5 overflow-hidden py-0.5">
                      {['polygon.ico', 'codi-net.ico', 'govi-care.ico', 'govi-link.ico', 'sales-dash.ico', 'govi-trans.ico'].map((ico) => (
                        <img
                          key={ico}
                          src={`/app-icons/${ico}`}
                          alt="app icon"
                          className="w-5 h-5 rounded-full border border-white dark:border-slate-800 bg-white object-contain shadow-xs"
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Live <code>/health</code> diagnostics across DEV, UAT & PROD for all 6 Polygon mobile apps with latency & response inspection.
                  </p>
                </div>

                <div
                  className={`p-3 rounded-xl border space-y-1 text-xs ${
                    isLightTheme ? 'bg-slate-50 border-slate-100' : 'bg-slate-950/60 border-slate-800/80'
                  }`}
                >
                  <div className="flex items-center justify-between font-medium">
                    <span className="text-slate-500 dark:text-slate-400">Target Projects:</span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">6 Apps (18 Envs)</span>
                  </div>
                  <div className="flex items-center justify-between font-medium">
                    <span className="text-slate-500 dark:text-slate-400">Endpoint Target:</span>
                    <span className="text-slate-700 dark:text-slate-300 font-mono font-semibold">.../health</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400">
                <div className="flex items-center gap-1.5">
                  <Activity className="w-4 h-4" />
                  <span>Inspect Backend Health</span>
                </div>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="max-w-7xl w-full mx-auto p-6 text-center text-xs text-slate-400 border-t border-slate-200 dark:border-slate-800/80">
        Mobile App Manager • Polygon Ecosystem Operations
      </footer>
    </div>
  );
};
