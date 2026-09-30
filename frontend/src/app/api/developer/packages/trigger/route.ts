import { NextRequest, NextResponse } from 'next/server';
import { executePackageUpdateNotification } from '@/lib/developer/packageUpdateService';
import { PackageUpdateEnvironmentKey, PackageActionType } from '@/lib/developer/packageUpdateTypes';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      env = 'dev',
      action = 'update',
      packageId,
      extra,
      notifySalesDash = true,
      notifyPolygon = true,
      customSalesDashUrl,
      customPolygonUrl,
    } = body;

    if (!packageId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Package ID is required.',
        },
        { status: 400 }
      );
    }

    if (!notifySalesDash && !notifyPolygon) {
      return NextResponse.json(
        {
          success: false,
          message: 'At least one target application (Sales Dash or Polygon) must be selected.',
        },
        { status: 400 }
      );
    }

    const result = await executePackageUpdateNotification({
      env: env as PackageUpdateEnvironmentKey,
      action: action as PackageActionType,
      packageId: Number(packageId),
      extra,
      notifySalesDash,
      notifyPolygon,
      customSalesDashUrl,
      customPolygonUrl,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Error in package update trigger API route:', err);
    return NextResponse.json(
      {
        success: false,
        message: err.message || 'An unexpected error occurred while broadcasting package update.',
        error: err.toString(),
      },
      { status: 500 }
    );
  }
}
