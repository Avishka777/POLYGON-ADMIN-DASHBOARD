import { NextRequest, NextResponse } from 'next/server';
import { testDbConnection, EnvironmentKey } from '@/lib/developer/officerService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const env = (body.env || 'dev') as EnvironmentKey;
    const customDb = body.customDb;

    const result = await testDbConnection(env, customDb);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Connection test failed',
      },
      { status: 500 }
    );
  }
}
