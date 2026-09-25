import { NextRequest, NextResponse } from 'next/server';
import { startScaleServer, getScaleServerStatus } from '@/lib/scale/scaleSimulator';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    let tcpPort = 33581;
    let httpPort = 3001;

    try {
      const body = await req.json();
      if (body.tcpPort) tcpPort = parseInt(body.tcpPort, 10);
      if (body.httpPort) httpPort = parseInt(body.httpPort, 10);
    } catch {
      // Use defaults
    }

    const res = await startScaleServer(tcpPort, httpPort);
    const status = getScaleServerStatus();

    return NextResponse.json({ ...res, status });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
