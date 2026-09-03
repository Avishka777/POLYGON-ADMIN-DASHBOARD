'use client';

import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Database,
  FileSpreadsheet,
  FileType,
  Flame,
  Layers,
  PlugZap,
  Server,
  ShieldCheck,
  Sparkles,
  Table as TableIcon,
} from 'lucide-react';
import { ConnectionModal } from '@/components/ConnectionModal';
import { DevilWomanIcon } from '@/components/DevilWomanIcon';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { SplashScreen } from '@/components/SplashScreen';
import { TablePreview } from '@/components/TablePreview';
import { ToastContainer, ToastMessage } from '@/components/Toast';
import { DbConnectionConfig, TableInfo, TablePreviewData } from '@/lib/db/types';

const LAST_CONFIG_KEY = 'dataflow_last_connection_config';

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);
  const [config, setConfig] = useState<DbConnectionConfig | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnectionModalOpen, setIsConnectionModalOpen] = useState(false);

  // Database and Tables state
  const [databases, setDatabases] = useState<string[]>([]);
  const [selectedDatabase, setSelectedDatabase] = useState<string>('');
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [selectedTableSchema, setSelectedTableSchema] = useState<string | undefined>('public');

  // Preview & Pagination state
  const [previewData, setPreviewData] = useState<TablePreviewData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Export state
  const [selectedForExport, setSelectedForExport] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  // Loading flags
  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Toast alerts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', title: string, message?: string) => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Attempt auto-reconnect or load previous connection on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LAST_CONFIG_KEY);
      if (saved) {
        const parsed: DbConnectionConfig = JSON.parse(saved);
        setConfig(parsed);
      }
    } catch {
      // Ignore
    }
  }, []);

  // Fetch tables when selectedDatabase or connection config changes
  const loadTables = async (dbConfig: DbConnectionConfig, targetDb?: string) => {
    setIsLoadingTables(true);
    try {
      const res = await fetch('/api/db/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: dbConfig,
          database: targetDb || dbConfig.database,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch tables');
      }

      setTables(data.tables || []);

      // If tables exist, preview the first one
      if (data.tables && data.tables.length > 0) {
        const first = data.tables[0];
        setSelectedTable(first.name);
        setSelectedTableSchema(first.schema || 'public');
        loadTablePreview(dbConfig, first.name, first.schema, 1, pageSize, targetDb);
      } else {
        setSelectedTable(null);
        setPreviewData(null);
      }
    } catch (err: any) {
      addToast('error', 'Error loading tables', err.message);
    } finally {
      setIsLoadingTables(false);
    }
  };

  // Load preview data
  const loadTablePreview = async (
    dbConfig: DbConnectionConfig,
    tableName: string,
    schema?: string,
    page = 1,
    size = pageSize,
    database?: string
  ) => {
    setIsLoadingPreview(true);
    try {
      const res = await fetch('/api/db/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: dbConfig,
          table: tableName,
          schema: schema || 'public',
          page,
          pageSize: size,
          database: database || selectedDatabase || dbConfig.database,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch table preview');
      }
      setPreviewData(data);
      setCurrentPage(page);
    } catch (err: any) {
      addToast('error', 'Preview Error', err.message);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // Handle Connect from modal
  const handleConnect = async (newConfig: DbConnectionConfig) => {
    try {
      // 1. Fetch available databases
      const dbRes = await fetch('/api/db/databases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig),
      });
      const dbData = await dbRes.json();
      if (!dbRes.ok) {
        throw new Error(dbData.error || 'Failed to connect to database');
      }

      const dbList: string[] = dbData.databases || [];
      setDatabases(dbList);

      const activeDb =
        newConfig.database && dbList.includes(newConfig.database)
          ? newConfig.database
          : dbList[0] || newConfig.database || 'default';

      setSelectedDatabase(activeDb);
      setConfig(newConfig);
      setIsConnected(true);

      try {
        localStorage.setItem(LAST_CONFIG_KEY, JSON.stringify(newConfig));
      } catch {
        // Ignore
      }

      addToast('success', 'Connected Successfully', `Connected to ${newConfig.type.toUpperCase()}`);

      // 2. Load tables for active database
      await loadTables(newConfig, activeDb);
    } catch (err: any) {
      setIsConnected(false);
      throw err;
    }
  };

  // Handle database change dropdown
  const handleSelectDatabase = async (dbName: string) => {
    if (!config) return;
    setSelectedDatabase(dbName);
    setSelectedForExport([]);
    await loadTables(config, dbName);
  };

  // Handle table selection for preview
  const handleSelectTable = (tableName: string, schema?: string) => {
    if (!config) return;
    setSelectedTable(tableName);
    setSelectedTableSchema(schema);
    setCurrentPage(1);
    loadTablePreview(config, tableName, schema, 1, pageSize, selectedDatabase);
  };

  // Handle pagination changes
  const handlePageChange = (newPage: number) => {
    if (!config || !selectedTable) return;
    loadTablePreview(
      config,
      selectedTable,
      selectedTableSchema,
      newPage,
      pageSize,
      selectedDatabase
    );
  };

  const handlePageSizeChange = (newSize: number) => {
    if (!config || !selectedTable) return;
    setPageSize(newSize);
    loadTablePreview(
      config,
      selectedTable,
      selectedTableSchema,
      1,
      newSize,
      selectedDatabase
    );
  };

  // Multi-table selection for batch export
  const handleToggleExportSelection = (tableName: string) => {
    setSelectedForExport((prev) =>
      prev.includes(tableName) ? prev.filter((t) => t !== tableName) : [...prev, tableName]
    );
  };

  const handleSelectAllForExport = () => {
    setSelectedForExport(tables.map((t) => t.name));
  };

  const handleClearExportSelection = () => {
    setSelectedForExport([]);
  };

  // Download helper from response blob
  const triggerDownload = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  // Export Single Table
  const handleExportSingle = async (
    tableName: string,
    schema?: string,
    format: 'xlsx' | 'csv' = 'xlsx'
  ) => {
    if (!config) return;
    setIsExporting(true);
    addToast('info', 'Exporting...', `Generating ${format.toUpperCase()} for ${tableName}`);

    try {
      const res = await fetch('/api/db/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config,
          format,
          tables: [tableName],
          schema: schema || 'public',
          database: selectedDatabase || config.database,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Failed to export table');
      }

      const blob = await res.blob();
      const ext = format === 'xlsx' ? 'xlsx' : 'csv';
      triggerDownload(blob, `${tableName}_${Date.now()}.${ext}`);

      addToast(
        'success',
        'Export Complete!',
        `${tableName}.${ext} downloaded successfully.`
      );
    } catch (err: any) {
      addToast('error', 'Export Failed', err.message);
    } finally {
      setIsExporting(false);
    }
  };

  // Export Multiple Selected Tables to multi-sheet Excel
  const handleExportSelected = async () => {
    if (!config || selectedForExport.length === 0) return;
    setIsExporting(true);
    addToast(
      'info',
      'Batch Exporting...',
      `Packaging ${selectedForExport.length} tables into multi-sheet Excel`
    );

    try {
      const res = await fetch('/api/db/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config,
          format: 'xlsx',
          tables: selectedForExport,
          database: selectedDatabase || config.database,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Failed to export tables');
      }

      const blob = await res.blob();
      triggerDownload(
        blob,
        `Database_Export_${selectedForExport.length}_Tables_${Date.now()}.xlsx`
      );

      addToast(
        'success',
        'Multi-Sheet Excel Ready!',
        `Successfully exported ${selectedForExport.length} tables into one Excel workbook.`
      );
    } catch (err: any) {
      addToast('error', 'Export Failed', err.message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-rose-500 selection:text-white">
      {/* Splash Screen */}
      {showSplash && (
        <SplashScreen onFinish={() => setShowSplash(false)} />
      )}

      {/* Header */}
      <Header
        config={config}
        isConnected={isConnected}
        onOpenConnectionModal={() => setIsConnectionModalOpen(true)}
        selectedDatabase={selectedDatabase}
        totalTablesCount={tables.length}
        onShowSplash={() => setShowSplash(true)}
      />

      {/* Main Content Area */}
      {isConnected && config ? (
        <main className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <Sidebar
            databases={databases}
            selectedDatabase={selectedDatabase}
            onSelectDatabase={handleSelectDatabase}
            tables={tables}
            selectedTable={selectedTable}
            onSelectTable={handleSelectTable}
            selectedTableSchema={selectedTableSchema}
            selectedForExport={selectedForExport}
            onToggleExportSelection={handleToggleExportSelection}
            onSelectAllForExport={handleSelectAllForExport}
            onClearExportSelection={handleClearExportSelection}
            onExportSelected={handleExportSelected}
            onQuickExportSingle={(t, s) => handleExportSingle(t, s, 'xlsx')}
            isExporting={isExporting}
            isLoadingTables={isLoadingTables}
            onRefreshTables={() => loadTables(config, selectedDatabase)}
          />

          {/* Table Preview & Data Area */}
          <TablePreview
            previewData={previewData}
            isLoading={isLoadingPreview}
            currentPage={currentPage}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onExportExcel={() =>
              selectedTable &&
              handleExportSingle(selectedTable, selectedTableSchema, 'xlsx')
            }
            onExportCsv={() =>
              selectedTable &&
              handleExportSingle(selectedTable, selectedTableSchema, 'csv')
            }
            isExporting={isExporting}
            onRefresh={() =>
              selectedTable &&
              loadTablePreview(
                config,
                selectedTable,
                selectedTableSchema,
                currentPage,
                pageSize,
                selectedDatabase
              )
            }
            schema={selectedTableSchema}
          />
        </main>
      ) : (
        /* Welcome / Disconnected Hero Screen */
        <main className="flex-1 flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
          <div className="max-w-2xl w-full text-center space-y-8 py-10 px-6">
            {/* Devil Woman Avatar & QA Badge */}
            <div className="flex flex-col items-center gap-3">
              <DevilWomanIcon size={100} />
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-red-950/80 to-rose-950/80 border border-red-500/40 text-red-300 text-xs font-bold tracking-wider shadow-[0_0_15px_rgba(244,63,94,0.3)]">
                <Flame className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                <span>For Napuru QA Team</span>
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Inspect Databases & Export Tables <br />
                <span className="bg-gradient-to-r from-rose-400 via-red-300 to-amber-300 bg-clip-text text-transparent">
                  Directly to Formatted Excel Files
                </span>
              </h2>
              <p className="text-slate-400 text-sm max-w-lg mx-auto leading-relaxed">
                Connect securely to any PostgreSQL or MySQL database. Browse all tables, preview
                schema & rows, and export single or multiple tables with auto-styled columns, frozen
                headers, and filters.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => setIsConnectionModalOpen(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-rose-600 via-red-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-bold text-sm shadow-xl shadow-red-950/60 transition-all hover:scale-105"
              >
                <PlugZap className="w-4 h-4" />
                <span>Connect Database</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Feature Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 text-left">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1.5">
                <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs">
                  <Database className="w-4 h-4" />
                  <span>PostgreSQL & MySQL</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-normal">
                  Connect via host credentials or full connection URI with SSL support.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1.5">
                <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Styled Excel (.xlsx)</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-normal">
                  Auto-sized column widths, bold colored headers, auto-filters, and date formatting.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1.5">
                <div className="flex items-center gap-2 text-sky-400 font-semibold text-xs">
                  <Layers className="w-4 h-4" />
                  <span>Multi-Sheet Batch Export</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-normal">
                  Select multiple tables and export all of them into a single workbook in 1 click.
                </p>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* Connection Modal */}
      <ConnectionModal
        isOpen={isConnectionModalOpen}
        onClose={() => setIsConnectionModalOpen(false)}
        onConnect={handleConnect}
        currentConfig={config}
      />

      {/* Toast Alerts */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
