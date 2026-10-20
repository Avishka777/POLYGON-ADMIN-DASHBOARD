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
  UserCheck,
  KeyRound,
  Bell,
  Zap,
  Box,
  ShoppingBag,
  Printer,
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

        {/* 5-CARD GLASSMORPHIC GRID */}
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

          {/* CARD 4: OFFICER STATUS & PASSWORD MANAGER */}
          <Link
            href="/developer/officer-status"
            className="group glass-card p-7 rounded-3xl transition-all duration-300 flex flex-col justify-between space-y-6 hover:-translate-y-1.5 hover:shadow-emerald-500/20"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                  <UserCheck className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Admin Panel Sync
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-extrabold group-hover:text-emerald-500 transition-colors">
                  Officer Status Manager
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Connect to DEV/UAT databases. Change officer status, auto-generate bcrypt passwords, and trigger mobile app synchronization.
                </p>
              </div>

              <div className="p-3 rounded-xl border border-white/20 dark:border-white/5 bg-white/40 dark:bg-black/30 space-y-1 text-xs">
                <div className="flex items-center justify-between font-medium">
                  <span className="text-slate-500 dark:text-slate-400">Environments:</span>
                  <span className="font-semibold text-emerald-500">DEV & UAT MySQL</span>
                </div>
                <div className="flex items-center justify-between font-medium">
                  <span className="text-slate-500 dark:text-slate-400">API Sync:</span>
                  <span className="font-mono font-bold">Collector & Transporter</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between text-xs font-bold text-emerald-500">
              <div className="flex items-center gap-1.5">
                <KeyRound className="w-4 h-4" />
                <span>Open Status Manager</span>
              </div>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* CARD 5: SALES DASH NOTIFICATION HUB */}
          <Link
            href="/developer/sales-dash-notifications"
            className="group glass-card p-7 rounded-3xl transition-all duration-300 flex flex-col justify-between space-y-6 hover:-translate-y-1.5 hover:shadow-amber-500/20"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
                  <Bell className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  Real-Time Webhook
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-extrabold group-hover:text-amber-500 transition-colors">
                  Sales Dash Notification Hub
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Trigger instant zero-polling notifications to Sales Agents across DEV, UAT, and Local environments with live WebSocket & push delivery.
                </p>
              </div>

              <div className="p-3 rounded-xl border border-white/20 dark:border-white/5 bg-white/40 dark:bg-black/30 space-y-1 text-xs">
                <div className="flex items-center justify-between font-medium">
                  <span className="text-slate-500 dark:text-slate-400">Environments:</span>
                  <span className="font-semibold text-amber-500">DEV, UAT & Local</span>
                </div>
                <div className="flex items-center justify-between font-medium">
                  <span className="text-slate-500 dark:text-slate-400">Trigger Target:</span>
                  <span className="font-mono font-bold">/api/notifications/trigger</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between text-xs font-bold text-amber-500">
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4" />
                <span>Open Notification Hub</span>
              </div>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* CARD 6: PACKAGE UPDATE HUB */}
          <Link
            href="/developer/package-updates"
            className="group glass-card p-7 rounded-3xl transition-all duration-300 flex flex-col justify-between space-y-6 hover:-translate-y-1.5 hover:shadow-purple-500/20"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-purple-600 via-indigo-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform">
                  <Box className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                  Cache & Socket Sync
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-extrabold group-hover:text-purple-500 transition-colors">
                  Package Real-Time Sync Hub
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Broadcast package creates, edits, and status changes simultaneously to Sales Dash and Polygon (GoviMart) Mobile APIs.
                </p>
              </div>

              <div className="p-3 rounded-xl border border-white/20 dark:border-white/5 bg-white/40 dark:bg-black/30 space-y-1 text-xs">
                <div className="flex items-center justify-between font-medium">
                  <span className="text-slate-500 dark:text-slate-400">Target Ecosystem:</span>
                  <span className="font-semibold text-purple-500">SalesDash & GoviMart</span>
                </div>
                <div className="flex items-center justify-between font-medium">
                  <span className="text-slate-500 dark:text-slate-400">Sync Channels:</span>
                  <span className="font-mono font-bold">NodeCache + WebSocket</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between text-xs font-bold text-purple-500">
              <div className="flex items-center gap-1.5">
                <Radio className="w-4 h-4" />
                <span>Open Package Sync Hub</span>
              </div>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* CARD 7: POLYGON (GOVIMART) NOTIFICATION HUB */}
          <Link
            href="/developer/polygon-notifications"
            className="group glass-card p-7 rounded-3xl transition-all duration-300 flex flex-col justify-between space-y-6 hover:-translate-y-1.5 hover:shadow-cyan-500/20"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-cyan-600 via-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                  Thin Event Trigger
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-extrabold group-hover:text-cyan-500 transition-colors">
                  Polygon (GoviMart) Notification Hub
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Trigger real-time notifications to GoviMart marketplace customers using lightweight thin-event socket signals & verified DB updates.
                </p>
              </div>

              <div className="p-3 rounded-xl border border-white/20 dark:border-white/5 bg-white/40 dark:bg-black/30 space-y-1 text-xs">
                <div className="flex items-center justify-between font-medium">
                  <span className="text-slate-500 dark:text-slate-400">Target Ecosystem:</span>
                  <span className="font-semibold text-cyan-500">Polygon GoviMart Customers</span>
                </div>
                <div className="flex items-center justify-between font-medium">
                  <span className="text-slate-500 dark:text-slate-400">Socket Protocol:</span>
                  <span className="font-mono font-bold">user_&#123;userId&#125; • new_notification</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between text-xs font-bold text-cyan-500">
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4" />
                <span>Open GoviMart Hub</span>
              </div>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* CARD 8: VIRTUAL THERMAL PRINTER HUB */}
          <Link
            href="/developer/thermal-printer"
            className="group glass-card p-7 rounded-3xl transition-all duration-300 flex flex-col justify-between space-y-6 hover:-translate-y-1.5 hover:shadow-blue-500/20"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                  <Printer className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  Label Hardware Hub
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-extrabold group-hover:text-blue-500 transition-colors">
                  Virtual Thermal Printer Hub
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Real-time TSPL Bluetooth & LAN printer hub. Visualizes live 50x30mm thermal label packing stickers from Codi Net with QR codes & feed animations.
                </p>
              </div>

              <div className="p-3 rounded-xl border border-white/20 dark:border-white/5 bg-white/40 dark:bg-black/30 space-y-1 text-xs">
                <div className="flex items-center justify-between font-medium">
                  <span className="text-slate-500 dark:text-slate-400">Protocols:</span>
                  <span className="text-blue-500 font-bold font-mono">TCP:33582 • HTTP:3002</span>
                </div>
                <div className="flex items-center justify-between font-medium">
                  <span className="text-slate-500 dark:text-slate-400">Label Format:</span>
                  <span className="font-semibold">50mm × 30mm TSPL Theme 2</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between text-xs font-bold text-blue-500">
              <div className="flex items-center gap-1.5">
                <Printer className="w-4 h-4" />
                <span>Open Virtual Printer Hub</span>
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
