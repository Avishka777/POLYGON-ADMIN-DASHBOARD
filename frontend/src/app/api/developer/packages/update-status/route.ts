import { NextRequest, NextResponse } from 'next/server';
import { updatePackageStatusAndNotify } from '@/lib/developer/packageUpdateService';
import { PackageUpdateEnvironmentKey } from '@/lib/developer/packageUpdateTypes';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      env = 'dev',
      packageId,
      newStatus,
      notifySalesDash = true,
      notifyPolygon = true,
      customSalesDashUrl,
      customPolygonUrl,
    } = body;

    if (!packageId) {
      return NextResponse.json(
        { success: false, message: 'Package ID is required.' },
        { status: 400 }
      );
    }

    if (!newStatus || (newStatus !== 'Enabled' && newStatus !== 'Disabled')) {
      return NextResponse.json(
        { success: false, message: 'newStatus must be either "Enabled" or "Disabled".' },
        { status: 400 }
      );
    }

    const result = await updatePackageStatusAndNotify({
      env: env as PackageUpdateEnvironmentKey,
      packageId: Number(packageId),
      newStatus: newStatus as 'Enabled' | 'Disabled',
      notifySalesDash,
      notifyPolygon,
      customSalesDashUrl,
      customPolygonUrl,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Error in package update-status route:', err);
    return NextResponse.json(
      {
        success: false,
        message: err.message || 'Failed to update package status in database and notify mobile APIs',
        error: err.toString(),
      },
      { status: 500 }
    );
  }
}
