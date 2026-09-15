import { NextResponse } from 'next/server';
import { stopScaleServer, getScaleServerStatus } from '@/lib/developer/scaleSimulator';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const res = await stopScaleServer();
    const status = getScaleServerStatus();
    return NextResponse.json({ ...res, status });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
