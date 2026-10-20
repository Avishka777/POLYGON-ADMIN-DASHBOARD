import { NextRequest, NextResponse } from 'next/server';
import {
  startBluetoothPrinter,
  stopBluetoothPrinter,
  getPrinterServerStatus,
} from '@/lib/printer/printerSimulator';

export const dynamic = 'force-dynamic';

export async function GET() {
  const status = getPrinterServerStatus();
  return NextResponse.json({
    isBluetoothRunning: status.isBluetoothRunning,
    bluetoothDeviceName: status.bluetoothDeviceName,
  });
}

export async function POST(req: NextRequest) {
  try {
    let action = 'start';
    try {
      const body = await req.json();
      if (body.action) action = body.action;
    } catch {
      // default
    }

    if (action === 'stop') {
      const res = await stopBluetoothPrinter();
      const status = getPrinterServerStatus();
      return NextResponse.json({ ...res, status });
    }

    const res = await startBluetoothPrinter(3000);
    const status = getPrinterServerStatus();
    return NextResponse.json({ ...res, status });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
