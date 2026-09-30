'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Box,
  CheckCircle2,
  Copy,
  Crown,
  Database,
  ExternalLink,
  Layers,
  Lock,
  Moon,
  Package,
  PackagePlus,
  RefreshCw,
  Search,
  Send,
  Server,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Sun,
  Truck,
  UserCheck,
  Users,
  X,
  AlertTriangle,
  Radio,
  Edit3,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Terminal,
  ChevronLeft,
  ChevronRight,
  Sliders,
  Check,
  Zap,
  ShoppingBag,
  Activity,
  Globe,
  Power,
  RotateCw,
} from 'lucide-react';
import { KingDeveloperIcon } from '@/components/common/icons/KingDeveloperIcon';
import { useTheme } from '@/context/ThemeContext';
import { clearDeveloperAccess } from '@/lib/developer/security';
import {
  PackageUpdateEnvironmentKey,
  PACKAGE_ENVIRONMENTS,
  MarketplacePackageRecord,
  PACKAGE_ACTION_PRESETS,
  PackageActionPreset,
  PackageActionType,
} from '@/lib/developer/packageUpdateTypes';

type ActiveViewSection = 'multi' | 'salesdash' | 'polygon' | 'db_toggle';

export default function PackageUpdateWorkspace() {
  const router = useRouter();
  const { isLightTheme, toggleTheme } = useTheme();

  // Environment state
  const [activeEnv, setActiveEnv] = useState<PackageUpdateEnvironmentKey>('dev');
  const [customSalesDashUrl, setCustomSalesDashUrl] = useState('');
  const [customPolygonUrl, setCustomPolygonUrl] = useState('');
  const [showEndpointModal, setShowEndpointModal] = useState(false);

  // Active View Section
  const [activeSection, setActiveSection] = useState<ActiveViewSection>('multi');

  // DB Connection Health
  const [isTestingDb, setIsTestingDb] = useState(false);
  const [dbStatus, setDbStatus] = useState<{
    connected: boolean;
    latencyMs?: number;
    totalPackages?: number;
    error?: string;
  } | null>(null);

  // Target Applications Toggle
  const [notifySalesDash, setNotifySalesDash] = useState(true);
  const [notifyPolygon, setNotifyPolygon] = useState(true);

  // Packages Directory
  const [packages, setPackages] = useState<MarketplacePackageRecord[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [availableStatuses, setAvailableStatuses] = useState<string[]>([]);
  const pageSize = 8;

  // Selected Package
  const [selectedPackage, setSelectedPackage] = useState<MarketplacePackageRecord | null>(null);
  const [manualPackageId, setManualPackageId] = useState<string>('326');

  // Action Builder Form
  const [activePreset, setActivePreset] = useState<string>('status_change');
  const [actionType, setActionType] = useState<PackageActionType>('status_change');
  const [customJsonData, setCustomJsonData] = useState<string>(
    JSON.stringify(
      {
        displayName: 'Hashi Disabled Test Pack 02',
        status: 'Disabled',
        reason: 'Disabled via Developer Console',
      },
      null,
      2
    )
  );
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Direct DB Status Updating State
  const [updatingPackageId, setUpdatingPackageId] = useState<number | null>(null);

  // Execution & Telemetry State
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<any | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [rightPanelTab, setRightPanelTab] = useState<'telemetry' | 'directory'>('telemetry');

  const currentConfig = PACKAGE_ENVIRONMENTS[activeEnv] || PACKAGE_ENVIRONMENTS.dev;
  const effectiveSalesDashUrl = (customSalesDashUrl || currentConfig.salesDashApiUrl).replace(/\/+$/, '');
  const effectivePolygonUrl = (customPolygonUrl || currentConfig.polygonApiUrl).replace(/\/+$/, '');

  const handleClearAccess = () => {
    clearDeveloperAccess();
    router.push('/select-role');
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2500);
  };

  // Test DB connection
  const testConnection = useCallback(async (envToTest: PackageUpdateEnvironmentKey) => {
    setIsTestingDb(true);
    try {
      const res = await fetch('/api/developer/packages/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ env: envToTest }),
      });
      const data = await res.json();
      if (data.success) {
        setDbStatus({
          connected: true,
          latencyMs: data.latencyMs,
          totalPackages: data.totalPackages,
        });
      } else {
        setDbStatus({
          connected: false,
          error: data.error,
        });
      }
    } catch (err: any) {
      setDbStatus({
        connected: false,
        error: err.message,
      });
    } finally {
      setIsTestingDb(false);
    }
  }, []);

  // Fetch packages list from DB
  const fetchPackages = useCallback(async () => {
    setLoadingPackages(true);
    try {
      const params = new URLSearchParams({
        env: activeEnv,
        page: currentPage.toString(),
        limit: pageSize.toString(),
        search: searchQuery,
        status: selectedStatus === 'all' ? '' : selectedStatus,
      });

      const res = await fetch(`/api/developer/packages?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setPackages(data.packages || []);
        setTotalCount(data.total || 0);
        setTotalPages(data.totalPages || 1);
        if (data.availableStatuses?.length) {
          setAvailableStatuses(data.availableStatuses);
        }
      } else {
        setPackages([]);
        setTotalCount(0);
      }
    } catch (err) {
      console.error('Failed to load marketplace packages:', err);
      setPackages([]);
    } finally {
      setLoadingPackages(false);
    }
  }, [activeEnv, currentPage, searchQuery, selectedStatus]);

  // Initial load
  useEffect(() => {
    setCurrentPage(1);
    testConnection(activeEnv);
    fetchPackages();
  }, [activeEnv, testConnection]);

  // Refetch when filters change
  useEffect(() => {
    fetchPackages();
  }, [currentPage, selectedStatus, fetchPackages]);

  // Handle section change
  const handleSectionSelect = (sec: ActiveViewSection) => {
    setActiveSection(sec);
    if (sec === 'salesdash') {
      setNotifySalesDash(true);
      setNotifyPolygon(false);
    } else if (sec === 'polygon') {
      setNotifySalesDash(false);
      setNotifyPolygon(true);
    } else {
      setNotifySalesDash(true);
      setNotifyPolygon(true);
    }
  };

  // Apply Preset
  const handleApplyPreset = (preset: PackageActionPreset) => {
    setActivePreset(preset.id);
    setActionType(preset.action);
    setManualPackageId(preset.samplePackageId.toString());
    setCustomJsonData(JSON.stringify(preset.sampleExtra, null, 2));
    setJsonError(null);
  };

  // Validate JSON
  const handleJsonChange = (val: string) => {
    setCustomJsonData(val);
    try {
      if (val.trim()) JSON.parse(val);
      setJsonError(null);
    } catch (e: any) {
      setJsonError(e.message);
    }
  };

  // Select package from directory
  const handleSelectPackage = (pkg: MarketplacePackageRecord) => {
    setSelectedPackage(pkg);
    setManualPackageId(pkg.id.toString());
    setCustomJsonData(
      JSON.stringify(
        {
          displayName: pkg.displayName,
          status: pkg.status,
          productPrice: pkg.productPrice,
          packageType: pkg.packageType,
        },
        null,
        2
      )
    );
    setRightPanelTab('telemetry');
  };

  // Direct DB Status Toggle (Enable / Disable in DB + Auto-Sync to APIs)
  const handleDirectToggleStatus = async (pkg: MarketplacePackageRecord) => {
    const newStatus = pkg.status === 'Enabled' ? 'Disabled' : 'Enabled';
    setUpdatingPackageId(pkg.id);
    setRightPanelTab('telemetry');

    try {
      const res = await fetch('/api/developer/packages/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          env: activeEnv,
          packageId: pkg.id,
          newStatus,
          notifySalesDash: activeSection === 'polygon' ? false : notifySalesDash,
          notifyPolygon: activeSection === 'salesdash' ? false : notifyPolygon,
          customSalesDashUrl: customSalesDashUrl || undefined,
          customPolygonUrl: customPolygonUrl || undefined,
        }),
      });

      const data = await res.json();
      setBroadcastResult(data.broadcastResult || data);

      if (data.dbResult?.success) {
        // Optimistically update status in local list
        setPackages((prev) =>
          prev.map((p) => (p.id === pkg.id ? { ...p, status: newStatus } : p))
        );
        if (selectedPackage?.id === pkg.id) {
          setSelectedPackage({ ...selectedPackage, status: newStatus });
        }
      }
    } catch (err: any) {
      setBroadcastResult({
        success: false,
        message: err.message || 'Failed to update package in DB',
        error: err.toString(),
      });
    } finally {
      setUpdatingPackageId(null);
    }
  };

  // Broadcast Webhooks
  const handleBroadcast = async () => {
    const targetPkgId = selectedPackage ? selectedPackage.id : (manualPackageId ? Number(manualPackageId) : null);

    if (!targetPkgId) {
      alert('Please enter or select a Package ID to update');
      return;
    }

    if (!notifySalesDash && !notifyPolygon) {
      alert('Please select at least one target application (Sales Dash or Polygon)');
      return;
    }

    let parsedExtra = {};
    if (customJsonData.trim()) {
      try {
        parsedExtra = JSON.parse(customJsonData);
      } catch {
        alert('Invalid JSON in Additional Metadata payload');
        return;
      }
    }

    setIsBroadcasting(true);
    setBroadcastResult(null);
    setRightPanelTab('telemetry');

    try {
      const res = await fetch('/api/developer/packages/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          env: activeEnv,
          action: actionType,
          packageId: targetPkgId,
          extra: parsedExtra,
          notifySalesDash,
          notifyPolygon,
          customSalesDashUrl: customSalesDashUrl || undefined,
          customPolygonUrl: customPolygonUrl || undefined,
        }),
      });

      const data = await res.json();
      setBroadcastResult(data);
    } catch (err: any) {
      setBroadcastResult({
        success: false,
        message: err.message || 'Network request failed',
        error: err.toString(),
      });
    } finally {
      setIsBroadcasting(false);
    }
  };

  // cURL preview
  const curlSalesDash = `curl -X POST "${effectiveSalesDashUrl}/api/packages/notify-update" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(
    {
      action: actionType,
      packageId: selectedPackage ? selectedPackage.id : Number(manualPackageId || 326),
      timestamp: new Date().toISOString(),
      ...(() => {
        try {
          return JSON.parse(customJsonData);
        } catch {
          return {};
        }
      })(),
    },
    null,
    2
  )}'`;

  const curlPolygon = `curl -X POST "${effectivePolygonUrl}/api/product/notify-update" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(
    {
      action: actionType,
      packageId: selectedPackage ? selectedPackage.id : Number(manualPackageId || 326),
      timestamp: new Date().toISOString(),
      ...(() => {
        try {
          return JSON.parse(customJsonData);
        } catch {
          return {};
        }
      })(),
    },
    null,
    2
  )}'`;

  return (
    <div className="min-h-screen flex flex-col font-sans transition-colors duration-300">
      {/* Top Glassmorphic Navigation Header */}
      <header className="sticky top-0 z-40 glass-header px-6 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand & Role Indicator */}
        <div className="flex items-center gap-3">
          <Link
            href="/developer"
            className="p-2 rounded-xl glass-card hover:bg-slate-200 dark:hover:bg-slate-800 transition-all text-slate-500 hover:text-slate-900 dark:hover:text-white"
            title="Back to Developer Control Center"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-amber-500 flex items-center justify-center text-white shadow-md p-0.5">
            <Box size={26} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold tracking-tight">Package Real-Time Sync Hub</h1>
              <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full border bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30">
                Multi-App Broadcast
              </span>
              <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full border bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 flex items-center gap-1 shadow-xs">
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                <span>DB + Cache + Socket</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Update Database & Broadcast in real time to Sales Dash & Polygon (GoviMart) Mobile APIs
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Endpoint Override Button */}
          <button
            onClick={() => setShowEndpointModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all glass-card hover:bg-slate-200 dark:hover:bg-slate-800"
            title="Configure Custom Endpoints"
          >
            <Sliders className="w-3.5 h-3.5 text-purple-500" />
            <span className="hidden sm:inline">Target APIs:</span>
            <span className="font-mono text-[11px] text-purple-500 uppercase">
              {activeEnv}
            </span>
          </button>

          {/* Clear Access Button */}
          <button
            onClick={handleClearAccess}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 cursor-pointer shadow-xs"
            title="Revoke Developer Session"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Clear Access</span>
          </button>

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
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-6">
        {/* Banner with Glassmorphic Styling */}
        <div className="glass-panel p-6 rounded-3xl relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30">
              <Zap className="w-3.5 h-3.5 text-purple-500 animate-pulse" />
              <span>Full Database Toggle & Multi-App Cache Invalidation</span>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight">
              Package Update & Enable/Disable Manager
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Toggle package status directly in MySQL DB and trigger instant mobile cache invalidation. Tells <strong>Sales Dash API</strong> to refresh in-memory NodeCache & emit <code className="font-mono text-amber-500">packagesUpdated</code>, and tells <strong>Polygon API</strong> to emit <code className="font-mono text-emerald-500">catalog_updated</code>!
            </p>
          </div>

          {/* Environment Switcher Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="glass-card p-1.5 rounded-2xl flex items-center gap-1">
              {(['dev', 'uat', 'local', 'prod'] as PackageUpdateEnvironmentKey[]).map((envKey) => (
                <button
                  key={envKey}
                  onClick={() => setActiveEnv(envKey)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase transition-all ${
                    activeEnv === envKey
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {envKey}
                </button>
              ))}
            </div>

            {/* Test DB Connection Status Button */}
            <button
              onClick={() => testConnection(activeEnv)}
              disabled={isTestingDb}
              className="px-4 py-2.5 rounded-2xl glass-card flex items-center justify-center gap-2 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-purple-500 ${isTestingDb ? 'animate-spin' : ''}`} />
              <span>{isTestingDb ? 'Testing...' : 'Test DB'}</span>
              {dbStatus && (
                <span
                  className={`w-2 h-2 rounded-full ${
                    dbStatus.connected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                  }`}
                />
              )}
            </button>
          </div>
        </div>

        {/* 4 SECTION TABS: Multi-Sync | Sales Dash Sync | Polygon Sync | Direct DB Toggle */}
        <div className="glass-card p-2 rounded-2xl flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => handleSectionSelect('multi')}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
                activeSection === 'multi'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>Multi-App Broadcast (Both)</span>
            </button>

            <button
              onClick={() => handleSectionSelect('salesdash')}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
                activeSection === 'salesdash'
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Sales Dash Sync Only</span>
            </button>

            <button
              onClick={() => handleSectionSelect('polygon')}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
                activeSection === 'polygon'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Polygon (GoviMart) Sync Only</span>
            </button>

            <button
              onClick={() => handleSectionSelect('db_toggle')}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
                activeSection === 'db_toggle'
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Power className="w-4 h-4" />
              <span>Direct DB Enable / Disable Manager</span>
            </button>
          </div>

          <div className="text-xs font-mono font-bold text-slate-400 px-3">
            {dbStatus?.totalPackages ?? totalCount} Packages in {activeEnv.toUpperCase()} DB
          </div>
        </div>

        {/* SECTION: DIRECT DB ENABLE / DISABLE MANAGER */}
        {activeSection === 'db_toggle' ? (
          <div className="glass-panel p-6 rounded-3xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/50 dark:border-slate-800/50 pb-4">
              <div>
                <h3 className="text-lg font-extrabold flex items-center gap-2">
                  <Power className="w-5 h-5 text-rose-500" />
                  <span>Direct Database Status Toggle & Real-Time Sync</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  1-Click to <strong>Enable</strong> or <strong>Disable</strong> any package directly in the MySQL database table <code className="font-mono text-purple-500">marketplacepackages</code> and immediately notify the mobile apps!
                </p>
              </div>

              {/* Sync Targets for Direct Toggle */}
              <div className="flex items-center gap-3 glass-card px-3 py-2 rounded-xl text-xs font-bold">
                <span className="text-slate-400">Auto-Notify:</span>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifySalesDash}
                    onChange={(e) => setNotifySalesDash(e.target.checked)}
                    className="w-3.5 h-3.5 accent-amber-500 rounded"
                  />
                  <span className="text-amber-500">Sales Dash</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyPolygon}
                    onChange={(e) => setNotifyPolygon(e.target.checked)}
                    className="w-3.5 h-3.5 accent-emerald-500 rounded"
                  />
                  <span className="text-emerald-500">Polygon</span>
                </label>
              </div>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search package name, ID..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-8 pr-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-rose-500"
                />
              </div>

              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-rose-500"
              >
                <option value="all">All Statuses</option>
                {availableStatuses.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Packages Interactive List with Instant Toggle */}
            <div className="space-y-3">
              {loadingPackages ? (
                <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-rose-500" />
                  <span>Loading packages from {activeEnv.toUpperCase()} database...</span>
                </div>
              ) : packages.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-400">
                  No packages found matching query.
                </div>
              ) : (
                packages.map((pkg) => {
                  const isEnabled = pkg.status === 'Enabled';
                  const isUpdatingThis = updatingPackageId === pkg.id;

                  return (
                    <div
                      key={pkg.id}
                      className="p-4 rounded-2xl glass-card border border-slate-200/60 dark:border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-slate-300"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-xs shadow-xs shrink-0">
                          #{pkg.id}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-extrabold truncate flex items-center gap-2">
                            <span>{pkg.displayName}</span>
                            <span className="font-mono text-xs text-purple-500 font-bold shrink-0">
                              Rs. {pkg.productPrice}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 truncate mt-0.5">
                            Type: {pkg.packageType || 'Standard'} • Validity: {pkg.isValid ? 'Valid' : 'Invalid'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {/* Status Badge */}
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                            isEnabled
                              ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-500 border border-rose-500/30'
                          }`}
                        >
                          {pkg.status}
                        </span>

                        {/* Instant DB Toggle Button */}
                        <button
                          onClick={() => handleDirectToggleStatus(pkg)}
                          disabled={isUpdatingThis}
                          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50 ${
                            isEnabled
                              ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20'
                              : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20'
                          }`}
                        >
                          {isUpdatingThis ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Updating DB...</span>
                            </>
                          ) : isEnabled ? (
                            <>
                              <ToggleLeft className="w-4 h-4" />
                              <span>Disable in DB</span>
                            </>
                          ) : (
                            <>
                              <ToggleRight className="w-4 h-4" />
                              <span>Enable in DB</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-slate-200/50 dark:border-slate-800/50 text-xs">
                <span className="text-slate-400">
                  Page {currentPage} of {totalPages} ({totalCount} packages total)
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="p-1.5 rounded-lg glass-card disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className="p-1.5 rounded-lg glass-card disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* SECTION: MULTI / SALESDASH / POLYGON WEBHOOK BROADCAST VIEW */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: Package Update Dispatcher (7 Cols) */}
            <div className="lg:col-span-7 glass-panel p-6 rounded-3xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50 pb-4">
                <div className="flex items-center gap-2">
                  <Box className="w-5 h-5 text-purple-500" />
                  <h3 className="text-base font-extrabold">
                    {activeSection === 'salesdash'
                      ? 'Sales Dash Package Sync Configurator'
                      : activeSection === 'polygon'
                      ? 'Polygon (GoviMart) Sync Configurator'
                      : 'Multi-App Broadcast Payload Configurator'}
                  </h3>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  Action: <strong className="text-purple-500 uppercase">{actionType}</strong>
                </span>
              </div>

              {/* Selected Package Banner */}
              <div className="p-4 rounded-2xl border border-purple-500/20 bg-purple-500/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Package className="w-4 h-4" />
                    <span>Target Marketplace Package</span>
                  </span>

                  <button
                    onClick={() => setRightPanelTab('directory')}
                    className="text-xs font-bold text-purple-500 hover:underline flex items-center gap-1"
                  >
                    <span>Select from DB</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>

                {selectedPackage ? (
                  <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-xs">
                        #{selectedPackage.id}
                      </div>
                      <div>
                        <div className="text-xs font-extrabold flex items-center gap-2">
                          <span>{selectedPackage.displayName}</span>
                          <span className="font-mono text-[10px] text-purple-500 font-bold">
                            Rs. {selectedPackage.productPrice}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          Type: {selectedPackage.packageType || 'General'} • Status: {selectedPackage.status}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedPackage(null);
                        setManualPackageId('');
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                      title="Clear selected package"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">
                      Direct Package ID (`packageId`):
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 326"
                      value={manualPackageId}
                      onChange={(e) => setManualPackageId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                )}
              </div>

              {/* Action Type & Target Selector */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 block mb-1.5">
                      Action Type (`action`):
                    </label>
                    <select
                      value={actionType}
                      onChange={(e) => setActionType(e.target.value as PackageActionType)}
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500"
                    >
                      <option value="status_change">status_change (Enable / Disable)</option>
                      <option value="update">update (Details, Items or Price)</option>
                      <option value="create">create (New Package Published)</option>
                      <option value="delete">delete (Package Removed)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-400 block mb-1.5">
                      Target Applications:
                    </label>
                    <div className="flex items-center gap-2 pt-1 text-xs font-bold">
                      <span className={`px-2.5 py-1 rounded-lg ${notifySalesDash ? 'bg-amber-500/15 text-amber-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                        Sales Dash
                      </span>
                      <span className={`px-2.5 py-1 rounded-lg ${notifyPolygon ? 'bg-emerald-500/15 text-emerald-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                        Polygon
                      </span>
                    </div>
                  </div>
                </div>

                {/* JSON Metadata Payload */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-400">
                      Additional JSON Metadata (`...extra`):
                    </label>
                    {jsonError ? (
                      <span className="text-[10px] text-rose-500 font-bold">Invalid JSON Syntax</span>
                    ) : (
                      <span className="text-[10px] text-emerald-500 font-bold">Valid JSON Object</span>
                    )}
                  </div>
                  <textarea
                    rows={5}
                    value={customJsonData}
                    onChange={(e) => handleJsonChange(e.target.value)}
                    className="w-full p-3 rounded-xl text-xs font-mono bg-slate-950 text-slate-200 border border-slate-800 focus:outline-none focus:border-purple-500 font-medium resize-none"
                  />
                </div>
              </div>

              {/* Action Trigger Button */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  onClick={handleBroadcast}
                  disabled={isBroadcasting}
                  className="flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-amber-500 hover:from-purple-700 hover:to-amber-600 text-white font-extrabold text-sm shadow-lg shadow-purple-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isBroadcasting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Broadcasting Webhooks to APIs...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>🚀 Broadcast Package Update</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => copyToClipboard(curlSalesDash, 'curlsd')}
                  className="px-4 py-3.5 rounded-2xl glass-card text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-800 transition-all flex items-center gap-1.5"
                  title="Copy Sales Dash cURL"
                >
                  <Terminal className="w-4 h-4 text-purple-500" />
                  <span>{copiedText === 'curlsd' ? 'Copied!' : 'cURL'}</span>
                </button>
              </div>
            </div>

            {/* RIGHT COLUMN: Tabbed Results & Database Packages (5 Cols) */}
            <div className="lg:col-span-5 space-y-4">
              {/* Tab Buttons */}
              <div className="glass-card p-1.5 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setRightPanelTab('telemetry')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                      rightPanelTab === 'telemetry'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span>Live Telemetry</span>
                  </button>

                  <button
                    onClick={() => setRightPanelTab('directory')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                      rightPanelTab === 'directory'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Box className="w-3.5 h-3.5" />
                    <span>Packages ({totalCount})</span>
                  </button>
                </div>

                {broadcastResult && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      broadcastResult.success
                        ? 'bg-emerald-500/15 text-emerald-500'
                        : 'bg-rose-500/15 text-rose-500'
                    }`}
                  >
                    {broadcastResult.success ? 'Sync OK' : 'Errors'}
                  </span>
                )}
              </div>

              {/* TAB 1: TELEMETRY & LIVE TARGET RESPONSES */}
              {rightPanelTab === 'telemetry' && (
                <div className="glass-panel p-6 rounded-3xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Radio className="w-4 h-4 text-purple-500" />
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                        Webhook Dispatch Status
                      </h4>
                    </div>

                    {broadcastResult && (
                      <button
                        onClick={() =>
                          copyToClipboard(JSON.stringify(broadcastResult, null, 2), 'response')
                        }
                        className="text-xs text-purple-500 hover:underline flex items-center gap-1 font-bold"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copiedText === 'response' ? 'Copied!' : 'Copy JSON'}</span>
                      </button>
                    )}
                  </div>

                  {broadcastResult ? (
                    <div className="space-y-4">
                      {/* Target 1: Sales Dash Result */}
                      {broadcastResult.targets?.find((t: any) => t.target === 'salesdash') && (
                        (() => {
                          const target = broadcastResult.targets.find((t: any) => t.target === 'salesdash');
                          return (
                            <div
                              className={`p-4 rounded-2xl border ${
                                target.success
                                  ? 'border-emerald-500/30 bg-emerald-500/10'
                                  : 'border-rose-500/30 bg-rose-500/10'
                              } space-y-2`}
                            >
                              <div className="flex items-center justify-between">
                                <span
                                  className={`text-xs font-extrabold flex items-center gap-1.5 ${
                                    target.success ? 'text-emerald-500' : 'text-rose-500'
                                  }`}
                                >
                                  {target.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                                  <span>Sales Dash Mobile API</span>
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-mono font-bold text-slate-400">{target.latencyMs}ms</span>
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${target.success ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'}`}>
                                    HTTP {target.statusCode}
                                  </span>
                                </div>
                              </div>
                              <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                {target.message}
                              </p>
                            </div>
                          );
                        })()
                      )}

                      {/* Target 2: Polygon Result */}
                      {broadcastResult.targets?.find((t: any) => t.target === 'polygon') && (
                        (() => {
                          const target = broadcastResult.targets.find((t: any) => t.target === 'polygon');
                          return (
                            <div
                              className={`p-4 rounded-2xl border ${
                                target.success
                                  ? 'border-emerald-500/30 bg-emerald-500/10'
                                  : 'border-rose-500/30 bg-rose-500/10'
                              } space-y-2`}
                            >
                              <div className="flex items-center justify-between">
                                <span
                                  className={`text-xs font-extrabold flex items-center gap-1.5 ${
                                    target.success ? 'text-emerald-500' : 'text-rose-500'
                                  }`}
                                >
                                  {target.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                                  <span>Polygon (GoviMart) Mobile API</span>
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-mono font-bold text-slate-400">{target.latencyMs}ms</span>
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${target.success ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'}`}>
                                    HTTP {target.statusCode}
                                  </span>
                                </div>
                              </div>
                              <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                {target.message}
                              </p>
                            </div>
                          );
                        })()
                      )}

                      {/* Raw Response */}
                      <div className="space-y-1.5">
                        <div className="text-[11px] font-bold text-slate-400">Aggregated Response:</div>
                        <pre className="p-3.5 rounded-2xl bg-slate-950 text-slate-200 text-[11px] font-mono overflow-x-auto max-h-[220px] border border-slate-800">
                          {JSON.stringify(broadcastResult, null, 2)}
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center mx-auto">
                        <Send className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-extrabold">Ready to Broadcast</p>
                        <p className="text-[11px] text-slate-400 max-w-xs mx-auto leading-relaxed">
                          Configure the action and select a package, then click <strong>Broadcast Package Update</strong> to invalidate caches and push WebSockets.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: PACKAGES DIRECTORY */}
              {rightPanelTab === 'directory' && (
                <div className="glass-panel p-6 rounded-3xl space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search package name, ID..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="w-full pl-8 pr-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <select
                      value={selectedStatus}
                      onChange={(e) => {
                        setSelectedStatus(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500"
                    >
                      <option value="all">All Statuses</option>
                      {availableStatuses.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Packages List */}
                  <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                    {loadingPackages ? (
                      <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-purple-500" />
                        <span>Loading Packages from {activeEnv.toUpperCase()} DB...</span>
                      </div>
                    ) : packages.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400">
                        No marketplace packages found matching query.
                      </div>
                    ) : (
                      packages.map((pkg) => {
                        const isSelected = selectedPackage?.id === pkg.id;
                        return (
                          <div
                            key={pkg.id}
                            className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                              isSelected
                                ? 'border-purple-500 bg-purple-500/10'
                                : 'border-slate-200/60 dark:border-slate-800/60 glass-card hover:border-slate-300'
                            }`}
                          >
                            <div className="min-w-0 flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                                #{pkg.id}
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-extrabold truncate flex items-center gap-1.5">
                                  <span>{pkg.displayName}</span>
                                  <span className="font-mono text-[10px] text-purple-500 font-bold shrink-0">
                                    Rs. {pkg.productPrice}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-400 truncate">
                                  Type: {pkg.packageType || 'General'}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  pkg.status === 'Enabled'
                                    ? 'bg-emerald-500/15 text-emerald-500'
                                    : 'bg-rose-500/15 text-rose-500'
                                }`}
                              >
                                {pkg.status}
                              </span>

                              <button
                                onClick={() => handleSelectPackage(pkg)}
                                className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-purple-600 hover:bg-purple-700 text-white transition-all cursor-pointer shadow-xs"
                              >
                                Select
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/50 dark:border-slate-800/50 text-xs">
                      <span className="text-slate-400">
                        Page {currentPage} of {totalPages} ({totalCount} total)
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage <= 1}
                          className="p-1 rounded-lg glass-card disabled:opacity-40"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          disabled={currentPage >= totalPages}
                          className="p-1 rounded-lg glass-card disabled:opacity-40"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Target API Override Modal */}
      {showEndpointModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl max-w-lg w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold flex items-center gap-2">
                <Sliders className="w-5 h-5 text-purple-500" />
                <span>Override Package API Endpoints</span>
              </h3>
              <button
                onClick={() => setShowEndpointModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">
                  Sales Dash API Base URL:
                </label>
                <input
                  type="text"
                  value={customSalesDashUrl}
                  onChange={(e) => setCustomSalesDashUrl(e.target.value)}
                  placeholder={currentConfig.salesDashApiUrl}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">
                  Polygon (GoviMart) API Base URL:
                </label>
                <input
                  type="text"
                  value={customPolygonUrl}
                  onChange={(e) => setCustomPolygonUrl(e.target.value)}
                  placeholder={currentConfig.polygonApiUrl}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                onClick={() => {
                  setCustomSalesDashUrl('');
                  setCustomPolygonUrl('');
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-rose-500"
              >
                Reset to Defaults
              </button>

              <button
                onClick={() => setShowEndpointModal(false)}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-md"
              >
                Save & Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
