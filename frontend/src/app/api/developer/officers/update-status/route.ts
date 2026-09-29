import { NextRequest, NextResponse } from 'next/server';
import { executeUpdateStatusAndSendPassword, EnvironmentKey } from '@/lib/developer/officerService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      env = 'dev',
      id,
      status,
      customPassword,
      sendEmail = false,
      collectorApiUrl,
      transporterApiUrl,
      customDb,
    } = body;

    if (!id || !status) {
      return NextResponse.json(
        { message: 'ID and status are required.', status: false },
        { status: 400 }
      );
    }

    const result = await executeUpdateStatusAndSendPassword({
      env: env as EnvironmentKey,
      id,
      status,
      customPassword,
      sendEmail,
      collectorApiUrl,
      transporterApiUrl,
      customDb,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Error in UpdateStatusAndSendPassword route:', err);
    return NextResponse.json(
      {
        message: err.message || 'An error occurred while updating status and password.',
        status: false,
        error: err.toString(),
      },
      { status: 500 }
    );
  }
}
