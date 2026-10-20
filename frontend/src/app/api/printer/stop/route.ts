import { NextResponse } from 'next/server';
import { stopPrinterServer, getPrinterServerStatus } from '@/lib/printer/printerSimulator';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const res = await stopPrinterServer();
    const status = getPrinterServerStatus();
    return NextResponse.json({ ...res, status });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
