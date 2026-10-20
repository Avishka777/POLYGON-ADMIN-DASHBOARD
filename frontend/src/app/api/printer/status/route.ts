import { NextResponse } from 'next/server';
import { getPrinterServerStatus } from '@/lib/printer/printerSimulator';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const status = getPrinterServerStatus();
    return NextResponse.json(status);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
