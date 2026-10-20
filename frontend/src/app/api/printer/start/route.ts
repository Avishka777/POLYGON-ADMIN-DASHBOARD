import { NextRequest, NextResponse } from 'next/server';
import { startPrinterServer, getPrinterServerStatus } from '@/lib/printer/printerSimulator';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    let tcpPort = 33582;
    let httpPort = 3002;

    try {
      const body = await req.json();
      if (body.tcpPort) tcpPort = parseInt(body.tcpPort, 10);
      if (body.httpPort) httpPort = parseInt(body.httpPort, 10);
    } catch {
      // Use defaults
    }

    const res = await startPrinterServer(tcpPort, httpPort);
    const status = getPrinterServerStatus();

    return NextResponse.json({ ...res, status });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
