'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Activity,
  ArrowLeft,
  Database,
  Lock,
  Moon,
  RefreshCw,
  ShieldCheck,
  Sun,
} from 'lucide-react';
import { ConnectionModal } from '@/components/db-exporter/ConnectionModal';
import { ErDiagramModal } from '@/components/db-exporter/ErDiagramModal';
import { Sidebar } from '@/components/db-exporter/Sidebar';
import { TablePreview } from '@/components/db-exporter/TablePreview';
import { ToastContainer, ToastMessage } from '@/components/common/Toast';
import { DevilWomanIcon } from '@/components/common/icons/DevilWomanIcon';
import { KingDeveloperIcon } from '@/components/common/icons/KingDeveloperIcon';
import { DbConnectionConfig, TableInfo, TablePreviewData, TableRelationship } from '@/lib/db/types';
import { useTheme } from '@/context/ThemeContext';
import { clearDeveloperAccess } from '@/lib/developer/security';

const LAST_CONFIG_KEY = 'dataflow_last_connection_config';

interface DbExporterWorkspaceProps {
  role: 'developer' | 'qa';
  backUrl: string;
}

export const DbExporterWorkspace: React.FC<DbExporterWorkspaceProps> = ({ role, backUrl }) => {
  const router = useRouter();
  const { isLightTheme, toggleTheme } = useTheme();
  const isQa = role === 'qa';

  // DB Connection & Exporter state
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

  // ER Diagram & Relationship state
  const [isErDiagramOpen, setIsErDiagramOpen] = useState(false);
  const [relationships, setRelationships] = useState<TableRelationship[]>([]);

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

  const loadRelationships = async (dbConfig: DbConnectionConfig, targetDb?: string) => {
    try {
      const res = await fetch('/api/db/relationships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: dbConfig,
          database: targetDb || selectedDatabase || dbConfig.database,
        }),
      });
      const data = await res.json();
      if (res.ok && data.relationships) {
        setRelationships(data.relationships);
      }
    } catch {
      // Ignore
    }
  };

  const handleOpenErDiagram = async () => {
    if (config) {
      await loadRelationships(config, selectedDatabase);
    }
    setIsErDiagramOpen(true);
  };

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

  const handleConnect = async (newConfig: DbConnectionConfig) => {
    try {
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
      await loadTables(newConfig, activeDb);
    } catch (err: any) {
      setIsConnected(false);
      throw err;
    }
  };

  const handleSelectDatabase = async (dbName: string) => {
    if (!config) return;
    setSelectedDatabase(dbName);
    setSelectedForExport([]);
    await loadTables(config, dbName);
  };

  const handleSelectTable = (tableName: string, schema?: string) => {
    if (!config) return;
    setSelectedTable(tableName);
    setSelectedTableSchema(schema);
    setCurrentPage(1);
    loadTablePreview(config, tableName, schema, 1, pageSize, selectedDatabase);
  };

  const handlePageChange = (newPage: number) => {
    if (!config || !selectedTable) return;
    loadTablePreview(config, selectedTable, selectedTableSchema, newPage, pageSize, selectedDatabase);
  };

  const handlePageSizeChange = (newSize: number) => {
    if (!config || !selectedTable) return;
    setPageSize(newSize);
    loadTablePreview(config, selectedTable, selectedTableSchema, 1, newSize, selectedDatabase);
  };

  const handleToggleExportSelection = (tableName: string) => {
    setSelectedForExport((prev) =>
      prev.includes(tableName) ? prev.filter((t) => t !== tableName) : [...prev, tableName]
    );
  };

  const handleSelectAllForExport = () => {
    setSelectedForExport(tables.map((t) => t.name));
  };

  const handleDeselectAllForExport = () => {
    setSelectedForExport([]);
  };

  const handleExport = async (format: 'xlsx' | 'csv', options: any) => {
    if (!config) return;
    setIsExporting(true);
    try {
      const res = await fetch('/api/db/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config,
          database: selectedDatabase,
          tables: options.tables || [selectedTable],
          format,
          options,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Export failed');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedDatabase || 'export'}_${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      addToast('success', 'Export Complete', `Successfully exported to ${format.toUpperCase()}`);
    } catch (err: any) {
      addToast('error', 'Export Error', err.message);
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    const savedConfig = localStorage.getItem(LAST_CONFIG_KEY);
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setConfig(parsed);
        handleConnect(parsed).catch(() => {
          setIsConnectionModalOpen(true);
        });
      } catch {
        setIsConnectionModalOpen(true);
      }
    } else {
      setIsConnectionModalOpen(true);
    }
  }, []);

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
              <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full border bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30 hidden sm:inline-flex items-center gap-1">
                <Database className="w-3 h-3" />
                DB Exporter
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Live database inspector & multi-sheet Excel exporter
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

          {/* Back to Hub */}
          <Link
            href={backUrl}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all glass-card hover:bg-slate-200 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="w-4 h-4 text-purple-500" />
            <span>Hub Menu</span>
          </Link>

          {/* Connect / Change DB */}
          <button
            onClick={() => setIsConnectionModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <Database className="w-3.5 h-3.5" />
            <span>{isConnected ? 'Change DB' : 'Connect DB'}</span>
          </button>

          {/* ER Diagram */}
          {isConnected && (
            <button
              onClick={handleOpenErDiagram}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all glass-card hover:bg-slate-200 dark:hover:bg-slate-800"
              title="View Entity Relationship Diagram"
            >
              <Activity className="w-3.5 h-3.5 text-indigo-500" />
              <span>ER Diagram</span>
            </button>
          )}

          {/* Switch Role */}
          <Link
            href="/select-role"
            className="p-2 rounded-xl glass-card text-xs font-bold transition-all"
            title="Switch User Role"
          >
            <RefreshCw className="w-4 h-4 text-indigo-500" />
          </Link>

          {/* Theme Toggle */}
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

      {/* Main DB Exporter Workspace Content */}
      <div className="flex-1 flex overflow-hidden">
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
          onClearExportSelection={handleDeselectAllForExport}
          onExportSelected={() => handleExport('xlsx', { tables: selectedForExport })}
          onQuickExportSingle={(tableName) => handleExport('xlsx', { tables: [tableName] })}
          isExporting={isExporting}
          isLoadingTables={isLoadingTables}
          onRefreshTables={() => config && loadTables(config, selectedDatabase)}
          isLightTheme={isLightTheme}
          onOpenErDiagram={handleOpenErDiagram}
          onOpenConnectionModal={() => setIsConnectionModalOpen(true)}
        />

        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <TablePreview
            previewData={previewData}
            isLoading={isLoadingPreview}
            currentPage={currentPage}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onExportExcel={() => {
              if (selectedTable) {
                handleExport('xlsx', {
                  tables: [selectedTable],
                  includeMetadata: true,
                  includeSummary: true,
                  formatHeader: true,
                  autoFilter: true,
                });
              }
            }}
            onExportCsv={() => {
              if (selectedTable) {
                handleExport('csv', {
                  tables: [selectedTable],
                });
              }
            }}
            isExporting={isExporting}
            onRefresh={() => {
              if (config && selectedTable) {
                loadTablePreview(
                  config,
                  selectedTable,
                  selectedTableSchema,
                  currentPage,
                  pageSize,
                  selectedDatabase
                );
              }
            }}
            schema={selectedTableSchema}
            isLightTheme={isLightTheme}
            onOpenErDiagram={handleOpenErDiagram}
          />
        </main>
      </div>

      {/* Connection Modal */}
      <ConnectionModal
        isOpen={isConnectionModalOpen}
        onClose={() => setIsConnectionModalOpen(false)}
        onConnect={handleConnect}
        currentConfig={config}
        isLightTheme={isLightTheme}
      />

      {/* ER Diagram Modal */}
      {isErDiagramOpen && (
        <ErDiagramModal
          isOpen={isErDiagramOpen}
          onClose={() => setIsErDiagramOpen(false)}
          tables={tables}
          relationships={relationships}
          selectedDatabase={selectedDatabase || config?.database || ''}
          isLightTheme={isLightTheme}
        />
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
};
