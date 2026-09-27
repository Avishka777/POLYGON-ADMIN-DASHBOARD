'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
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
  Lock,
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
import { useTheme } from '@/context/ThemeContext';
import { clearDeveloperAccess } from '@/lib/developer/security';

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

export default function SingleApplicationPage() {
  const router = useRouter();
  const params = useParams();
  const rawAppId = (params?.appId as string) || '';
  // Support user typo "polyogn" by mapping it to "polygon"
  const normalizedAppId = rawAppId === 'polyogn' ? 'polygon' : rawAppId;

  const project = POLYGON_PROJECTS.find((p) => p.id === normalizedAppId);
  const { isLightTheme, toggleTheme } = useTheme();

  const handleClearAccess = () => {
    clearDeveloperAccess();
    router.push('/select-role');
  };

  // Polygon environment tab selector: 'DEV' | 'UAT' | 'PROD' | 'ALL'
  const [polygonActiveEnv, setPolygonActiveEnv] = useState<'DEV' | 'UAT' | 'PROD' | 'ALL'>('DEV');

  // Results & Loading states keyed by url
  const [results, setResults] = useState<Record<string, HealthCheckResult>>({});
  const [loadingUrls, setLoadingUrls] = useState<Record<string, boolean>>({});
  const [isCheckingAll, setIsCheckingAll] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
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

  // Ping all routes for Polygon
  const checkPolygonRoutes = async (envName: 'DEV' | 'UAT' | 'PROD' | 'ALL') => {
    if (!project || !project.routes) return;
    setIsCheckingAll(true);

    const envsToTest =
      envName === 'ALL'
        ? project.environments
        : project.environments.filter((e) => e.name === envName);

    const urls = envsToTest.flatMap((env) =>
      project.routes!.map((route) => buildRouteUrl(env.baseUrl, route.path))
    );

    await Promise.all(urls.map((url) => checkSingleUrl(url)));
    setIsCheckingAll(false);
  };

  // Ping all environments for a standard project
  const checkProjectEnvironments = async () => {
    if (!project) return;
    setIsCheckingAll(true);
    await Promise.all(project.environments.map((env) => checkSingleUrl(env.healthUrl)));
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

  // Helper for Route Badge
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

  if (!project) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="p-4 rounded-3xl glass-card">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        </div>
        <h2 className="text-2xl font-black">Application Not Found</h2>
        <p className="text-xs text-slate-400 max-w-sm">
          The requested application identifier &quot;{rawAppId}&quot; does not exist in the Polygon ecosystem catalog.
        </p>
        <Link
          href="/developer/applications"
          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs"
        >
          Return to Applications Hub
        </Link>
      </div>
    );
  }

  const isPolygon = project.id === 'polygon';

  return (
    <div className="min-h-screen flex flex-col font-sans transition-colors duration-300">
      {/* Top Glassmorphic Navigation Header */}
      <header className="sticky top-0 z-40 glass-header px-6 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand & App Info */}
        <div className="flex items-center gap-3">
          <Link
            href="/developer/applications"
            className="w-11 h-11 rounded-2xl glass-card flex items-center justify-center hover:scale-105 transition-transform"
            title="Return to Applications Hub"
          >
            <img
              src={project.icon}
              alt={project.name}
              className="w-8 h-8 rounded-lg object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold tracking-tight">{project.name}</h1>
              <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full border bg-amber-500/10 text-amber-500 border-amber-500/30">
                King of Developer
              </span>
              <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full border bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 flex items-center gap-1 shadow-xs">
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                <span>Full Access</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {project.subtitle}
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
            href="/developer/applications"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all glass-card hover:bg-slate-200 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="w-4 h-4 text-purple-500" />
            <span>All Applications</span>
          </Link>

          <Link
            href="/developer"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all glass-card hover:bg-slate-200 dark:hover:bg-slate-800"
          >
            <KingDeveloperIcon size={16} />
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

      {/* Main Single App View */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-8">
        {/* Banner with Glassmorphic Styling */}
        <section className="glass-panel p-6 sm:p-8 rounded-3xl relative overflow-hidden">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl p-2.5 glass-panel flex items-center justify-center shrink-0 shadow-lg">
                <img
                  src={project.icon}
                  alt={project.name}
                  className="w-11 h-11 rounded-xl object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight">{project.name}</h2>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider border bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30">
                    {isPolygon ? 'Complete Health & Version Suite' : 'Dedicated App Inspector'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                  {isPolygon
                    ? 'Inspect application release version (/api/app-version) alongside basic, detailed, liveness, and readiness health probes across DEV, UAT, and PROD.'
                    : `Real-time health verification and network latency diagnostics for ${project.name} across DEV, UAT, and PROD.`}
                </p>
              </div>
            </div>

            {/* Batch Ping Action */}
            <div className="shrink-0">
              {isPolygon ? (
                <button
                  onClick={() => checkPolygonRoutes(polygonActiveEnv)}
                  disabled={isCheckingAll}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isCheckingAll ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  <span>Ping {polygonActiveEnv} Routes</span>
                </button>
              ) : (
                <button
                  onClick={checkProjectEnvironments}
                  disabled={isCheckingAll}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isCheckingAll ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  <span>Ping All 3 Environments</span>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* POLYGON MOBILE DEDICATED VIEW (ALL 6 ROUTES) */}
        {isPolygon && project.routes ? (
          <div className="space-y-6">
            {/* Environment Tabs */}
            <div className="glass-panel p-2 rounded-2xl flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none p-1">
                {(['DEV', 'UAT', 'PROD', 'ALL'] as const).map((envTab) => (
                  <button
                    key={envTab}
                    onClick={() => setPolygonActiveEnv(envTab)}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      polygonActiveEnv === envTab
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'glass-card hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {envTab} Environment
                  </button>
                ))}
              </div>

              <div className="text-xs text-slate-400 font-mono px-3 hidden md:block">
                Active: {polygonActiveEnv === 'ALL' ? 'All Environments Matrix' : `${polygonActiveEnv} Endpoints`}
              </div>
            </div>

            {/* Environments Content */}
            {(polygonActiveEnv === 'ALL'
              ? project.environments
              : project.environments.filter((e) => e.name === polygonActiveEnv)
            ).map((env) => {
              const envBadgeColor =
                env.name === 'DEV'
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                  : env.name === 'UAT'
                  ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30'
                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';

              return (
                <div key={env.name} className="glass-panel p-6 sm:p-8 rounded-3xl space-y-6">
                  {/* Env Section Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/50 dark:border-slate-800/50">
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1 text-xs font-black uppercase tracking-wider rounded-xl border ${envBadgeColor}`}
                      >
                        {env.name} Environment
                      </span>
                      <code className="text-xs text-slate-500 font-mono">{env.baseUrl}</code>
                    </div>

                    <button
                      onClick={() => checkPolygonRoutes(env.name)}
                      disabled={isCheckingAll}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold glass-card hover:bg-slate-200 dark:hover:bg-slate-800 transition-all self-start sm:self-auto"
                    >
                      <Play className="w-3.5 h-3.5 text-purple-500 fill-purple-500" />
                      <span>Ping {env.name} Routes</span>
                    </button>
                  </div>

                  {/* 6 Routes Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {project.routes!.map((route) => {
                      const routeUrl = buildRouteUrl(env.baseUrl, route.path);
                      const result = results[routeUrl];
                      const isLoading = loadingUrls[routeUrl] || false;
                      const isExpanded = expandedPayloads[routeUrl] || false;
                      const badge = getRouteBadge(route.type);

                      const detectedVersion =
                        result?.data?.version ||
                        result?.data?.appVersion ||
                        (typeof result?.data === 'string' && result?.data.length < 20
                          ? result.data
                          : null);

                      return (
                        <div
                          key={route.id}
                          className={`glass-card rounded-2xl border flex flex-col justify-between transition-all ${
                            result
                              ? result.healthy
                                ? 'hover:border-purple-500/40'
                                : 'border-rose-500/40 bg-rose-500/5'
                              : ''
                          }`}
                        >
                          <div className="p-5 space-y-3.5">
                            {/* Route Method & Type */}
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase bg-slate-200 dark:bg-slate-800">
                                  {route.method}
                                </span>
                                <span
                                  className={`flex items-center gap-1 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-lg border ${badge.badgeColor}`}
                                >
                                  {badge.icon}
                                  <span>{badge.label}</span>
                                </span>
                              </div>

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
                              <h4 className="text-sm font-extrabold">{route.name}</h4>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug line-clamp-2">
                                {route.description}
                              </p>
                            </div>

                            {/* URL Pill */}
                            <div className="flex items-center gap-1">
                              <code
                                className="text-[11px] font-mono font-bold px-2 py-1 rounded-lg border border-white/20 dark:border-white/5 bg-white/40 dark:bg-black/30 flex-1 truncate select-all"
                                title={routeUrl}
                              >
                                /{route.path}
                              </code>

                              <button
                                onClick={() => copyToClipboard(routeUrl)}
                                className={`p-1.5 rounded-lg border text-xs font-bold transition-all shrink-0 ${
                                  copiedUrl === routeUrl
                                    ? 'bg-emerald-500 text-white border-emerald-500'
                                    : 'glass-card hover:bg-slate-200 dark:hover:bg-slate-800'
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
                                className="p-1.5 rounded-lg glass-card hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-bold transition-all shrink-0"
                                title="Open in browser"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>

                            {/* Version Detected Highlight */}
                            {route.type === 'version' && detectedVersion && (
                              <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-between text-xs">
                                <span className="text-purple-600 dark:text-purple-300 font-bold flex items-center gap-1.5">
                                  <Tag className="w-3.5 h-3.5 text-purple-500" />
                                  App Version:
                                </span>
                                <span className="font-mono font-black text-purple-700 dark:text-purple-200 bg-purple-500/20 px-2 py-0.5 rounded-md">
                                  {String(detectedVersion)}
                                </span>
                              </div>
                            )}

                            {/* Detailed Diagnostics Breakdown */}
                            {route.type === 'detailed' && result?.data && (
                              <div className="space-y-1.5 text-[10px] p-2 rounded-xl glass-card">
                                {result.data.application && (
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-500">Node / App:</span>
                                    <span className="font-semibold">
                                      {result.data.application.name} ({result.data.application.nodeVersion})
                                    </span>
                                  </div>
                                )}
                                {result.data.application?.memoryUsage && (
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-500">RSS / Heap:</span>
                                    <span className="font-mono text-indigo-500 font-bold">
                                      {result.data.application.memoryUsage.rss} • {result.data.application.memoryUsage.heapUsed}
                                    </span>
                                  </div>
                                )}
                                {result.data.system?.hostname && (
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-500">Host / CPUs:</span>
                                    <span>
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
                              <div className="p-3 rounded-xl font-mono text-xs overflow-x-auto max-h-48 bg-black text-slate-200 border border-slate-800">
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

                          {/* Card Footer Actions */}
                          <div className="p-3.5 border-t border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between gap-2">
                            {result ? (
                              <button
                                onClick={() => toggleExpand(routeUrl)}
                                className="flex items-center gap-1 text-[11px] font-bold text-purple-500 hover:text-purple-400"
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
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-xs transition-all disabled:opacity-50 cursor-pointer"
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
        ) : (
          /* STANDARD APPLICATION DEDICATED VIEW (3 ENVIRONMENTS) */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                  className={`glass-card p-6 rounded-3xl border flex flex-col justify-between space-y-5 transition-all ${
                    result
                      ? result.healthy
                        ? 'hover:border-emerald-500/40'
                        : 'border-rose-500/40 bg-rose-500/5'
                      : ''
                  }`}
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-3 py-1 text-xs font-black uppercase tracking-wider rounded-xl border ${envBadgeColor}`}
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
                          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span>{result.statusCode} OK</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
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

                    {/* URL */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                        Health Endpoint URL:
                      </span>
                      <div className="flex items-center gap-1.5">
                        <code
                          className="text-[11px] font-mono font-bold px-2 py-1.5 rounded-xl border border-white/20 dark:border-white/5 bg-white/40 dark:bg-black/30 flex-1 truncate select-all"
                          title={env.healthUrl}
                        >
                          {env.healthUrl}
                        </code>

                        <button
                          onClick={() => copyToClipboard(env.healthUrl)}
                          className={`p-1.5 rounded-lg border text-xs font-bold transition-all shrink-0 ${
                            copiedUrl === env.healthUrl
                              ? 'bg-emerald-500 text-white border-emerald-500'
                              : 'glass-card hover:bg-slate-200 dark:hover:bg-slate-800'
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
                          className="p-1.5 rounded-lg glass-card hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-bold transition-all shrink-0"
                          title="Open in browser"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>

                    {/* Latency & Timestamp */}
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

                    {/* Error Message */}
                    {result && result.error && (
                      <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
                        {result.error}
                      </div>
                    )}

                    {/* Expandable JSON Payload */}
                    {isExpanded && result && (
                      <div className="p-3 rounded-xl font-mono text-xs overflow-x-auto max-h-48 bg-black text-slate-200 border border-slate-800">
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

                  {/* Footer */}
                  <div className="pt-4 border-t border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between gap-2">
                    {result ? (
                      <button
                        onClick={() => toggleExpand(env.healthUrl)}
                        className="flex items-center gap-1 text-[11px] font-bold text-indigo-500 hover:text-indigo-400"
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
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xs transition-all disabled:opacity-50 cursor-pointer"
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
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-7xl w-full mx-auto p-6 text-center text-xs text-slate-400 border-t border-slate-200/50 dark:border-slate-800/50 mt-12">
        Mobile App Manager • Dedicated {project.name} Operations Page • Polygon Ecosystem
      </footer>
    </div>
  );
}
