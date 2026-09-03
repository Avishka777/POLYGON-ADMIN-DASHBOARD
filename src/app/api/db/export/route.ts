import { NextRequest, NextResponse } from 'next/server';
import { getAllTableData } from '@/lib/db';
import { exportMultipleTablesToExcel, exportTableToCsv, exportTableToExcel } from '@/lib/db/exporter';
import { DbConnectionConfig, TableExportPayload } from '@/lib/db/types';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      config: DbConnectionConfig;
      format: 'xlsx' | 'csv';
      tables: string[];
      schema?: string;
      database?: string;
    };

    if (!body || !body.config || !body.tables || body.tables.length === 0) {
      return NextResponse.json(
        { error: 'Database config and at least one table name are required' },
        { status: 400 }
      );
    }

    const format = body.format || 'xlsx';
    const schema = body.schema || 'public';
    const database = body.database;

    // Fetch data for all requested tables
    const tablePayloads: TableExportPayload[] = [];
    for (const tableName of body.tables) {
      const data = await getAllTableData(body.config, tableName, schema, database);
      tablePayloads.push({
        tableName,
        columns: data.columns,
        rows: data.rows,
      });
    }

    if (format === 'csv') {
      if (tablePayloads.length > 1) {
        return NextResponse.json(
          { error: 'CSV export supports single table at a time. Use Excel (.xlsx) for multiple tables.' },
          { status: 400 }
        );
      }

      const csvContent = exportTableToCsv(tablePayloads[0]);
      const filename = `${tablePayloads[0].tableName}_export_${Date.now()}.csv`;

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    // Default to Excel (.xlsx)
    let excelBuffer: Buffer;
    let filename: string;

    if (tablePayloads.length === 1) {
      excelBuffer = await exportTableToExcel(tablePayloads[0]);
      filename = `${tablePayloads[0].tableName}_export_${Date.now()}.xlsx`;
    } else {
      excelBuffer = await exportMultipleTablesToExcel(tablePayloads);
      filename = `Database_Export_${tablePayloads.length}_Tables_${Date.now()}.xlsx`;
    }

    const uint8Array = new Uint8Array(excelBuffer);

    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': uint8Array.length.toString(),
      },
    });
  } catch (error: any) {
    console.error('Export failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to export table data' },
      { status: 500 }
    );
  }
}
