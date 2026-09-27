'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  Cpu,
  Flame,
  Gauge,
  HelpCircle,
  Layers,
  Loader2,
  Lock,
  Moon,
  Play,
  Power,
  Radio,
  RefreshCw,
  Scale,
  Settings,
  ShieldCheck,
  Shuffle,
  Square,
  Sun,
  Terminal,
  Wifi,
  Zap,
} from 'lucide-react';
import { ScaleServerState, ScaleConfig } from '@/lib/scale/scaleSimulator';
import { DevilWomanIcon } from '@/components/common/icons/DevilWomanIcon';
import { KingDeveloperIcon } from '@/components/common/icons/KingDeveloperIcon';
import { useTheme } from '@/context/ThemeContext';
import { clearDeveloperAccess } from '@/lib/developer/security';

interface ScaleSimulatorWorkspaceProps {
  role: 'developer' | 'qa';
  backUrl: string;
}

export const ScaleSimulatorWorkspace: React.FC<ScaleSimulatorWorkspaceProps> = ({ role, backUrl }) => {
  const router = useRouter();
  const { isLightTheme, toggleTheme } = useTheme();
  const isQa = role === 'qa';

  const [state, setState] = useState<ScaleServerState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Form states
  const [mode, setMode] = useState<'random' | 'manual'>('random');
  const [currentWeight, setCurrentWeight] = useState<number>(6.5);
  const [minWeight, setMinWeight] = useState<number>(1.0);
  const [maxWeight, setMaxWeight] = useState<number>(25.0);
  const [intervalMs, setIntervalMs] = useState<number>(1000);
  const [tcpPort, setTcpPort] = useState<number>(33581);
  const [httpPort, setHttpPort] = useState<number>(3001);
  const [selectedIp, setSelectedIp] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/scale/status');
      if (res.ok) {
        const data: ScaleServerState = await res.json();
        setState(data);
        if (!selectedIp && data.ip) {
          setSelectedIp(data.ip);
        }
        if (data.config) {
          setMode(data.config.mode);
          setCurrentWeight(data.config.currentWeight);
          setMinWeight(data.config.minWeight);
          setMaxWeight(data.config.maxWeight);
          setIntervalMs(data.config.intervalMs);
        }
        if (data.tcpPort) setTcpPort(data.tcpPort);
        if (data.httpPort) setHttpPort(data.httpPort);
      }
    } catch {
      // Ignore polling error
    }
  };

  useEffect(() => {
    fetchStatus();
    pollRef.current = setInterval(fetchStatus, 1500);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const handleStart = async () => {
    setIsStarting(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/scale/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tcpPort, httpPort }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Failed to start scale simulator');
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
      const res = await fetch('/api/scale/stop', { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Failed to stop scale simulator');
      }
      await fetchStatus();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateConfig = async (partial: Partial<ScaleConfig>) => {
    try {
      await fetch('/api/scale/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partial),
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
  const liveWeight = state?.config?.currentWeight ?? currentWeight;
  const primaryIp = selectedIp || state?.ip || '192.168.8.101';

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
              <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full border bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 hidden sm:inline-flex items-center gap-1">
                <Radio className="w-3 h-3" />
                Wi-Fi Scale Simulator
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              BUDRY MFD-300 TCP raw socket & HTTP bridge for CoDiNet weighing app
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Clear Access Button (Developer only) */}
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

      {/* Main Scale Simulator Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-6">
        {/* Error Alert */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-xs underline cursor-pointer">
              Dismiss
            </button>
          </div>
        )}

        {/* 2-Column Responsive Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN: Hardware Status & Live Weight Gauge (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Live Weight Display Glass Card */}
            <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-6 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-3 h-3 rounded-full ${
                      isRunning ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'
                    }`}
                  />
                  <span className="text-xs font-black uppercase tracking-wider">
                    {isRunning ? 'Broadcasting Active' : 'Simulator Idle'}
                  </span>
                </div>

                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                  {state?.connectedClientsCount ?? 0} App Connected
                </span>
              </div>

              {/* Digital Weight Gauge */}
              <div className="py-6 px-4 rounded-2xl bg-slate-900/90 text-white border border-slate-700/60 shadow-inner flex flex-col items-center justify-center space-y-1">
                <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
                  BUDRY MFD-300 EMULATOR
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-emerald-400">
                    {isRunning ? liveWeight.toFixed(2) : '0.00'}
                  </span>
                  <span className="text-2xl font-bold font-mono text-emerald-500/80">kg</span>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  {isRunning
                    ? mode === 'random'
                      ? `Fluctuating between ${minWeight} - ${maxWeight} kg`
                      : 'Fixed Manual Value'
                    : 'Press Start to Begin Broadcast'}
                </span>
              </div>

              {/* Power Switch Action Button */}
              <div className="pt-2">
                {isRunning ? (
                  <button
                    onClick={handleStop}
                    disabled={isLoading}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-extrabold text-sm shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />}
                    <span>Stop Scale Broadcast</span>
                  </button>
                ) : (
                  <button
                    onClick={handleStart}
                    disabled={isStarting}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    {isStarting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    <span>Start Scale Simulator</span>
                  </button>
                )}
              </div>
            </div>

            {/* Network Connection Credentials Glass Card */}
            <div className="glass-panel p-6 rounded-3xl space-y-4">
              <h3 className="text-sm font-extrabold flex items-center gap-2">
                <Wifi className="w-4 h-4 text-purple-500" />
                <span>CoDiNet Connection Settings</span>
              </h3>

              {/* Wi-Fi IP Selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  Scale Wi-Fi Host IP Address:
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedIp}
                    onChange={(e) => setSelectedIp(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl text-xs font-mono font-bold glass-card outline-none"
                  >
                    {state?.allIps?.map((entry) => (
                      <option key={entry.ip} value={entry.ip} className="bg-slate-900 text-white">
                        {entry.ip} ({entry.name})
                      </option>
                    )) || <option value="192.168.8.101">192.168.8.101</option>}
                  </select>

                  <button
                    onClick={() => copyToClipboard(primaryIp, 'ip')}
                    className="p-2 rounded-xl glass-card text-xs font-bold transition-all hover:bg-slate-200 dark:hover:bg-slate-800"
                    title="Copy IP Address"
                  >
                    {copiedField === 'ip' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Port Numbers */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl glass-card space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">TCP Port (Socket)</span>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-sm text-purple-600 dark:text-purple-400">
                      {tcpPort}
                    </span>
                    <button
                      onClick={() => copyToClipboard(String(tcpPort), 'tcp')}
                      className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800"
                    >
                      {copiedField === 'tcp' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-2xl glass-card space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">HTTP Port (Expo)</span>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-sm text-indigo-600 dark:text-indigo-400">
                      {httpPort}
                    </span>
                    <button
                      onClick={() => copyToClipboard(String(httpPort), 'http')}
                      className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800"
                    >
                      {copiedField === 'http' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Weight Controls & Live Packet Terminal (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Weight Simulation Controls */}
            <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold flex items-center gap-2">
                  <Settings className="w-4 h-4 text-purple-500" />
                  <span>Simulation Modes & Presets</span>
                </h3>

                {/* Mode Selector */}
                <div className="p-1 rounded-xl glass-card flex items-center gap-1">
                  <button
                    onClick={() => {
                      setMode('random');
                      if (isRunning) handleUpdateConfig({ mode: 'random' });
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      mode === 'random' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    Random Fluctuation
                  </button>
                  <button
                    onClick={() => {
                      setMode('manual');
                      if (isRunning) handleUpdateConfig({ mode: 'manual', currentWeight });
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      mode === 'manual' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    Manual Weight
                  </button>
                </div>
              </div>

              {/* Mode Specific Inputs */}
              {mode === 'random' ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Min Weight (kg)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={minWeight}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setMinWeight(val);
                        if (isRunning) handleUpdateConfig({ minWeight: val });
                      }}
                      className="w-full px-3 py-2 rounded-xl text-xs font-mono font-bold glass-card outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Max Weight (kg)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={maxWeight}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setMaxWeight(val);
                        if (isRunning) handleUpdateConfig({ maxWeight: val });
                      }}
                      className="w-full px-3 py-2 rounded-xl text-xs font-mono font-bold glass-card outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Interval (ms)</label>
                    <input
                      type="number"
                      step="200"
                      value={intervalMs}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10) || 1000;
                        setIntervalMs(val);
                        if (isRunning) handleUpdateConfig({ intervalMs: val });
                      }}
                      className="w-full px-3 py-2 rounded-xl text-xs font-mono font-bold glass-card outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Set Weight (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={currentWeight}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setCurrentWeight(val);
                        if (isRunning) handleUpdateConfig({ currentWeight: val });
                      }}
                      className="w-full px-3 py-2 rounded-xl text-sm font-mono font-bold glass-card outline-none"
                    />
                  </div>

                  {/* Manual Quick Presets */}
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    {[0.0, 2.5, 5.0, 10.0, 15.0, 25.0, 50.0].map((preset) => (
                      <button
                        key={preset}
                        onClick={() => {
                          setCurrentWeight(preset);
                          if (isRunning) handleUpdateConfig({ currentWeight: preset });
                        }}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer ${
                          currentWeight === preset
                            ? 'bg-purple-600 text-white border-purple-500'
                            : 'glass-card hover:bg-slate-200 dark:hover:bg-slate-800'
                        }`}
                      >
                        {preset === 0.0 ? '0.0kg (Tare)' : `${preset}kg`}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Live Packet Terminal Feed */}
            <div className="glass-panel p-6 rounded-3xl space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <Terminal className="w-3.5 h-3.5 text-purple-500" />
                  <span>BUDRY MFD-300 Raw Packet Stream</span>
                </h3>

                <span className="text-[10px] font-mono text-emerald-400">
                  {isRunning ? '● Broadcasting' : '○ Standby'}
                </span>
              </div>

              {/* Terminal Box */}
              <div className="p-4 rounded-2xl bg-black text-emerald-400 font-mono text-xs overflow-x-auto h-44 flex flex-col justify-between border border-slate-800">
                <div className="space-y-1">
                  <div className="text-slate-500 text-[10px]">
                    // BUDRY MFD-300 socket packet regex parser compatible:
                  </div>
                  <div className="text-slate-400 text-[11px] whitespace-pre font-mono">
                    {`XD1\\tSDT\\r\\nSDT\\t1\\t1\\t0\\t0\\t0\\t0,0\\t0,0\\t0,0\\t0,0\\t${liveWeight.toFixed(1)}kg\\t0.0kg\\r\\nEND\\tSDT\\r\\n`}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-500">
                  <span>Host: {primaryIp}:{tcpPort}</span>
                  <span>HTTP API: http://{primaryIp}:{httpPort}/api/weight</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl w-full mx-auto p-6 text-center text-xs text-slate-400 border-t border-slate-200/50 dark:border-slate-800/50 mt-12">
        Mobile App Manager • Hardware Wi-Fi Scale Simulation Subsystem
      </footer>
    </div>
  );
};
