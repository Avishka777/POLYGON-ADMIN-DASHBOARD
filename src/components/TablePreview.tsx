'use client';

import React, { useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Database,
  Download,
  FileSpreadsheet,
  FileType,
  KeyRound,
  Layers,
  Link,
  Loader2,
  Maximize2,
  RefreshCw,
  Search,
  Sparkles,
} from 'lucide-react';
import { ColumnInfo, TablePreviewData } from '@/lib/db/types';

interface TablePreviewProps {
  previewData: TablePreviewData | null;
  isLoading: boolean;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onExportExcel: () => void;
  onExportCsv: () => void;
  isExporting: boolean;
  onRefresh: () => void;
  schema?: string;
  isLightTheme?: boolean;
  onOpenErDiagram?: () => void;
}

export const TablePreview: React.FC<TablePreviewProps> = ({
  previewData,
  isLoading,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onExportExcel,
  onExportCsv,
  isExporting,
  onRefresh,
  schema,
  isLightTheme = false,
  onOpenErDiagram,
}) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [expandedCell, setExpandedCell] = useState<{
    col: string;
    value: string;
  } | null>(null);

  const filteredRows = useMemo(() => {
    if (!previewData || !previewData.rows) return [];
    if (!filterQuery.trim()) return previewData.rows;

    const q = filterQuery.toLowerCase();
    return previewData.rows.filter((row) =>
      Object.values(row).some((val) => {
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(q);
      })
    );
  }, [previewData, filterQuery]);

  if (!previewData && !isLoading) {
    return (
      <div
        className={`flex-1 flex flex-col items-center justify-center p-8 transition-colors ${
          isLightTheme ? 'bg-slate-50 text-slate-500' : 'bg-slate-950 text-slate-500'
        }`}
      >
        <div
          className={`w-16 h-16 rounded-2xl border flex items-center justify-center mb-4 ${
            isLightTheme ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800'
          }`}
        >
          <Database className="w-8 h-8 text-emerald-500" />
        </div>
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-300">
          No Table Selected
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm text-center">
          Select any table from the sidebar to inspect its schema and preview data, or export directly to Excel.
        </p>
      </div>
    );
  }

  const totalPages = previewData
    ? Math.max(1, Math.ceil(previewData.totalRows / pageSize))
    : 1;

  const renderCellContent = (val: any) => {
    if (val === null || val === undefined) {
      return <span className="text-slate-400 dark:text-slate-600 italic font-mono text-[11px]">NULL</span>;
    }
    if (typeof val === 'boolean') {
      return (
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-semibold font-mono ${
            val
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
          }`}
        >
          {val ? 'TRUE' : 'FALSE'}
        </span>
      );
    }
    if (val instanceof Date || (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(val))) {
      const dateStr = val instanceof Date ? val.toISOString() : val;
      return <span className="text-sky-600 dark:text-sky-300 font-mono text-xs">{dateStr}</span>;
    }
    if (typeof val === 'object') {
      const jsonStr = JSON.stringify(val);
      return (
        <div
          onClick={(e) => {
            e.stopPropagation();
            setExpandedCell({ col: 'JSON View', value: JSON.stringify(val, null, 2) });
          }}
          className={`max-w-[240px] truncate font-mono text-[11px] cursor-pointer px-2 py-0.5 rounded border transition-colors ${
            isLightTheme
              ? 'bg-slate-100 border-slate-200 text-slate-700 hover:border-sky-500'
              : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-sky-500'
          }`}
          title="Click to view full formatted JSON"
        >
          {jsonStr}
        </div>
      );
    }
    return (
      <span className="text-slate-800 dark:text-slate-200 text-xs font-mono">
        {String(val)}
      </span>
    );
  };

  return (
    <div
      className={`flex-1 flex flex-col h-[calc(100vh-61px)] overflow-hidden transition-colors ${
        isLightTheme ? 'bg-slate-50' : 'bg-slate-950'
      }`}
    >
      {/* Top Action Bar */}
      <div
        className={`p-4 border-b flex flex-wrap items-center justify-between gap-3 backdrop-blur-sm ${
          isLightTheme ? 'bg-white/90 border-slate-200' : 'bg-slate-950/60 border-slate-800'
        }`}
      >
        {/* Left Table Info */}
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-xl border text-emerald-500 ${
              isLightTheme ? 'bg-slate-100 border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold font-mono text-slate-900 dark:text-slate-100">
                {previewData?.tableName || 'Loading table...'}
              </h2>
              {schema && (
                <span
                  className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded border ${
                    isLightTheme
                      ? 'bg-slate-100 text-slate-600 border-slate-200'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {schema}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
              <span>
                Total Rows:{' '}
                <strong className="text-slate-900 dark:text-slate-200">
                  {previewData?.totalRows.toLocaleString() || '0'}
                </strong>
              </span>
              <span>•</span>
              <span>
                Columns:{' '}
                <strong className="text-slate-900 dark:text-slate-200">
                  {previewData?.columns.length || '0'}
                </strong>
              </span>
            </div>
          </div>
        </div>

        {/* Right Actions: Filter & Export Buttons */}
        <div className="flex items-center gap-2.5">
          {/* Quick Filter */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Search in view..."
              className={`pl-8 pr-3 py-2 text-xs rounded-xl border focus:border-emerald-500 focus:outline-none w-44 ${
                isLightTheme
                  ? 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                  : 'bg-slate-900 border-slate-800 text-slate-200 placeholder-slate-500'
              }`}
            />
          </div>

          <button
            onClick={onRefresh}
            disabled={isLoading}
            title="Refresh preview data"
            className={`p-2 rounded-xl border transition-colors disabled:opacity-50 ${
              isLightTheme
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-500' : ''}`} />
          </button>

          {onOpenErDiagram && (
            <button
              onClick={onOpenErDiagram}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border transition-all ${
                isLightTheme
                  ? 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200'
                  : 'bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 border-purple-800'
              }`}
              title="View ER Diagram & Schema Relationships"
            >
              <Layers className="w-4 h-4 text-purple-500" />
              <span>ER Diagram</span>
            </button>
          )}

          <button
            onClick={onExportCsv}
            disabled={isExporting || !previewData}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border transition-all disabled:opacity-50 ${
              isLightTheme
                ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
            }`}
          >
            <FileType className="w-4 h-4 text-sky-500" />
            <span>CSV</span>
          </button>

          <button
            onClick={onExportExcel}
            disabled={isExporting || !previewData}
            className="flex items-center gap-2 px-4 py-2 text-xs font-extrabold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-all disabled:opacity-50 cursor-pointer"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4" />
            )}
            <span>Export Table (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="flex-1 overflow-auto relative">
        {isLoading ? (
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs flex flex-col items-center justify-center text-xs font-mono text-emerald-500 z-20 gap-2">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Fetching table rows & data preview...</span>
          </div>
        ) : null}

        {previewData && previewData.columns.length > 0 ? (
          <table className="w-full text-left border-collapse">
            <thead
              className={`sticky top-0 z-10 text-[11px] font-mono font-bold uppercase tracking-wider border-b ${
                isLightTheme
                  ? 'bg-slate-100 border-slate-200 text-slate-700'
                  : 'bg-slate-900 border-slate-800 text-slate-300'
              }`}
            >
              <tr>
                <th className="py-3 px-4 w-12 text-center border-r border-slate-200 dark:border-slate-800/80">
                  #
                </th>
                {previewData.columns.map((col) => (
                  <th
                    key={col.name}
                    className="py-3 px-4 border-r border-slate-200 dark:border-slate-800/80 whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1.5">
                      {col.isPrimaryKey && (
                        <span title="Primary Key">
                          <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                        </span>
                      )}
                      {col.isForeignKey && col.foreignKeyInfo && (
                        <span
                          title={`Foreign Key -> ${col.foreignKeyInfo.foreignTable}.${col.foreignKeyInfo.foreignColumn}`}
                          className="flex items-center gap-1 text-[9px] font-mono text-purple-600 dark:text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/30"
                        >
                          <Link className="w-3 h-3 text-purple-500" />
                          <span>FK ➔ {col.foreignKeyInfo.foreignTable}</span>
                        </span>
                      )}
                      <span>{col.name}</span>
                      <span className="text-[9px] font-normal text-slate-400 lowercase border px-1 rounded bg-slate-200/50 dark:bg-slate-800 border-slate-300 dark:border-slate-700">
                        {col.type}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-mono text-xs">
              {filteredRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={previewData.columns.length + 1}
                    className="py-12 text-center text-slate-400 italic"
                  >
                    No matching rows found in this page view.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, idx) => {
                  const rowNum = (currentPage - 1) * pageSize + idx + 1;
                  return (
                    <tr
                      key={idx}
                      className={`transition-colors ${
                        isLightTheme
                          ? 'hover:bg-slate-100/70 even:bg-slate-50/50'
                          : 'hover:bg-slate-900/60 even:bg-slate-900/20'
                      }`}
                    >
                      <td className="py-2.5 px-4 text-center text-slate-400 text-[11px] border-r border-slate-200 dark:border-slate-800/60">
                        {rowNum}
                      </td>
                      {previewData.columns.map((col) => (
                        <td
                          key={col.name}
                          className="py-2.5 px-4 border-r border-slate-200 dark:border-slate-800/60 whitespace-nowrap max-w-xs truncate"
                        >
                          {renderCellContent(row[col.name])}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400 text-xs">
            <span>This table is currently empty (0 rows).</span>
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      {previewData && (
        <div
          className={`p-3 border-t flex flex-wrap items-center justify-between gap-3 text-xs font-mono select-none ${
            isLightTheme
              ? 'bg-white border-slate-200 text-slate-700'
              : 'bg-slate-950 border-slate-800 text-slate-400'
          }`}
        >
          {/* Left: Page Size Selector */}
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className={`px-2 py-1 rounded-lg border text-xs focus:outline-none cursor-pointer ${
                isLightTheme
                  ? 'bg-slate-100 border-slate-200 text-slate-800'
                  : 'bg-slate-900 border-slate-800 text-slate-200'
              }`}
            >
              {[10, 25, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span className="text-slate-400 ml-2">
              Showing {(currentPage - 1) * pageSize + 1} -{' '}
              {Math.min(currentPage * pageSize, previewData.totalRows)} of{' '}
              {previewData.totalRows.toLocaleString()}
            </span>
          </div>

          {/* Right: Page Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1 || isLoading}
              className={`p-1.5 rounded-lg border transition-colors disabled:opacity-40 ${
                isLightTheme
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-200'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-800'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-bold text-slate-900 dark:text-slate-200">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages || isLoading}
              className={`p-1.5 rounded-lg border transition-colors disabled:opacity-40 ${
                isLightTheme
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-200'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-800'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Formatted JSON Modal */}
      {expandedCell && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className={`max-w-xl w-full p-6 rounded-3xl border shadow-2xl space-y-4 ${
              isLightTheme ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold font-mono text-emerald-500">
                {expandedCell.col}
              </h3>
              <button
                onClick={() => setExpandedCell(null)}
                className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Close
              </button>
            </div>
            <pre
              className={`p-4 rounded-xl border overflow-x-auto text-xs font-mono max-h-96 ${
                isLightTheme ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-950 border-slate-800 text-slate-200'
              }`}
            >
              {expandedCell.value}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
