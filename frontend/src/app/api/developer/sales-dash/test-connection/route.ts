import { NextRequest, NextResponse } from 'next/server';
import { testSalesDashDbConnection } from '@/lib/developer/salesDashService';
import { SalesDashEnvironmentKey } from '@/lib/developer/salesDashTypes';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const env = (body.env || 'dev') as SalesDashEnvironmentKey;
    const result = await testSalesDashDbConnection(env);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Database test connection failed',
      },
      { status: 500 }
    );
  }
}
