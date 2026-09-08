'use client';

import React, { useEffect, useState } from 'react';
import {
  Check,
  Database,
  ExternalLink,
  History,
  KeyRound,
  Loader2,
  PlugZap,
  Server,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import { DbConnectionConfig, SavedConnection } from '@/lib/db/types';

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (config: DbConnectionConfig) => Promise<void>;
  currentConfig: DbConnectionConfig | null;
  isLightTheme?: boolean;
}

const STORAGE_KEY = 'saved_db_connections_v1';

export const ConnectionModal: React.FC<ConnectionModalProps> = ({
  isOpen,
  onClose,
  onConnect,
  currentConfig,
  isLightTheme = false,
}) => {
  const [dbType, setDbType] = useState<'postgres' | 'mysql'>('postgres');
  const [tab, setTab] = useState<'form' | 'uri'>('form');

  // Form State
  const [host, setHost] = useState('localhost');
  const [port, setPort] = useState(5432);
  const [user, setUser] = useState('postgres');
  const [password, setPassword] = useState('');
  const [database, setDatabase] = useState('postgres');
  const [ssl, setSsl] = useState(false);
  const [connectionString, setConnectionString] = useState('');

  // Profile State
  const [profileName, setProfileName] = useState('My Local DB');
  const [savedProfiles, setSavedProfiles] = useState<SavedConnection[]>([]);

  // Testing & Connecting state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success?: boolean;
    message?: string;
    latencyMs?: number;
    version?: string;
    error?: string;
  } | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Load saved profiles from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSavedProfiles(JSON.parse(stored));
      }
    } catch {
      // Ignore
    }
  }, []);

  // Update default port when DB type changes
  useEffect(() => {
    if (!currentConfig) {
      if (dbType === 'postgres') {
        setPort(5432);
        if (user === 'root') setUser('postgres');
        if (database === '') setDatabase('postgres');
      } else {
        setPort(3306);
        if (user === 'postgres') setUser('root');
      }
    }
  }, [dbType, currentConfig, user, database]);

  // Sync with currentConfig if opened
  useEffect(() => {
    if (currentConfig) {
      setDbType(currentConfig.type);
      if (currentConfig.connectionString) {
        setTab('uri');
        setConnectionString(currentConfig.connectionString);
      } else {
        setTab('form');
        setHost(currentConfig.host || 'localhost');
        setPort(currentConfig.port || (currentConfig.type === 'postgres' ? 5432 : 3306));
        setUser(currentConfig.user || '');
        setPassword(currentConfig.password || '');
        setDatabase(currentConfig.database || '');
        setSsl(Boolean(currentConfig.ssl));
      }
    }
  }, [currentConfig, isOpen]);

  if (!isOpen) return null;

  const buildConfig = (): DbConnectionConfig => {
    if (tab === 'uri') {
      return {
        type: dbType,
        connectionString: connectionString.trim(),
        ssl,
      };
    }
    return {
      type: dbType,
      host: host.trim(),
      port: Number(port),
      user: user.trim(),
      password,
      database: database.trim() || undefined,
      ssl,
    };
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const config = buildConfig();
      const res = await fetch('/api/db/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (!res.ok) {
        setTestResult({ success: false, error: data.error || 'Connection failed' });
      } else {
        setTestResult(data);
      }
    } catch (err: any) {
      setTestResult({ success: false, error: err.message || 'Connection test error' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveProfile = () => {
    const config = buildConfig();
    const newProfile: SavedConnection = {
      id: Date.now().toString(),
      name: profileName || `${dbType.toUpperCase()} - ${host || 'Remote'}`,
      config,
      lastConnectedAt: new Date().toISOString(),
    };
    const updated = [newProfile, ...savedProfiles.filter((p) => p.name !== newProfile.name)];
    setSavedProfiles(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore
    }
  };

  const handleDeleteProfile = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedProfiles.filter((p) => p.id !== id);
    setSavedProfiles(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore
    }
  };

  const handleSelectProfile = (profile: SavedConnection) => {
    const c = profile.config;
    setDbType(c.type);
    if (c.connectionString) {
      setTab('uri');
      setConnectionString(c.connectionString);
    } else {
      setTab('form');
      setHost(c.host || 'localhost');
      setPort(c.port || (c.type === 'postgres' ? 5432 : 3306));
      setUser(c.user || '');
      setPassword(c.password || '');
      setDatabase(c.database || '');
      setSsl(Boolean(c.ssl));
    }
    setProfileName(profile.name);
    setTestResult(null);
  };

  const handleConnectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsConnecting(true);
    try {
      const config = buildConfig();
      await onConnect(config);
      handleSaveProfile();
      onClose();
    } catch (err: any) {
      setTestResult({ success: false, error: err.message || 'Failed to connect' });
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div
        className={`border rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-8 transition-colors ${
          isLightTheme ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-slate-100'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between ${
            isLightTheme ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/50 border-slate-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Database Connection</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Configure PostgreSQL or MySQL credentials</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Saved Profiles Quick Select */}
          {savedProfiles.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-sky-500" />
                Saved Connection Profiles
              </label>
              <div className="flex flex-wrap gap-2">
                {savedProfiles.slice(0, 4).map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleSelectProfile(p)}
                    className={`group flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                      isLightTheme
                        ? 'bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200'
                        : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        p.config.type === 'postgres' ? 'bg-sky-500' : 'bg-amber-500'
                      }`}
                    />
                    <span className="truncate max-w-[120px]">{p.name}</span>
                    <button
                      onClick={(e) => handleDeleteProfile(p.id, e)}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 p-0.5 rounded transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Database Engine Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-2">
              Database Engine
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setDbType('postgres');
                  setPort(5432);
                }}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                  dbType === 'postgres'
                    ? isLightTheme
                      ? 'bg-sky-50 border-sky-300 text-sky-900 shadow-xs'
                      : 'bg-sky-500/10 border-sky-500/50 text-sky-200 shadow-md'
                    : isLightTheme
                    ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs ${
                    dbType === 'postgres'
                      ? 'bg-sky-500 text-white shadow'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  PG
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-slate-100">PostgreSQL</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Port 5432 (pg client)</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDbType('mysql');
                  setPort(3306);
                }}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                  dbType === 'mysql'
                    ? isLightTheme
                      ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-xs'
                      : 'bg-amber-500/10 border-amber-500/50 text-amber-200 shadow-md'
                    : isLightTheme
                    ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs ${
                    dbType === 'mysql'
                      ? 'bg-amber-500 text-white shadow'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  MY
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-slate-100">MySQL</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Port 3306 (mysql2 client)</div>
                </div>
              </button>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex border-b border-slate-800">
            <button
              type="button"
              onClick={() => setTab('form')}
              className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
                tab === 'form'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Standard Connection
            </button>
            <button
              type="button"
              onClick={() => setTab('uri')}
              className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
                tab === 'uri'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Connection String (URI)
            </button>
          </div>

          <form onSubmit={handleConnectSubmit} className="space-y-4">
            {tab === 'form' ? (
              <div className="space-y-3.5">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 space-y-1">
                    <label className="text-xs font-medium text-slate-300">Host</label>
                    <input
                      type="text"
                      value={host}
                      onChange={(e) => setHost(e.target.value)}
                      placeholder="localhost or 127.0.0.1"
                      className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:outline-none font-mono"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300">Port</label>
                    <input
                      type="number"
                      value={port}
                      onChange={(e) => setPort(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:outline-none font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300">Username</label>
                    <input
                      type="text"
                      value={user}
                      onChange={(e) => setUser(e.target.value)}
                      placeholder={dbType === 'postgres' ? 'postgres' : 'root'}
                      className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Database Name</label>
                  <input
                    type="text"
                    value={database}
                    onChange={(e) => setDatabase(e.target.value)}
                    placeholder={
                      dbType === 'postgres' ? 'postgres (or your db)' : 'my_database'
                    }
                    className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:outline-none font-mono"
                  />
                  <p className="text-[11px] text-slate-500">
                    Leave blank to list all databases on the server
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="ssl_toggle"
                    checked={ssl}
                    onChange={(e) => setSsl(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500/20"
                  />
                  <label htmlFor="ssl_toggle" className="text-xs text-slate-300 cursor-pointer">
                    Enable SSL / TLS (Required for Supabase, Neon, AWS RDS, PlanetScale)
                  </label>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Connection URI</label>
                  <input
                    type="text"
                    value={connectionString}
                    onChange={(e) => setConnectionString(e.target.value)}
                    placeholder={
                      dbType === 'postgres'
                        ? 'postgresql://user:password@host:5432/dbname?sslmode=require'
                        : 'mysql://user:password@host:3306/dbname'
                    }
                    className="w-full px-3 py-2.5 text-xs rounded-lg bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:outline-none font-mono"
                    required
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="ssl_toggle_uri"
                    checked={ssl}
                    onChange={(e) => setSsl(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500/20"
                  />
                  <label
                    htmlFor="ssl_toggle_uri"
                    className="text-xs text-slate-300 cursor-pointer"
                  >
                    Force SSL (rejectUnauthorized: false)
                  </label>
                </div>
              </div>
            )}

            {/* Profile Name input */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center gap-3">
              <div className="flex-1 space-y-1">
                <label className="text-[11px] text-slate-400">Save Profile As</label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="e.g. Production DB, Local Dev"
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-800 focus:border-slate-700 focus:outline-none"
                />
              </div>
            </div>

            {/* Test Result Feedback */}
            {testResult && (
              <div
                className={`p-3 rounded-xl text-xs border ${
                  testResult.success
                    ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-200'
                    : 'bg-rose-950/60 border-rose-800/80 text-rose-200'
                }`}
              >
                {testResult.success ? (
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-semibold">{testResult.message}</div>
                      {testResult.version && (
                        <div className="text-[11px] opacity-80 mt-0.5 font-mono">
                          {testResult.version}
                        </div>
                      )}
                      {testResult.latencyMs !== undefined && (
                        <div className="text-[10px] text-emerald-400/80 mt-0.5">
                          Latency: {testResult.latencyMs} ms
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="font-semibold text-rose-300">Connection Failed:</div>
                    <div className="font-mono text-[11px] opacity-90 break-words">
                      {testResult.error}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting || isConnecting}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition-all disabled:opacity-50"
              >
                {isTesting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                ) : (
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span>Test Connection</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-transparent hover:bg-slate-800 text-slate-400 hover:text-white transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isConnecting}
                  className="flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/50 transition-all disabled:opacity-50"
                >
                  {isConnecting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <PlugZap className="w-4 h-4" />
                  )}
                  <span>Connect & Explore</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
