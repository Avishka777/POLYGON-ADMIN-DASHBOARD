import { NextRequest, NextResponse } from 'next/server';
import { executeTriggerPolygonNotification } from '@/lib/developer/polygonNotificationService';
import { PolygonEnvironmentKey } from '@/lib/developer/polygonNotificationTypes';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      env = 'dev',
      customApiUrl,
      userId,
      orderId,
      title,
      message,
      eventType = 'order_confirmed',
      isThinEvent = false,
      data,
    } = body;

    const isCatalog = eventType === 'catalog_updated' || eventType === 'catalog_update';

    if (!isCatalog && (!title || !title.trim())) {
      return NextResponse.json(
        {
          success: false,
          message: 'Notification title is required.',
        },
        { status: 400 }
      );
    }

    if (!isCatalog && !userId && !orderId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Either userId or orderId is required to route notification to a customer.',
        },
        { status: 400 }
      );
    }

    const result = await executeTriggerPolygonNotification({
      env: env as PolygonEnvironmentKey,
      customApiUrl,
      userId: userId ? Number(userId) : null,
      orderId: orderId ? Number(orderId) : null,
      title: title || 'Catalog Updated',
      message: message || '',
      eventType,
      isThinEvent: Boolean(isThinEvent),
      data,
    });

    return NextResponse.json(result, {
      status: result.success ? 200 : result.statusCode || 500,
    });
  } catch (err: any) {
    console.error('Error in Polygon notification trigger API route:', err);
    return NextResponse.json(
      {
        success: false,
        message: err.message || 'An unexpected error occurred while triggering Polygon notification.',
      },
      { status: 500 }
    );
  }
}
