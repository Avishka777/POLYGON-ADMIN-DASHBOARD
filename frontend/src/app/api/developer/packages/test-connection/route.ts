import { NextRequest, NextResponse } from 'next/server';
import { testPackageDbConnection } from '@/lib/developer/packageUpdateService';
import { PackageUpdateEnvironmentKey } from '@/lib/developer/packageUpdateTypes';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const env = (body.env || 'dev') as PackageUpdateEnvironmentKey;
    const result = await testPackageDbConnection(env);
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
