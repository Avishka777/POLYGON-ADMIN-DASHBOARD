import ExcelJS from 'exceljs';
import { TableExportPayload } from './types';

function sanitizeSheetName(name: string): string {
  // Excel limits sheet names to 31 chars and bans \ / ? * : [ ]
  return name.replace(/[\\/?*:[\]]/g, '_').substring(0, 31) || 'Sheet1';
}

function formatCellValue(val: any): any {
  if (val === null || val === undefined) {
    return '';
  }
  if (val instanceof Date) {
    return val;
  }
  if (typeof val === 'object') {
    try {
      return JSON.stringify(val);
    } catch {
      return String(val);
    }
  }
  if (typeof val === 'bigint') {
    return Number(val);
  }
  return val;
}

function applyWorksheetFormatting(
  worksheet: ExcelJS.Worksheet,
  payload: TableExportPayload
) {
  const { columns, rows } = payload;

  // Setup column definitions
  worksheet.columns = columns.map((col) => {
    return {
      header: col.name,
      key: col.name,
    };
  });

  // Freeze top row
  worksheet.views = [{ state: 'frozen', ySplit: 1 }];

  // Style Header Row (Row 1)
  const headerRow = worksheet.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.font = {
      name: 'Segoe UI',
      size: 11,
      bold: true,
      color: { argb: 'FFFFFFFF' },
    };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' }, // Slate 800
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'left',
      indent: 1,
    };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF334155' } },
      left: { style: 'thin', color: { argb: 'FF334155' } },
      bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
      right: { style: 'thin', color: { argb: 'FF334155' } },
    };
  });

  // Add Data Rows
  rows.forEach((row, rowIndex) => {
    const rowValues: Record<string, any> = {};
    columns.forEach((col) => {
      rowValues[col.name] = formatCellValue(row[col.name]);
    });

    const addedRow = worksheet.addRow(rowValues);
    addedRow.height = 22;

    const isEven = rowIndex % 2 === 0;
    const bgArgb = isEven ? 'FFFFFFFF' : 'FFF8FAFC'; // Alternating row color

    addedRow.eachCell((cell) => {
      cell.font = {
        name: 'Segoe UI',
        size: 10,
        color: { argb: 'FF0F172A' },
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: bgArgb },
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
      cell.alignment = {
        vertical: 'middle',
        horizontal: typeof cell.value === 'number' ? 'right' : 'left',
      };
    });
  });

  // Calculate & set dynamic column widths
  columns.forEach((col, i) => {
    const colNumber = i + 1;
    let maxLength = col.name.length;

    // Sample up to first 100 rows for performance
    const sampleRows = rows.slice(0, 100);
    sampleRows.forEach((r) => {
      const val = r[col.name];
      if (val !== null && val !== undefined) {
        const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
        if (str.length > maxLength) {
          maxLength = str.length;
        }
      }
    });

    const width = Math.min(65, Math.max(12, maxLength + 4));
    worksheet.getColumn(colNumber).width = width;
  });

  // Enable AutoFilter
  if (columns.length > 0 && rows.length > 0) {
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: rows.length + 1, column: columns.length },
    };
  }
}

export async function exportTableToExcel(payload: TableExportPayload): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Next.js DB Excel Exporter';
  workbook.created = new Date();

  const sheetName = sanitizeSheetName(payload.tableName);
  const worksheet = workbook.addWorksheet(sheetName);

  applyWorksheetFormatting(worksheet, payload);

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

export async function exportMultipleTablesToExcel(payloads: TableExportPayload[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Next.js DB Excel Exporter';
  workbook.created = new Date();

  const usedNames = new Set<string>();

  payloads.forEach((payload, index) => {
    let rawName = sanitizeSheetName(payload.tableName || `Table_${index + 1}`);
    if (usedNames.has(rawName.toLowerCase())) {
      rawName = `${rawName.substring(0, 27)}_${index + 1}`;
    }
    usedNames.add(rawName.toLowerCase());

    const worksheet = workbook.addWorksheet(rawName);
    applyWorksheetFormatting(worksheet, payload);
  });

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

export function exportTableToCsv(payload: TableExportPayload): string {
  const { columns, rows } = payload;
  const headerLine = columns
    .map((c) => `"${c.name.replace(/"/g, '""')}"`)
    .join(',');

  const dataLines = rows.map((row) => {
    return columns
      .map((c) => {
        const val = row[c.name];
        if (val === null || val === undefined) {
          return '""';
        }
        if (val instanceof Date) {
          return `"${val.toISOString()}"`;
        }
        if (typeof val === 'object') {
          return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
        }
        return `"${String(val).replace(/"/g, '""')}"`;
      })
      .join(',');
  });

  return [headerLine, ...dataLines].join('\r\n');
}
