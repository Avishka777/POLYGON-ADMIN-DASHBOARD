import { NextRequest, NextResponse } from 'next/server';
import { testConnection } from '@/lib/db';
import { DbConnectionConfig } from '@/lib/db/types';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as DbConnectionConfig;
    if (!body || !body.type) {
      return NextResponse.json(
        { error: 'Database configuration and type are required' },
        { status: 400 }
      );
    }

    const result = await testConnection(body);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Connection test failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to connect to the database' },
      { status: 500 }
    );
  }
}
