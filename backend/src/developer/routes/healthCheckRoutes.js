const express = require('express');
const router = express.Router();

// POST /api/developer/health-check
router.post('/health-check', async (req, res) => {
  const { url, timeoutMs = 8000 } = req.body || {};

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Valid "url" parameter is required' });
  }

  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'User-Agent': 'Polygon-Admin-Dashboard/1.0 (HealthChecker)',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const latencyMs = Date.now() - startTime;
    const isHealthy = response.status >= 200 && response.status < 400;

    let data = null;
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

    return res.json({
      success: true,
      healthy: isHealthy,
      statusCode: response.status,
      statusText: response.statusText || (isHealthy ? 'OK' : 'Error'),
      latencyMs,
      data,
      url,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const latencyMs = Date.now() - startTime;
    const isTimeout = err.name === 'AbortError';

    return res.json({
      success: false,
      healthy: false,
      statusCode: isTimeout ? 408 : 0,
      statusText: isTimeout ? 'Request Timeout' : 'Network Error',
      latencyMs,
      error: isTimeout ? 'Health check timed out after 8 seconds' : err.message,
      url,
      timestamp: new Date().toISOString(),
    });
  }
});

module.exports = router;
