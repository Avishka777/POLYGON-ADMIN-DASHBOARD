'use client';

import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  Database,
  Download,
  ExternalLink,
  FileText,
  Filter,
  Flame,
  Globe,
  Layers,
  PackageCheck,
  Printer,
  QrCode,
  RefreshCw,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  UserCheck,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { InvoiceData, InvoiceModal } from './InvoiceModal';

interface OutPackagesViewProps {
  onBackToMenu: () => void;
  isLightTheme: boolean;
  userRole: 'qa' | 'developer';
}

interface PackageItem {
  id: string;
  appName: string;
  appId: string;
  iconBg: string;
  version: string;
  buildNumber: number;
  platform: 'android' | 'ios' | 'bundle';
  platformLabel: string;
  environment: 'local' | 'dev' | 'uat' | 'prod';
  fileSize: string;
  buildDate: string;
  downloadUrl: string;
  notes: string;
}

interface PackingPosition {
  id: number;
  name: string;
  type: 'QR' | 'NOR' | 'QC';
  status: 'Occupied' | 'Available';
  assignedUser: string | null;
}

interface PackingRow {
  id: number;
  rowIndex: number;
  name: string;
  isEnabled: boolean;
  positionsCount: number;
  allocatedCount: number;
  crops: string;
  positions: PackingPosition[];
}

interface WebUser {
  id: number;
  name: string;
  role: string;
  email: string;
}

interface OrderItem {
  id: number;
  orderId: number;
  invNo: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  timeSlot: string;
  buyerType: string;
  deliveryMethod: string;
  orderStatus: string;
  rowId: number;
  rowName: string;
  items: Array<{ name: string; qty: string; price: number; packingFee?: number }>;
  subtotal: number;
  packingFee: number;
  serviceFee: number;
  discount: number;
  grandTotal: number;
  paymentType: string;
}

