import { NextRequest, NextResponse } from 'next/server';
import { getOfficersList, EnvironmentKey } from '@/lib/developer/officerService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const env = (searchParams.get('env') || 'dev') as EnvironmentKey;
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const jobRole = searchParams.get('jobRole') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const result = await getOfficersList({
      env,
      search,
      status,
      jobRole,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Error fetching officers:', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Failed to fetch officers from database',
      },
      { status: 500 }
    );
  }
}
