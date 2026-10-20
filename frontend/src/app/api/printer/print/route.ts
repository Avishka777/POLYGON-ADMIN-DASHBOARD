import { NextRequest, NextResponse } from 'next/server';
import { processPrintJob, getPrinterServerStatus, generateSampleTspl } from '@/lib/printer/printerSimulator';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function GET() {
  const status = getPrinterServerStatus();
  return NextResponse.json(
    {
      status: 'ready',
      message: 'Polygon Virtual Thermal Printer API is running',
      latestJob: status.latestJob,
      totalJobs: status.totalJobsPrinted,
    },
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}

export async function POST(req: NextRequest) {
  try {
    let tsplContent = '';
    let source: 'http' | 'manual' = 'http';

    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const body = await req.json();
      tsplContent = body.tspl || body.command || body.data || '';
      if (body.sample) {
        tsplContent = generateSampleTspl(body.sample);
        source = 'manual';
      }
    } else {
      // Plain text or octet-stream
      tsplContent = await req.text();
    }

    if (!tsplContent.trim()) {
      return NextResponse.json(
        { success: false, error: 'No TSPL command content provided' },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const job = processPrintJob(tsplContent, source);
    const status = getPrinterServerStatus();

    return NextResponse.json(
      {
        success: true,
        job,
        status,
      },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}
