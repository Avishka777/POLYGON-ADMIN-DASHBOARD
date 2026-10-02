'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  Copy,
  Database,
  ExternalLink,
  Layers,
  Lock,
  Moon,
  Package,
  Radio,
  RefreshCw,
  Search,
  Send,
  Server,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Sun,
  Truck,
  Users,
  X,
  AlertTriangle,
  CreditCard,
  BellRing,
  Activity,
  Terminal,
  ChevronLeft,
  ChevronRight,
  Sliders,
  Check,
  Clock,
  Zap,
  ShoppingBag,
  Store,
  DollarSign,
  Tag,
} from 'lucide-react';
import { KingDeveloperIcon } from '@/components/common/icons/KingDeveloperIcon';
import { useTheme } from '@/context/ThemeContext';
import { clearDeveloperAccess } from '@/lib/developer/security';
import {
  PolygonEnvironmentKey,
  POLYGON_ENVIRONMENTS,
  MarketplaceUserRecord,
  POLYGON_NOTIFICATION_PRESETS,
  PolygonNotificationPreset,
} from '@/lib/developer/polygonNotificationTypes';

export default function PolygonNotificationWorkspace() {
  const router = useRouter();
  const { isLightTheme, toggleTheme } = useTheme();

  // Environment state
  const [activeEnv, setActiveEnv] = useState<PolygonEnvironmentKey>('dev');
  const [customApiUrl, setCustomApiUrl] = useState('');
  const [showEndpointModal, setShowEndpointModal] = useState(false);

  // DB Connection Health
  const [isTestingDb, setIsTestingDb] = useState(false);
  const [dbStatus, setDbStatus] = useState<{
    connected: boolean;
    latencyMs?: number;
    totalUsers?: number;
    totalOrders?: number;
    error?: string;
  } | null>(null);

  // Marketplace Users Directory
  const [users, setUsers] = useState<MarketplaceUserRecord[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBuyerType, setSelectedBuyerType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [availableBuyerTypes, setAvailableBuyerTypes] = useState<string[]>([]);
  const pageSize = 8;

  // Selected Target Customer
  const [selectedUser, setSelectedUser] = useState<MarketplaceUserRecord | null>(null);
  const [manualUserId, setManualUserId] = useState<string>('55');

  // Thin Event mode toggle
  const [isThinEventMode, setIsThinEventMode] = useState<boolean>(true);

  // Notification Builder Form
  const [activePreset, setActivePreset] = useState<string>('thin_event_trigger');
  const [orderId, setOrderId] = useState<string>('4277');
  const [title, setTitle] = useState<string>('New Notification Signal');
  const [message, setMessage] = useState<string>(
    'Minimal lightweight event trigger emitted to room user_{userId}. Updates badge immediately and triggers DB fetch.'
  );
  const [eventType, setEventType] = useState<string>('thin_event_trigger');
  const [customJsonData, setCustomJsonData] = useState<string>(
    JSON.stringify(
      {
        invNo: '2610020003',
        customerName: 'Pasan Fernando',
        itemCount: 3,
        total: 1000,
      },
      null,
      2
    )
  );

  // Execution State & Telemetry
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastResponse, setLastResponse] = useState<any>(null);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);

  // 1. Fetch Users from DB
  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const params = new URLSearchParams({
        env: activeEnv,
        page: currentPage.toString(),
        limit: pageSize.toString(),
        search: searchQuery,
        buyerType: selectedBuyerType,
        status: selectedStatus,
      });

      const res = await fetch(`/api/developer/polygon/users?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setUsers(data.users || []);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.total || 0);
        if (data.availableBuyerTypes && data.availableBuyerTypes.length > 0) {
          setAvailableBuyerTypes(data.availableBuyerTypes);
        }
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error('Failed to load marketplace users:', err);
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  }, [activeEnv, currentPage, searchQuery, selectedBuyerType, selectedStatus]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // 2. Test DB Connection
  const handleTestDbConnection = async () => {
    setIsTestingDb(true);
    setDbStatus(null);
    try {
      const res = await fetch('/api/developer/polygon/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ env: activeEnv }),
      });
      const data = await res.json();
      if (data.success) {
        setDbStatus({
          connected: true,
          latencyMs: data.latencyMs,
          totalUsers: data.totalUsers,
          totalOrders: data.totalOrders,
        });
      } else {
        setDbStatus({
          connected: false,
          error: data.error || 'Connection failed',
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
  };

  // Switch Preset Handler
  const handleApplyPreset = (preset: PolygonNotificationPreset) => {
    setActivePreset(preset.id);
    setTitle(preset.title);
    setEventType(preset.id);

    // If a user is selected with an authentic order in DB, use their real order ID!
    const effectiveOrderId = selectedUser?.latestProcessOrderId
      ? selectedUser.latestProcessOrderId.toString()
      : preset.sampleOrderId
      ? preset.sampleOrderId.toString()
      : '';
    setOrderId(effectiveOrderId);

    const inv = selectedUser?.latestInvNo;
    let effectiveMsg = preset.message;
    if (inv) {
      effectiveMsg = effectiveMsg.replace(/#\d+/g, `#${inv}`);
    }
    setMessage(effectiveMsg);

    if (preset.sampleData) {
      const dataCopy = { ...preset.sampleData };
      if (inv) {
        dataCopy.invNo = inv;
      }
      setCustomJsonData(JSON.stringify(dataCopy, null, 2));
    }
    if (preset.isThinEvent !== undefined) {
      setIsThinEventMode(preset.isThinEvent);
    }
  };

  // Select User
  const handleSelectUser = (user: MarketplaceUserRecord) => {
    setSelectedUser(user);
    setManualUserId(user.id.toString());

    // Auto-link to this customer's authentic process order
    if (user.latestProcessOrderId) {
      setOrderId(user.latestProcessOrderId.toString());
    } else {
      setOrderId('');
    }

    // Auto-update message with customer's invoice number
    if (user.latestInvNo) {
      const inv = user.latestInvNo;
      setMessage((prev) => prev.replace(/#\d+/g, `#${inv}`));
      try {
        const parsed = JSON.parse(customJsonData);
        parsed.invNo = inv;
        setCustomJsonData(JSON.stringify(parsed, null, 2));
      } catch {}
    }
  };

  // Execute Trigger
  const handleTriggerNotification = async () => {
    const isCatalog = eventType === 'catalog_updated' || eventType === 'catalog_update';
    if (!isCatalog && !manualUserId && !orderId) {
      alert('Please select a customer or provide an Order ID.');
      return;
    }

    let parsedData = {};
    if (customJsonData && customJsonData.trim() !== '') {
      try {
        parsedData = JSON.parse(customJsonData);
      } catch (e: any) {
        alert('Invalid JSON in custom data: ' + e.message);
        return;
      }
    }

    setIsSubmitting(true);
    setLastResponse(null);

    const payload = {
      env: activeEnv,
      customApiUrl: customApiUrl.trim() || undefined,
      userId: manualUserId ? Number(manualUserId) : undefined,
      orderId: orderId ? Number(orderId) : undefined,
      title,
      message,
      eventType,
      isThinEvent: isThinEventMode,
      data: parsedData,
    };

    try {
      const res = await fetch('/api/developer/polygon/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setLastResponse(data);
    } catch (err: any) {
      setLastResponse({
        success: false,
        message: err.message || 'Network request failed',
        statusCode: 0,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Active base URL
  const activeBaseUrl = (
    customApiUrl || POLYGON_ENVIRONMENTS[activeEnv].polygonApiUrl
  ).replace(/\/+$/, '');

  const isCatalog = eventType === 'catalog_updated' || eventType === 'catalog_update';
  const effectiveEndpoint = isCatalog
    ? `${activeBaseUrl}/api/product/notify-update`
    : `${activeBaseUrl}/api/notification/trigger`;

  // Generate cURL Command
  const generateCurlCommand = () => {
    let parsedData = {};
    try {
      parsedData = JSON.parse(customJsonData);
    } catch {}

    const payload: any = isCatalog
      ? {
          action: 'update',
          packageId: Number(orderId) || 326,
        }
      : {
          userId: manualUserId ? Number(manualUserId) : undefined,
          orderId: orderId ? Number(orderId) : undefined,
          title,
          message,
          eventType,
          isThinEvent: isThinEventMode,
          data: parsedData,
        };

    return `curl -X POST "${effectiveEndpoint}" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(payload, null, 2)}'`;
  };

  const copyToClipboard = (text: string, type: 'curl' | 'payload') => {
    navigator.clipboard.writeText(text);
    if (type === 'curl') {
      setCopiedCurl(true);
      setTimeout(() => setCopiedCurl(false), 2000);
    } else {
      setCopiedPayload(true);
      setTimeout(() => setCopiedPayload(false), 2000);
    }
  };

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
            className="p-2 rounded-xl glass-card hover:bg-slate-200 dark:hover:bg-slate-800 transition-all text-slate-500 hover:text-slate-900 dark:hover:text-white"
            title="Back to Developer Console"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-600 via-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-md p-0.5">
            <ShoppingBag className="w-6 h-6" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold tracking-tight">
                Polygon (GoviMart) Notification Hub
              </h1>
              <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full border bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30">
                Thin Event Trigger
              </span>
              <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full border bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 flex items-center gap-1">
                <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
                <span>Socket.IO v4</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Zero-Polling Lightweight Event Trigger & Customer Push Delivery
            </p>
          </div>
        </div>

        {/* Action Controls & Environment Switcher */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Environment Selector Pills */}
          <div className="flex items-center p-1 rounded-xl glass-card border border-white/20 dark:border-white/5 text-xs font-bold">
            {(['dev', 'uat', 'local', 'prod'] as PolygonEnvironmentKey[]).map((env) => (
              <button
                key={env}
                onClick={() => {
                  setActiveEnv(env);
                  setCurrentPage(1);
                  setDbStatus(null);
                }}
                className={`px-3 py-1.5 rounded-lg transition-all uppercase tracking-wider text-[11px] font-extrabold cursor-pointer ${
                  activeEnv === env
                    ? env === 'prod'
                      ? 'bg-rose-500 text-white shadow-sm'
                      : env === 'uat'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {env}
              </button>
            ))}
          </div>

          {/* Test DB Button */}
          <button
            onClick={handleTestDbConnection}
            disabled={isTestingDb}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold glass-card hover:bg-slate-200 dark:hover:bg-slate-800 transition-all text-slate-700 dark:text-slate-200 cursor-pointer shadow-xs disabled:opacity-50"
            title="Test connection to MySQL collection_officer database"
          >
            <Database
              className={`w-3.5 h-3.5 text-cyan-500 ${isTestingDb ? 'animate-spin' : ''}`}
            />
            <span>{isTestingDb ? 'Testing DB...' : 'Test DB'}</span>
          </button>

          {/* Endpoint Config Button */}
          <button
            onClick={() => setShowEndpointModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold glass-card hover:bg-slate-200 dark:hover:bg-slate-800 transition-all text-slate-700 dark:text-slate-200 cursor-pointer shadow-xs"
            title="Custom Endpoint Override"
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-500" />
            <span>Endpoint</span>
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

          {/* Clear Access Button */}
          <button
            onClick={handleClearAccess}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 cursor-pointer shadow-xs"
            title="Revoke Developer Session"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Lock</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        {/* DB Connection Health Banner */}
        {dbStatus && (
          <div
            className={`p-4 rounded-2xl border transition-all text-xs flex items-center justify-between gap-4 ${
              dbStatus.connected
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {dbStatus.connected ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0" />
              )}
              <div>
                <span className="font-bold">
                  {dbStatus.connected
                    ? `Connected to MySQL [collection_officer] successfully in ${dbStatus.latencyMs}ms`
                    : 'Database Connection Failed'}
                </span>
                {dbStatus.connected && (
                  <p className="text-[11px] opacity-80 mt-0.5">
                    Total Marketplace Users: <b className="font-mono">{dbStatus.totalUsers}</b> | Orders in DB: <b className="font-mono">{dbStatus.totalOrders}</b> | Host: {POLYGON_ENVIRONMENTS[activeEnv].db.host}
                  </p>
                )}
                {dbStatus.error && (
                  <p className="text-[11px] font-mono mt-0.5 text-rose-500">{dbStatus.error}</p>
                )}
              </div>
            </div>
            <button
              onClick={() => setDbStatus(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Architecture & Thin Event Banner */}
        <div className="p-4 md:p-5 rounded-3xl glass-card border border-cyan-500/20 bg-gradient-to-r from-cyan-500/5 via-teal-500/5 to-transparent relative overflow-hidden">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-3xl">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
                  Thin Event Architecture
                </span>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Target Endpoint: <code className="font-mono text-cyan-600 dark:text-cyan-400">{effectiveEndpoint}</code>
                </span>
              </div>
              <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100">
                Zero-Polling Real-Time Trigger & DB Single Source of Truth
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                When triggered, the backend emits a lightweight trigger payload <code className="font-mono bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded text-[11px]">{'{ id, unreadCount, title }'}</code> directly to the user socket room <code className="font-mono bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded text-[11px]">user_{'{userId}'}</code>. The mobile app immediately updates badges and queries the database for verified records.
              </p>
            </div>

            {/* Thin Event Switcher */}
            <div className="flex items-center gap-3 p-2.5 rounded-2xl border border-white/20 dark:border-white/5 bg-white/40 dark:bg-black/30 flex-shrink-0">
              <div className="text-right">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  {isThinEventMode ? 'Thin Event Mode' : 'Full Payload Mode'}
                </div>
                <div className="text-[10px] text-slate-500">
                  {isThinEventMode ? 'Minimal trigger signal' : 'Complete fields via socket'}
                </div>
              </div>
              <button
                onClick={() => setIsThinEventMode(!isThinEventMode)}
                className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer ${
                  isThinEventMode ? 'bg-cyan-500' : 'bg-slate-400'
                }`}
                title="Toggle Thin Event Pattern"
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
                    isThinEventMode ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* 2-Column Grid: Directory & Dispatcher */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: Marketplace Customer Directory (5 cols) */}
          <section className="lg:col-span-5 space-y-4">
            <div className="glass-card p-5 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Store className="w-5 h-5 text-cyan-500" />
                  <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                    Marketplace Customers
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-slate-500">
                  {totalCount} Customers in DB
                </span>
              </div>

              {/* Search & Filters */}
              <div className="space-y-2.5">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Search name, phone, email, CUS ID..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 focus:outline-hidden focus:ring-2 focus:ring-cyan-500/50"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filter Chips: Buyer Type */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                  {['all', 'Retail', 'Wholesale'].map((type) => (
                    <button
                      key={type}
                      onClick={() => {
                        setSelectedBuyerType(type);
                        setCurrentPage(1);
                      }}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                        selectedBuyerType === type
                          ? 'bg-cyan-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      {type === 'all' ? 'All Types' : type}
                    </button>
                  ))}
                  <button
                    onClick={fetchUsers}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 ml-auto"
                    title="Refresh Customers List"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingUsers ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Customer Cards List */}
              <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                {loadingUsers ? (
                  <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-cyan-500" />
                    <p>Loading customers from MySQL...</p>
                  </div>
                ) : users.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 space-y-2 border border-dashed rounded-2xl border-slate-300 dark:border-slate-700">
                    <Users className="w-8 h-8 mx-auto text-slate-400 opacity-60" />
                    <p>No customers found matching your criteria.</p>
                  </div>
                ) : (
                  users.map((user) => {
                    const isSelected = selectedUser?.id === user.id;
                    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User';
                    const initials =
                      (user.firstName?.[0] || '') + (user.lastName?.[0] || '') || 'U';

                    return (
                      <div
                        key={user.id}
                        onClick={() => handleSelectUser(user)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 text-xs ${
                          isSelected
                            ? 'bg-cyan-500/10 border-cyan-500 shadow-sm'
                            : 'bg-white/40 dark:bg-black/20 border-slate-200/60 dark:border-slate-800 hover:border-cyan-500/40'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs uppercase flex-shrink-0 ${
                              user.buyerType === 'Wholesale'
                                ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30'
                                : 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30'
                            }`}
                          >
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-extrabold text-slate-800 dark:text-slate-100 truncate">
                                {fullName}
                              </span>
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                ID: {user.id}
                              </span>
                              {user.cusId && (
                                <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400">
                                  {user.cusId}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate flex items-center gap-2 mt-0.5">
                              <span>{user.phoneNumber || user.email || 'No contact'}</span>
                              {user.companyName && (
                                <span className="truncate text-slate-400">• {user.companyName}</span>
                              )}
                            </div>
                            {user.latestInvNo && (
                              <div className="mt-1 flex items-center gap-1.5">
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 font-bold border border-cyan-500/20">
                                  Order #{user.latestInvNo} (ID: {user.latestProcessOrderId})
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                              user.buyerType === 'Wholesale'
                                ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            }`}
                          >
                            {user.buyerType || 'Retail'}
                          </span>
                          {user.creditBalance !== null && Number(user.creditBalance) > 0 && (
                            <span className="text-[10px] font-mono text-amber-500 font-bold">
                              Rs. {Number(user.creditBalance).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800 text-xs">
                  <span className="text-slate-500 text-[11px]">
                    Page {currentPage} of {totalPages}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded-lg glass-card hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-1.5 rounded-lg glass-card hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Manual User ID Fallback */}
              <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800 space-y-2">
                <label className="text-[11px] font-bold text-slate-500 block">
                  Target Customer User ID:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={manualUserId}
                    onChange={(e) => setManualUserId(e.target.value)}
                    placeholder="e.g. 55"
                    className="flex-1 px-3 py-1.5 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                  />
                  <div className="flex items-center gap-1 text-[11px]">
                    {[55, 123, 375, 383].map((id) => (
                      <button
                        key={id}
                        onClick={() => setManualUserId(id.toString())}
                        className="px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-cyan-500 hover:text-white font-mono transition-colors"
                      >
                        {id}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* RIGHT COLUMN: Interactive Dispatcher & Presets (7 cols) */}
          <section className="lg:col-span-7 space-y-5">
            {/* Presets Carousel / Grid */}
            <div className="glass-card p-5 rounded-3xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-cyan-500" />
                  <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                    Event Templates & Presets
                  </h3>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                  1-Click Select
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {POLYGON_NOTIFICATION_PRESETS.map((preset) => {
                  const isCurrent = activePreset === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => handleApplyPreset(preset)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                        isCurrent
                          ? 'bg-cyan-500/15 border-cyan-500 shadow-sm'
                          : 'bg-white/40 dark:bg-black/20 border-slate-200/60 dark:border-slate-800 hover:border-cyan-500/40'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        {preset.isThinEvent ? (
                          <Radio className="w-3.5 h-3.5 text-amber-500" />
                        ) : preset.isCatalogEvent ? (
                          <Package className="w-3.5 h-3.5 text-cyan-500" />
                        ) : (
                          <BellRing className="w-3.5 h-3.5 text-cyan-500" />
                        )}
                        <span className="text-[11px] font-bold truncate text-slate-800 dark:text-slate-100">
                          {preset.label}
                        </span>
                      </div>
                      <div className="text-[9px] text-slate-500 uppercase tracking-wider font-extrabold truncate">
                        {preset.sourceApp}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notification Form Builder */}
            <div className="glass-card p-5 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyan-500" />
                  <span>Payload Form Builder</span>
                </h3>
                <span className="text-xs font-mono text-cyan-500 font-bold">
                  Room: user_{manualUserId || 'none'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {/* Order ID */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-400">
                    Order / Process Order ID (Optional):
                  </label>
                  <input
                    type="number"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    placeholder="e.g. 4277 (resolves invNo & userId)"
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                  />
                </div>

                {/* Event Type */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-400">
                    Event Type:
                  </label>
                  <input
                    type="text"
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    placeholder="e.g. order_on_the_way"
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                  />
                </div>
              </div>

              {/* Title & Message */}
              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-400">
                    Notification Title:
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Your Order is On the Way"
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-400">
                    Message Body:
                  </label>
                  <textarea
                    rows={2}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="e.g. Order #2610020003 is on its way to you."
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 leading-relaxed"
                  />
                </div>

                {/* Custom JSON Data */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-600 dark:text-slate-400">
                      Extra Data (JSON):
                    </label>
                    <button
                      onClick={() => setCustomJsonData('{\n  "test": true\n}')}
                      className="text-[10px] text-cyan-500 hover:underline"
                    >
                      Reset JSON
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={customJsonData}
                    onChange={(e) => setCustomJsonData(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 text-slate-100 font-mono text-[11px] border border-slate-700"
                  />
                </div>
              </div>

              {/* Trigger Button */}
              <button
                onClick={handleTriggerNotification}
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-extrabold text-sm shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Dispatching Trigger to Mobile API...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Dispatch Real-Time Notification</span>
                  </>
                )}
              </button>
            </div>

            {/* Mobile In-App Preview */}
            <div className="glass-card p-5 rounded-3xl space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-cyan-500" />
                  <span>GoviMart Mobile App Notification Screen Preview</span>
                </div>
                <span className="text-[10px] font-mono bg-cyan-500/10 text-cyan-500 px-2 py-0.5 rounded-md">
                  In-App Banner
                </span>
              </div>

              {/* Mobile notification card mock */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-xl border border-slate-700/60 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-black text-xs">
                      G
                    </div>
                    <span className="font-extrabold tracking-tight">Polygon GoviMart</span>
                  </div>
                  <span className="text-slate-400 font-mono text-[10px]">Just now</span>
                </div>

                <div className="space-y-1 pl-8">
                  <h4 className="text-xs font-extrabold text-emerald-400">{title}</h4>
                  <p className="text-[11px] text-slate-300 leading-relaxed">{message}</p>
                </div>

                <div className="pt-2 pl-8 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                  <span className="font-mono">User Room: user_{manualUserId || '0'}</span>
                  <span className="font-bold text-emerald-400">Real-time Unread Badge: +1</span>
                </div>
              </div>
            </div>

            {/* Live Telemetry & Result Inspector */}
            {lastResponse && (
              <div
                className={`glass-card p-5 rounded-3xl space-y-4 border ${
                  lastResponse.success ? 'border-emerald-500/40' : 'border-rose-500/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity
                      className={`w-4 h-4 ${
                        lastResponse.success ? 'text-emerald-500' : 'text-rose-500'
                      }`}
                    />
                    <h3 className="text-sm font-extrabold">Dispatch Result & Telemetry</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase font-mono ${
                        lastResponse.success
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      HTTP {lastResponse.statusCode || (lastResponse.success ? 200 : 500)}
                    </span>
                    {lastResponse.latencyMs !== undefined && (
                      <span className="text-[10px] font-mono text-slate-400">
                        {lastResponse.latencyMs}ms
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {lastResponse.message}
                </p>

                {/* Response Body JSON */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                    <span>API Response Payload:</span>
                    <button
                      onClick={() =>
                        copyToClipboard(JSON.stringify(lastResponse.data, null, 2), 'payload')
                      }
                      className="text-cyan-500 hover:underline flex items-center gap-1"
                    >
                      {copiedPayload ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedPayload ? 'Copied' : 'Copy Response'}</span>
                    </button>
                  </div>
                  <pre className="p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-[10px] overflow-x-auto max-h-48 border border-slate-800">
                    {JSON.stringify(lastResponse.data || lastResponse, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* cURL Command Generator */}
            <div className="glass-card p-5 rounded-3xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyan-500" />
                  <h4 className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                    Instant cURL Command
                  </h4>
                </div>
                <button
                  onClick={() => copyToClipboard(generateCurlCommand(), 'curl')}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold glass-card hover:bg-slate-200 dark:hover:bg-slate-800 transition-all text-cyan-500 flex items-center gap-1"
                >
                  {copiedCurl ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCurl ? 'Copied!' : 'Copy cURL'}</span>
                </button>
              </div>
              <pre className="p-3 rounded-xl bg-slate-900 text-cyan-300 font-mono text-[10px] overflow-x-auto border border-slate-800 whitespace-pre-wrap">
                {generateCurlCommand()}
              </pre>
            </div>
          </section>
        </div>
      </main>

      {/* Custom Endpoint Modal */}
      {showEndpointModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="glass-card p-6 rounded-3xl max-w-lg w-full space-y-4 border border-white/20 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">
                Override Polygon API Base URL
              </h3>
              <button
                onClick={() => setShowEndpointModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              By default, the active environment ({activeEnv.toUpperCase()}) uses{' '}
              <code className="font-mono text-cyan-500">
                {POLYGON_ENVIRONMENTS[activeEnv].polygonApiUrl}
              </code>
              . You can specify a local ngrok, docker, or custom port below:
            </p>

            <input
              type="text"
              value={customApiUrl}
              onChange={(e) => setCustomApiUrl(e.target.value)}
              placeholder="e.g. http://localhost:3000/polygon or https://xxxx.ngrok-free.app/polygon"
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setCustomApiUrl('');
                  setShowEndpointModal(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"
              >
                Reset Default
              </button>
              <button
                onClick={() => setShowEndpointModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600 text-white hover:bg-cyan-500"
              >
                Save Endpoint
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="max-w-7xl w-full mx-auto p-6 text-center text-xs text-slate-400 border-t border-slate-200/50 dark:border-slate-800/50 mt-12">
        Mobile App Manager • Polygon (GoviMart) Real-Time Notification Operations
      </footer>
    </div>
  );
}
