import { NextRequest, NextResponse } from 'next/server';
import { updateScaleConfig, getScaleServerStatus } from '@/lib/scale/scaleSimulator';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const updated = updateScaleConfig(body);
    const status = getScaleServerStatus();
    return NextResponse.json({ success: true, config: updated, status });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
