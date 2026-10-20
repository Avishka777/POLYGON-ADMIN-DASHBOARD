'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Bluetooth,
  Database,
  FileSpreadsheet,
  Flame,
  Moon,
  Radio,
  RefreshCw,
  Scale,
  Sun,
  Printer,
  Sliders,
  Zap,
} from 'lucide-react';
import { DevilWomanIcon } from '@/components/common/icons/DevilWomanIcon';
import { useTheme } from '@/context/ThemeContext';

export default function QaDashboardPage() {
  const { isLightTheme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col font-sans transition-colors duration-300">
      {/* Top Glassmorphic Navigation Header */}
      <header className="sticky top-0 z-40 glass-header px-6 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand & Role Indicator */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-rose-600 flex items-center justify-center text-white shadow-md p-0.5">
            <DevilWomanIcon size={44} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold tracking-tight">Mobile App Manager</h1>
              <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full border bg-rose-500/10 text-rose-500 border-rose-500/30">
                Napuru QA
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              QA Operations Hub
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border bg-rose-500/10 text-rose-500 border-rose-500/30">
              <Flame className="w-3.5 h-3.5 text-rose-500" />
              <span>Napuru QA Environment Active</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight">
              Napuru QA Operations Hub
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
              Welcome to the QA Operations Portal. Inspect databases, export styled Excel spreadsheets, and test live Wi-Fi scale data streams for weighing verification.
            </p>
          </div>
        </section>

        {/* QA: 4-CARD OPERATIONS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* CARD 1: DB EXPORTER */}
          <Link
            href="/qa/db-exporter"
            className="group glass-card p-8 rounded-3xl transition-all duration-300 flex flex-col justify-between space-y-6 hover:-translate-y-1.5 hover:shadow-purple-500/20"
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
                <h3 className="text-xl font-extrabold group-hover:text-purple-500 transition-colors">
                  DB Exporter
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Inspect PostgreSQL &amp; MySQL live databases. Preview table rows, search columns, examine schemas, and export single or multi-sheet Excel (.xlsx) &amp; CSV files.
                </p>
              </div>

              <div className="p-3 rounded-xl border border-white/20 dark:border-white/5 bg-white/40 dark:bg-black/30 space-y-1 text-xs">
                <div className="flex items-center justify-between font-medium">
                  <span className="text-slate-500 dark:text-slate-400">Supported Databases:</span>
                  <span className="font-semibold">PostgreSQL &amp; MySQL</span>
                </div>
                <div className="flex items-center justify-between font-medium">
                  <span className="text-slate-500 dark:text-slate-400">Export Formats:</span>
                  <span className="text-purple-500 font-bold">Excel (.xlsx) &amp; CSV</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between text-xs font-bold text-purple-500">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4" />
                <span>Open DB Exporter Workspace</span>
              </div>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* CARD 2: SCALE SIMULATOR */}
          <Link
            href="/qa/wifi-scale"
            className="group glass-card p-8 rounded-3xl transition-all duration-300 flex flex-col justify-between space-y-6 hover:-translate-y-1.5 hover:shadow-rose-500/20"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 via-pink-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-rose-500/20 group-hover:scale-105 transition-transform">
                  <Scale className="w-7 h-7" />
                </div>
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border bg-rose-500/10 text-rose-500 border-rose-500/20">
                  Hardware Simulator
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-extrabold group-hover:text-rose-500 transition-colors">
                  Wi-Fi Scale Simulator
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  BUDRY MFD-300 scale protocol emulator. Broadcasts live weight streams over TCP socket &amp; HTTP bridge to CoDiNet app with random weight generation for QA testing.
                </p>
              </div>

              <div className="p-3 rounded-xl border border-white/20 dark:border-white/5 bg-white/40 dark:bg-black/30 space-y-1 text-xs">
                <div className="flex items-center justify-between font-medium">
                  <span className="text-slate-500 dark:text-slate-400">Scale Protocols:</span>
                  <span className="font-bold font-mono text-rose-500">
                    TCP (33581) • HTTP (3001)
                  </span>
                </div>
                <div className="flex items-center justify-between font-medium">
                  <span className="text-slate-500 dark:text-slate-400">Features:</span>
                  <span className="font-semibold">Random Weight Stream &amp; Live IP</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between text-xs font-bold text-rose-500">
              <div className="flex items-center gap-1.5">
                <Radio className="w-4 h-4" />
                <span>Open Scale Simulator</span>
              </div>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* CARD 3: 50mm × 30mm THERMAL PRINTER (PHYSICAL XP-365B & ADJUSTABLE TEXT SIZE) */}
          <Link
            href="/qa/thermal-printer"
            className="group glass-card p-8 rounded-3xl transition-all duration-300 flex flex-col justify-between space-y-6 hover:-translate-y-1.5 hover:shadow-blue-500/20 border-2 border-blue-500/20"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                  <Printer className="w-7 h-7" />
                </div>
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border bg-blue-500/10 text-blue-500 border-blue-500/20">
                  Card 1 • Label Studio
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-extrabold group-hover:text-blue-500 transition-colors flex items-center gap-2">
                  <span>50×30mm Thermal Printer</span>
                  <span className="px-2 py-0.5 text-[9px] rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 uppercase font-bold">
                    XP-365B
                  </span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Direct Chrome Web Bluetooth connection to physical XP-365B printer. Customize 50×30mm thermal stickers with adjustable text sizes, QR side positioning, and text-only mode.
                </p>
              </div>

              <div className="p-3 rounded-xl border border-white/20 dark:border-white/5 bg-white/40 dark:bg-black/30 space-y-1 text-xs">
                <div className="flex items-center justify-between font-medium">
                  <span className="text-slate-500 dark:text-slate-400">Driver &amp; Connection:</span>
                  <span className="font-bold font-mono text-blue-500">
                    Chrome Web Bluetooth (ISSC / FFE0)
                  </span>
                </div>
                <div className="flex items-center justify-between font-medium">
                  <span className="text-slate-500 dark:text-slate-400">Customization:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    Adjustable Text Size (F1-F4) • No-QR Mode
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between text-xs font-bold text-blue-500">
              <div className="flex items-center gap-1.5">
                <Sliders className="w-4 h-4" />
                <span>Open 50×30mm Printer Studio</span>
              </div>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* CARD 4: BLUETOOTH PRINTER BROADCAST (ACT AS REAL PRINTER FOR CODI NET PHONE) */}
          <Link
            href="/qa/thermal-printer"
            className="group glass-card p-8 rounded-3xl transition-all duration-300 flex flex-col justify-between space-y-6 hover:-translate-y-1.5 hover:shadow-emerald-500/20 border-2 border-emerald-500/20"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                  <Bluetooth className="w-7 h-7" />
                </div>
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                  Card 2 • Hardware Emulation
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-extrabold group-hover:text-emerald-500 transition-colors flex items-center gap-2">
                  <span>Bluetooth Broadcast (Napru Hashini Printer)</span>
                  <span className="px-2 py-0.5 text-[9px] rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 uppercase font-bold">
                    0x00 ACK
                  </span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Broadcasts your laptop natively as 'Napru Hashini Printer' over Bluetooth LE. Answers Codi Net with genuine 0x00 ACK responses so the mobile app never reverts order state.
                </p>
              </div>

              <div className="p-3 rounded-xl border border-white/20 dark:border-white/5 bg-white/40 dark:bg-black/30 space-y-1 text-xs">
                <div className="flex items-center justify-between font-medium">
                  <span className="text-slate-500 dark:text-slate-400">Broadcast Protocols:</span>
                  <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    Windows BLE (49535343 &amp; FFE0)
                  </span>
                </div>
                <div className="flex items-center justify-between font-medium">
                  <span className="text-slate-500 dark:text-slate-400">Order Protection:</span>
                  <span className="font-semibold text-blue-500">
                    Mirrored 0x00 Ready ACK (Zero Revert)
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4" />
                <span>Open Printer Broadcaster &amp; Phone Receiver</span>
              </div>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </main>

      <footer className="max-w-7xl w-full mx-auto p-6 text-center text-xs text-slate-400 border-t border-slate-200/50 dark:border-slate-800/50 mt-12">
        Mobile App Manager • QA Operations
      </footer>
    </div>
  );
}
