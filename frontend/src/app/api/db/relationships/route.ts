import { NextRequest, NextResponse } from 'next/server';
import { getForeignKeys } from '@/lib/db';
import { DbConnectionConfig } from '@/lib/db/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const config: DbConnectionConfig = body.config;
    const database: string | undefined = body.database;
    const tableName: string | undefined = body.tableName;

    if (!config || !config.type) {
      return NextResponse.json({ error: 'Invalid database configuration' }, { status: 400 });
    }

    const relationships = await getForeignKeys(config, database, tableName);
    return NextResponse.json({ relationships });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to fetch relationships' },
      { status: 500 }
    );
  }
}
