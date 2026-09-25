'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  Activity,
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  Cpu,
  Flame,
  Gauge,
  HelpCircle,
  Layers,
  Loader2,
  Play,
  Power,
  Radio,
  RefreshCw,
  Scale,
  Settings,
  Shuffle,
  Square,
  Terminal,
  Wifi,
  X,
  Zap,
} from 'lucide-react';
import { ScaleServerState, ScaleConfig } from '@/lib/scale/scaleSimulator';

interface ScaleSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLightTheme?: boolean;
}

export const ScaleSimulatorModal: React.FC<ScaleSimulatorModalProps> = ({
  isOpen,
  onClose,
  isLightTheme = false,
}) => {
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
    if (isOpen) {
      fetchStatus();
      pollRef.current = setInterval(fetchStatus, 1500);
    } else {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [isOpen]);

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
        throw new Error(data.message || data.error || 'Failed to start scale server');
      }
      await fetchStatus();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsStarting(false);
    }
  };

  const handleStop = async () => {
    setIsStarting(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/scale/stop', { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Failed to stop scale server');
      }
      await fetchStatus();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsStarting(false);
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

  if (!isOpen) return null;

  const isRunning = state?.isRunning ?? false;
  const displayIp = selectedIp || state?.ip || '192.168.8.101';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div
        className={`relative w-full max-w-4xl rounded-3xl border shadow-2xl flex flex-col max-h-[90vh] overflow-hidden my-auto transition-all ${
          isLightTheme ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between ${
            isLightTheme ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-950/60 border-slate-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Wi-Fi Scale Simulator
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Hardware Emulator • QA & Dev
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                BUDRY MFD-300 TCP Raw Socket & HTTP Bridge for CoDiNet Mobile App
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl border transition-colors ${
              isLightTheme
                ? 'hover:bg-slate-200 border-slate-200 text-slate-500'
                : 'hover:bg-slate-800 border-slate-800 text-slate-400'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Top Status & Controls Strip */}
          <div
            className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
              isRunning
                ? isLightTheme
                  ? 'bg-emerald-50/80 border-emerald-200'
                  : 'bg-emerald-950/20 border-emerald-900/40'
                : isLightTheme
                ? 'bg-slate-50 border-slate-200'
                : 'bg-slate-950/40 border-slate-800'
            }`}
          >
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div
                className={`w-4 h-4 rounded-full flex items-center justify-center ${
                  isRunning ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]' : 'bg-slate-500'
                }`}
              >
                {isRunning && <span className="w-2 h-2 rounded-full bg-white animate-ping" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                    {isRunning ? 'Scale Server Active & Broadcasting' : 'Scale Server Stopped'}
                  </span>
                  {isRunning && (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                      LIVE
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isRunning
                    ? `Listening on 0.0.0.0:${tcpPort} (TCP) and 0.0.0.0:${httpPort} (HTTP)`
                    : 'Click Start to broadcast BUDRY MFD-300 weight packets to mobile apps'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {isRunning ? (
                <button
                  onClick={handleStop}
                  disabled={isStarting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
                >
                  {isStarting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />}
                  <span>Stop Scale</span>
                </button>
              ) : (
                <button
                  onClick={handleStart}
                  disabled={isStarting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
                >
                  {isStarting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  <span>Start Scale</span>
                </button>
              )}
            </div>
          </div>

          {/* Connection Info Cards (IP, TCP Port, HTTP Bridge Port) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* IP Address Card */}
            <div
              className={`p-4 rounded-2xl border flex flex-col justify-between ${
                isLightTheme ? 'bg-slate-50/70 border-slate-200' : 'bg-slate-950/60 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5 text-indigo-500" />
                  Scale Server IP
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-500 font-bold">
                  Wi-Fi / LAN
                </span>
              </div>

              {state?.allIps && state.allIps.length > 1 ? (
                <select
                  value={selectedIp}
                  onChange={(e) => setSelectedIp(e.target.value)}
                  className={`w-full text-xs font-mono font-bold px-2.5 py-1.5 rounded-lg border mb-2 focus:outline-none ${
                    isLightTheme ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  {state.allIps.map((iface) => (
                    <option key={iface.ip} value={iface.ip}>
                      {iface.name}: {iface.ip}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="font-mono text-base font-black text-slate-900 dark:text-white py-1">
                  {displayIp}
                </div>
              )}

              <button
                onClick={() => copyToClipboard(displayIp, 'ip')}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border text-xs font-bold transition-all ${
                  copiedField === 'ip'
                    ? 'bg-emerald-500 text-white border-emerald-500'
                    : isLightTheme
                    ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                    : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                }`}
              >
                {copiedField === 'ip' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedField === 'ip' ? 'Copied IP' : 'Copy IP Address'}</span>
              </button>
            </div>

            {/* TCP Port Card */}
            <div
              className={`p-4 rounded-2xl border flex flex-col justify-between ${
                isLightTheme ? 'bg-slate-50/70 border-slate-200' : 'bg-slate-950/60 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-amber-500" />
                  Scale TCP Port
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 font-bold">
                  Standalone APK
                </span>
              </div>

              <div className="font-mono text-base font-black text-slate-900 dark:text-white py-1">
                {tcpPort}
              </div>

              <button
                onClick={() => copyToClipboard(tcpPort.toString(), 'tcpPort')}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border text-xs font-bold transition-all ${
                  copiedField === 'tcpPort'
                    ? 'bg-emerald-500 text-white border-emerald-500'
                    : isLightTheme
                    ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                    : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                }`}
              >
                {copiedField === 'tcpPort' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedField === 'tcpPort' ? 'Copied Port' : 'Copy TCP Port'}</span>
              </button>
            </div>

            {/* HTTP Bridge Port Card */}
            <div
              className={`p-4 rounded-2xl border flex flex-col justify-between ${
                isLightTheme ? 'bg-slate-50/70 border-slate-200' : 'bg-slate-950/60 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-emerald-500" />
                  HTTP Bridge Port
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-bold">
                  Expo Go
                </span>
              </div>

              <div className="font-mono text-base font-black text-slate-900 dark:text-white py-1">
                {httpPort}
              </div>

              <button
                onClick={() => copyToClipboard(httpPort.toString(), 'httpPort')}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border text-xs font-bold transition-all ${
                  copiedField === 'httpPort'
                    ? 'bg-emerald-500 text-white border-emerald-500'
                    : isLightTheme
                    ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                    : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                }`}
              >
                {copiedField === 'httpPort' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedField === 'httpPort' ? 'Copied Port' : 'Copy HTTP Port'}</span>
              </button>
            </div>
          </div>

          {/* Quick Connection Guide Notice */}
          <div
            className={`p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 ${
              isLightTheme
                ? 'bg-indigo-50/70 border-indigo-200 text-indigo-900'
                : 'bg-indigo-950/30 border-indigo-900/40 text-indigo-300'
            }`}
          >
            <HelpCircle className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">How to connect from CoDiNet App:</span> Open CoDiNet on your phone (same Wi-Fi) &rarr; tap <strong>Scale Select</strong> modal &rarr; enter IP <code className="font-mono font-bold bg-indigo-500/20 px-1 py-0.5 rounded">{displayIp}</code> and Port <code className="font-mono font-bold bg-indigo-500/20 px-1 py-0.5 rounded">{tcpPort}</code> (or <code className="font-mono font-bold bg-indigo-500/20 px-1 py-0.5 rounded">{httpPort}</code> if using Expo Go) &rarr; tap <strong>Connect</strong>.
            </div>
          </div>

          {/* Digital Weight Gauge & Generator Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Digital LED Scale Display (5 cols) */}
            <div
              className={`lg:col-span-5 p-6 rounded-3xl border flex flex-col justify-between items-center text-center relative overflow-hidden shadow-inner ${
                isLightTheme
                  ? 'bg-slate-900 text-white border-slate-800'
                  : 'bg-black text-white border-slate-800'
              }`}
            >
              <div className="w-full flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  BUDRY MFD-300
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-emerald-400 font-bold">
                  {state?.config.isStable ? 'STABLE' : 'UNSTABLE'}
                </span>
              </div>

              {/* Big Digital Weight Display */}
              <div className="my-6">
                <div className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-emerald-400 drop-shadow-[0_0_20px_rgba(52,211,153,0.6)]">
                  {state?.config.currentWeight !== undefined
                    ? state.config.currentWeight.toFixed(1)
                    : currentWeight.toFixed(1)}
                  <span className="text-2xl text-emerald-500/80 ml-2 font-sans font-bold">kg</span>
                </div>
                <p className="text-[11px] font-mono text-slate-400 mt-2">
                  Protocol: BUDRY MFD-300 RAW TCP • Unit: KG
                </p>
              </div>

              {/* Connected Clients Strip */}
              <div className="w-full pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
                <span>Active Mobile Clients:</span>
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  {state?.connectedClientsCount ?? 0} Connected
                </span>
              </div>
            </div>

            {/* Generator Settings & Controls (7 cols) */}
            <div
              className={`lg:col-span-7 p-6 rounded-3xl border space-y-5 ${
                isLightTheme ? 'bg-slate-50/70 border-slate-200' : 'bg-slate-950/60 border-slate-800'
              }`}
            >
              {/* Mode Selector Tabs */}
              <div className="flex rounded-2xl border p-1 bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => {
                    setMode('random');
                    handleUpdateConfig({ mode: 'random' });
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-extrabold transition-all ${
                    mode === 'random'
                      ? 'bg-amber-500 text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Shuffle className="w-4 h-4" />
                  <span>Random Weight Mode</span>
                </button>

                <button
                  onClick={() => {
                    setMode('manual');
                    handleUpdateConfig({ mode: 'manual' });
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-extrabold transition-all ${
                    mode === 'manual'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Gauge className="w-4 h-4" />
                  <span>Manual Fixed Weight</span>
                </button>
              </div>

              {/* Random Weight Controls */}
              {mode === 'random' ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                        Min Weight (kg):
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={minWeight}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setMinWeight(val);
                          handleUpdateConfig({ minWeight: val });
                        }}
                        className={`w-full px-3 py-2 rounded-xl border text-xs font-mono font-bold focus:outline-none ${
                          isLightTheme ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                        Max Weight (kg):
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="0.5"
                        value={maxWeight}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 10;
                          setMaxWeight(val);
                          handleUpdateConfig({ maxWeight: val });
                        }}
                        className={`w-full px-3 py-2 rounded-xl border text-xs font-mono font-bold focus:outline-none ${
                          isLightTheme ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-600 dark:text-slate-300 text-xs block mb-1">
                      Weight Change Interval:
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[500, 1000, 2000, 3000].map((ms) => (
                        <button
                          key={ms}
                          onClick={() => {
                            setIntervalMs(ms);
                            handleUpdateConfig({ intervalMs: ms });
                          }}
                          className={`py-1.5 rounded-xl border text-xs font-mono font-bold transition-all ${
                            intervalMs === ms
                              ? 'bg-amber-500 text-white border-amber-500'
                              : isLightTheme
                              ? 'bg-white border-slate-200 text-slate-700'
                              : 'bg-slate-900 border-slate-800 text-slate-300'
                          }`}
                        >
                          {ms / 1000}s
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const rand = Math.round((Math.random() * (maxWeight - minWeight) + minWeight) * 10) / 10;
                      setCurrentWeight(rand);
                      handleUpdateConfig({ currentWeight: rand });
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer"
                  >
                    <Shuffle className="w-4 h-4" />
                    <span>Roll New Random Weight Now</span>
                  </button>
                </div>
              ) : (
                /* Manual Weight Controls */
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <label className="font-bold text-slate-600 dark:text-slate-300">
                        Adjust Weight Slider (0 - 50 kg):
                      </label>
                      <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {currentWeight.toFixed(1)} kg
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      step="0.1"
                      value={currentWeight}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setCurrentWeight(val);
                        handleUpdateConfig({ currentWeight: val });
                      }}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-600 dark:text-slate-300 text-xs block mb-1">
                      Quick Weight Presets:
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[0.0, 2.5, 5.0, 8.3, 12.0, 15.5, 20.0, 25.0].map((w) => (
                        <button
                          key={w}
                          onClick={() => {
                            setCurrentWeight(w);
                            handleUpdateConfig({ currentWeight: w });
                          }}
                          className={`py-1.5 rounded-xl border text-xs font-mono font-bold transition-all ${
                            currentWeight === w
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : isLightTheme
                              ? 'bg-white border-slate-200 text-slate-700'
                              : 'bg-slate-900 border-slate-800 text-slate-300'
                          }`}
                        >
                          {w === 0 ? '0.0 (Tare)' : `${w} kg`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Packet Stream Console / Logs */}
          <div
            className={`rounded-3xl border overflow-hidden ${
              isLightTheme ? 'bg-slate-900 text-slate-200 border-slate-800' : 'bg-black border-slate-800 text-slate-300'
            }`}
          >
            <div className="px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
              <span className="flex items-center gap-2 text-slate-400 font-bold">
                <Terminal className="w-4 h-4 text-emerald-400" />
                Live Packet Stream & Connection Logs
              </span>
              <span className="text-[11px] text-slate-500">
                Auto-refreshes every 1.5s
              </span>
            </div>

            <div className="p-4 font-mono text-xs max-h-48 overflow-y-auto space-y-1.5 select-text">
              {state?.logs && state.logs.length > 0 ? (
                state.logs.map((log) => (
                  <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                    <span className="text-slate-500 shrink-0">[{log.timestamp}]</span>
                    <span
                      className={`font-bold uppercase text-[10px] px-1 py-0.5 rounded shrink-0 ${
                        log.type === 'tcp'
                          ? 'bg-amber-500/20 text-amber-400'
                          : log.type === 'http'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-purple-500/20 text-purple-400'
                      }`}
                    >
                      {log.type}
                    </span>
                    <span className="break-all">{log.message}</span>
                  </div>
                ))
              ) : (
                <div className="text-slate-500 italic py-2 text-center">
                  No log entries yet. Start the scale server to see outgoing packets.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
