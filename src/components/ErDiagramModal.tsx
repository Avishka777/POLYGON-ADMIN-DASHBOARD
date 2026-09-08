'use client';

import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  ChevronRight,
  Database,
  Download,
  KeyRound,
  Layers,
  Link as LinkIcon,
  Maximize2,
  Minimize2,
  RefreshCw,
  Search,
  Sparkles,
  Table as TableIcon,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { ColumnInfo, TableInfo, TableRelationship } from '@/lib/db/types';

interface ErDiagramModalProps {
  isOpen: boolean;
  onClose: () => void;
  tables: TableInfo[];
  selectedDatabase: string;
  relationships: TableRelationship[];
  isLightTheme?: boolean;
}

export const ErDiagramModal: React.FC<ErDiagramModalProps> = ({
  isOpen,
  onClose,
  tables,
  selectedDatabase,
  relationships,
  isLightTheme = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTableFilter, setSelectedTableFilter] = useState<string>('all');
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Filter relationships
  const filteredRelationships = useMemo(() => {
    if (selectedTableFilter === 'all') return relationships;
    return relationships.filter(
      (r) => r.sourceTable === selectedTableFilter || r.targetTable === selectedTableFilter
    );
  }, [relationships, selectedTableFilter]);

  // Filtered list of tables to show in diagram
  const displayedTables = useMemo(() => {
    let list = tables;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((t) => t.name.toLowerCase().includes(q));
    }
    if (selectedTableFilter !== 'all') {
      const relatedTables = new Set<string>([selectedTableFilter]);
      relationships.forEach((r) => {
        if (r.sourceTable === selectedTableFilter) relatedTables.add(r.targetTable);
        if (r.targetTable === selectedTableFilter) relatedTables.add(r.sourceTable);
      });
      list = list.filter((t) => relatedTables.has(t.name));
    }
    return list;
  }, [tables, searchQuery, selectedTableFilter, relationships]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 select-none">
      <div
        className={`w-full max-w-6xl h-[90vh] rounded-3xl border flex flex-col overflow-hidden shadow-2xl transition-colors ${
          isLightTheme ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-slate-100'
        }`}
      >
        {/* Header */}
        <div
          className={`px-6 py-4 border-b flex flex-wrap items-center justify-between gap-4 ${
            isLightTheme ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/90 border-slate-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-500">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Database ER Diagram & Relationships
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                  {selectedDatabase}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Inspect entity-relationship links, primary keys & foreign keys
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Zoom Controls */}
            <div
              className={`flex items-center gap-1 p-1 rounded-xl border text-xs ${
                isLightTheme ? 'bg-white border-slate-200' : 'bg-slate-950 border-slate-800'
              }`}
            >
              <button
                onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.1))}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 font-mono font-bold text-xs">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(1.5, z + 0.1))}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoomLevel(1)}
                className="px-2 py-1 text-[10px] font-mono hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500"
              >
                Reset
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div
          className={`px-6 py-3 border-b flex flex-wrap items-center justify-between gap-4 text-xs ${
            isLightTheme ? 'bg-slate-100/50 border-slate-200' : 'bg-slate-900/40 border-slate-800'
          }`}
        >
          {/* Table Filter Dropdown */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-500">Filter Table:</span>
            <select
              value={selectedTableFilter}
              onChange={(e) => setSelectedTableFilter(e.target.value)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold cursor-pointer ${
                isLightTheme
                  ? 'bg-white border-slate-200 text-slate-800'
                  : 'bg-slate-950 border-slate-800 text-slate-200'
              }`}
            >
              <option value="all">All Tables ({tables.length})</option>
              {tables.map((t) => (
                <option key={t.name} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search Bar */}
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search table in diagram..."
              className={`w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border focus:outline-none focus:border-purple-500 ${
                isLightTheme
                  ? 'bg-white border-slate-200 text-slate-800'
                  : 'bg-slate-950 border-slate-800 text-slate-200'
              }`}
            />
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3 font-mono text-[11px] text-slate-500">
            <span>
              Relationships:{' '}
              <strong className="text-purple-600 dark:text-purple-400 font-extrabold">
                {filteredRelationships.length}
              </strong>
            </span>
            <span>•</span>
            <span>
              Visible Tables:{' '}
              <strong className="text-slate-800 dark:text-slate-200 font-extrabold">
                {displayedTables.length}
              </strong>
            </span>
          </div>
        </div>

        {/* Diagram Canvas Body */}
        <div className="flex-1 overflow-auto p-8 relative">
          <div
            className="transition-transform duration-200 origin-top-left space-y-8"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            {/* Relationships Summary Card List if available */}
            {filteredRelationships.length > 0 && (
              <div
                className={`p-4 rounded-2xl border mb-6 space-y-2 ${
                  isLightTheme ? 'bg-purple-50/60 border-purple-100' : 'bg-purple-950/20 border-purple-900/30'
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-bold text-purple-600 dark:text-purple-400">
                  <LinkIcon className="w-4 h-4" />
                  <span>Detected Foreign Key Relationships</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 font-mono text-xs">
                  {filteredRelationships.map((rel, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-xl border flex items-center justify-between ${
                        isLightTheme ? 'bg-white border-purple-200/60' : 'bg-slate-900 border-purple-900/40'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-bold text-slate-900 dark:text-slate-100">{rel.sourceTable}</span>
                        <span className="text-purple-500 font-semibold">({rel.sourceColumn})</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-purple-400 shrink-0 mx-1" />
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{rel.targetTable}</span>
                        <span className="text-emerald-500 font-semibold">({rel.targetColumn})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tables Grid Schema Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedTables.map((table) => {
                // Find FKs for this table
                const tableFks = relationships.filter((r) => r.sourceTable === table.name);
                const tableReferenced = relationships.filter((r) => r.targetTable === table.name);

                return (
                  <div
                    key={table.name}
                    className={`rounded-2xl border shadow-md flex flex-col justify-between overflow-hidden transition-all ${
                      isLightTheme
                        ? 'bg-white border-slate-200 hover:border-purple-300'
                        : 'bg-slate-900 border-slate-800 hover:border-purple-500/50'
                    }`}
                  >
                    {/* Card Header */}
                    <div
                      className={`p-3.5 border-b flex items-center justify-between ${
                        isLightTheme
                          ? 'bg-slate-100/80 border-slate-200'
                          : 'bg-slate-950 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <TableIcon className="w-4 h-4 text-purple-500" />
                        <h4 className="font-mono font-extrabold text-sm text-slate-900 dark:text-white truncate">
                          {table.name}
                        </h4>
                      </div>
                      {table.rowCount !== undefined && (
                        <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {table.rowCount.toLocaleString()} rows
                        </span>
                      )}
                    </div>

                    {/* Table Relationships List */}
                    <div className="p-4 space-y-2 text-xs">
                      {tableFks.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-500 block">
                            Foreign Keys Outgoing ({tableFks.length})
                          </span>
                          {tableFks.map((fk, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between font-mono text-[11px] bg-purple-500/10 px-2 py-1 rounded border border-purple-500/20 text-purple-700 dark:text-purple-300"
                            >
                              <span className="font-bold">{fk.sourceColumn}</span>
                              <span className="text-slate-400">➔</span>
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                {fk.targetTable}.{fk.targetColumn}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {tableReferenced.length > 0 && (
                        <div className="space-y-1 pt-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 block">
                            Referenced By ({tableReferenced.length})
                          </span>
                          {tableReferenced.map((ref, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between font-mono text-[11px] bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                            >
                              <span className="font-bold">{ref.sourceTable}.{ref.sourceColumn}</span>
                              <span className="text-slate-400">➔</span>
                              <span className="font-bold">{ref.targetColumn}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {tableFks.length === 0 && tableReferenced.length === 0 && (
                        <p className="text-slate-400 text-xs italic">
                          No foreign key constraints defined on this table.
                        </p>
                      )}
                    </div>

                    <div
                      className={`px-4 py-2 border-t text-[11px] font-mono text-slate-400 flex items-center justify-between ${
                        isLightTheme ? 'bg-slate-50 border-slate-100' : 'bg-slate-950/40 border-slate-800'
                      }`}
                    >
                      <span>Schema: public</span>
                      <span className="text-purple-500 font-bold">SQL Ready</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {displayedTables.length === 0 && (
              <div className="text-center py-16 text-slate-400 space-y-2">
                <TableIcon className="w-10 h-10 mx-auto text-slate-400" />
                <h3 className="text-base font-bold">No matching tables found</h3>
                <p className="text-xs">Adjust your search or filter selection above.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
