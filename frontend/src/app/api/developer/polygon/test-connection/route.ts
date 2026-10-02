import { NextRequest, NextResponse } from 'next/server';
import { testPolygonDbConnection } from '@/lib/developer/polygonNotificationService';
import { PolygonEnvironmentKey } from '@/lib/developer/polygonNotificationTypes';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const env = (body.env || 'dev') as PolygonEnvironmentKey;
    const result = await testPolygonDbConnection(env);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Polygon database test connection failed',
      },
      { status: 500 }
    );
  }
}
