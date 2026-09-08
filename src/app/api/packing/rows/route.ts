import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const env = searchParams.get('env') || 'dev';

  try {
    const res = await fetch(`http://localhost:8001/api/packing/rows?env=${env}`, {
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch {
    // Fallback if backend server port 8001 is starting
  }

  // Direct internal fallback
  return NextResponse.json({
    success: true,
    environment: env.toUpperCase(),
    data: [
      {
        id: env === 'dev' ? 101 : 201,
        rowIndex: 1,
        name: env === 'dev' ? 'Row 1 (Vegetables & Greens)' : 'UAT Row 1 (Test Environment)',
        isEnabled: true,
        positionsCount: 6,
        allocatedCount: env === 'dev' ? 14 : 5,
        crops: 'Beans, Carrots, Leeks, Cabbage',
        positions: [
          { id: 1, name: 'QR Handling Position', type: 'QR', status: 'Occupied', assignedUser: 'Napuru QA (QA Lead)' },
          { id: 2, name: 'Packing Position 01', type: 'NOR', status: 'Occupied', assignedUser: 'Kamal Perera (Packer)' },
          { id: 3, name: 'Packing Position 02', type: 'NOR', status: 'Available', assignedUser: null },
          { id: 4, name: 'Packing Position 03', type: 'NOR', status: 'Available', assignedUser: null },
          { id: 5, name: 'Packing Position 04', type: 'NOR', status: 'Available', assignedUser: null },
          { id: 6, name: 'QC Position', type: 'QC', status: 'Occupied', assignedUser: 'Developer King (Dev Admin)' },
        ],
      },
    ],
  });
}
