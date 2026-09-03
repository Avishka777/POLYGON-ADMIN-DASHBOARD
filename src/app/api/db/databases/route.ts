import { NextRequest, NextResponse } from 'next/server';
import { listDatabases } from '@/lib/db';
import { DbConnectionConfig } from '@/lib/db/types';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as DbConnectionConfig;
    if (!body || !body.type) {
      return NextResponse.json(
        { error: 'Database configuration is required' },
        { status: 400 }
      );
    }

    const databases = await listDatabases(body);
    return NextResponse.json({ databases });
  } catch (error: any) {
    console.error('List databases failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list databases' },
      { status: 500 }
    );
  }
}
