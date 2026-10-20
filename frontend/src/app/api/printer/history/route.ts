import { NextResponse } from 'next/server';
import { clearPrintHistory, getPrinterServerStatus } from '@/lib/printer/printerSimulator';

export const dynamic = 'force-dynamic';

export async function DELETE() {
  try {
    clearPrintHistory();
    const status = getPrinterServerStatus();
    return NextResponse.json({ success: true, status });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
