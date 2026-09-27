'use client';

import React, { useState } from 'react';
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Code2,
  Copy,
  Cpu,
  Database,
  ExternalLink,
  Flame,
  Globe,
  HardDrive,
  Home,
  Layers,
  Loader2,
  Moon,
  Play,
  Radio,
  RefreshCw,
  Server,
  ShieldCheck,
  Sun,
  Tag,
  Terminal,
  Zap,
} from 'lucide-react';
import {
  POLYGON_PROJECTS,
  ProjectHealthConfig,
  EnvironmentConfig,
  AppRouteConfig,
  buildRouteUrl,
} from '@/lib/developer/backendHealthConfig';
import { KingDeveloperIcon } from '@/components/common/icons/KingDeveloperIcon';

export interface HealthCheckResult {
  success: boolean;
  healthy: boolean;
  statusCode: number;
  statusText: string;
  latencyMs: number;
  data: any;
  error?: string;
  url: string;
  timestamp: string;
}

interface BackendHealthPageProps {
  onGoToMenu: () => void;
  onSwitchRole: () => void;
  isLightTheme: boolean;
  onToggleTheme: () => void;
}

export const BackendHealthPage: React.FC<BackendHealthPageProps> = ({
  onGoToMenu,
  onSwitchRole,
  isLightTheme,
  onToggleTheme,
}) => {
  // Filter: 'all' to show all 6 app sections, or specific project id ('polygon', 'codi-net', etc.)
  const [filterProjectId, setFilterProjectId] = useState<string>('all');

  // Polygon environment tab selector: 'DEV' | 'UAT' | 'PROD' | 'ALL'
  const [polygonActiveEnv, setPolygonActiveEnv] = useState<'DEV' | 'UAT' | 'PROD' | 'ALL'>('DEV');

  // Results & Loading states keyed by url
  const [results, setResults] = useState<Record<string, HealthCheckResult>>({});
  const [loadingUrls, setLoadingUrls] = useState<Record<string, boolean>>({});

  // Global batch checking flags
  const [isCheckingAll, setIsCheckingAll] = useState(false);
  const [isCheckingPolygon, setIsCheckingPolygon] = useState(false);

  // Copied feedback
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Expandable payload viewer per URL
  const [expandedPayloads, setExpandedPayloads] = useState<Record<string, boolean>>({});

  // Ping a single endpoint via the server proxy
  const checkSingleUrl = async (url: string) => {
    setLoadingUrls((prev) => ({ ...prev, [url]: true }));
    try {
      const res = await fetch('/api/developer/health-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, timeoutMs: 8000 }),
      });
      const data: HealthCheckResult = await res.json();
      setResults((prev) => ({ ...prev, [url]: data }));
    } catch (err: any) {
      setResults((prev) => ({
        ...prev,
        [url]: {
          success: false,
          healthy: false,
          statusCode: 0,
          statusText: 'Client Error',
          latencyMs: 0,
          data: null,
          error: err.message,
          url,
          timestamp: new Date().toISOString(),
        },
      }));
    } finally {
      setLoadingUrls((prev) => ({ ...prev, [url]: false }));
    }
  };

  // Ping all 3 environments for a specific standard project
  const checkProjectEnvironments = async (projectId: string) => {
    const proj = POLYGON_PROJECTS.find((p) => p.id === projectId);
    if (!proj) return;
    await Promise.all(proj.environments.map((env) => checkSingleUrl(env.healthUrl)));
  };

  // Ping Polygon routes for a specific environment or all environments
  const checkPolygonRoutesForEnv = async (envName: 'DEV' | 'UAT' | 'PROD' | 'ALL') => {
    setIsCheckingPolygon(true);
    const polygon = POLYGON_PROJECTS.find((p) => p.id === 'polygon');
    if (!polygon || !polygon.routes) {
      setIsCheckingPolygon(false);
      return;
    }

    const envsToTest =
      envName === 'ALL'
        ? polygon.environments
        : polygon.environments.filter((e) => e.name === envName);

    const urls = envsToTest.flatMap((env) =>
      polygon.routes!.map((route) => buildRouteUrl(env.baseUrl, route.path))
    );

    await Promise.all(urls.map((url) => checkSingleUrl(url)));
    setIsCheckingPolygon(false);
  };

  // Ping all endpoints across all 6 projects (including Polygon's specialized routes)
  const checkAllProjects = async () => {
    setIsCheckingAll(true);
    const basicUrls = POLYGON_PROJECTS.flatMap((p) => p.environments.map((e) => e.healthUrl));
    const polygon = POLYGON_PROJECTS.find((p) => p.id === 'polygon');
    const polygonExtraUrls =
      polygon && polygon.routes
        ? polygon.environments.flatMap((env) =>
            polygon.routes!.map((r) => buildRouteUrl(env.baseUrl, r.path))
          )
        : [];
    const allUrls = Array.from(new Set([...basicUrls, ...polygonExtraUrls]));

    await Promise.all(allUrls.map((url) => checkSingleUrl(url)));
    setIsCheckingAll(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(text);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const toggleExpand = (url: string) => {
    setExpandedPayloads((prev) => ({ ...prev, [url]: !prev[url] }));
  };

  // Compute stats across tested endpoints
  const totalBaseEndpoints = POLYGON_PROJECTS.reduce((acc, p) => acc + p.environments.length, 0);
  const testedResults = Object.values(results);
  const testedCount = testedResults.length;
  const healthyCount = testedResults.filter((r) => r.healthy).length;
  const unhealthyCount = testedResults.filter((r) => !r.healthy).length;

  // Project-level summary helper
  const getProjectStatusSummary = (project: ProjectHealthConfig) => {
    const envResults = project.environments.map((e) => results[e.healthUrl]);
    const tested = envResults.filter(Boolean);
    if (tested.length === 0) return { label: 'Not Tested', color: 'slate' };
    const hCount = tested.filter((r) => r.healthy).length;
    if (hCount === project.environments.length) {
      return { label: `${hCount}/${project.environments.length} Online`, color: 'emerald' };
    }
    if (hCount > 0) {
      return { label: `${hCount}/${project.environments.length} Degraded`, color: 'amber' };
    }
    return { label: 'All Offline', color: 'rose' };
  };

  const displayedProjects =
    filterProjectId === 'all'
      ? POLYGON_PROJECTS
      : POLYGON_PROJECTS.filter((p) => p.id === filterProjectId);

  // Helper to get Route Icon & Color
  const getRouteBadge = (type: AppRouteConfig['type']) => {
    switch (type) {
      case 'version':
        return {
          icon: <Tag className="w-3 h-3 text-purple-400" />,
          label: 'APP VERSION',
          badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
        };
      case 'health':
        return {
          icon: <Activity className="w-3 h-3 text-emerald-400" />,
          label: 'BASIC HEALTH',
          badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        };
      case 'detailed':
        return {
          icon: <Cpu className="w-3 h-3 text-blue-400" />,
          label: 'SYSTEM & MEMORY',
          badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
        };
      case 'live':
        return {
          icon: <Radio className="w-3 h-3 text-amber-400" />,
          label: 'LIVENESS PROBE',
          badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
        };
      case 'ready':
        return {
          icon: <ShieldCheck className="w-3 h-3 text-cyan-400" />,
          label: 'READINESS PROBE',
          badgeColor: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
        };
      case 'home':
        return {
          icon: <Home className="w-3 h-3 text-slate-400" />,
          label: 'API DIRECTORY',
          badgeColor: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30',
        };
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${
        isLightTheme ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'
      }`}
    >
      {/* Top Navigation Header */}
      <header
        className={`sticky top-0 z-40 border-b backdrop-blur-md px-6 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4 transition-colors ${
          isLightTheme
            ? 'bg-white/90 border-slate-200 shadow-xs'
            : 'bg-slate-900/90 border-slate-800'
        }`}
      >
        {/* Brand & Role Indicator */}
        <div className="flex items-center gap-3">
          <button
            onClick={onGoToMenu}
            title="Return to Menu Hub"
            className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-amber-500 flex items-center justify-center text-white shadow-md overflow-hidden p-0.5 group hover:scale-105 transition-transform cursor-pointer"
          >
            <KingDeveloperIcon size={34} />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
                Mobile App Manager
              </h1>
              <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full border bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30">
                King of Developer
              </span>
              <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full border bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 hidden sm:inline-flex items-center gap-1">
                <Layers className="w-3 h-3" />
                All App State
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Ecosystem state monitor • Health probes, detailed diagnostics & version routes across all 6 apps
            </p>
          </div>
        </div>

        {/* Global Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Ping All Button */}
          <button
            onClick={checkAllProjects}
            disabled={isCheckingAll}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 cursor-pointer"
            title="Ping all endpoints across DEV, UAT and PROD for all 6 apps"
          >
            {isCheckingAll ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span>{isCheckingAll ? 'Testing All Envs...' : 'Ping All 6 Apps'}</span>
          </button>

          {/* Return to Menu Hub Button */}
          <button
            onClick={onGoToMenu}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border shadow-xs ${
              isLightTheme
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            <ArrowLeft className="w-4 h-4 text-indigo-500" />
            <span>Menu Hub</span>
          </button>

          {/* Switch Role Button */}
          <button
            onClick={onSwitchRole}
            className={`p-2 rounded-xl border text-xs font-bold transition-all shadow-xs ${
              isLightTheme
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
            title="Switch User Role"
          >
            <RefreshCw className="w-4 h-4 text-indigo-500" />
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

      {/* Main Page Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-8">
        {/* Banner with Live Ecosystem Summary */}
        <section
          className={`p-6 sm:p-8 rounded-3xl border shadow-xl relative overflow-hidden ${
            isLightTheme
              ? 'bg-gradient-to-r from-indigo-50/80 via-white to-amber-50/80 border-indigo-100'
              : 'bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-900 border-indigo-900/30'
          }`}
        >
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
            <div className="max-w-2xl space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30">
                <Layers className="w-3.5 h-3.5 text-indigo-500" />
                <span>All App State Operations Center</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                Polygon Mobile Ecosystem — All App State
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                Inspect backend server status, system diagnostics, and version verification across DEV, UAT, and PROD for all 6 Polygon mobile apps. Click on <strong>Polygon Mobile</strong> to inspect all 6 dedicated health & version routes.
              </p>
            </div>

            {/* Quick Metrics Cards */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <div
                className={`p-3.5 rounded-2xl border text-center min-w-[90px] ${
                  isLightTheme ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800'
                }`}
              >
                <span className="text-[10px] font-black uppercase text-slate-400 block">Projects</span>
                <span className="text-xl font-black text-slate-900 dark:text-white">6</span>
              </div>

              <div
                className={`p-3.5 rounded-2xl border text-center min-w-[90px] ${
                  isLightTheme ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800'
                }`}
              >
                <span className="text-[10px] font-black uppercase text-slate-400 block">Base Envs</span>
                <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">{totalBaseEndpoints}</span>
              </div>

              <div
                className={`p-3.5 rounded-2xl border text-center min-w-[90px] ${
                  isLightTheme ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800'
                }`}
              >
                <span className="text-[10px] font-black uppercase text-slate-400 block">Tested</span>
                <span className="text-xl font-black text-slate-700 dark:text-slate-300">{testedCount}</span>
              </div>

              <div
                className={`p-3.5 rounded-2xl border text-center min-w-[90px] ${
                  isLightTheme ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800'
                }`}
              >
                <span className="text-[10px] font-black uppercase text-slate-400 block">Healthy</span>
                <span className="text-xl font-black text-emerald-500">{healthyCount}</span>
              </div>

              {unhealthyCount > 0 && (
                <div
                  className={`p-3.5 rounded-2xl border text-center min-w-[90px] ${
                    isLightTheme ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Issues</span>
                  <span className="text-xl font-black text-rose-500">{unhealthyCount}</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Project Selector Bar (All 6 App Sections + Individual Filter) */}
        <section
          className={`p-2.5 rounded-3xl border shadow-sm ${
            isLightTheme ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}
        >
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none p-1">
            {/* "All 6 Apps" Button */}
            <button
              onClick={() => setFilterProjectId('all')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer shrink-0 ${
                filterProjectId === 'all'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : isLightTheme
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              <Server className="w-4 h-4" />
              <span>All 6 Mobile Apps</span>
            </button>

            {/* Individual App Filter Buttons with Official Icons */}
            {POLYGON_PROJECTS.map((proj) => {
              const isSelected = filterProjectId === proj.id;
              const summary = getProjectStatusSummary(proj);

              return (
                <button
                  key={proj.id}
                  onClick={() => setFilterProjectId(proj.id)}
                  className={`flex items-center gap-2.5 px-3.5 py-2 rounded-2xl border text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    isSelected
                      ? isLightTheme
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-300 shadow-sm ring-2 ring-indigo-500/20'
                        : 'bg-slate-800 text-white border-indigo-500 shadow-sm ring-2 ring-indigo-500/30'
                      : isLightTheme
                      ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                      : 'bg-slate-950/60 hover:bg-slate-800 text-slate-300 border-slate-800'
                  }`}
                >
                  <img
                    src={proj.icon}
                    alt={proj.name}
                    className="w-5 h-5 rounded-md object-contain shrink-0"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <span>{proj.name}</span>

                  {proj.id === 'polygon' && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-black uppercase bg-purple-500/20 text-purple-600 dark:text-purple-400">
                      6 Routes
                    </span>
                  )}

                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                      summary.color === 'emerald'
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                        : summary.color === 'amber'
                        ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                        : summary.color === 'rose'
                        ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                        : 'bg-slate-500/10 text-slate-400'
                    }`}
                  >
                    {summary.label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* The 6 App Sections List */}
        <div className="space-y-8">
          {displayedProjects.map((project) => {
            const summary = getProjectStatusSummary(project);
            const isPolygon = project.id === 'polygon';

            // Special UI for Polygon Mobile: Show all 6 health and version routes
            if (isPolygon && project.routes) {
              const activeEnvs =
                polygonActiveEnv === 'ALL'
                  ? project.environments
                  : project.environments.filter((e) => e.name === polygonActiveEnv);

              return (
                <section
                  key={project.id}
                  id={`project-${project.id}`}
                  className={`p-6 sm:p-8 rounded-3xl border shadow-xl transition-all space-y-6 ${
                    isLightTheme
                      ? 'bg-white border-purple-200/80 shadow-purple-50/50'
                      : 'bg-slate-900 border-purple-900/40 shadow-black/40'
                  }`}
                >
                  {/* Polygon Header */}
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl p-2 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 shadow-md flex items-center justify-center shrink-0">
                        <img
                          src={project.icon}
                          alt={project.name}
                          className="w-10 h-10 rounded-xl object-contain"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                            {project.name}
                          </h3>
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider border bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30">
                            Core App • Full Health & Version Suite
                          </span>
                          <span
                            className={`text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider border ${
                              summary.color === 'emerald'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                : summary.color === 'amber'
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                : summary.color === 'rose'
                                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                                : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                            }`}
                          >
                            {summary.label}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                          Inspect version endpoint (<code>/api/app-version</code>) and all health probes (<code>/health</code>, <code>/health/detailed</code>, <code>/health/live</code>, <code>/health/ready</code>, <code>/home</code>).
                        </p>
                      </div>
                    </div>

                    {/* Environment Tabs & Ping All Polygon Routes */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {/* Env Switcher Tabs */}
                      <div
                        className={`p-1 rounded-xl border flex items-center gap-1 ${
                          isLightTheme ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-slate-800'
                        }`}
                      >
                        {(['DEV', 'UAT', 'PROD', 'ALL'] as const).map((envTab) => (
                          <button
                            key={envTab}
                            onClick={() => setPolygonActiveEnv(envTab)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                              polygonActiveEnv === envTab
                                ? 'bg-purple-600 text-white shadow-xs'
                                : isLightTheme
                                ? 'text-slate-600 hover:text-slate-900'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            {envTab}
                          </button>
                        ))}
                      </div>

                      {/* Ping Button for Polygon */}
                      <button
                        onClick={() => checkPolygonRoutesForEnv(polygonActiveEnv)}
                        disabled={isCheckingPolygon}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                        title={`Ping all routes for ${polygonActiveEnv}`}
                      >
                        {isCheckingPolygon ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="w-3.5 h-3.5" />
                        )}
                        <span>Ping Polygon Routes</span>
                      </button>
                    </div>
                  </div>

                  {/* Render Routes per Active Environment */}
                  <div className="space-y-8">
                    {activeEnvs.map((env) => {
                      const envBadgeColor =
                        env.name === 'DEV'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                          : env.name === 'UAT'
                          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30'
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';

                      return (
                        <div key={env.name} className="space-y-4">
                          {/* Env Section Subheader */}
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2.5 py-0.5 text-xs font-black uppercase tracking-wider rounded-lg border ${envBadgeColor}`}
                              >
                                {env.name} Environment
                              </span>
                              <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                                {env.baseUrl}
                              </span>
                            </div>

                            <button
                              onClick={() => checkPolygonRoutesForEnv(env.name)}
                              disabled={isCheckingPolygon}
                              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border text-[11px] font-bold transition-all shadow-xs ${
                                isLightTheme
                                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                              }`}
                            >
                              <Play className="w-3 h-3 text-purple-500 fill-purple-500" />
                              <span>Ping {env.name} Routes</span>
                            </button>
                          </div>

                          {/* 6 Routes Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {project.routes!.map((route) => {
                              const routeUrl = buildRouteUrl(env.baseUrl, route.path);
                              const result = results[routeUrl];
                              const isLoading = loadingUrls[routeUrl] || false;
                              const isExpanded = expandedPayloads[routeUrl] || false;
                              const badge = getRouteBadge(route.type);

                              // Check if result data contains version info
                              const detectedVersion =
                                result?.data?.version ||
                                result?.data?.appVersion ||
                                (typeof result?.data === 'string' && result?.data.length < 20
                                  ? result.data
                                  : null);

                              return (
                                <div
                                  key={route.id}
                                  className={`rounded-2xl border flex flex-col justify-between transition-all ${
                                    result
                                      ? result.healthy
                                        ? isLightTheme
                                          ? 'bg-white border-slate-200 hover:border-purple-300'
                                          : 'bg-slate-950/60 border-slate-800 hover:border-purple-500/40'
                                        : isLightTheme
                                        ? 'bg-rose-50/40 border-rose-200'
                                        : 'bg-rose-950/20 border-rose-900/40'
                                      : isLightTheme
                                      ? 'bg-slate-50/60 border-slate-200'
                                      : 'bg-slate-950/40 border-slate-800'
                                  }`}
                                >
                                  <div className="p-4 space-y-3">
                                    {/* Top Row: Method & Route Type Badge */}
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-1.5">
                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                                          {route.method}
                                        </span>
                                        <span
                                          className={`flex items-center gap-1 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-lg border ${badge.badgeColor}`}
                                        >
                                          {badge.icon}
                                          <span>{badge.label}</span>
                                        </span>
                                      </div>

                                      {/* Status Code */}
                                      {isLoading ? (
                                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-500">
                                          <Loader2 className="w-3 h-3 animate-spin" />
                                          <span>Pinging...</span>
                                        </span>
                                      ) : result ? (
                                        result.healthy ? (
                                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                            <span>{result.statusCode} OK</span>
                                          </span>
                                        ) : (
                                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                                            <AlertCircle className="w-3 h-3 text-rose-500" />
                                            <span>{result.statusCode > 0 ? `${result.statusCode}` : 'Error'}</span>
                                          </span>
                                        )
                                      ) : (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-500/10 text-slate-400">
                                          Ready
                                        </span>
                                      )}
                                    </div>

                                    {/* Route Name & Description */}
                                    <div className="space-y-1">
                                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                                        {route.name}
                                      </h4>
                                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug line-clamp-2">
                                        {route.description}
                                      </p>
                                    </div>

                                    {/* URL Pill */}
                                    <div className="flex items-center gap-1">
                                      <code
                                        className={`text-[11px] font-mono font-bold px-2 py-1 rounded-lg border flex-1 truncate select-all ${
                                          isLightTheme
                                            ? 'bg-slate-100 text-slate-800 border-slate-200'
                                            : 'bg-slate-900 text-slate-200 border-slate-800'
                                        }`}
                                        title={routeUrl}
                                      >
                                        /{route.path}
                                      </code>

                                      <button
                                        onClick={() => copyToClipboard(routeUrl)}
                                        className={`p-1.5 rounded-lg border text-xs font-bold transition-all shrink-0 ${
                                          copiedUrl === routeUrl
                                            ? 'bg-emerald-500 text-white border-emerald-500'
                                            : isLightTheme
                                            ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-600'
                                            : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                                        }`}
                                        title="Copy full URL"
                                      >
                                        {copiedUrl === routeUrl ? (
                                          <Check className="w-3 h-3" />
                                        ) : (
                                          <Copy className="w-3 h-3" />
                                        )}
                                      </button>

                                      <a
                                        href={routeUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`p-1.5 rounded-lg border text-xs font-bold transition-all shrink-0 ${
                                          isLightTheme
                                            ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-600'
                                            : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                                        }`}
                                        title="Open in browser"
                                      >
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                    </div>

                                    {/* Highlights: Detected Version Badge */}
                                    {route.type === 'version' && detectedVersion && (
                                      <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-between text-xs">
                                        <span className="text-purple-600 dark:text-purple-300 font-bold flex items-center gap-1.5">
                                          <Tag className="w-3.5 h-3.5 text-purple-500" />
                                          Version Detected:
                                        </span>
                                        <span className="font-mono font-black text-purple-700 dark:text-purple-200 bg-purple-500/20 px-2 py-0.5 rounded-md">
                                          {String(detectedVersion)}
                                        </span>
                                      </div>
                                    )}

                                    {/* Highlights: Detailed Health Diagnostic Pills */}
                                    {route.type === 'detailed' && result?.data && (
                                      <div className="space-y-1.5 text-[10px] p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                        {result.data.application && (
                                          <div className="flex items-center justify-between">
                                            <span className="text-slate-500">App Name / Node:</span>
                                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                                              {result.data.application.name} ({result.data.application.nodeVersion})
                                            </span>
                                          </div>
                                        )}
                                        {result.data.application?.memoryUsage && (
                                          <div className="flex items-center justify-between">
                                            <span className="text-slate-500">RSS / Heap:</span>
                                            <span className="font-mono text-indigo-500 dark:text-indigo-400 font-bold">
                                              {result.data.application.memoryUsage.rss} • {result.data.application.memoryUsage.heapUsed}
                                            </span>
                                          </div>
                                        )}
                                        {result.data.system?.hostname && (
                                          <div className="flex items-center justify-between">
                                            <span className="text-slate-500">Host / CPUs:</span>
                                            <span className="text-slate-700 dark:text-slate-300">
                                              {result.data.system.hostname} ({result.data.system.cpus} cores)
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    {/* Latency & Timestamp */}
                                    {result && (
                                      <div className="flex items-center justify-between text-xs pt-0.5">
                                        <span
                                          className={`flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                            result.latencyMs < 250
                                              ? 'bg-emerald-500/10 text-emerald-500'
                                              : result.latencyMs < 600
                                              ? 'bg-amber-500/10 text-amber-500'
                                              : 'bg-rose-500/10 text-rose-500'
                                          }`}
                                        >
                                          <Clock className="w-3 h-3" />
                                          <span>{result.latencyMs} ms</span>
                                        </span>

                                        <span className="text-[10px] text-slate-400 font-mono">
                                          {new Date(result.timestamp).toLocaleTimeString()}
                                        </span>
                                      </div>
                                    )}

                                    {/* Error Message */}
                                    {result && result.error && (
                                      <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
                                        {result.error}
                                      </div>
                                    )}

                                    {/* Expandable JSON Payload */}
                                    {isExpanded && result && (
                                      <div
                                        className={`p-3 rounded-xl font-mono text-xs overflow-x-auto max-h-48 ${
                                          isLightTheme ? 'bg-slate-900 text-slate-200' : 'bg-black text-slate-200'
                                        }`}
                                      >
                                        {result.data !== null && result.data !== undefined ? (
                                          <pre className="text-purple-300 text-[11px] whitespace-pre-wrap break-all">
                                            {typeof result.data === 'object'
                                              ? JSON.stringify(result.data, null, 2)
                                              : String(result.data)}
                                          </pre>
                                        ) : (
                                          <div className="text-slate-500 text-[11px] italic">No response body.</div>
                                        )}
                                      </div>
                                    )}
                                  </div>

                                  {/* Card Bottom Actions */}
                                  <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                                    {result ? (
                                      <button
                                        onClick={() => toggleExpand(routeUrl)}
                                        className={`flex items-center gap-1 text-[11px] font-bold ${
                                          isLightTheme
                                            ? 'text-purple-600 hover:text-purple-800'
                                            : 'text-purple-400 hover:text-purple-300'
                                        }`}
                                      >
                                        <Terminal className="w-3 h-3" />
                                        <span>{isExpanded ? 'Hide' : 'Payload'}</span>
                                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                      </button>
                                    ) : (
                                      <span className="text-[10px] text-slate-400">Ready</span>
                                    )}

                                    <button
                                      onClick={() => checkSingleUrl(routeUrl)}
                                      disabled={isLoading}
                                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                                    >
                                      {isLoading ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                      ) : (
                                        <Play className="w-3 h-3 fill-white" />
                                      )}
                                      <span>Ping</span>
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            }

            // Standard Section for other 5 mobile apps
            return (
              <section
                key={project.id}
                id={`project-${project.id}`}
                className={`p-6 sm:p-8 rounded-3xl border shadow-xl transition-all space-y-6 ${
                  isLightTheme
                    ? 'bg-white border-slate-200 hover:border-slate-300'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Project Section Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md flex items-center justify-center shrink-0">
                      <img
                        src={project.icon}
                        alt={project.name}
                        className="w-10 h-10 rounded-xl object-contain"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                          {project.name}
                        </h3>
                        <span
                          className={`text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider border ${
                            summary.color === 'emerald'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                              : summary.color === 'amber'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                              : summary.color === 'rose'
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                              : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                          }`}
                        >
                          {summary.label}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                        {project.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Re-check this project button */}
                  <button
                    onClick={() => checkProjectEnvironments(project.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer ${
                      isLightTheme
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                    }`}
                    title={`Ping DEV, UAT and PROD for ${project.name}`}
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Ping {project.name} Envs</span>
                  </button>
                </div>

                {/* 3 Environment Cards: DEV, UAT, PROD in 3-column grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  {project.environments.map((env) => {
                    const result = results[env.healthUrl];
                    const isLoading = loadingUrls[env.healthUrl] || false;
                    const isExpanded = expandedPayloads[env.healthUrl] || false;

                    const envBadgeColor =
                      env.name === 'DEV'
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                        : env.name === 'UAT'
                        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30'
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';

                    return (
                      <div
                        key={env.name}
                        className={`rounded-2xl border flex flex-col justify-between transition-all ${
                          result
                            ? result.healthy
                              ? isLightTheme
                                ? 'bg-white border-slate-200 hover:border-emerald-300'
                                : 'bg-slate-950/60 border-slate-800 hover:border-emerald-500/40'
                              : isLightTheme
                              ? 'bg-rose-50/40 border-rose-200'
                              : 'bg-rose-950/20 border-rose-900/40'
                            : isLightTheme
                            ? 'bg-slate-50/60 border-slate-200'
                            : 'bg-slate-950/40 border-slate-800'
                        }`}
                      >
                        <div className="p-5 space-y-4">
                          {/* Top Row: Env Name & Status Badge */}
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider rounded-lg border ${envBadgeColor}`}
                            >
                              {env.name} Environment
                            </span>

                            {isLoading ? (
                              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-500">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span>Pinging...</span>
                              </span>
                            ) : result ? (
                              result.healthy ? (
                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                  <span>{result.statusCode} OK</span>
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                                  <AlertCircle className="w-3 h-3 text-rose-500" />
                                  <span>{result.statusCode > 0 ? `${result.statusCode}` : 'Error'}</span>
                                </span>
                              )
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-500/10 text-slate-400">
                                Unchecked
                              </span>
                            )}
                          </div>

                          {/* Endpoint URL Pill with Copy and Open Buttons */}
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                              Endpoint URL:
                            </span>

                            <div className="flex items-center gap-1.5">
                              <code
                                className={`text-[11px] font-mono font-bold px-2 py-1.5 rounded-xl border flex-1 truncate select-all ${
                                  isLightTheme
                                    ? 'bg-slate-100 text-slate-800 border-slate-200'
                                    : 'bg-slate-900 text-slate-200 border-slate-800'
                                }`}
                                title={env.healthUrl}
                              >
                                {env.healthUrl}
                              </code>

                              <button
                                onClick={() => copyToClipboard(env.healthUrl)}
                                className={`p-1.5 rounded-lg border text-xs font-bold transition-all shrink-0 ${
                                  copiedUrl === env.healthUrl
                                    ? 'bg-emerald-500 text-white border-emerald-500'
                                    : isLightTheme
                                    ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-600'
                                    : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                                }`}
                                title="Copy endpoint URL"
                              >
                                {copiedUrl === env.healthUrl ? (
                                  <Check className="w-3.5 h-3.5" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>

                              <a
                                href={env.healthUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`p-1.5 rounded-lg border text-xs font-bold transition-all shrink-0 ${
                                  isLightTheme
                                    ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-600'
                                    : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                                }`}
                                title="Open in browser"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </div>

                          {/* Response Latency & Timestamp */}
                          {result && (
                            <div className="flex items-center justify-between text-xs pt-1">
                              <span
                                className={`flex items-center gap-1 font-mono text-[11px] font-bold px-2 py-0.5 rounded-md ${
                                  result.latencyMs < 250
                                    ? 'bg-emerald-500/10 text-emerald-500'
                                    : result.latencyMs < 600
                                    ? 'bg-amber-500/10 text-amber-500'
                                    : 'bg-rose-500/10 text-rose-500'
                                }`}
                              >
                                <Clock className="w-3 h-3" />
                                <span>{result.latencyMs} ms</span>
                              </span>

                              <span className="text-[10px] text-slate-400 font-mono">
                                {new Date(result.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                          )}

                          {/* Error message if failed */}
                          {result && result.error && (
                            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
                              {result.error}
                            </div>
                          )}

                          {/* Expandable JSON Payload */}
                          {isExpanded && result && (
                            <div
                              className={`p-3 rounded-xl font-mono text-xs overflow-x-auto max-h-48 ${
                                isLightTheme ? 'bg-slate-900 text-slate-200' : 'bg-black text-slate-200'
                              }`}
                            >
                              {result.data !== null && result.data !== undefined ? (
                                <pre className="text-emerald-400 text-[11px] whitespace-pre-wrap break-all">
                                  {typeof result.data === 'object'
                                    ? JSON.stringify(result.data, null, 2)
                                    : String(result.data)}
                                </pre>
                              ) : (
                                <div className="text-slate-500 text-[11px] italic">No response body.</div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Card Bottom Actions */}
                        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                          {result ? (
                            <button
                              onClick={() => toggleExpand(env.healthUrl)}
                              className={`flex items-center gap-1 text-[11px] font-bold ${
                                isLightTheme ? 'text-indigo-600 hover:text-indigo-800' : 'text-indigo-400 hover:text-indigo-300'
                              }`}
                            >
                              <Terminal className="w-3 h-3" />
                              <span>{isExpanded ? 'Hide Payload' : 'View Payload'}</span>
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400">Ready to test</span>
                          )}

                          <button
                            onClick={() => checkSingleUrl(env.healthUrl)}
                            disabled={isLoading}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                          >
                            {isLoading ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Play className="w-3 h-3 fill-white" />
                            )}
                            <span>Ping</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl w-full mx-auto p-6 text-center text-xs text-slate-400 border-t border-slate-200 dark:border-slate-800/80 mt-12">
        Mobile App Manager • Developer All App State & Health Diagnostics Hub • Polygon Ecosystem
      </footer>
    </div>
  );
};
