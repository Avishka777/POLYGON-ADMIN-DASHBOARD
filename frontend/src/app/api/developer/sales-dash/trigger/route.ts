import { NextRequest, NextResponse } from 'next/server';
import { executeTriggerSalesDashNotification } from '@/lib/developer/salesDashService';
import { SalesDashEnvironmentKey } from '@/lib/developer/salesDashTypes';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      env = 'dev',
      customApiUrl,
      orderId,
      salesAgentId,
      title,
      message,
      eventType = 'order_placed',
      data,
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: 'Notification title is required.',
        },
        { status: 400 }
      );
    }

    if (!salesAgentId && !orderId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Either salesAgentId or orderId is required to route the notification.',
        },
        { status: 400 }
      );
    }

    const result = await executeTriggerSalesDashNotification({
      env: env as SalesDashEnvironmentKey,
      customApiUrl,
      orderId: orderId ? Number(orderId) : null,
      salesAgentId: salesAgentId ? Number(salesAgentId) : null,
      title,
      message,
      eventType,
      data,
    });

    return NextResponse.json(result, {
      status: result.success ? 200 : (result.statusCode || 500),
    });
  } catch (err: any) {
    console.error('Error in SalesDash notification trigger API route:', err);
    return NextResponse.json(
      {
        success: false,
        message: err.message || 'An unexpected error occurred while triggering notification.',
        error: err.toString(),
      },
      { status: 500 }
    );
  }
}
