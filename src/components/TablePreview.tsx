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
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-500">
        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4">
          <Database className="w-8 h-8 text-slate-600" />
        </div>
        <h3 className="text-base font-semibold text-slate-300">No Table Selected</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm text-center">
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
      return <span className="text-slate-600 italic font-mono text-[11px]">NULL</span>;
    }
    if (typeof val === 'boolean') {
      return (
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-semibold font-mono ${
            val
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
          }`}
        >
          {val ? 'TRUE' : 'FALSE'}
        </span>
      );
    }
    if (val instanceof Date || (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(val))) {
      const dateStr = val instanceof Date ? val.toISOString() : val;
      return <span className="text-sky-300/90 font-mono text-xs">{dateStr}</span>;
    }
    if (typeof val === 'object') {
      const jsonStr = JSON.stringify(val);
      return (
        <div
          onClick={(e) => {
            e.stopPropagation();
            setExpandedCell({ col: 'JSON View', value: JSON.stringify(val, null, 2) });
          }}
          className="max-w-[240px] truncate text-slate-400 hover:text-sky-300 font-mono text-[11px] cursor-pointer bg-slate-900/60 px-2 py-0.5 rounded border border-slate-800 hover:border-sky-500/40 transition-colors"
          title="Click to view full formatted JSON"
        >
          {jsonStr}
        </div>
      );
    }
    return <span className="text-slate-200 text-xs font-mono">{String(val)}</span>;
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-61px)] overflow-hidden bg-slate-950">
      {/* Top Action Bar */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/60 backdrop-blur-sm flex flex-wrap items-center justify-between gap-3">
        {/* Left Table Info */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-100 font-mono">
                {previewData?.tableName || 'Loading table...'}
              </h2>
              {schema && (
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  {schema}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5 font-mono">
              <span>
                Total Rows:{' '}
                <strong className="text-slate-200">
                  {previewData?.totalRows.toLocaleString() || '0'}
                </strong>
              </span>
              <span>•</span>
              <span>
                Columns:{' '}
                <strong className="text-slate-200">
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
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Search in view..."
              className="pl-8 pr-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 focus:border-emerald-500 focus:outline-none text-slate-200 w-44 placeholder-slate-500"
            />
          </div>

          <button
            onClick={onRefresh}
            disabled={isLoading}
            title="Refresh preview data"
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>

          {/* Export to CSV */}
          <button
            onClick={onExportCsv}
            disabled={isExporting || isLoading || !previewData}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all disabled:opacity-50"
          >
            <FileType className="w-4 h-4 text-sky-400" />
            <span>Export CSV</span>
          </button>

          {/* Export to Excel (.xlsx) */}
          <button
            onClick={onExportExcel}
            disabled={isExporting || isLoading || !previewData}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/60 transition-all disabled:opacity-50"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4" />
            )}
            <span>Export to Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Main Table Viewer */}
      <div className="flex-1 overflow-auto relative">
        {isLoading ? (
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm z-20 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
            <Loader2 className="w-7 h-7 animate-spin text-emerald-400" />
            <span>Loading table records...</span>
          </div>
        ) : null}

        {previewData && previewData.columns.length > 0 ? (
          <div className="min-w-full inline-block align-middle">
            <table className="min-w-full divide-y divide-slate-800 text-left border-collapse">
              <thead className="bg-slate-900/90 backdrop-blur sticky top-0 z-10">
                <tr>
                  <th className="py-2.5 px-3 text-[11px] font-semibold text-slate-500 font-mono border-b border-slate-800 w-12 text-center">
                    #
                  </th>
                  {previewData.columns.map((col) => (
                    <th
                      key={col.name}
                      className="py-2.5 px-4 text-xs font-semibold text-slate-300 border-b border-slate-800 font-mono whitespace-nowrap"
                    >
                      <div className="flex items-center gap-1.5">
                        {col.isPrimaryKey && (
                          <span title="Primary Key">
                            <KeyRound className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          </span>
                        )}
                        <span className="text-slate-200 font-bold">{col.name}</span>
                        <span className="text-[10px] text-slate-500 font-normal px-1 py-0.2 rounded bg-slate-800/80 border border-slate-700/40">
                          {col.type}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={previewData.columns.length + 1}
                      className="text-center py-12 text-xs text-slate-500"
                    >
                      No records match the current filter.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row, rIdx) => {
                    const rowNumber = (currentPage - 1) * pageSize + rIdx + 1;
                    return (
                      <tr
                        key={rIdx}
                        className="hover:bg-slate-900/50 transition-colors group"
                      >
                        <td className="py-2 px-3 text-[10px] text-slate-600 font-mono text-center select-none group-hover:text-slate-400">
                          {rowNumber}
                        </td>
                        {previewData.columns.map((col) => (
                          <td
                            key={col.name}
                            className="py-2 px-4 whitespace-nowrap align-middle"
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
          </div>
        ) : null}
      </div>

      {/* Pagination Footer */}
      {previewData && previewData.totalRows > 0 && (
        <div className="p-3 border-t border-slate-800 bg-slate-950/80 backdrop-blur flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <span>
              Showing{' '}
              <strong className="text-slate-200">
                {Math.min(previewData.totalRows, (currentPage - 1) * pageSize + 1)}
              </strong>{' '}
              -{' '}
              <strong className="text-slate-200">
                {Math.min(previewData.totalRows, currentPage * pageSize)}
              </strong>{' '}
              of <strong className="text-slate-200">{previewData.totalRows.toLocaleString()}</strong>{' '}
              rows
            </span>

            <div className="flex items-center gap-1.5 ml-4">
              <span className="text-[11px] text-slate-500">Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 focus:outline-none focus:border-emerald-500"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono mr-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1 || isLoading}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages || isLoading}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* JSON Modal Viewer */}
      {expandedCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-sm font-bold text-slate-200">{expandedCell.col}</h4>
              <button
                onClick={() => setExpandedCell(null)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-emerald-400 font-mono overflow-auto max-h-96">
              {expandedCell.value}
            </pre>
            <div className="flex justify-end">
              <button
                onClick={() => setExpandedCell(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
