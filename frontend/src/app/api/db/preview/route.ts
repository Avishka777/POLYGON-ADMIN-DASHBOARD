import { NextRequest, NextResponse } from 'next/server';
import { getTablePreview } from '@/lib/db';
import { DbConnectionConfig } from '@/lib/db/types';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      config: DbConnectionConfig;
      table: string;
      page?: number;
      pageSize?: number;
      schema?: string;
      database?: string;
    };

    if (!body || !body.config || !body.table) {
      return NextResponse.json(
        { error: 'Config and table name are required' },
        { status: 400 }
      );
    }

    const previewData = await getTablePreview(body.config, body.table, {
      page: body.page || 1,
      pageSize: body.pageSize || 25,
      schema: body.schema || 'public',
      database: body.database,
    });

    return NextResponse.json(previewData);
  } catch (error: any) {
    console.error('Preview failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to preview table data' },
      { status: 500 }
    );
  }
}
