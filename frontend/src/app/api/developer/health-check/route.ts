import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const startTime = performance.now();
  let targetUrl = '';

  try {
    const body = await req.json();
    targetUrl = body.url;

    if (!targetUrl || typeof targetUrl !== 'string') {
      return NextResponse.json(
        { error: 'Valid "url" parameter is required' },
        { status: 400 }
      );
    }

    const timeoutMs = body.timeoutMs || 8000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'User-Agent': 'Polygon-Admin-Dashboard/1.0 (HealthChecker)',
      },
      signal: controller.signal,
      cache: 'no-store',
    });

    clearTimeout(timeoutId);
    const latencyMs = Math.round(performance.now() - startTime);

    const isHealthy = response.status >= 200 && response.status < 400;
    let data: any = null;

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch {
        data = await response.text();
      }
    } else {
      data = await response.text();
    }

    return NextResponse.json({
      success: true,
      healthy: isHealthy,
      statusCode: response.status,
      statusText: response.statusText || (isHealthy ? 'OK' : 'Error'),
      latencyMs,
      data,
      url: targetUrl,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    const latencyMs = Math.round(performance.now() - startTime);
    const isTimeout = err.name === 'AbortError';

    return NextResponse.json({
      success: false,
      healthy: false,
      statusCode: isTimeout ? 408 : 0,
      statusText: isTimeout ? 'Request Timeout' : 'Network Error',
      latencyMs,
      error: isTimeout ? 'Health check timed out after 8 seconds' : err.message,
      url: targetUrl,
      timestamp: new Date().toISOString(),
    });
  }
}
