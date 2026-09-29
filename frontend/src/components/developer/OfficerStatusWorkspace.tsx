'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  Crown,
  Database,
  Eye,
  EyeOff,
  Filter,
  KeyRound,
  Lock,
  Moon,
  RefreshCw,
  Search,
  Send,
  Server,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sun,
  Truck,
  UserCheck,
  Users,
  X,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { KingDeveloperIcon } from '@/components/common/icons/KingDeveloperIcon';
import { useTheme } from '@/context/ThemeContext';
import { clearDeveloperAccess } from '@/lib/developer/security';
import { EnvironmentKey, OfficerRecord, ENVIRONMENTS } from '@/lib/developer/officerTypes';

export default function OfficerStatusWorkspace() {
  const router = useRouter();
  const { isLightTheme, toggleTheme } = useTheme();

  // Environment state
  const [activeEnv, setActiveEnv] = useState<EnvironmentKey>('dev');
  const [isTestingDb, setIsTestingDb] = useState(false);
  const [dbStatus, setDbStatus] = useState<{
    connected: boolean;
    latencyMs?: number;
    totalOfficers?: number;
    error?: string;
  } | null>(null);

  // Officers list state
  const [officers, setOfficers] = useState<OfficerRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedRole, setSelectedRole] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [availableStatuses, setAvailableStatuses] = useState<string[]>([]);
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const pageSize = 15;

  // Selected officer for modal
  const [selectedOfficer, setSelectedOfficer] = useState<OfficerRecord | null>(null);
  const [newStatus, setNewStatus] = useState('Approved');
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [sendEmail, setSendEmail] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Success result modal
  const [updateResult, setUpdateResult] = useState<any | null>(null);

  // Custom API endpoint overrides
  const [showEndpointsModal, setShowEndpointsModal] = useState(false);
  const [customCollectorUrl, setCustomCollectorUrl] = useState('');
  const [customTransporterUrl, setCustomTransporterUrl] = useState('');

  const handleClearAccess = () => {
    clearDeveloperAccess();
    router.push('/select-role');
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2500);
  };

  const generateRandomPassword = () => {
    return Math.random().toString(36).slice(-8);
  };

  // Test DB connection
  const testConnection = useCallback(async (envToTest: EnvironmentKey) => {
    setIsTestingDb(true);
    try {
      const res = await fetch('/api/developer/officers/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ env: envToTest }),
      });
      const data = await res.json();
      if (data.success) {
        setDbStatus({
          connected: true,
          latencyMs: data.latencyMs,
          totalOfficers: data.totalOfficers,
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

  // Fetch officers list
  const fetchOfficers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        env: activeEnv,
        page: currentPage.toString(),
        limit: pageSize.toString(),
        search: searchQuery,
        status: selectedStatus === 'all' ? '' : selectedStatus,
        jobRole: selectedRole === 'all' ? '' : selectedRole,
      });

      const res = await fetch(`/api/developer/officers?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setOfficers(data.officers || []);
        setTotalCount(data.total || 0);
        setTotalPages(data.totalPages || 1);
        if (data.availableStatuses?.length) {
          setAvailableStatuses(data.availableStatuses);
        }
        if (data.availableRoles?.length) {
          setAvailableRoles(data.availableRoles);
        }
      } else {
        setOfficers([]);
        setTotalCount(0);
      }
    } catch (err) {
      console.error('Failed to load officers:', err);
      setOfficers([]);
    } finally {
      setLoading(false);
    }
  }, [activeEnv, currentPage, searchQuery, selectedStatus, selectedRole]);

  // Initial load & when env changes
  useEffect(() => {
    setCurrentPage(1);
    testConnection(activeEnv);
    fetchOfficers();
  }, [activeEnv, testConnection]);

  // Refetch when filters change
  useEffect(() => {
    fetchOfficers();
  }, [currentPage, selectedStatus, selectedRole, fetchOfficers]);

  // Open modal for an officer
  const handleOpenStatusModal = (officer: OfficerRecord) => {
    setSelectedOfficer(officer);
    setNewStatus(officer.status || 'Approved');
    setGeneratedPassword(generateRandomPassword());
    setShowPassword(false);
    setSendEmail(officer.status !== 'Approved'); // default true if changing to Approved
    setUpdateError(null);
  };

  // Submit status and password update
  const handleExecuteUpdate = async () => {
    if (!selectedOfficer) return;
    setIsUpdating(true);
    setUpdateError(null);

    try {
      const payload: any = {
        env: activeEnv,
        id: selectedOfficer.id,
        status: newStatus,
        customPassword: generatedPassword,
        sendEmail,
      };

      if (customCollectorUrl) payload.collectorApiUrl = customCollectorUrl;
      if (customTransporterUrl) payload.transporterApiUrl = customTransporterUrl;

      const res = await fetch('/api/developer/officers/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (res.ok && result.status) {
        setUpdateResult(result.data);
        setSelectedOfficer(null);
        fetchOfficers(); // reload table
      } else {
        setUpdateError(result.message || 'Failed to update status.');
      }
    } catch (err: any) {
      setUpdateError(err.message || 'An error occurred during submission.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Helper to determine sync target
  const getRoleSyncTarget = (role: string | null) => {
    if (!role) return 'none';
    if (role === 'Light Weight Driver' || role === 'Heavy Weight Driver') {
      return 'transporter';
    }
    if (
      role === 'Collection Officer' ||
      role === 'Collection Centre Manager' ||
      role === 'Distribution Officer' ||
      role === 'Distribution Centre Manager'
    ) {
      return 'collector';
    }
    return 'none';
  };

  const getStatusBadgeClass = (status: string | null) => {
    const s = (status || '').toLowerCase().trim();
    if (s === 'approved') {
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
    }
    if (s.includes('not approved') || s === 'rejected') {
      return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30';
    }
    return 'bg-amber-500/10 text-amber-500 border-amber-500/30';
  };

  const currentConfig = ENVIRONMENTS[activeEnv] || ENVIRONMENTS.dev;

  return (
    <div className="min-h-screen flex flex-col font-sans transition-colors duration-300">
      {/* Top Glassmorphic Navigation Header */}
      <header className="sticky top-0 z-40 glass-header px-6 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Brand & Title */}
        <div className="flex items-center gap-3">
          <Link
            href="/developer"
            className="p-2 rounded-xl glass-card text-xs font-bold transition-all hover:bg-slate-200 dark:hover:bg-slate-800"
            title="Back to Developer Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-amber-500 flex items-center justify-center text-white shadow-md p-0.5">
            <KingDeveloperIcon size={30} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold tracking-tight">Officer Status & Password Manager</h1>
              <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full border bg-amber-500/10 text-amber-500 border-amber-500/30">
                Admin Panel Sync
              </span>
              <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full border bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 flex items-center gap-1 shadow-xs">
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                <span>Full Access</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Update Collection Officer status, generate bcrypt credentials, and trigger mobile app sync
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowEndpointsModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all glass-card hover:border-indigo-500/40 text-slate-700 dark:text-slate-300"
            title="Inspect & configure mobile API endpoints"
          >
            <Server className="w-3.5 h-3.5 text-indigo-500" />
            <span>API Endpoints</span>
          </button>

          <button
            onClick={handleClearAccess}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 cursor-pointer shadow-xs"
            title="Revoke Developer Session"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Clear Access</span>
          </button>

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

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-6">
        {/* ENVIRONMENT SELECTOR & DB STATUS BAR */}
        <section className="glass-panel p-5 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">Environment:</span>
            {(['dev', 'uat', 'local'] as EnvironmentKey[]).map((envKey) => {
              const active = activeEnv === envKey;
              return (
                <button
                  key={envKey}
                  onClick={() => setActiveEnv(envKey)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    active
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-indigo-500/20 scale-102'
                      : 'glass-card text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>{envKey.toUpperCase()}</span>
                </button>
              );
            })}
          </div>

          {/* Active DB Info & Test Connection Button */}
          <div className="flex flex-wrap items-center gap-3 text-xs w-full md:w-auto justify-between md:justify-end">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/20 dark:border-white/5 bg-white/40 dark:bg-black/30">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  dbStatus?.connected
                    ? 'bg-emerald-500 shadow-xs shadow-emerald-500 animate-pulse'
                    : dbStatus?.connected === false
                    ? 'bg-rose-500 shadow-xs shadow-rose-500'
                    : 'bg-slate-400'
                }`}
              />
              <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300">
                {currentConfig.db.host}:{currentConfig.db.port} • {currentConfig.db.database}
              </span>
              {dbStatus?.latencyMs !== undefined && (
                <span className="text-[10px] text-emerald-500 font-bold font-mono">
                  ({dbStatus.latencyMs}ms)
                </span>
              )}
            </div>

            <button
              onClick={() => testConnection(activeEnv)}
              disabled={isTestingDb}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold glass-card hover:bg-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-500 ${isTestingDb ? 'animate-spin' : ''}`} />
              <span>{isTestingDb ? 'Pinging DB...' : 'Test DB'}</span>
            </button>
          </div>
        </section>

        {/* SEARCH & FILTERS BAR */}
        <section className="glass-panel p-4 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Emp ID, Name, Email, Phone..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') fetchOfficers();
              }}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs glass-card border border-white/20 dark:border-white/5 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 rounded-xl text-xs glass-card border border-white/20 dark:border-white/5 focus:outline-none cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="Approved">Approved</option>
                <option value="Not Approved">Not Approved</option>
                <option value="Rejected">Rejected</option>
                {availableStatuses
                  .filter((s) => !['Approved', 'Not Approved', 'Rejected'].includes(s))
                  .map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
              </select>
            </div>

            {/* Role Filter */}
            <select
              value={selectedRole}
              onChange={(e) => {
                setSelectedRole(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 rounded-xl text-xs glass-card border border-white/20 dark:border-white/5 focus:outline-none cursor-pointer max-w-[200px]"
            >
              <option value="all">All Job Roles</option>
              {availableRoles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>

            {/* Reload button */}
            <button
              onClick={() => fetchOfficers()}
              disabled={loading}
              className="p-2.5 rounded-xl glass-card hover:bg-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer"
              title="Refresh officer list"
            >
              <RefreshCw className={`w-4 h-4 text-purple-500 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </section>

        {/* OFFICERS DATA TABLE */}
        <section className="glass-panel p-6 rounded-3xl overflow-hidden space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-500" />
              <h2 className="text-sm font-extrabold">Registered Officers ({totalCount})</h2>
            </div>
            <span className="text-xs text-slate-400">
              Page {currentPage} of {totalPages}
            </span>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="w-8 h-8 text-purple-500 animate-spin" />
              <p className="text-xs font-semibold text-slate-400">Loading officers from {activeEnv.toUpperCase()} database...</p>
            </div>
          ) : officers.length === 0 ? (
            <div className="py-20 text-center space-y-2">
              <ShieldAlert className="w-10 h-10 text-amber-500 mx-auto" />
              <p className="text-sm font-bold">No officers found matching your criteria</p>
              <p className="text-xs text-slate-400">Try changing your search term, role filter, or environment.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/50 dark:border-slate-800/50 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Officer Profile</th>
                    <th className="py-3 px-4">Emp ID</th>
                    <th className="py-3 px-4">Job Role</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-center">Mobile Sync Type</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/40 dark:divide-slate-800/40">
                  {officers.map((officer) => {
                    const syncTarget = getRoleSyncTarget(officer.jobRole);
                    return (
                      <tr
                        key={officer.id}
                        className="hover:bg-purple-500/5 transition-colors group cursor-pointer"
                        onClick={() => handleOpenStatusModal(officer)}
                      >
                        {/* Profile */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                              {(officer.firstNameEnglish?.[0] || 'O').toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                                <span>
                                  {officer.firstNameEnglish || ''} {officer.lastNameEnglish || ''}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">#{officer.id}</span>
                              </div>
                              <span className="text-[11px] text-slate-400">
                                {officer.createdAt ? new Date(officer.createdAt).toLocaleDateString() : 'N/A'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Emp ID */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-xs bg-slate-200/60 dark:bg-slate-800/60 px-2 py-0.5 rounded-md">
                              {officer.empId || 'N/A'}
                            </span>
                            {officer.empId && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(officer.empId!, `emp-${officer.id}`);
                                }}
                                className="text-slate-400 hover:text-purple-500 transition-colors"
                                title="Copy Employee ID"
                              >
                                {copiedText === `emp-${officer.id}` ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Job Role */}
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {officer.jobRole || 'Unassigned'}
                          </span>
                        </td>

                        {/* Contact */}
                        <td className="py-3.5 px-4 space-y-0.5">
                          <div className="font-mono text-[11px] text-slate-600 dark:text-slate-300 truncate max-w-[180px]">
                            {officer.email || 'No email registered'}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {officer.phoneNumber01 || '—'}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${getStatusBadgeClass(
                              officer.status
                            )}`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            <span>{officer.status || 'Unknown'}</span>
                          </span>
                        </td>

                        {/* Mobile Sync Type */}
                        <td className="py-3.5 px-4 text-center">
                          {syncTarget === 'transporter' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                              <Truck className="w-3 h-3" />
                              <span>Transporter API</span>
                            </span>
                          ) : syncTarget === 'collector' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                              <Smartphone className="w-3 h-3" />
                              <span>Collector API</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">None (Internal)</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenStatusModal(officer);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-xs transition-all cursor-pointer"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                            <span>Change Status</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="pt-4 border-t border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between text-xs">
              <span className="text-slate-400">
                Showing {officers.length} of {totalCount} records
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1 || loading}
                  className="p-2 rounded-xl glass-card disabled:opacity-40 transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-1 rounded-xl glass-card font-mono font-bold">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages || loading}
                  className="p-2 rounded-xl glass-card disabled:opacity-40 transition-all cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* CHANGE STATUS & PASSWORD MODAL */}
      {selectedOfficer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg glass-panel p-6 rounded-3xl space-y-6 relative shadow-2xl border border-white/20">
            {/* Close Button */}
            <button
              onClick={() => setSelectedOfficer(null)}
              className="absolute right-5 top-5 p-1.5 rounded-xl glass-card text-slate-400 hover:text-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-500 flex items-center justify-center">
                  <UserCheck className="w-4 h-4" />
                </div>
                <h3 className="text-base font-extrabold">Update Status & Password</h3>
              </div>
              <p className="text-xs text-slate-400">
                Matches the Admin Panel controller logic. Updates MySQL status, encrypts bcrypt password, and synchronizes with mobile APIs.
              </p>
            </div>

            {/* Target Officer Card */}
            <div className="p-3.5 rounded-2xl border border-white/20 dark:border-white/5 bg-white/40 dark:bg-black/30 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm">
                  {selectedOfficer.firstNameEnglish} {selectedOfficer.lastNameEnglish}
                </span>
                <span className="font-mono text-purple-500 font-bold">{selectedOfficer.empId || 'NO EMP ID'}</span>
              </div>
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span>Role: {selectedOfficer.jobRole}</span>
                <span>Current: <strong className="text-slate-700 dark:text-slate-200">{selectedOfficer.status}</strong></span>
              </div>
            </div>

            {/* Status Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Select New Status
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['Approved', 'Not Approved', 'Rejected'].map((statusOption) => {
                  const isSelected = newStatus === statusOption;
                  return (
                    <button
                      key={statusOption}
                      type="button"
                      onClick={() => setNewStatus(statusOption)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        isSelected
                          ? statusOption === 'Approved'
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500'
                            : 'bg-rose-500/20 border-rose-500 text-rose-500'
                          : 'glass-card text-slate-400 border-white/10 hover:border-white/20'
                      }`}
                    >
                      {statusOption}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Generated Password Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  New Password (Auto-Generated)
                </label>
                <button
                  type="button"
                  onClick={() => setGeneratedPassword(generateRandomPassword())}
                  className="text-[11px] text-purple-500 hover:underline flex items-center gap-1 font-bold"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Regenerate</span>
                </button>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={generatedPassword}
                  onChange={(e) => setGeneratedPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl font-mono text-sm glass-card border border-white/20 dark:border-white/5 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-slate-400">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(generatedPassword, 'modal-pwd')}
                    className="p-1 hover:text-slate-200"
                    title="Copy Password"
                  >
                    {copiedText === 'modal-pwd' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-slate-400">
                Will be hashed with bcrypt (<code className="font-mono">10 salt rounds</code>) before saving.
              </p>
            </div>

            {/* Mobile API Notification Notice */}
            {(() => {
              const target = getRoleSyncTarget(selectedOfficer.jobRole);
              if (target === 'transporter') {
                return (
                  <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-500 text-xs flex items-center gap-2">
                    <Truck className="w-4 h-4 shrink-0" />
                    <span>
                      <strong>Transporter Mobile API</strong> will be notified at <code className="font-mono">/api/auth/notify-status-changed</code> with <code className="font-mono">userId: {selectedOfficer.id}</code>.
                    </span>
                  </div>
                );
              }
              if (target === 'collector') {
                return (
                  <div className="p-3 rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-500 text-xs flex items-center gap-2">
                    <Smartphone className="w-4 h-4 shrink-0" />
                    <span>
                      <strong>Collector Mobile API</strong> will be notified at <code className="font-mono">/api/auth/notify-status-changed</code> with <code className="font-mono">userId: {selectedOfficer.id}</code>.
                    </span>
                  </div>
                );
              }
              return (
                <div className="p-2.5 rounded-xl border border-slate-500/20 bg-slate-500/5 text-slate-400 text-xs">
                  ℹ️ Internal role. No mobile app notification is required.
                </div>
              );
            })()}

            {/* Email Notification Option */}
            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                id="sendEmailCheckbox"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
              />
              <label htmlFor="sendEmailCheckbox" className="text-xs text-slate-600 dark:text-slate-300 font-medium cursor-pointer">
                Send password notification to <strong className="text-slate-800 dark:text-slate-100">{selectedOfficer.email || 'registered email'}</strong>
              </label>
            </div>

            {/* Error Message */}
            {updateError && (
              <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-500 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{updateError}</span>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedOfficer(null)}
                disabled={isUpdating}
                className="px-4 py-2 rounded-xl text-xs font-bold glass-card hover:bg-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleExecuteUpdate}
                disabled={isUpdating}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md shadow-purple-500/20 transition-all cursor-pointer flex items-center gap-1.5"
              >
                {isUpdating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirm & Update Status</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS RESULT MODAL */}
      {updateResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md glass-panel p-6 rounded-3xl space-y-6 relative shadow-2xl border border-emerald-500/30">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto shadow-md shadow-emerald-500/10">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-emerald-500">Status Updated Successfully!</h3>
              <p className="text-xs text-slate-400">
                The officer record in the <strong>{activeEnv.toUpperCase()}</strong> database has been updated.
              </p>
            </div>

            {/* Generated Password Box with Quick Copy */}
            <div className="p-4 rounded-2xl border border-purple-500/30 bg-purple-500/10 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-purple-400">NEW PLAIN PASSWORD:</span>
                <span className="text-[10px] text-slate-400 font-medium">Use to login in app</span>
              </div>
              <div className="flex items-center justify-between bg-black/40 px-3.5 py-2 rounded-xl">
                <span className="font-mono text-base font-extrabold text-purple-300 tracking-wider">
                  {updateResult.plainPassword}
                </span>
                <button
                  onClick={() => copyToClipboard(updateResult.plainPassword, 'result-pwd')}
                  className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1 transition-all"
                >
                  {copiedText === 'result-pwd' ? (
                    <>
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Sync Details */}
            <div className="p-3.5 rounded-xl border border-white/20 dark:border-white/5 bg-white/40 dark:bg-black/30 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Employee ID:</span>
                <span className="font-mono font-bold">{updateResult.empId || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">New Status:</span>
                <span className="font-bold text-emerald-400">{updateResult.newStatus}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Mobile API Sync:</span>
                <span
                  className={`font-semibold ${
                    updateResult.syncResult?.success ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {updateResult.syncResult?.message || 'N/A'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setUpdateResult(null)}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition-all shadow-md cursor-pointer"
            >
              Done & Return to Table
            </button>
          </div>
        </div>
      )}

      {/* ENDPOINTS CONFIGURATION MODAL */}
      {showEndpointsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg glass-panel p-6 rounded-3xl space-y-5 relative shadow-2xl border border-white/20">
            <button
              onClick={() => setShowEndpointsModal(false)}
              className="absolute right-5 top-5 p-1.5 rounded-xl glass-card text-slate-400 hover:text-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <h3 className="text-base font-extrabold flex items-center gap-2">
                <Server className="w-4 h-4 text-indigo-500" />
                <span>Mobile Sync API Endpoints</span>
              </h3>
              <p className="text-xs text-slate-400">
                These endpoints are notified automatically when officer or driver status changes.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              {/* Collector API URL */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-300">Collector Mobile API Base URL</label>
                  <span className="text-[10px] text-slate-500 font-mono">Roles: COO, CCM, DIO, DCM</span>
                </div>
                <input
                  type="text"
                  placeholder={currentConfig.urls.collectorApiUrl}
                  value={customCollectorUrl}
                  onChange={(e) => setCustomCollectorUrl(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl font-mono text-xs glass-card border border-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[10px] text-slate-400">
                  Target Endpoint: <code className="font-mono text-indigo-400">/api/auth/notify-status-changed</code>
                </p>
              </div>

              {/* Transporter API URL */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-300">Transporter Mobile API Base URL</label>
                  <span className="text-[10px] text-slate-500 font-mono">Roles: Heavy & Light Driver</span>
                </div>
                <input
                  type="text"
                  placeholder={currentConfig.urls.transporterApiUrl}
                  value={customTransporterUrl}
                  onChange={(e) => setCustomTransporterUrl(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl font-mono text-xs glass-card border border-white/20 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <p className="text-[10px] text-slate-400">
                  Target Endpoint: <code className="font-mono text-amber-400">/api/auth/notify-status-changed</code>
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setCustomCollectorUrl('');
                  setCustomTransporterUrl('');
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold glass-card hover:bg-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer text-slate-400"
              >
                Reset to Defaults
              </button>
              <button
                type="button"
                onClick={() => setShowEndpointsModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all cursor-pointer"
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
