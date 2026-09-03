'use client';

import React, { useMemo, useState } from 'react';
import {
  CheckSquare,
  ChevronDown,
  Database,
  Download,
  FileSpreadsheet,
  Layers,
  Loader2,
  RefreshCw,
  Search,
  Square,
  Table as TableIcon,
} from 'lucide-react';
import { TableInfo } from '@/lib/db/types';

interface SidebarProps {
  databases: string[];
  selectedDatabase: string;
  onSelectDatabase: (db: string) => void;
  tables: TableInfo[];
  selectedTable: string | null;
  onSelectTable: (tableName: string, schema?: string) => void;
  selectedTableSchema?: string;
  selectedForExport: string[];
  onToggleExportSelection: (tableName: string) => void;
  onSelectAllForExport: () => void;
  onClearExportSelection: () => void;
  onExportSelected: () => void;
  onQuickExportSingle: (tableName: string, schema?: string) => void;
  isExporting: boolean;
  isLoadingTables: boolean;
  onRefreshTables: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  databases,
  selectedDatabase,
  onSelectDatabase,
  tables,
  selectedTable,
  onSelectTable,
  selectedTableSchema,
  selectedForExport,
  onToggleExportSelection,
  onSelectAllForExport,
  onClearExportSelection,
  onExportSelected,
  onQuickExportSingle,
  isExporting,
  isLoadingTables,
  onRefreshTables,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTables = useMemo(() => {
    if (!searchTerm.trim()) return tables;
    const q = searchTerm.toLowerCase();
    return tables.filter(
      (t) =>
        t.name.toLowerCase().includes(q) || (t.schema && t.schema.toLowerCase().includes(q))
    );
  }, [tables, searchTerm]);

  const allSelected =
    filteredTables.length > 0 &&
    filteredTables.every((t) => selectedForExport.includes(t.name));

  return (
    <aside className="w-80 border-r border-slate-800 bg-slate-950 flex flex-col h-[calc(100vh-61px)] shrink-0 select-none">
      {/* Database Selector Section */}
      <div className="p-4 border-b border-slate-800 space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            Active Database
          </span>
          <button
            onClick={onRefreshTables}
            disabled={isLoadingTables}
            title="Refresh tables"
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isLoadingTables ? 'animate-spin text-emerald-400' : ''}`}
            />
          </button>
        </div>

        {databases.length > 0 ? (
          <div className="relative">
            <select
              value={selectedDatabase}
              onChange={(e) => onSelectDatabase(e.target.value)}
              className="w-full appearance-none px-3 py-2 text-xs font-mono font-medium rounded-xl bg-slate-900 border border-slate-800 focus:border-emerald-500 focus:outline-none text-slate-200 pr-8 cursor-pointer"
            >
              {databases.map((db) => (
                <option key={db} value={db}>
                  {db}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        ) : (
          <div className="px-3 py-2 text-xs font-mono rounded-xl bg-slate-900 border border-slate-800 text-slate-400">
            {selectedDatabase || 'Default Database'}
          </div>
        )}
      </div>

      {/* Table Search & Batch Selection Bar */}
      <div className="p-3 border-b border-slate-800 space-y-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter tables..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-800 focus:border-emerald-500 focus:outline-none text-slate-200 placeholder-slate-500"
          />
        </div>

        {tables.length > 0 && (
          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-1">
            <button
              onClick={allSelected ? onClearExportSelection : onSelectAllForExport}
              className="flex items-center gap-1.5 hover:text-slate-200 transition-colors"
            >
              {allSelected ? (
                <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Square className="w-3.5 h-3.5 text-slate-500" />
              )}
              <span>{allSelected ? 'Deselect All' : 'Select All'}</span>
            </button>
            <span>
              {filteredTables.length} {filteredTables.length === 1 ? 'table' : 'tables'}
            </span>
          </div>
        )}
      </div>

      {/* Table List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {isLoadingTables ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-500 text-xs gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
            <span>Scanning tables & metadata...</span>
          </div>
        ) : filteredTables.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-500 text-xs text-center px-4">
            <TableIcon className="w-8 h-8 text-slate-700 mb-2" />
            <span>No tables found in this database schema</span>
          </div>
        ) : (
          filteredTables.map((table) => {
            const isSelected =
              selectedTable === table.name &&
              (!table.schema || selectedTableSchema === table.schema);
            const isChecked = selectedForExport.includes(table.name);

            return (
              <div
                key={`${table.schema || ''}_${table.name}`}
                onClick={() => onSelectTable(table.name, table.schema)}
                className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-all border ${
                  isSelected
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 font-medium'
                    : 'bg-slate-900/40 hover:bg-slate-900 border-transparent hover:border-slate-800 text-slate-300'
                }`}
              >
                {/* Left check & Table Name */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleExportSelection(table.name);
                    }}
                    className="shrink-0 p-0.5 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-600 group-hover:text-slate-400" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="truncate font-mono">{table.name}</span>
                    </div>
                    {table.schema && table.schema !== 'public' && (
                      <span className="text-[10px] text-slate-500 font-mono">
                        {table.schema}.
                      </span>
                    )}
                  </div>
                </div>

                {/* Right badges & Quick Export */}
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  {table.rowCount !== undefined && (
                    <span className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-slate-800/80 text-slate-400 group-hover:text-slate-300 border border-slate-700/50">
                      {table.rowCount.toLocaleString()} r
                    </span>
                  )}
                  <button
                    type="button"
                    title="Export table to Excel (.xlsx)"
                    onClick={(e) => {
                      e.stopPropagation();
                      onQuickExportSingle(table.name, table.schema);
                    }}
                    className="p-1 rounded-lg hover:bg-emerald-500/20 text-slate-500 hover:text-emerald-400 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Bulk Export Action Bar (when tables are selected) */}
      {selectedForExport.length > 0 && (
        <div className="p-3 border-t border-slate-800 bg-slate-900/90 backdrop-blur space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium text-emerald-400">
              {selectedForExport.length} {selectedForExport.length === 1 ? 'table' : 'tables'}{' '}
              selected
            </span>
            <button
              onClick={onClearExportSelection}
              className="text-[11px] text-slate-500 hover:text-slate-300"
            >
              Clear
            </button>
          </div>
          <button
            onClick={onExportSelected}
            disabled={isExporting}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-950/60 transition-all disabled:opacity-50"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4" />
            )}
            <span>
              Export {selectedForExport.length} to Multi-Sheet Excel
            </span>
          </button>
        </div>
      )}
    </aside>
  );
};
