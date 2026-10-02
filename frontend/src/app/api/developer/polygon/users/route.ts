import { NextRequest, NextResponse } from 'next/server';
import { getMarketplaceUsersList } from '@/lib/developer/polygonNotificationService';
import { PolygonEnvironmentKey } from '@/lib/developer/polygonNotificationTypes';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const env = (searchParams.get('env') || 'dev') as PolygonEnvironmentKey;
    const search = searchParams.get('search') || undefined;
    const buyerType = searchParams.get('buyerType') || undefined;
    const status = searchParams.get('status') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '15', 10);

    const result = await getMarketplaceUsersList({
      env,
      search,
      buyerType,
      status,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Error fetching marketplace users:', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Failed to fetch marketplace users',
        users: [],
        total: 0,
        page: 1,
        limit: 15,
        totalPages: 1,
        availableBuyerTypes: [],
      },
      { status: 500 }
    );
  }
}
