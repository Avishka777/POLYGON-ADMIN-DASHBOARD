import { NextResponse } from 'next/server';
import { getScaleServerStatus } from '@/lib/developer/scaleSimulator';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const status = getScaleServerStatus();
    return NextResponse.json(status);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
