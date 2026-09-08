import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const env = searchParams.get('env') || 'dev';

  try {
    const res = await fetch(`http://localhost:8001/api/packing/users?env=${env}`, {
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch {
    // Fallback
  }

  return NextResponse.json({
    success: true,
    environment: env.toUpperCase(),
    data: [
      { id: 1, name: 'Napuru QA (QA Lead)', role: 'QA Officer', email: 'qa@polygon.lk' },
      { id: 2, name: 'Developer King (Dev Admin)', role: 'System Admin', email: 'dev@polygon.lk' },
      { id: 3, name: 'Kamal Perera', role: 'Distribution Officer', email: 'kamal@polygon.lk' },
      { id: 4, name: 'Saman Kumara', role: 'Packing Specialist', email: 'saman@polygon.lk' },
      { id: 5, name: 'Nimali Silva', role: 'QC Officer', email: 'nimali@polygon.lk' },
    ],
  });
}
