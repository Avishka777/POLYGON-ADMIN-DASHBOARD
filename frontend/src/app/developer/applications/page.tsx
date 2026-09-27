'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Globe,
  Layers,
  Lock,
  Moon,
  RefreshCw,
  Server,
  ShieldCheck,
  Sun,
  Tag,
  Zap,
} from 'lucide-react';
import { POLYGON_PROJECTS } from '@/lib/developer/backendHealthConfig';
import { KingDeveloperIcon } from '@/components/common/icons/KingDeveloperIcon';
import { useTheme } from '@/context/ThemeContext';
import { clearDeveloperAccess } from '@/lib/developer/security';

export default function ApplicationsHubPage() {
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
          <Link
            href="/developer"
            className="w-11 h-11 rounded-2xl glass-card flex items-center justify-center hover:scale-105 transition-transform"
            title="Return to Developer Dashboard"
          >
            <KingDeveloperIcon size={30} />
          </Link>

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
              Ecosystem Applications Hub • Dedicated diagnostic pages per app
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

          <Link
            href="/developer"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all glass-card hover:bg-slate-200 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="w-4 h-4 text-indigo-500" />
            <span>Developer Hub</span>
          </Link>

          <Link
            href="/select-role"
            className="p-2 rounded-xl glass-card text-xs font-bold transition-all"
            title="Switch User Role"
          >
            <RefreshCw className="w-4 h-4 text-indigo-500" />
          </Link>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl glass-card text-xs font-bold transition-all"
            title="Toggle Light / Dark Theme"
          >
            {isLightTheme ? (
              <Sun className="w-4 h-4 text-amber-500 fill-amber-500" />
            ) : (
              <Moon className="w-4 h-4 text-purple-400" />
            )}
          </button>
        </div>
      </header>

      {/* Main Applications Hub Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-8">
        {/* Banner with Glassmorphic Styling */}
        <section className="glass-panel p-6 sm:p-8 rounded-3xl relative overflow-hidden">
          <div className="max-w-3xl space-y-3 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border bg-indigo-500/10 text-indigo-500 border-indigo-500/30">
              <Server className="w-3.5 h-3.5 text-indigo-500" />
              <span>Mobile Applications Operations Catalog</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
              Polygon Mobile Ecosystem Applications
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
              Select an application below to open its dedicated status and operations page. Click on <strong>Polygon Mobile</strong> to inspect its full suite of 6 health probes and application version routes.
            </p>
          </div>
        </section>

        {/* 6 APPLICATIONS CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {POLYGON_PROJECTS.map((project) => {
            const isPolygon = project.id === 'polygon';
            const appUrl = `/developer/applications/${project.id}`;

            return (
              <Link
                key={project.id}
                href={appUrl}
                className={`group glass-card p-6 rounded-3xl transition-all duration-300 flex flex-col justify-between space-y-6 hover:-translate-y-1.5 ${
                  isPolygon
                    ? 'hover:shadow-purple-500/25 border-purple-500/30'
                    : 'hover:shadow-indigo-500/20'
                }`}
              >
                <div className="space-y-4">
                  {/* Top Header: App Icon & Badge */}
                  <div className="flex items-center justify-between">
                    <div className="w-14 h-14 rounded-2xl p-2.5 glass-panel flex items-center justify-center group-hover:scale-105 transition-transform shadow-md">
                      <img
                        src={project.icon}
                        alt={project.name}
                        className="w-10 h-10 rounded-xl object-contain"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                        isPolygon
                          ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30'
                          : 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'
                      }`}
                    >
                      {isPolygon ? '6 Routes Suite' : '3 Envs'}
                    </span>
                  </div>

                  {/* Title & Subtitle */}
                  <div className="space-y-1">
                    <h3 className="text-xl font-extrabold group-hover:text-indigo-500 transition-colors">
                      {project.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {project.subtitle}
                    </p>
                  </div>

                  {/* Highlights Pill */}
                  {isPolygon ? (
                    <div className="p-3 rounded-2xl border border-purple-500/20 bg-purple-500/5 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between font-medium">
                        <span className="text-slate-500 dark:text-slate-400">Routes Included:</span>
                        <span className="font-bold text-purple-500">Version & 5 Health</span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 truncate">
                        /api/app-version, /health, /health/detailed, /live, /ready, /home
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-2xl border border-white/20 dark:border-white/5 bg-white/40 dark:bg-black/30 space-y-1 text-xs">
                      <div className="flex items-center justify-between font-medium">
                        <span className="text-slate-500 dark:text-slate-400">Environments:</span>
                        <span className="font-semibold">DEV • UAT • PROD</span>
                      </div>
                      <div className="flex items-center justify-between font-medium">
                        <span className="text-slate-500 dark:text-slate-400">Endpoint:</span>
                        <span className="font-mono text-indigo-500">.../health</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Action Link */}
                <div
                  className={`pt-4 border-t border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between text-xs font-bold ${
                    isPolygon ? 'text-purple-500' : 'text-indigo-500'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Activity className="w-4 h-4" />
                    <span>{isPolygon ? 'Inspect Polygon Routes' : `Inspect ${project.name}`}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl w-full mx-auto p-6 text-center text-xs text-slate-400 border-t border-slate-200/50 dark:border-slate-800/50 mt-12">
        Mobile App Manager • Developer Applications Operations Hub
      </footer>
    </div>
  );
}
