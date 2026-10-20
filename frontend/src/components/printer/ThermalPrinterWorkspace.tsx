'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  Bluetooth,
  Check,
  CheckCircle2,
  Copy,
  Download,
  FileCode,
  Flame,
  Layers,
  Loader2,
  Lock,
  Moon,
  Play,
  Power,
  Printer,
  QrCode,
  Radio,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Square,
  Sun,
  Terminal,
  Trash2,
  Wifi,
  Zap,
} from 'lucide-react';
import { PrinterServerState, PrintJobRecord } from '@/lib/printer/printerSimulator';
import { generateQrSvg } from '@/lib/printer/qrGenerator';
import { DevilWomanIcon } from '@/components/common/icons/DevilWomanIcon';
import { KingDeveloperIcon } from '@/components/common/icons/KingDeveloperIcon';
import { useTheme } from '@/context/ThemeContext';
import { clearDeveloperAccess } from '@/lib/developer/security';
import { ChromeBluetoothPrinterStudio } from '@/components/printer/ChromeBluetoothPrinterStudio';

interface ThermalPrinterWorkspaceProps {
  role: 'developer' | 'qa';
  backUrl: string;
}

export const ThermalPrinterWorkspace: React.FC<ThermalPrinterWorkspaceProps> = ({ role, backUrl }) => {
  const router = useRouter();
  const { isLightTheme, toggleTheme } = useTheme();
  const isQa = role === 'qa';

  const [state, setState] = useState<PrinterServerState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isTogglingBt, setIsTogglingBt] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'chrome-ble' | 'virtual-server'>('chrome-ble');

  // Server settings
  const [tcpPort, setTcpPort] = useState<number>(33582);
  const [httpPort, setHttpPort] = useState<number>(3002);
  const [selectedIp, setSelectedIp] = useState<string>('');

  // Custom TSPL test input
  const [customTspl, setCustomTspl] = useState<string>('');
  const [selectedJobModal, setSelectedJobModal] = useState<PrintJobRecord | null>(null);
  const [isFeedingAnimation, setIsFeedingAnimation] = useState(false);

  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const lastJobIdRef = useRef<string | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/printer/status');
      if (res.ok) {
        const data: PrinterServerState = await res.json();
        setState(data);
        if (!selectedIp && data.ip) {
          setSelectedIp(data.ip);
        }
        if (data.tcpPort) setTcpPort(data.tcpPort);
        if (data.httpPort) setHttpPort(data.httpPort);

        // Detect new incoming print job to trigger feed animation
        if (data.latestJob && data.latestJob.id !== lastJobIdRef.current) {
          if (lastJobIdRef.current !== null) {
            setIsFeedingAnimation(true);
            setTimeout(() => setIsFeedingAnimation(false), 800);
          }
          lastJobIdRef.current = data.latestJob.id;
        }
      }
    } catch {
      // Ignore polling errors
    }
  };

  useEffect(() => {
    fetchStatus();
    // Auto-start simulator on workspace load if not already running
    fetch('/api/printer/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tcpPort: 33582, httpPort: 3002 }),
    }).catch(() => {});

    pollRef.current = setInterval(fetchStatus, 1200);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const handleStart = async () => {
    setIsStarting(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/printer/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tcpPort, httpPort }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Failed to start printer server');
      }
      await fetchStatus();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsStarting(false);
    }
  };

  const handleStop = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/printer/stop', { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Failed to stop printer server');
      }
      await fetchStatus();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleBluetooth = async () => {
    setIsTogglingBt(true);
    try {
      const action = state?.isBluetoothRunning ? 'stop' : 'start';
      await fetch('/api/printer/bluetooth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      await fetchStatus();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsTogglingBt(false);
    }
  };

  const handlePrintSample = async (sampleType: 'wholesale' | 'retail' | 'step2' | 'box') => {
    try {
      setIsFeedingAnimation(true);
      const res = await fetch('/api/printer/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sample: sampleType }),
      });
      await res.json();
      await fetchStatus();
      setTimeout(() => setIsFeedingAnimation(false), 700);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleSendCustomTspl = async () => {
    if (!customTspl.trim()) return;
    try {
      setIsFeedingAnimation(true);
      const res = await fetch('/api/printer/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tspl: customTspl }),
      });
      await res.json();
      await fetchStatus();
      setCustomTspl('');
      setTimeout(() => setIsFeedingAnimation(false), 700);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleClearHistory = async () => {
    try {
      await fetch('/api/printer/history', { method: 'DELETE' });
      await fetchStatus();
    } catch {
      // Ignore
    }
  };

  const handleChromeSimulation = async (tspl: string, details?: any) => {
    try {
      await fetch('/api/printer/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tspl }),
      });
      await fetchStatus();
    } catch {
      // Ignore
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const isRunning = state?.isRunning ?? false;
  const isBluetoothRunning = state?.isBluetoothRunning ?? false;
  const btDeviceName = state?.bluetoothDeviceName || 'APEX-TUF-F15';
  const primaryIp = selectedIp || state?.ip || '192.168.8.101';
  const latestJob = state?.latestJob;
  const parsed = latestJob?.parsed;

  // QR Code SVG generation
  const qrSvg = parsed?.qrValue ? generateQrSvg(parsed.qrValue, 130) : '';

  return (
    <div className="min-h-screen flex flex-col font-sans transition-colors duration-300">
      {/* Top Glassmorphic Navigation Header */}
      <header className="sticky top-0 z-40 glass-header px-6 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href={backUrl}
            className="w-11 h-11 rounded-2xl glass-card flex items-center justify-center hover:scale-105 transition-transform"
            title="Return to Hub"
          >
            {isQa ? <DevilWomanIcon size={38} /> : <KingDeveloperIcon size={30} />}
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold tracking-tight">Mobile App Manager</h1>
              <span
                className={`px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full border ${
                  isQa
                    ? 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                    : 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                }`}
              >
                {isQa ? 'Napuru QA' : 'King of Developer'}
              </span>
              {!isQa && (
                <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full border bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 flex items-center gap-1 shadow-xs">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" />
                  <span>Full Access</span>
                </span>
              )}
              <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full border bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 hidden sm:inline-flex items-center gap-1">
                <Bluetooth className="w-3 h-3" />
                Laptop Bluetooth Thermal Printer (TSPL 50x30mm)
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Laptop broadcasts natively as a real Bluetooth Thermal Printer for unmodified Codi Net APK &amp; QA testing
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {!isQa && (
            <button
              onClick={() => {
                clearDeveloperAccess();
                router.push('/select-role');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 cursor-pointer shadow-xs"
              title="Revoke Developer Session & Lock Workspace"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Clear Access</span>
            </button>
          )}

          <Link
            href={backUrl}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all glass-card hover:bg-slate-200 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="w-4 h-4 text-purple-500" />
            <span>Hub Menu</span>
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

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-6">
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="underline cursor-pointer">
              Dismiss
            </button>
          </div>
        )}

        {/* Workspace Mode Tabs: Chrome Web Bluetooth 50x30 Studio vs Virtual Printer Server */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 rounded-3xl glass-card border border-slate-200 dark:border-slate-800 shadow-lg">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('chrome-ble')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl font-black text-xs transition-all cursor-pointer ${
                activeTab === 'chrome-ble'
                  ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg shadow-blue-500/25 ring-2 ring-blue-500/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
              }`}
            >
              <Bluetooth className="w-4 h-4 text-cyan-300" />
              <span>Chrome Bluetooth 50x30 Studio</span>
              <span className="px-2 py-0.5 text-[9px] font-black rounded-full bg-white/20 text-white uppercase tracking-wider">
                XP-365B Physical
              </span>
            </button>

            <button
              onClick={() => setActiveTab('virtual-server')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl font-black text-xs transition-all cursor-pointer ${
                activeTab === 'virtual-server'
                  ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg shadow-blue-500/25 ring-2 ring-blue-500/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
              }`}
            >
              <Radio className="w-4 h-4 text-emerald-400" />
              <span>Laptop Virtual Server Hub</span>
              <span className="px-2 py-0.5 text-[9px] font-black rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Zero-Change Mobile
              </span>
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-3 px-4 text-xs font-mono text-slate-500 dark:text-slate-400">
            <span>Label: <strong className="text-slate-800 dark:text-slate-200">50mm × 30mm TSPL</strong></span>
            <span>•</span>
            <span>Driver: <strong className="text-blue-500">Google Chrome Web BLE</strong></span>
          </div>
        </div>

        {activeTab === 'chrome-ble' ? (
          /* SECTION 1: DEDICATED CHROME WEB BLUETOOTH 50x30 STUDIO */
          <div className="space-y-6">
            <ChromeBluetoothPrinterStudio
              onSimulatePrint={handleChromeSimulation}
              serverState={state}
              onRefreshServer={fetchStatus}
            />

            {/* Print Job History in Studio Tab */}
            <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Printer className="w-4 h-4 text-emerald-500" />
                  <h3 className="text-sm font-extrabold tracking-tight">Print Job Audit Log (50x30mm)</h3>
                </div>
                {state?.history && state.history.length > 0 && (
                  <button
                    onClick={handleClearHistory}
                    className="flex items-center gap-1 text-[11px] font-bold text-rose-500 hover:text-rose-600 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear History</span>
                  </button>
                )}
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {state?.history && state.history.length > 0 ? (
                  state.history.map((job) => (
                    <div
                      key={job.id}
                      className="p-3 rounded-2xl bg-slate-100/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-800 dark:text-slate-200">
                              {job.parsed.orderNumber}
                            </span>
                            <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25 flex items-center gap-0.5">
                              <Bluetooth className="w-2.5 h-2.5" />
                              <span>{job.source.toUpperCase()}</span>
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">
                            {job.parsed.stepIndex} • {job.parsed.stepLabel}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-slate-400">{job.timestamp}</span>
                        <button
                          onClick={() => setSelectedJobModal(job)}
                          className="p-1.5 rounded-lg bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-500 cursor-pointer"
                          title="View TSPL"
                        >
                          <FileCode className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center text-xs text-slate-400">
                    No print jobs recorded yet. Use &ldquo;Print to XP-365B Now&rdquo; or &ldquo;Simulate Label&rdquo; above!
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* SECTION 2: LAPTOP VIRTUAL SERVER HUB & BACKGROUND BROADCAST */
          <div className="space-y-6">
            {/* Top Grid: Server Control & Status vs Bluetooth Direct Pairing */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card 1: Virtual Printer Server Status & Switch */}
          <div className="lg:col-span-2 glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800/80">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                    isRunning || isBluetoothRunning
                      ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/40'
                      : 'bg-slate-500/10 text-slate-400'
                  }`}
                >
                  <Bluetooth className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-extrabold tracking-tight">Laptop Bluetooth Printer</h2>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        isBluetoothRunning
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isBluetoothRunning ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                        }`}
                      />
                      {isBluetoothRunning ? 'Broadcasting on Bluetooth' : 'Bluetooth Inactive'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Your Windows 10 laptop operates as a physical Bluetooth LE Thermal Printer (203 DPI, 50x30mm)
                  </p>
                </div>
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleToggleBluetooth}
                  disabled={isTogglingBt}
                  className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl font-bold text-xs transition-all cursor-pointer shadow-md ${
                    isBluetoothRunning
                      ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                  }`}
                  title="Toggle Windows 10 Bluetooth LE GATT Peripheral Broadcast"
                >
                  {isTogglingBt ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Bluetooth className="w-3.5 h-3.5" />
                  )}
                  <span>{isBluetoothRunning ? 'Bluetooth Active' : 'Start Bluetooth'}</span>
                </button>

                {isRunning ? (
                  <button
                    onClick={handleStop}
                    disabled={isLoading}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-500/25 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Power className="w-3.5 h-3.5" />}
                    <span>Stop All</span>
                  </button>
                ) : (
                  <button
                    onClick={handleStart}
                    disabled={isStarting}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-lg shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isStarting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                    <span>Start All</span>
                  </button>
                )}
              </div>
            </div>

            {/* Hardware & Network Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-blue-500/10 dark:bg-blue-950/40 border border-blue-500/20">
                <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block mb-1">
                  Bluetooth Device Name
                </span>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-black text-blue-900 dark:text-blue-200 truncate">
                    {btDeviceName}
                  </span>
                  <button
                    onClick={() => copyToClipboard(btDeviceName, 'btname')}
                    className="text-blue-500 hover:text-blue-600 p-1 rounded-lg"
                    title="Copy Device Name"
                  >
                    {copiedField === 'btname' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-100/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Printer Service UUID
                </span>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-black text-slate-800 dark:text-slate-200 truncate">
                    0000ffe0-0000... (XP-365B)
                  </span>
                  <button
                    onClick={() => copyToClipboard('0000ffe0-0000-1000-8000-00805f9b34fb', 'btuuid')}
                    className="text-slate-400 hover:text-blue-500 p-1 rounded-lg"
                    title="Copy UUID"
                  >
                    {copiedField === 'btuuid' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-100/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Local Network IP
                </span>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-black text-indigo-600 dark:text-indigo-400">
                    {primaryIp}
                  </span>
                  <button
                    onClick={() => copyToClipboard(primaryIp, 'ip')}
                    className="text-slate-400 hover:text-blue-500 p-1 rounded-lg"
                    title="Copy IP"
                  >
                    {copiedField === 'ip' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Test Bar */}
            <div className="pt-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
                1-Click Packing Test Stickers (Codi Net Theme 2):
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handlePrintSample('wholesale')}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Sparkles className="w-3 h-3 text-blue-500" />
                  <span>Wholesale Sticker</span>
                </button>
                <button
                  onClick={() => handlePrintSample('retail')}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/20 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Sparkles className="w-3 h-3 text-purple-500" />
                  <span>Retail Express Sticker</span>
                </button>
                <button
                  onClick={() => handlePrintSample('step2')}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Layers className="w-3 h-3 text-amber-500" />
                  <span>Multi-Box Step 2/3</span>
                </button>
                <button
                  onClick={() => handlePrintSample('box')}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Zap className="w-3 h-3 text-emerald-500" />
                  <span>Pallet Crate 3/3</span>
                </button>
              </div>
            </div>
          </div>

          {/* Card 2: Zero-Change Mobile Bluetooth Pairing Guide */}
          <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Bluetooth className="w-4 h-4 text-blue-500" />
                <h3 className="text-sm font-extrabold tracking-tight">Direct Phone Bluetooth Pairing</h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                No code modifications needed in Codi Net. Your laptop acts as an authentic Bluetooth LE label printer!
              </p>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="font-bold text-slate-700 dark:text-slate-300">1. Phone Bluetooth:</span> Turn Bluetooth ON on your phone (Samsung A7).
                </div>
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="font-bold text-slate-700 dark:text-slate-300">2. In Codi Net:</span> Tap <em>Select Bluetooth Printer</em> &rarr; tap <em>Scan Devices</em>.
                </div>
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="font-bold text-slate-700 dark:text-slate-300">3. Select Laptop:</span> Pick <strong>{btDeviceName}</strong> in the list &rarr; connected!
                </div>
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="font-bold text-slate-700 dark:text-slate-300">4. Print:</span> Confirm packing in Codi Net — label renders live below!
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-200 dark:border-slate-800">
              <span>Total Labels Printed:</span>
              <span className="font-mono font-black text-slate-900 dark:text-slate-100 text-sm">
                {state?.totalJobsPrinted ?? 0}
              </span>
            </div>
          </div>
        </div>

        {/* Centerpiece: Physical 50mm × 30mm Thermal Sticker Visualization */}
        <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight">Live Thermal Sticker Visualizer</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  50mm × 30mm • Exact 1:1 Codi Net Theme 2 layout calibrated for thermal label roll
                </p>
              </div>
            </div>

            {latestJob && (
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 ${
                  latestJob.source === 'bluetooth'
                    ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}>
                  {latestJob.source === 'bluetooth' && <Bluetooth className="w-3 h-3 text-blue-500" />}
                  <span>{latestJob.timestamp} via {latestJob.source.toUpperCase()}</span>
                </span>
                <button
                  onClick={() => setSelectedJobModal(latestJob)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer transition-all"
                >
                  <FileCode className="w-3.5 h-3.5 text-blue-500" />
                  <span>Inspect TSPL</span>
                </button>
              </div>
            )}
          </div>

          {/* Thermal Sticker Canvas Container */}
          <div className="flex flex-col items-center justify-center py-6 px-2 bg-gradient-to-b from-slate-100/70 to-slate-200/50 dark:from-slate-950/70 dark:to-slate-900/50 rounded-2xl border border-slate-200/70 dark:border-slate-800/70">
            {/* The Printer Slot with Label Roll Emulation */}
            <div className="w-full max-w-lg mb-1 flex items-center justify-center">
              <div className="w-80 h-3 bg-slate-800 rounded-full shadow-inner border border-slate-700 flex items-center justify-center">
                <div className="w-72 h-1 bg-slate-950 rounded-full" />
              </div>
            </div>

            {/* The 50mm × 30mm Sticker Card (5:3 aspect ratio) */}
            <div
              className={`w-full max-w-md bg-white text-black p-4 rounded-xl shadow-2xl border border-neutral-300 transition-all duration-500 font-sans select-none relative ${
                isFeedingAnimation ? 'animate-bounce translate-y-2' : ''
              }`}
              style={{
                aspectRatio: '50 / 30',
                boxShadow: '0 20px 30px -10px rgba(0,0,0,0.35), 0 0 1px 1px rgba(0,0,0,0.1)',
              }}
            >
              <div className="absolute top-2 right-2 text-[8px] font-mono uppercase tracking-widest text-neutral-400 font-bold opacity-60">
                50×30mm TSPL
              </div>

              {parsed ? (
                <div className="h-full flex flex-col justify-between">
                  {/* Top Section: Left Details + Right QR Code */}
                  <div className="flex items-start justify-between">
                    {/* Left Details */}
                    <div className="space-y-0.5 max-w-[62%]">
                      {/* 1. Invoice / Order Number - Font 3 (Bold Big) */}
                      <div className="text-base sm:text-lg font-black tracking-tight text-neutral-950 leading-tight">
                        {parsed.orderNumber}
                      </div>

                      {/* 2. Hub Category */}
                      <div className="text-[11px] sm:text-xs font-semibold text-neutral-800 leading-tight truncate">
                        {parsed.category}
                      </div>

                      {/* 3. Order Type */}
                      <div className="text-[10px] sm:text-[11px] font-bold text-neutral-900 uppercase tracking-wide leading-tight">
                        {parsed.orderType}
                      </div>

                      {/* 4. Date */}
                      <div className="text-[10px] font-mono text-neutral-700 leading-tight">
                        {parsed.date}
                      </div>

                      {/* 5. Time Slot */}
                      <div className="text-[10px] font-medium text-neutral-700 leading-tight">
                        {parsed.timeSlot}
                      </div>

                      {/* 6. Step Index */}
                      <div className="text-[10px] font-bold text-neutral-900 leading-tight">
                        {parsed.stepIndex}
                      </div>
                    </div>

                    {/* Right QR Code (22mm x 22mm calibrated) */}
                    <div className="flex flex-col items-center justify-center p-1 bg-white border border-neutral-300 rounded-md shadow-xs">
                      {qrSvg ? (
                        <div
                          className="w-20 h-20 sm:w-22 sm:h-22"
                          dangerouslySetInnerHTML={{ __html: qrSvg }}
                        />
                      ) : (
                        <div className="w-20 h-20 bg-neutral-100 flex items-center justify-center">
                          <QrCode className="w-8 h-8 text-neutral-400" />
                        </div>
                      )}
                      <span className="text-[8px] font-mono text-neutral-600 mt-0.5 truncate max-w-[80px]">
                        {parsed.qrValue}
                      </span>
                    </div>
                  </div>

                  {/* Divider Line */}
                  <div className="w-full border-t-2 border-neutral-900 my-1" />

                  {/* Bottom Section: Package Name / Container Label */}
                  <div className="flex items-center justify-between text-neutral-900">
                    <span className="text-xs sm:text-sm font-black tracking-tight uppercase truncate">
                      {parsed.stepLabel}
                    </span>
                    <span className="text-[9px] font-mono text-neutral-500 shrink-0 ml-2">
                      POLYGON CODI NET
                    </span>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-neutral-400 space-y-2">
                  <Printer className="w-8 h-8 stroke-1 text-neutral-300" />
                  <span className="text-xs font-bold uppercase tracking-wider">Awaiting TSPL Print Job...</span>
                  <span className="text-[10px] text-neutral-400">
                    Print from Codi Net via Bluetooth or tap a test button above
                  </span>
                </div>
              )}
            </div>

            {/* Sticker Dimensions Indicator */}
            <div className="mt-3 flex items-center gap-4 text-[11px] font-mono text-slate-500 dark:text-slate-400">
              <span>Width: 50 mm (400 dots)</span>
              <span>•</span>
              <span>Height: 30 mm (240 dots)</span>
              <span>•</span>
              <span>Gap: 2 mm</span>
            </div>
          </div>
        </div>

        {/* Lower Grid: Custom TSPL Stream Sender + Print Job History */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Custom TSPL Console */}
          <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-purple-500" />
                <h3 className="text-sm font-extrabold tracking-tight">Direct TSPL Command Injector</h3>
              </div>
              <button
                onClick={() =>
                  setCustomTspl(
                    `SIZE 50 mm, 30 mm\r\nGAP 2 mm, 0 mm\r\nDIRECTION 1\r\nCLS\r\nTEXT 16,16,"3",0,1,1,"ORD-TEST-999"\r\nTEXT 16,45,"1",0,1,1,"Custom QA Branch"\r\nTEXT 16,74,"1",0,1,1,"Wholesale"\r\nQRCODE 226,16,L,8,A,0,"ORD-TEST-999"\r\nBAR 16,192,368,2\r\nTEXT 24,206,"1",0,1,1,"QA Verification Box"\r\nPRINT 1,1\r\n`
                  )
                }
                className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
              >
                Insert Sample TSPL
              </button>
            </div>

            <textarea
              value={customTspl}
              onChange={(e) => setCustomTspl(e.target.value)}
              placeholder="Paste raw TSPL text here (SIZE, TEXT, QRCODE, BAR, PRINT)..."
              rows={6}
              className="w-full p-3 font-mono text-xs rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/40 resize-none"
            />

            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Simulates Bluetooth printer byte transfer or TCP stream
              </span>
              <button
                onClick={handleSendCustomTspl}
                disabled={!customTspl.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition-all shadow-md shadow-purple-500/20 disabled:opacity-40 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send to Printer</span>
              </button>
            </div>
          </div>

          {/* Print Job History */}
          <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-extrabold tracking-tight">Print Job Audit Log</h3>
              </div>
              {state?.history && state.history.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  className="flex items-center gap-1 text-[11px] font-bold text-rose-500 hover:text-rose-600 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear History</span>
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {state?.history && state.history.length > 0 ? (
                state.history.map((job) => (
                  <div
                    key={job.id}
                    className="p-3 rounded-2xl bg-slate-100/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-800 dark:text-slate-200">
                            {job.parsed.orderNumber}
                          </span>
                          {job.source === 'bluetooth' && (
                            <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25 flex items-center gap-0.5">
                              <Bluetooth className="w-2.5 h-2.5" />
                              <span>BT</span>
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          {job.parsed.stepIndex} • {job.parsed.stepLabel}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-slate-400">{job.timestamp}</span>
                      <button
                        onClick={() => setSelectedJobModal(job)}
                        className="p-1.5 rounded-lg bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-500"
                        title="View TSPL"
                      >
                        <FileCode className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  No print jobs recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Live Diagnostics & Server Logs Feed */}
        <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-extrabold tracking-tight">Live Server Log Feed</h3>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400">
              <span>Bluetooth: {isBluetoothRunning ? 'ACTIVE' : 'OFF'}</span>
              <span>•</span>
              <span>TCP Clients: {state?.connectedClientsCount ?? 0}</span>
            </div>
          </div>

          <div className="bg-slate-950 text-emerald-400 p-4 rounded-2xl font-mono text-xs max-h-48 overflow-y-auto space-y-1 shadow-inner border border-slate-800">
            {state?.logs && state.logs.length > 0 ? (
              state.logs.map((log) => (
                <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                  <span className="text-slate-500 shrink-0">[{log.timestamp}]</span>
                  <span
                    className={`font-bold shrink-0 ${
                      log.type === 'tcp'
                        ? 'text-indigo-400'
                        : log.type === 'http'
                        ? 'text-blue-400'
                        : 'text-amber-400'
                    }`}
                  >
                    [{log.type.toUpperCase()}]
                  </span>
                  <span className="text-slate-300">{log.message}</span>
                </div>
              ))
            ) : (
              <div className="text-slate-500">Virtual Printer initialized. Listening for commands...</div>
            )}
          </div>
        </div>
      </div>
    )}
  </main>

      {/* Raw TSPL Inspection Modal */}
      {selectedJobModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="glass-card max-w-xl w-full p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-blue-500" />
                <h3 className="text-base font-extrabold">TSPL Command Inspector</h3>
              </div>
              <button
                onClick={() => setSelectedJobModal(null)}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Job ID: {selectedJobModal.id}</span>
                <span className="font-bold text-blue-500">Source: {selectedJobModal.source.toUpperCase()}</span>
              </div>
              <pre className="p-4 bg-slate-950 text-emerald-400 font-mono text-xs rounded-2xl overflow-x-auto max-h-72 border border-slate-800">
                {selectedJobModal.rawTspl}
              </pre>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => copyToClipboard(selectedJobModal.rawTspl, 'modal-tspl')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 cursor-pointer"
              >
                {copiedField === 'modal-tspl' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy TSPL</span>
              </button>
              <button
                onClick={() => setSelectedJobModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