export const OutPackagesView: React.FC<OutPackagesViewProps> = ({
  onBackToMenu,
  isLightTheme,
  userRole,
}) => {
  const [activeTab, setActiveTab] = useState<'artifacts' | 'codi-packing'>('codi-packing');
  const [selectedEnv, setSelectedEnv] = useState<'dev' | 'uat'>('dev');

  // Artifacts Filter state
  const [filterEnv, setFilterEnv] = useState<string>('all');
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [qrModalPackage, setQrModalPackage] = useState<PackageItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Codi Net Packing State
  const [packingRows, setPackingRows] = useState<PackingRow[]>([]);
  const [availableUsers, setAvailableUsers] = useState<WebUser[]>([]);
  const [selectedRowId, setSelectedRowId] = useState<number | null>(101);
  const [selectedPositionId, setSelectedPositionId] = useState<number | null>(null);
  const [selectedUserToAssign, setSelectedUserToAssign] = useState<string>('');
  const [activeOrders, setActiveOrders] = useState<OrderItem[]>([]);

  // Invoice Modal state
  const [isInvoiceOpen, setIsInvoiceOpen] = useState<boolean>(false);
  const [activeInvoice, setActiveInvoice] = useState<InvoiceData | null>(null);
  const [isProcessingOut, setIsProcessingOut] = useState<boolean>(false);

  // Build Packages list
  const packages: PackageItem[] = [
    {
      id: 'codi-uat-apk',
      appName: 'Codi Net Collector',
      appId: 'com.polygon.codinet',
      iconBg: 'from-purple-600 to-indigo-600',
      version: 'v2.4.1',
      buildNumber: 142,
      platform: 'android',
      platformLabel: 'Android APK',
      environment: 'uat',
      fileSize: '34.8 MB',
      buildDate: '2026-09-06 14:30',
      downloadUrl: 'http://192.168.8.101:3000/builds/codi-net-v2.4.1-uat.apk',
      notes: 'Updated assembly line QR scanner & socket latency ping.',
    },
    {
      id: 'codi-uat-ipa',
      appName: 'Codi Net Collector',
      appId: 'com.polygon.codinet',
      iconBg: 'from-purple-600 to-indigo-600',
      version: 'v2.4.1',
      buildNumber: 142,
      platform: 'ios',
      platformLabel: 'iOS IPA',
      environment: 'uat',
      fileSize: '41.2 MB',
      buildDate: '2026-09-06 14:45',
      downloadUrl: 'http://192.168.8.101:3000/builds/codi-net-v2.4.1-uat.ipa',
      notes: 'TestFlight UAT release build for iOS test devices.',
    },
    {
      id: 'govi-care-dev-apk',
      appName: 'Govi Care Diagnostics',
      appId: 'com.polygon.govicare',
      iconBg: 'from-teal-500 to-emerald-600',
      version: 'v1.8.0',
      buildNumber: 98,
      platform: 'android',
      platformLabel: 'Android APK',
      environment: 'dev',
      fileSize: '28.4 MB',
      buildDate: '2026-09-05 11:15',
      downloadUrl: 'http://192.168.8.101:3000/builds/govi-care-v1.8.0-dev.apk',
      notes: 'Added AI crop leaf diagnostic model & offline sync.',
    },
    {
      id: 'govi-link-uat-apk',
      appName: 'Govi Link Marketplace',
      appId: 'com.polygon.govilink',
      iconBg: 'from-orange-500 to-amber-600',
      version: 'v3.1.2',
      buildNumber: 210,
      platform: 'android',
      platformLabel: 'Android APK',
      environment: 'uat',
      fileSize: '31.6 MB',
      buildDate: '2026-09-06 09:20',
      downloadUrl: 'http://192.168.8.101:3000/builds/govi-link-v3.1.2-uat.apk',
      notes: 'Direct farmer auction bidding module and SMS notification bridge.',
    },
    {
      id: 'govi-trans-prod-apk',
      appName: 'Govi Trans Pay',
      appId: 'com.polygon.govitrans',
      iconBg: 'from-yellow-500 to-amber-500',
      version: 'v2.0.5',
      buildNumber: 164,
      platform: 'android',
      platformLabel: 'Android APK',
      environment: 'prod',
      fileSize: '26.9 MB',
      buildDate: '2026-09-04 18:00',
      downloadUrl: 'http://192.168.8.101:3000/builds/govi-trans-v2.0.5-prod.apk',
      notes: 'Production release with biometric NFC payment support.',
    },
    {
      id: 'govi-mart-dev-apk',
      appName: 'Govi Mart B2B',
      appId: 'com.polygon.govimart',
      iconBg: 'from-orange-600 to-red-600',
      version: 'v1.5.0',
      buildNumber: 74,
      platform: 'android',
      platformLabel: 'Android APK',
      environment: 'dev',
      fileSize: '33.1 MB',
      buildDate: '2026-09-05 16:10',
      downloadUrl: 'http://192.168.8.101:3000/builds/govi-mart-v1.5.0-dev.apk',
      notes: 'Bulk wholesale bidding & order dispatch tracking.',
    },
    {
      id: 'sales-dash-uat-bundle',
      appName: 'Sales Dash Control',
      appId: 'com.polygon.salesdash',
      iconBg: 'from-violet-600 to-purple-700',
      version: 'v4.0.1',
      buildNumber: 305,
      platform: 'bundle',
      platformLabel: 'AAB Bundle',
      environment: 'uat',
      fileSize: '45.0 MB',
      buildDate: '2026-09-06 17:50',
      downloadUrl: 'http://192.168.8.101:3000/builds/sales-dash-v4.0.1-uat.aab',
      notes: 'SSO multi-app dashboard bundle for Play Store Internal Testing.',
    },
  ];

  // Load packing data when environment changes
  const loadPackingData = async () => {
    try {
      const rowsRes = await fetch(`/api/packing/rows?env=${selectedEnv}`);
      const rowsData = await rowsRes.json();
      if (rowsData.success && rowsData.data) {
        setPackingRows(rowsData.data);
        if (rowsData.data.length > 0) {
          setSelectedRowId(rowsData.data[0].id);
        }
      }

      const usersRes = await fetch(`/api/packing/users?env=${selectedEnv}`);
      const usersData = await usersRes.json();
      if (usersData.success && usersData.data) {
        setAvailableUsers(usersData.data);
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    loadPackingData();
  }, [selectedEnv]);

  // Filter packages for Artifacts Tab
  const filteredPackages = packages.filter((pkg) => {
    const matchesEnv = filterEnv === 'all' || pkg.environment === filterEnv;
    const matchesPlatform = filterPlatform === 'all' || pkg.platform === filterPlatform;
    const matchesSearch =
      pkg.appName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pkg.appId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pkg.version.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesEnv && matchesPlatform && matchesSearch;
  });

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleAssignUser = async (positionId: number) => {
    if (!selectedUserToAssign) return;
    try {
      const res = await fetch('/api/packing/assign-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          env: selectedEnv,
          positionId,
          userName: selectedUserToAssign,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPackingRows((prev) =>
          prev.map((row) => ({
            ...row,
            positions: row.positions.map((p) =>
              p.id === positionId
                ? { ...p, assignedUser: selectedUserToAssign, status: selectedUserToAssign ? 'Occupied' : 'Available' }
                : p
            ),
          }))
        );
        setSelectedPositionId(null);
        setSelectedUserToAssign('');
      }
    } catch {
      // Ignore
    }
  };

  const handleOutOrder = async (orderId: number) => {
    setIsProcessingOut(true);
    try {
      const res = await fetch('/api/packing/out-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          env: selectedEnv,
          orderId,
        }),
      });
      const data = await res.json();
      if (data.success && data.invoice) {
        setActiveInvoice(data.invoice);
        setIsInvoiceOpen(true);

        // Update local state order status
        setActiveOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, orderStatus: 'Out' } : o))
        );
      }
    } catch {
      // Fallback
    } finally {
      setIsProcessingOut(false);
    }
  };

  const activeRow = packingRows.find((r) => r.id === selectedRowId) || packingRows[0];

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${
        isLightTheme ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'
      }`}
    >
      {/* Top Navigation Header */}
      <header
        className={`sticky top-0 z-40 border-b backdrop-blur-md px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 transition-colors ${
          isLightTheme ? 'bg-white/90 border-slate-200 shadow-xs' : 'bg-slate-900/90 border-slate-800'
        }`}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToMenu}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-2 ${
              isLightTheme
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Menu</span>
          </button>

          <div className="h-5 w-px bg-slate-300 dark:bg-slate-800 hidden sm:block" />

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-md">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                Out Packages Hub
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  Codi Net Operations
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage Packing Rows, Position Users, Build Releases & Invoice Outing
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation & Environment Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Main Sub-Tabs */}
          <div className="flex items-center p-1 rounded-xl bg-slate-200/60 dark:bg-slate-800/80 text-xs font-bold">
            <button
              onClick={() => setActiveTab('codi-packing')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'codi-packing'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Codi Net Row & Outing Ops</span>
            </button>
            <button
              onClick={() => setActiveTab('artifacts')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'artifacts'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Build Artifact Downloads</span>
            </button>
          </div>

          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
              userRole === 'qa'
                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
            }`}
          >
            {userRole === 'qa' ? 'Napuru QA' : 'King of Developer'}
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-10 space-y-8">
        {/* TAB 1: CODI NET PACKING ROW & OUTING OPERATIONS */}
        {activeTab === 'codi-packing' && (
          <div className="space-y-8">
            {/* Banner with Environment Selector */}
            <section
              className={`p-8 rounded-3xl border shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6 ${
                isLightTheme
                  ? 'bg-gradient-to-r from-indigo-50/80 via-white to-purple-50/80 border-indigo-100'
                  : 'bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-900 border-indigo-900/30'
              }`}
            >
              <div className="max-w-2xl space-y-3 relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold">
                  <Flame className="w-3.5 h-3.5 text-rose-500" />
                  <span>Codi Net Distribution Operations</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Order Row Allocation & Invoice Outing
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                  View available packing rows for <strong>DEV</strong> & <strong>UAT</strong> environments, assign web users to packing positions (QR, Packing 01-04, QC), and out completed orders with automatic tax invoice generation.
                </p>
              </div>

              {/* DEV / UAT Environment Toggle */}
              <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-md">
                <button
                  onClick={() => setSelectedEnv('dev')}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                    selectedEnv === 'dev'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  DEV Environment
                </button>
                <button
                  onClick={() => setSelectedEnv('uat')}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                    selectedEnv === 'uat'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  UAT Environment
                </button>
              </div>
            </section>

            {/* SECTION 1: AVAILABLE PACKING ROWS GRID */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-indigo-500" />
                  Available Packing Rows ({selectedEnv.toUpperCase()})
                </h3>
                <span className="text-xs text-slate-500 font-medium">
                  Validated against Codi Net packing rows & positions schema
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {packingRows.map((row) => (
                  <div
                    key={row.id}
                    onClick={() => setSelectedRowId(row.id)}
                    className={`p-6 rounded-3xl border cursor-pointer transition-all duration-200 space-y-4 shadow-sm hover:shadow-md ${
                      selectedRowId === row.id
                        ? isLightTheme
                          ? 'bg-white border-indigo-400 ring-2 ring-indigo-500/20'
                          : 'bg-slate-900 border-indigo-500 ring-2 ring-indigo-500/20'
                        : isLightTheme
                        ? 'bg-white border-slate-200 hover:border-slate-300'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                          Row #{row.rowIndex}
                        </span>
                        <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                          {row.name}
                        </h4>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        {row.allocatedCount} Orders Allocated
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                      <div className="flex justify-between text-slate-500 dark:text-slate-400">
                        <span>Assigned Crops:</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {row.crops}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-500 dark:text-slate-400">
                        <span>Position Occupancy:</span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">
                          {row.positions.filter((p) => p.status === 'Occupied').length} / {row.positions.length} Occupied
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 2: WEB USER POSITION ASSIGNMENT (POSITIONS IN SELECTED ROW) */}
            {activeRow && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-500" />
                    Packing Positions & Web User Assignment for {activeRow.name}
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {activeRow.positions.map((pos) => (
                    <div
                      key={pos.id}
                      className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 transition-all shadow-xs ${
                        isLightTheme ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-black uppercase rounded ${
                              pos.type === 'QR'
                                ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                                : pos.type === 'QC'
                                ? 'bg-purple-500/10 text-purple-600 border border-purple-500/20'
                                : 'bg-indigo-500/10 text-indigo-600 border border-indigo-500/20'
                            }`}
                          >
                            {pos.type}
                          </span>
                          <span
                            className={`text-xs font-bold ${
                              pos.status === 'Occupied' ? 'text-emerald-500' : 'text-amber-500'
                            }`}
                          >
                            ● {pos.status}
                          </span>
                        </div>

                        <h5 className="text-sm font-extrabold text-slate-900 dark:text-white">
                          {pos.name}
                        </h5>

                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Assigned User:{' '}
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {pos.assignedUser || 'None'}
                          </span>
                        </div>
                      </div>

                      {/* Position Assignment Controls */}
                      {selectedPositionId === pos.id ? (
                        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                          <select
                            value={selectedUserToAssign}
                            onChange={(e) => setSelectedUserToAssign(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-xl border text-xs font-medium focus:outline-none bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                          >
                            <option value="">-- Select Web User --</option>
                            {availableUsers.map((u) => (
                              <option key={u.id} value={u.name}>
                                {u.name} ({u.role})
                              </option>
                            ))}
                          </select>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleAssignUser(pos.id)}
                              className="flex-1 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setSelectedPositionId(null)}
                              className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setSelectedPositionId(pos.id)}
                          className={`w-full py-2 rounded-xl text-xs font-bold transition-all border ${
                            isLightTheme
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                          }`}
                        >
                          {pos.assignedUser ? 'Re-assign User' : 'Assign User'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECTION 3: ORDER OUTING & TAX INVOICE GENERATOR */}
            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Printer className="w-5 h-5 text-emerald-500" />
                  Orders Ready for Outing & Invoice Generation
                </h3>
                <span className="text-xs text-slate-500 font-medium">
                  Click 'Out Order' to transition status to Out / Dispatched & issue tax invoice
                </span>
              </div>

              {/* Sample Ready Orders */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div
                  className={`p-6 rounded-3xl border flex flex-col justify-between space-y-6 shadow-sm ${
                    isLightTheme ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-black uppercase font-mono text-indigo-600 dark:text-indigo-400 block">
                          INV-2026-0901 • Order #501
                        </span>
                        <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                          Sunil Farmer Fresh Ltd
                        </h4>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                        QC Inspected
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 text-xs space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Time Slot & Buyer:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          08:00 AM - 12:00 PM (Retail)
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Items:</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          Fresh Beans, Carrots, Leeks (3 Items)
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Grand Total:</span>
                        <span className="font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
                          Rs. 4,135.00
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOutOrder(501)}
                    disabled={isProcessingOut}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Out Order & Generate Invoice</span>
                  </button>
                </div>

                <div
                  className={`p-6 rounded-3xl border flex flex-col justify-between space-y-6 shadow-sm ${
                    isLightTheme ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-black uppercase font-mono text-purple-600 dark:text-purple-400 block">
                          INV-2026-0902 • Order #502
                        </span>
                        <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                          SuperMart B2B Store
                        </h4>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        QC Completed
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 text-xs space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Time Slot & Buyer:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          12:00 PM - 04:00 PM (Wholesale)
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Items:</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          Mango Cartons, Grade A Avocado (2 Items)
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Grand Total:</span>
                        <span className="font-extrabold text-purple-600 dark:text-purple-400 font-mono">
                          Rs. 15,550.00
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOutOrder(502)}
                    disabled={isProcessingOut}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Out Order & Generate Invoice</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ORIGINAL BUILD ARTIFACT PACKAGES DOWNLOAD */}
        {activeTab === 'artifacts' && (
          <div className="space-y-8">
            {/* Banner Section */}
            <section
              className={`p-8 rounded-3xl border shadow-xl relative overflow-hidden ${
                isLightTheme
                  ? 'bg-gradient-to-r from-indigo-50/80 via-white to-purple-50/80 border-indigo-100'
                  : 'bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-900 border-indigo-900/30'
              }`}
            >
              <div className="max-w-3xl space-y-3 relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold">
                  <Smartphone className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Mobile Artifact Storage</span>
                </div>
                <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Mobile Application Out Packages
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                  Access compiled release builds for all mobile applications across the Polygon ecosystem. Download APKs directly, scan QR codes for over-the-air installation, or inspect build release logs.
                </p>
              </div>
            </section>

            {/* Filters & Search Toolbar */}
            <div
              className={`p-4 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs ${
                isLightTheme ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search app, ID or version..."
                  className={`w-full pl-10 pr-4 py-2 text-xs font-medium rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                    isLightTheme
                      ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                      : 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500'
                  }`}
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="flex items-center gap-1.5 text-xs">
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-bold text-slate-500 dark:text-slate-400">Env:</span>
                  <select
                    value={filterEnv}
                    onChange={(e) => setFilterEnv(e.target.value)}
                    className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold focus:outline-none cursor-pointer ${
                      isLightTheme
                        ? 'bg-slate-50 border-slate-200 text-slate-800'
                        : 'bg-slate-950 border-slate-800 text-slate-200'
                    }`}
                  >
                    <option value="all">All Environments</option>
                    <option value="local">Local</option>
                    <option value="dev">Dev</option>
                    <option value="uat">UAT</option>
                    <option value="prod">Production</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5 text-xs">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-bold text-slate-500 dark:text-slate-400">Platform:</span>
                  <select
                    value={filterPlatform}
                    onChange={(e) => setFilterPlatform(e.target.value)}
                    className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold focus:outline-none cursor-pointer ${
                      isLightTheme
                        ? 'bg-slate-50 border-slate-200 text-slate-800'
                        : 'bg-slate-950 border-slate-800 text-slate-200'
                    }`}
                  >
                    <option value="all">All Platforms</option>
                    <option value="android">Android (.apk)</option>
                    <option value="ios">iOS (.ipa)</option>
                    <option value="bundle">AAB Bundle</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Packages Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPackages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`p-6 rounded-3xl border transition-all duration-200 flex flex-col justify-between space-y-5 shadow-sm hover:shadow-md ${
                    isLightTheme
                      ? 'bg-white border-slate-200 hover:border-indigo-300'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${pkg.iconBg} flex items-center justify-center text-white font-black shadow-md text-sm`}
                        >
                          {pkg.appName.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">
                            {pkg.appName}
                          </h3>
                          <span className="text-[11px] font-mono text-slate-400 block mt-0.5">
                            {pkg.appId}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                          pkg.environment === 'prod'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                            : pkg.environment === 'uat'
                            ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                        }`}
                      >
                        {pkg.environment}
                      </span>
                    </div>

                    <div
                      className={`p-3.5 rounded-2xl border space-y-2 text-xs ${
                        isLightTheme ? 'bg-slate-50 border-slate-100' : 'bg-slate-950/60 border-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Version:</span>
                        <span className="font-extrabold font-mono text-indigo-600 dark:text-indigo-400">
                          {pkg.version} (Build {pkg.buildNumber})
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Format:</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {pkg.platformLabel}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Size & Date:</span>
                        <span className="font-medium text-slate-500 dark:text-slate-400">
                          {pkg.fileSize} • {pkg.buildDate}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed italic">
                      "{pkg.notes}"
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2">
                    <a
                      href={pkg.downloadUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>

                    <button
                      onClick={() => setQrModalPackage(pkg)}
                      className={`p-2.5 rounded-xl border transition-colors ${
                        isLightTheme
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                      }`}
                      title="Scan QR Code to Install"
                    >
                      <QrCode className="w-4 h-4 text-purple-500" />
                    </button>

                    <button
                      onClick={() => copyToClipboard(pkg.id, pkg.downloadUrl)}
                      className={`p-2.5 rounded-xl border transition-colors ${
                        isLightTheme
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                      }`}
                      title="Copy Package URL"
                    >
                      {copiedId === pkg.id ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Copy className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Invoice Modal Component */}
      <InvoiceModal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        invoice={activeInvoice}
        isLightTheme={isLightTheme}
      />

      {/* QR Code Scan Modal */}
      {qrModalPackage && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className={`max-w-sm w-full p-6 rounded-3xl border shadow-2xl space-y-5 text-center relative ${
              isLightTheme ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}
          >
            <button
              onClick={() => setQrModalPackage(null)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1 pt-2">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mx-auto mb-2">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">{qrModalPackage.appName}</h3>
              <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400 block">
                {qrModalPackage.version} ({qrModalPackage.environment.toUpperCase()})
              </span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 inline-block shadow-inner">
              <div className="w-48 h-48 bg-slate-900 p-3 rounded-xl flex flex-col items-center justify-center text-white space-y-2">
                <QrCode className="w-32 h-32 text-white" />
                <span className="text-[10px] font-mono text-slate-300">Scan to Install on Device</span>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              Scan this QR code with your mobile camera to download and install build directly.
            </p>

            <button
              onClick={() => setQrModalPackage(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
