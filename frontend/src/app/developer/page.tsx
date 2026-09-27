'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Activity,
  ArrowRight,
  Crown,
  Database,
  FileSpreadsheet,
  Lock,
  Moon,
  Radio,
  RefreshCw,
  Scale,
  Server,
  ShieldCheck,
  Sun,
  Layers,
} from 'lucide-react';
import { KingDeveloperIcon } from '@/components/common/icons/KingDeveloperIcon';
import { useTheme } from '@/context/ThemeContext';
import { clearDeveloperAccess } from '@/lib/developer/security';

export default function DeveloperDashboardPage() {
  const router = useRouter();
  const { isLightTheme, toggleTheme } = useTheme();

  const handleClearAccess = () => {
    clearDeveloperAccess();
    router.push('/select-role');
  };

  return (
    <div className="min-h-screen flex flex-col font-sans transition-colors duration-300">
      {/* Top Glassmorphic Navigation Header */}
      <header className="sticky top-0 z-40 glass-header px-6 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand & Role Indicator */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-amber-500 flex items-center justify-center text-white shadow-md p-0.5">
            <KingDeveloperIcon size={34} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold tracking-tight">Mobile App Manager</h1>
              <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full border bg-amber-500/10 text-amber-500 border-amber-500/30">
                King of Developer
              </span>
              <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full border bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 flex items-center gap-1 shadow-xs">
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                <span>Full Access</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Developer Ops & Management Console
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Clear Access Button */}
          <button
            onClick={handleClearAccess}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 cursor-pointer shadow-xs"
            title="Revoke Developer Session & Lock Workspace"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Clear Access</span>
          </button>

          {/* Switch Role Button */}
          <Link
            href="/select-role"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all glass-card hover:bg-slate-200 dark:hover:bg-slate-800"
            title="Switch between Developer and QA roles"
          >
            <RefreshCw className="w-4 h-4 text-indigo-500" />
            <span>Switch Role</span>
          </Link>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl glass-card text-xs font-bold transition-all"
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
        {/* Banner with Glassmorphic Styling */}
        <section className="glass-panel p-8 rounded-3xl relative overflow-hidden">
          <div className="max-w-3xl space-y-3 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border bg-amber-500/10 text-amber-500 border-amber-500/30">
              <Crown className="w-3.5 h-3.5 text-amber-500" />
              <span>King of Developer Mode Active</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight">
              King of Developer Control Center
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
              Inspect database schemas, stream multi-sheet Excel exports, broadcast live Wi-Fi scale socket data, and monitor real-time health across the 6 Polygon mobile applications.
            </p>
          </div>
        </section>

        {/* 3-CARD GLASSMORPHIC GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* CARD 1: DB EXPORTER */}
          <Link
            href="/developer/db-exporter"
            className="group glass-card p-7 rounded-3xl transition-all duration-300 flex flex-col justify-between space-y-6 hover:-translate-y-1.5 hover:shadow-purple-500/20"
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
                <h3 className="text-lg font-extrabold group-hover:text-purple-500 transition-colors">
                  DB Exporter
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Inspect PostgreSQL & MySQL databases. Preview live table rows, search schemas, and export single or multi-sheet Excel (.xlsx) & CSV files.
                </p>
              </div>

              <div className="p-3 rounded-xl border border-white/20 dark:border-white/5 bg-white/40 dark:bg-black/30 space-y-1 text-xs">
                <div className="flex items-center justify-between font-medium">
                  <span className="text-slate-500 dark:text-slate-400">Databases:</span>
                  <span className="font-semibold">Postgres & MySQL</span>
                </div>
                <div className="flex items-center justify-between font-medium">
                  <span className="text-slate-500 dark:text-slate-400">Export Formats:</span>
                  <span className="text-purple-500 font-bold">Excel (.xlsx) & CSV</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between text-xs font-bold text-purple-500">
              <div className="flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4" />
                <span>Open DB Exporter Workspace</span>
              </div>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* CARD 2: SCALE SIMULATOR */}
          <Link
            href="/developer/wifi-scale"
            className="group glass-card p-7 rounded-3xl transition-all duration-300 flex flex-col justify-between space-y-6 hover:-translate-y-1.5 hover:shadow-amber-500/20"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
                  <Scale className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  Hardware Simulator
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-extrabold group-hover:text-amber-500 transition-colors">
                  Wi-Fi Scale Simulator
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  BUDRY MFD-300 scale protocol emulator. Broadcasts live weight streams over TCP socket & HTTP bridge to CoDiNet mobile app.
                </p>
              </div>

              <div className="p-3 rounded-xl border border-white/20 dark:border-white/5 bg-white/40 dark:bg-black/30 space-y-1 text-xs">
                <div className="flex items-center justify-between font-medium">
                  <span className="text-slate-500 dark:text-slate-400">Protocols:</span>
                  <span className="text-amber-500 font-bold font-mono">TCP:33581 • HTTP:3001</span>
                </div>
                <div className="flex items-center justify-between font-medium">
                  <span className="text-slate-500 dark:text-slate-400">Features:</span>
                  <span className="font-semibold">Random Weight Stream & Live IP</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between text-xs font-bold text-amber-500">
              <div className="flex items-center gap-1.5">
                <Radio className="w-4 h-4" />
                <span>Open Scale Simulator</span>
              </div>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* CARD 3: APPLICATIONS HUB (ALL APP STATE) */}
          <Link
            href="/developer/applications"
            className="group glass-card p-7 rounded-3xl transition-all duration-300 flex flex-col justify-between space-y-6 hover:-translate-y-1.5 hover:shadow-indigo-500/20"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                  <Server className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                  Developer Only
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-extrabold group-hover:text-indigo-500 transition-colors">
                    Applications Hub
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
                  Browse and inspect individual mobile apps. Access Polygon Mobile's 6 health & version routes or test endpoints per app.
                </p>
              </div>

              <div className="p-3 rounded-xl border border-white/20 dark:border-white/5 bg-white/40 dark:bg-black/30 space-y-1 text-xs">
                <div className="flex items-center justify-between font-medium">
                  <span className="text-slate-500 dark:text-slate-400">Target Ecosystem:</span>
                  <span className="text-indigo-500 font-bold">All 6 Apps (Separate Pages)</span>
                </div>
                <div className="flex items-center justify-between font-medium">
                  <span className="text-slate-500 dark:text-slate-400">Monitored Routes:</span>
                  <span className="font-mono font-semibold">Health, Probes & Version</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between text-xs font-bold text-indigo-500">
              <div className="flex items-center gap-1.5">
                <Activity className="w-4 h-4" />
                <span>Browse All 6 Applications</span>
              </div>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </main>

      <footer className="max-w-7xl w-full mx-auto p-6 text-center text-xs text-slate-400 border-t border-slate-200/50 dark:border-slate-800/50 mt-12">
        Mobile App Manager • Polygon Ecosystem Operations
      </footer>
    </div>
  );
}
