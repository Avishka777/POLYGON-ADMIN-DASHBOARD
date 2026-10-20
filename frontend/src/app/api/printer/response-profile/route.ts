import { NextResponse } from 'next/server';
import {
  getPrinterResponseProfile,
  updatePrinterResponseProfile,
} from '@/lib/printer/printerSimulator';

export async function GET() {
  try {
    const profile = getPrinterResponseProfile();
    return NextResponse.json(profile);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message, stack: err.stack },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const updated = updatePrinterResponseProfile(body);
    return NextResponse.json({ success: true, profile: updated });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to update response profile' },
      { status: 400 }
    );
  }
}
