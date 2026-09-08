'use client';

import React, { useEffect, useState } from 'react';
import { ConnectionModal } from '@/components/ConnectionModal';
import { DeveloperSplashScreen } from '@/components/DeveloperSplashScreen';
import { ErDiagramModal } from '@/components/ErDiagramModal';
import { Header } from '@/components/Header';
import { OutPackagesView } from '@/components/OutPackagesView';
import { RoleMenuDashboard } from '@/components/RoleMenuDashboard';
import { RoleSelectScreen } from '@/components/RoleSelectScreen';
import { Sidebar } from '@/components/Sidebar';
import { SplashScreen as QaSplashScreen } from '@/components/SplashScreen';
import { TablePreview } from '@/components/TablePreview';
import { ToastContainer, ToastMessage } from '@/components/Toast';
import { DbConnectionConfig, TableInfo, TablePreviewData, TableRelationship } from '@/lib/db/types';

const LAST_CONFIG_KEY = 'dataflow_last_connection_config';
const ROLE_STORAGE_KEY = 'app_manager_user_role';
const THEME_STORAGE_KEY = 'app_manager_theme';

export default function Home() {
  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Role state: 'qa' | 'developer' | null
  const [userRole, setUserRole] = useState<'qa' | 'developer' | null>(null);

  // View state: 'role-select' | 'splash' | 'menu' | 'db-exporter' | 'out-packages'
  const [activeView, setActiveView] = useState<'role-select' | 'splash' | 'menu' | 'db-exporter' | 'out-packages'>('role-select');

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

  const isLightTheme = theme === 'light';

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

  // Load saved theme, role & connection on mount
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as 'light' | 'dark' | null;
      if (savedTheme) {
        setTheme(savedTheme);
      }

      const savedRole = localStorage.getItem(ROLE_STORAGE_KEY) as 'qa' | 'developer' | null;
      if (savedRole) {
        setUserRole(savedRole);
        setActiveView('menu');
      }

      const savedConfig = localStorage.getItem(LAST_CONFIG_KEY);
      if (savedConfig) {
        const parsed: DbConnectionConfig = JSON.parse(savedConfig);
        setConfig(parsed);
      }
    } catch {
      // Ignore error
    }
  }, []);

  // Update theme in html element class
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleSelectRole = (role: 'qa' | 'developer') => {
    setUserRole(role);
    try {
      localStorage.setItem(ROLE_STORAGE_KEY, role);
    } catch {
      // Ignore
    }
    setActiveView('splash');
  };

  const handleSwitchRole = () => {
    setActiveView('role-select');
  };

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

  // Load tables for database
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

  // Load table preview
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

  // Connect database
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

  const handleClearExportSelection = () => {
    setSelectedForExport([]);
  };

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

      addToast('success', 'Export Complete!', `${tableName}.${ext} downloaded successfully.`);
    } catch (err: any) {
      addToast('error', 'Export Failed', err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportSelected = async () => {
    if (!config || selectedForExport.length === 0) return;
    setIsExporting(true);
    addToast('info', 'Batch Exporting...', `Packaging ${selectedForExport.length} tables into multi-sheet Excel`);

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
      triggerDownload(blob, `Database_Export_${selectedForExport.length}_Tables_${Date.now()}.xlsx`);

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

  // RENDER VIEW LOGIC
  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${
        isLightTheme ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'
      }`}
    >
      {/* 1. ROLE SELECTION SCREEN */}
      {activeView === 'role-select' && (
        <RoleSelectScreen
          onSelectRole={handleSelectRole}
          isLightTheme={isLightTheme}
          onToggleTheme={toggleTheme}
        />
      )}

      {/* 2. SPLASH SCREEN TRANSITIONS */}
      {activeView === 'splash' && userRole === 'qa' && (
        <QaSplashScreen
          onFinish={() => setActiveView('menu')}
          isLightTheme={isLightTheme}
        />
      )}

      {activeView === 'splash' && userRole === 'developer' && (
        <DeveloperSplashScreen
          onFinish={() => setActiveView('menu')}
          isLightTheme={isLightTheme}
        />
      )}

      {/* 3. MENU DASHBOARD */}
      {activeView === 'menu' && userRole && (
        <RoleMenuDashboard
          userRole={userRole}
          onSwitchRole={handleSwitchRole}
          onOpenDbExporter={() => setActiveView('db-exporter')}
          onOpenOutPackages={() => setActiveView('out-packages')}
          isLightTheme={isLightTheme}
          onToggleTheme={toggleTheme}
          config={config}
          isConnected={isConnected}
          onOpenConnectionModal={() => setIsConnectionModalOpen(true)}
        />
      )}

      {/* 4. OUT PACKAGES WORKSPACE */}
      {activeView === 'out-packages' && userRole && (
        <OutPackagesView
          onBackToMenu={() => setActiveView('menu')}
          isLightTheme={isLightTheme}
          userRole={userRole}
        />
      )}

      {/* 5. DB EXPORTER WORKSPACE */}
      {activeView === 'db-exporter' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header
            config={config}
            isConnected={isConnected}
            onOpenConnectionModal={() => setIsConnectionModalOpen(true)}
            selectedDatabase={selectedDatabase}
            totalTablesCount={tables.length}
            onShowSplash={() => setActiveView('splash')}
            userRole={userRole}
            onSwitchRole={handleSwitchRole}
            isLightTheme={isLightTheme}
            onToggleTheme={toggleTheme}
            onGoToMenu={() => setActiveView('menu')}
          />

          <main className="flex-1 flex overflow-hidden">
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
              onRefreshTables={() => config && loadTables(config, selectedDatabase)}
              isLightTheme={isLightTheme}
              onOpenErDiagram={handleOpenErDiagram}
            />

            <TablePreview
              previewData={previewData}
              isLoading={isLoadingPreview}
              currentPage={currentPage}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              onExportExcel={() =>
                selectedTable && handleExportSingle(selectedTable, selectedTableSchema, 'xlsx')
              }
              onExportCsv={() =>
                selectedTable && handleExportSingle(selectedTable, selectedTableSchema, 'csv')
              }
              isExporting={isExporting}
              onRefresh={() =>
                config &&
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
              isLightTheme={isLightTheme}
              onOpenErDiagram={handleOpenErDiagram}
            />
          </main>
        </div>
      )}

      {/* ER Diagram Modal */}
      <ErDiagramModal
        isOpen={isErDiagramOpen}
        onClose={() => setIsErDiagramOpen(false)}
        tables={tables}
        selectedDatabase={selectedDatabase}
        relationships={relationships}
        isLightTheme={isLightTheme}
      />

      {/* Global Connection Modal */}
      <ConnectionModal
        isOpen={isConnectionModalOpen}
        onClose={() => setIsConnectionModalOpen(false)}
        onConnect={handleConnect}
        currentConfig={config}
        isLightTheme={isLightTheme}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
