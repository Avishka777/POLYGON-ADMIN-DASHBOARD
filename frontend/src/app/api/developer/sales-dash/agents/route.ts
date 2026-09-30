import { NextRequest, NextResponse } from 'next/server';
import { getSalesAgentsList } from '@/lib/developer/salesDashService';
import { SalesDashEnvironmentKey } from '@/lib/developer/salesDashTypes';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const env = (searchParams.get('env') || 'dev') as SalesDashEnvironmentKey;
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '15', 10);

    const result = await getSalesAgentsList({
      env,
      search,
      status,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Error fetching sales agents:', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Failed to fetch sales agents',
        agents: [],
        total: 0,
        page: 1,
        limit: 15,
        totalPages: 1,
      },
      { status: 500 }
    );
  }
}
