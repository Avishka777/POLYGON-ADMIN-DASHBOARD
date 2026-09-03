import { NextRequest, NextResponse } from 'next/server';
import { listTables } from '@/lib/db';
import { DbConnectionConfig } from '@/lib/db/types';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      config: DbConnectionConfig;
      database?: string;
    };

    if (!body || !body.config) {
      return NextResponse.json(
        { error: 'Database configuration is required' },
        { status: 400 }
      );
    }

    const tables = await listTables(body.config, body.database);
    return NextResponse.json({ tables });
  } catch (error: any) {
    console.error('List tables failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list tables' },
      { status: 500 }
    );
  }
}
