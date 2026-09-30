import { NextRequest, NextResponse } from 'next/server';
import { getMarketplacePackagesList } from '@/lib/developer/packageUpdateService';
import { PackageUpdateEnvironmentKey } from '@/lib/developer/packageUpdateTypes';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const env = (searchParams.get('env') || 'dev') as PackageUpdateEnvironmentKey;
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '15', 10);

    const result = await getMarketplacePackagesList({
      env,
      search,
      status,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Error fetching marketplace packages:', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Failed to fetch marketplace packages',
        packages: [],
        total: 0,
        page: 1,
        limit: 15,
        totalPages: 1,
      },
      { status: 500 }
    );
  }
}
