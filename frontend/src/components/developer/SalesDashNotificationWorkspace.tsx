'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Bell,
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
  CreditCard,
  BellRing,
  Activity,
  Terminal,
  ChevronLeft,
  ChevronRight,
  Sliders,
  Check,
  Clock,
  Radio,
} from 'lucide-react';
import { KingDeveloperIcon } from '@/components/common/icons/KingDeveloperIcon';
import { useTheme } from '@/context/ThemeContext';
import { clearDeveloperAccess } from '@/lib/developer/security';
import {
  SalesDashEnvironmentKey,
  SALES_DASH_ENVIRONMENTS,
  SalesAgentRecord,
  NOTIFICATION_PRESETS,
  NotificationPreset,
} from '@/lib/developer/salesDashTypes';

export default function SalesDashNotificationWorkspace() {
  const router = useRouter();
  const { isLightTheme, toggleTheme } = useTheme();

  // Environment state
  const [activeEnv, setActiveEnv] = useState<SalesDashEnvironmentKey>('dev');
  const [customApiUrl, setCustomApiUrl] = useState('');
  const [showEndpointModal, setShowEndpointModal] = useState(false);

  // DB Connection Health
  const [isTestingDb, setIsTestingDb] = useState(false);
  const [dbStatus, setDbStatus] = useState<{
    connected: boolean;
    latencyMs?: number;
    totalSalesAgents?: number;
    error?: string;
  } | null>(null);

  // Sales Agents Directory
  const [agents, setAgents] = useState<SalesAgentRecord[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [availableStatuses, setAvailableStatuses] = useState<string[]>([]);
  const pageSize = 8;

  // Selected Target Sales Agent
  const [selectedAgent, setSelectedAgent] = useState<SalesAgentRecord | null>(null);
  const [manualAgentId, setManualAgentId] = useState<string>('37');

  // Notification Builder Form
  const [activePreset, setActivePreset] = useState<string>('order_placed');
  const [orderId, setOrderId] = useState<string>('1420');
  const [title, setTitle] = useState<string>('New Customer Order Placed');
  const [message, setMessage] = useState<string>('Order #INV-2026-098 for John Silva (Rs. 4,500)');
  const [eventType, setEventType] = useState<string>('order_placed');
  const [customJsonData, setCustomJsonData] = useState<string>(
    JSON.stringify(
      {
        invNo: 'INV-2026-098',
        customerName: 'John Silva',
        total: 4500,
        itemCount: 4,
      },
      null,
      2
    )
  );
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Trigger Execution & Telemetry
  const [isTriggering, setIsTriggering] = useState(false);
  const [triggerResult, setTriggerResult] = useState<any | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [rightPanelTab, setRightPanelTab] = useState<'telemetry' | 'agents'>('telemetry');

  const currentConfig = SALES_DASH_ENVIRONMENTS[activeEnv] || SALES_DASH_ENVIRONMENTS.dev;
  const effectiveApiUrl = (customApiUrl || currentConfig.salesDashApiUrl).replace(/\/+$/, '');

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
  const testConnection = useCallback(async (envToTest: SalesDashEnvironmentKey) => {
    setIsTestingDb(true);
    try {
      const res = await fetch('/api/developer/sales-dash/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ env: envToTest }),
      });
      const data = await res.json();
      if (data.success) {
        setDbStatus({
          connected: true,
          latencyMs: data.latencyMs,
          totalSalesAgents: data.totalSalesAgents,
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

  // Fetch sales agents
  const fetchAgents = useCallback(async () => {
    setLoadingAgents(true);
    try {
      const params = new URLSearchParams({
        env: activeEnv,
        page: currentPage.toString(),
        limit: pageSize.toString(),
        search: searchQuery,
        status: selectedStatus === 'all' ? '' : selectedStatus,
      });

      const res = await fetch(`/api/developer/sales-dash/agents?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setAgents(data.agents || []);
        setTotalCount(data.total || 0);
        setTotalPages(data.totalPages || 1);
        if (data.availableStatuses?.length) {
          setAvailableStatuses(data.availableStatuses);
        }
      } else {
        setAgents([]);
        setTotalCount(0);
      }
    } catch (err) {
      console.error('Failed to load sales agents:', err);
      setAgents([]);
    } finally {
      setLoadingAgents(false);
    }
  }, [activeEnv, currentPage, searchQuery, selectedStatus]);

  // Initial load on env change
  useEffect(() => {
    setCurrentPage(1);
    testConnection(activeEnv);
    fetchAgents();
  }, [activeEnv, testConnection]);

  // Refetch when filters change
  useEffect(() => {
    fetchAgents();
  }, [currentPage, selectedStatus, fetchAgents]);

  // Apply Preset
  const handleApplyPreset = (preset: NotificationPreset) => {
    setActivePreset(preset.id);
    setTitle(preset.title);
    setMessage(preset.message);
    setEventType(preset.id);
    setOrderId(preset.sampleOrderId.toString());
    setCustomJsonData(JSON.stringify(preset.sampleData, null, 2));
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

  // Select an agent from table
  const handleSelectAgent = (agent: SalesAgentRecord) => {
    setSelectedAgent(agent);
    setManualAgentId(agent.id.toString());
    setRightPanelTab('telemetry');
  };

  // Execute Notification Trigger
  const handleTrigger = async () => {
    if (!title.trim()) {
      alert('Please enter a notification title');
      return;
    }

    let parsedData = {};
    if (customJsonData.trim()) {
      try {
        parsedData = JSON.parse(customJsonData);
      } catch (e) {
        alert('Invalid JSON in Additional Data payload');
        return;
      }
    }

    const resolvedAgentId = selectedAgent ? selectedAgent.id : (manualAgentId ? Number(manualAgentId) : null);
    const resolvedOrderId = orderId ? Number(orderId) : null;

    if (!resolvedAgentId && !resolvedOrderId) {
      alert('Please provide either a Sales Agent ID or an Order ID to target');
      return;
    }

    setIsTriggering(true);
    setTriggerResult(null);
    setRightPanelTab('telemetry');

    try {
      const res = await fetch('/api/developer/sales-dash/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          env: activeEnv,
          customApiUrl: customApiUrl || undefined,
          salesAgentId: resolvedAgentId,
          orderId: resolvedOrderId,
          title,
          message,
          eventType,
          data: parsedData,
        }),
      });

      const data = await res.json();
      setTriggerResult(data);
    } catch (err: any) {
      setTriggerResult({
        success: false,
        statusCode: 0,
        message: err.message || 'Network request failed',
        error: err.toString(),
      });
    } finally {
      setIsTriggering(false);
    }
  };

  // Generate Curl command preview
  const curlPreview = `curl -X POST "${effectiveApiUrl}/api/notifications/trigger" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(
    {
      orderId: orderId ? Number(orderId) : null,
      salesAgentId: selectedAgent ? selectedAgent.id : (manualAgentId ? Number(manualAgentId) : null),
      title,
      message,
      eventType,
      data: (() => {
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

          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-600 to-indigo-600 flex items-center justify-center text-white shadow-md p-0.5">
            <KingDeveloperIcon size={30} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold tracking-tight">Sales Dash Notification Hub</h1>
              <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full border bg-amber-500/10 text-amber-500 border-amber-500/30">
                Live Trigger
              </span>
              <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full border bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 flex items-center gap-1 shadow-xs">
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                <span>Zero-Polling</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Simulate & Trigger Cross-App Real-Time Webhooks to Sales Agents
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Endpoint Override Button */}
          <button
            onClick={() => setShowEndpointModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all glass-card hover:bg-slate-200 dark:hover:bg-slate-800"
            title="Configure Custom Sales Dash API URL"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">Target API:</span>
            <span className="font-mono text-[11px] text-amber-500 max-w-[120px] truncate">
              {customApiUrl ? 'Custom' : activeEnv.toUpperCase()}
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
        {/* Top Info Banner */}
        <div className="glass-panel p-6 rounded-3xl relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border bg-amber-500/10 text-amber-500 border-amber-500/30">
              <Radio className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              <span>Universal Webhook Dispatcher</span>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight">
              Cross-Application Notification Simulator
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Test how <strong>Admin Panel</strong>, <strong>Polygon (GoviMart)</strong>, and <strong>Govi Transport</strong> dispatch real-time events to the Sales Dash mobile app. Emits instant WebSocket badges, updates unread counts in cache, and fires native Push notifications.
            </p>
          </div>

          {/* Environment Switcher Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="glass-card p-1.5 rounded-2xl flex items-center gap-1">
              {(['dev', 'uat', 'local'] as SalesDashEnvironmentKey[]).map((envKey) => (
                <button
                  key={envKey}
                  onClick={() => setActiveEnv(envKey)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${
                    activeEnv === envKey
                      ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md'
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
              <RefreshCw className={`w-3.5 h-3.5 text-amber-500 ${isTestingDb ? 'animate-spin' : ''}`} />
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

        {/* Database & Target Endpoint Status Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Target API Card */}
          <div className="glass-card p-4 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Server className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Target Endpoint</div>
                <div className="text-xs font-mono font-bold truncate max-w-[200px]" title={effectiveApiUrl}>
                  {effectiveApiUrl}
                </div>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-500">
              /api/notifications/trigger
            </span>
          </div>

          {/* Database Connection Card */}
          <div className="glass-card p-4 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Database</div>
                <div className="text-xs font-bold flex items-center gap-1.5">
                  <span className="truncate">{currentConfig.db.host}</span>
                  {dbStatus?.latencyMs && (
                    <span className="text-[10px] text-slate-400 font-mono">({dbStatus.latencyMs}ms)</span>
                  )}
                </div>
              </div>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                dbStatus?.connected
                  ? 'bg-emerald-500/15 text-emerald-500'
                  : 'bg-rose-500/15 text-rose-500'
              }`}
            >
              {dbStatus?.connected ? 'Online' : 'Check DB'}
            </span>
          </div>

          {/* Registered Agents in Environment Card */}
          <div className="glass-card p-4 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Sales Agents</div>
                <div className="text-xs font-bold">
                  {dbStatus?.totalSalesAgents ?? totalCount} Agents Registered
                </div>
              </div>
            </div>
            <button
              onClick={() => setRightPanelTab('agents')}
              className="text-[10px] font-bold text-amber-500 hover:underline flex items-center gap-1"
            >
              <span>View Directory</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Quick Event Presets Strip */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Select Event Preset Scenario:</span>
            <span className="text-[10px] font-normal lowercase text-slate-500">click to load realistic sample payload</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
            {NOTIFICATION_PRESETS.map((preset) => {
              const isSelected = activePreset === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => handleApplyPreset(preset)}
                  className={`p-3 rounded-2xl text-left transition-all border flex flex-col justify-between gap-2 cursor-pointer ${
                    isSelected
                      ? 'border-amber-500 bg-amber-500/10 dark:bg-amber-500/15 shadow-md shadow-amber-500/10'
                      : 'border-slate-200/60 dark:border-slate-800/60 glass-card hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-amber-500 tracking-wider">
                      {preset.label}
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-amber-500" />}
                  </div>
                  <div className="text-[11px] font-bold truncate text-slate-800 dark:text-slate-200">
                    {preset.sourceApp}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Workspace Two-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: Notification Builder Form (7 Cols) */}
          <div className="lg:col-span-7 glass-panel p-6 rounded-3xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50 pb-4">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-extrabold">Notification Builder</h3>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Target: {selectedAgent ? `${selectedAgent.firstName} (${selectedAgent.empId})` : `Agent ID: ${manualAgentId || 'Auto-resolve'}`}
              </span>
            </div>

            {/* Target Agent Selector Ribbon */}
            <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4" />
                  <span>Target Sales Agent</span>
                </span>

                <button
                  onClick={() => setRightPanelTab('agents')}
                  className="text-xs font-bold text-amber-500 hover:underline flex items-center gap-1"
                >
                  <span>Select from Database</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>

              {selectedAgent ? (
                <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-xs">
                      {selectedAgent.firstName?.[0] || 'A'}
                    </div>
                    <div>
                      <div className="text-xs font-extrabold flex items-center gap-2">
                        <span>{selectedAgent.firstName} {selectedAgent.lastName}</span>
                        <span className="font-mono text-[10px] text-amber-500 font-bold">
                          {selectedAgent.empId}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        DB ID: {selectedAgent.id} • {selectedAgent.email}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedAgent(null);
                      setManualAgentId('');
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                    title="Clear selected agent (Test smart auto-resolution by Order ID)"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">
                      Direct Sales Agent ID:
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 37"
                      value={manualAgentId}
                      onChange={(e) => setManualAgentId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">
                      Smart Resolution:
                    </label>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      Leave Agent ID blank to test backend <strong>auto-resolving</strong> the agent from <strong>Order ID</strong>!
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Event Type */}
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1.5">
                    Event Type (`eventType`):
                  </label>
                  <input
                    type="text"
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    placeholder="order_placed"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Order ID */}
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1.5">
                    Order ID (`orderId`):
                  </label>
                  <input
                    type="number"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    placeholder="1420"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1.5">
                  Notification Title:
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. New Order Placed"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Message */}
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1.5">
                  Notification Message / Body:
                </label>
                <textarea
                  rows={2}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="e.g. Order #INV-2026-098 for John Silva (Rs. 4,500)"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              {/* Custom JSON Data payload */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-400">
                    Additional JSON Metadata (`data`):
                  </label>
                  {jsonError ? (
                    <span className="text-[10px] text-rose-500 font-bold">Invalid JSON Syntax</span>
                  ) : (
                    <span className="text-[10px] text-emerald-500 font-bold">Valid JSON Object</span>
                  )}
                </div>
                <textarea
                  rows={4}
                  value={customJsonData}
                  onChange={(e) => handleJsonChange(e.target.value)}
                  className="w-full p-3 rounded-xl text-xs font-mono bg-slate-950 text-slate-200 border border-slate-800 focus:outline-none focus:border-amber-500 font-medium"
                />
              </div>
            </div>

            {/* Action Trigger Button */}
            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={handleTrigger}
                disabled={isTriggering}
                className="flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-600 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white font-extrabold text-sm shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isTriggering ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Dispatching Real-Time Trigger...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>🚀 Trigger Notification to Sales Dash</span>
                  </>
                )}
              </button>

              <button
                onClick={() => copyToClipboard(curlPreview, 'curl')}
                className="px-4 py-3.5 rounded-2xl glass-card text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-800 transition-all flex items-center gap-1.5"
                title="Copy as cURL command"
              >
                <Terminal className="w-4 h-4 text-amber-500" />
                <span>{copiedText === 'curl' ? 'Copied!' : 'Copy cURL'}</span>
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: Tabbed Results & Sales Agents Directory (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Tab Buttons */}
            <div className="glass-card p-1.5 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setRightPanelTab('telemetry')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                    rightPanelTab === 'telemetry'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Live Telemetry</span>
                </button>

                <button
                  onClick={() => setRightPanelTab('agents')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                    rightPanelTab === 'agents'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Sales Agents Directory ({totalCount})</span>
                </button>
              </div>

              {triggerResult && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    triggerResult.success
                      ? 'bg-emerald-500/15 text-emerald-500'
                      : 'bg-rose-500/15 text-rose-500'
                  }`}
                >
                  HTTP {triggerResult.statusCode}
                </span>
              )}
            </div>

            {/* TAB 1: TELEMETRY & LIVE RESPONSE */}
            {rightPanelTab === 'telemetry' && (
              <div className="glass-panel p-6 rounded-3xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-amber-500" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                      Webhook Response & Socket State
                    </h4>
                  </div>

                  {triggerResult && (
                    <button
                      onClick={() =>
                        copyToClipboard(JSON.stringify(triggerResult, null, 2), 'response')
                      }
                      className="text-xs text-amber-500 hover:underline flex items-center gap-1 font-bold"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedText === 'response' ? 'Copied!' : 'Copy JSON'}</span>
                    </button>
                  )}
                </div>

                {triggerResult ? (
                  <div className="space-y-4">
                    {/* Status Summary Banner */}
                    <div
                      className={`p-4 rounded-2xl border ${
                        triggerResult.success
                          ? 'border-emerald-500/30 bg-emerald-500/10'
                          : 'border-rose-500/30 bg-rose-500/10'
                      } space-y-2`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-extrabold flex items-center gap-1.5 ${
                            triggerResult.success ? 'text-emerald-500' : 'text-rose-500'
                          }`}
                        >
                          {triggerResult.success ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <AlertTriangle className="w-4 h-4" />
                          )}
                          <span>
                            {triggerResult.success
                              ? 'Notification Dispatched Successfully'
                              : 'Dispatch Failed'}
                          </span>
                        </span>

                        <span className="text-[11px] font-mono font-bold text-slate-400">
                          {triggerResult.latencyMs}ms
                        </span>
                      </div>

                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        {triggerResult.message}
                      </p>
                    </div>

                    {/* Architectural Verification Badges */}
                    {triggerResult.data && (
                      <div className="grid grid-cols-3 gap-2">
                        {/* Socket Delivered Badge */}
                        <div className="p-2.5 rounded-xl border border-white/20 dark:border-white/5 bg-white/40 dark:bg-black/30 text-center">
                          <div className="text-[10px] uppercase font-bold text-slate-400">
                            WebSocket Event
                          </div>
                          <div className="text-xs font-extrabold text-emerald-500 flex items-center justify-center gap-1 mt-0.5">
                            <Radio className="w-3 h-3" />
                            <span>newNotification</span>
                          </div>
                        </div>

                        {/* Unread Count Cache Badge */}
                        <div className="p-2.5 rounded-xl border border-white/20 dark:border-white/5 bg-white/40 dark:bg-black/30 text-center">
                          <div className="text-[10px] uppercase font-bold text-slate-400">
                            Unread Counter
                          </div>
                          <div className="text-xs font-mono font-extrabold text-amber-500 mt-0.5">
                            +{triggerResult.data?.data?.unreadCount ?? 1}
                          </div>
                        </div>

                        {/* Push Notification Badge */}
                        <div className="p-2.5 rounded-xl border border-white/20 dark:border-white/5 bg-white/40 dark:bg-black/30 text-center">
                          <div className="text-[10px] uppercase font-bold text-slate-400">
                            FCM / Push
                          </div>
                          <div className="text-xs font-extrabold text-indigo-500 flex items-center justify-center gap-1 mt-0.5">
                            <Smartphone className="w-3 h-3" />
                            <span>Delivered</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Raw JSON Code Box */}
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-bold text-slate-400">Raw API Response:</div>
                      <pre className="p-3.5 rounded-2xl bg-slate-950 text-slate-200 text-[11px] font-mono overflow-x-auto max-h-[260px] border border-slate-800">
                        {JSON.stringify(triggerResult.data || triggerResult, null, 2)}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
                      <Send className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-extrabold">Ready to Trigger</p>
                      <p className="text-[11px] text-slate-400 max-w-xs mx-auto leading-relaxed">
                        Configure the event and target sales agent on the left, then click <strong>Trigger Notification</strong> to broadcast.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: SALES AGENTS DIRECTORY TABLE */}
            {rightPanelTab === 'agents' && (
              <div className="glass-panel p-6 rounded-3xl space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search name, EMP ID, email..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full pl-8 pr-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <select
                    value={selectedStatus}
                    onChange={(e) => {
                      setSelectedStatus(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-amber-500"
                  >
                    <option value="all">All Statuses</option>
                    {availableStatuses.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Agents List */}
                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {loadingAgents ? (
                    <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
                      <span>Loading Sales Agents from {activeEnv.toUpperCase()} DB...</span>
                    </div>
                  ) : agents.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      No sales agents found matching query.
                    </div>
                  ) : (
                    agents.map((agent) => {
                      const isSelected = selectedAgent?.id === agent.id;
                      return (
                        <div
                          key={agent.id}
                          className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'border-amber-500 bg-amber-500/10'
                              : 'border-slate-200/60 dark:border-slate-800/60 glass-card hover:border-slate-300'
                          }`}
                        >
                          <div className="min-w-0 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                              {agent.firstName?.[0] || 'S'}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-extrabold truncate flex items-center gap-1.5">
                                <span>{agent.firstName} {agent.lastName}</span>
                                <span className="font-mono text-[10px] text-amber-500 font-bold shrink-0">
                                  {agent.empId}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-400 truncate">
                                DB ID: {agent.id} • {agent.email || agent.phoneNumber1 || 'No contact'}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                agent.status === 'Approved'
                                  ? 'bg-emerald-500/15 text-emerald-500'
                                  : 'bg-rose-500/15 text-rose-500'
                              }`}
                            >
                              {agent.status}
                            </span>

                            <button
                              onClick={() => handleSelectAgent(agent)}
                              className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-amber-500 hover:bg-amber-600 text-white transition-all cursor-pointer shadow-xs"
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
      </main>

      {/* Target API Override Modal */}
      {showEndpointModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl max-w-lg w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold flex items-center gap-2">
                <Sliders className="w-5 h-5 text-amber-500" />
                <span>Override Sales Dash API Endpoint</span>
              </h3>
              <button
                onClick={() => setShowEndpointModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Customize the base URL for the Sales Dash Mobile API. Useful for testing against local port 3000, ngrok, or preview branches.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 block">
                Sales Dash Base URL:
              </label>
              <input
                type="text"
                value={customApiUrl}
                onChange={(e) => setCustomApiUrl(e.target.value)}
                placeholder={currentConfig.salesDashApiUrl}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                onClick={() => setCustomApiUrl('')}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-rose-500"
              >
                Reset to Default
              </button>

              <button
                onClick={() => setShowEndpointModal(false)}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs shadow-md"
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
