import mysql from 'mysql2/promise';
import {
  PolygonEnvironmentKey,
  PolygonDbConfig,
  MarketplaceUserRecord,
  POLYGON_ENVIRONMENTS,
  TriggerPolygonNotificationPayload,
} from './polygonNotificationTypes';

export function getPolygonDbConfig(
  env: PolygonEnvironmentKey,
  customDb?: Partial<PolygonDbConfig>
): PolygonDbConfig {
  const base = POLYGON_ENVIRONMENTS[env]?.db || POLYGON_ENVIRONMENTS.dev.db;
  return {
    ...base,
    ...(customDb || {}),
  };
}

export async function createPolygonDbConnection(
  env: PolygonEnvironmentKey,
  customDb?: Partial<PolygonDbConfig>
) {
  const config = getPolygonDbConfig(env, customDb);
  return await mysql.createConnection({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    connectTimeout: 8000,
  });
}

export async function testPolygonDbConnection(
  env: PolygonEnvironmentKey,
  customDb?: Partial<PolygonDbConfig>
) {
  const startTime = Date.now();
  let conn: mysql.Connection | null = null;
  try {
    conn = await createPolygonDbConnection(env, customDb);
    const [userRows]: [any[], any] = await conn.query('SELECT COUNT(*) as total FROM marketplaceusers');
    let totalOrders = 0;
    try {
      const [orderRows]: [any[], any] = await conn.query('SELECT COUNT(*) as total FROM processorders');
      totalOrders = orderRows[0]?.total ?? 0;
    } catch {
      // processorders might be in separate db or permissions
    }

    const latencyMs = Date.now() - startTime;
    return {
      success: true,
      latencyMs,
      totalUsers: userRows[0]?.total ?? 0,
      totalOrders,
      host: getPolygonDbConfig(env, customDb).host,
      database: getPolygonDbConfig(env, customDb).database,
    };
  } catch (err: any) {
    return {
      success: false,
      latencyMs: Date.now() - startTime,
      error: err.message || 'Database connection failed',
      host: getPolygonDbConfig(env, customDb).host,
      database: getPolygonDbConfig(env, customDb).database,
    };
  } finally {
    if (conn) await conn.end().catch(() => {});
  }
}

export interface GetMarketplaceUsersParams {
  env: PolygonEnvironmentKey;
  search?: string;
  buyerType?: string;
  status?: string;
  page?: number;
  limit?: number;
  customDb?: Partial<PolygonDbConfig>;
}

export async function getMarketplaceUsersList(params: GetMarketplaceUsersParams) {
  const { env, search, buyerType, status, page = 1, limit = 15, customDb } = params;
  let conn: mysql.Connection | null = null;

  try {
    conn = await createPolygonDbConnection(env, customDb);

    const conditions: string[] = [];
    const values: any[] = [];

    if (search && search.trim() !== '') {
      const term = `%${search.trim()}%`;
      conditions.push(
        '(CAST(id AS CHAR) LIKE ? OR cusId LIKE ? OR firstName LIKE ? OR lastName LIKE ? OR email LIKE ? OR phoneNumber LIKE ? OR companyName LIKE ?)'
      );
      values.push(term, term, term, term, term, term, term);
    }

    if (buyerType && buyerType !== 'all' && buyerType.trim() !== '') {
      conditions.push('buyerType = ?');
      values.push(buyerType.trim());
    }

    if (status && status !== 'all' && status.trim() !== '') {
      if (status === 'active') {
        conditions.push('(isActive = 1 OR isActive IS NULL)');
      } else if (status === 'inactive') {
        conditions.push('isActive = 0');
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Total Count
    const countQuery = `SELECT COUNT(*) as total FROM marketplaceusers ${whereClause}`;
    const [countRows]: [any[], any] = await conn.query(countQuery, values);
    const total = countRows[0]?.total ?? 0;

    // Available Buyer Types for filter chips
    const [typeRows]: [any[], any] = await conn.query(
      'SELECT DISTINCT buyerType FROM marketplaceusers WHERE buyerType IS NOT NULL AND buyerType != ""'
    );
    const availableBuyerTypes = typeRows.map((r: any) => r.buyerType);

    // Paginated results
    const offset = Math.max(0, (page - 1) * limit);
    const selectQuery = `
      SELECT 
        id, 
        cusId, 
        salesAgent,
        title, 
        firstName, 
        lastName, 
        phoneCode, 
        phoneNumber, 
        email, 
        buyerType, 
        companyName, 
        creditBalance, 
        creditLimit, 
        nearesCity, 
        isActive, 
        isMarketPlaceUser, 
        created_at,
        (
          SELECT po.id 
          FROM processorders po 
          JOIN orders o ON po.orderId = o.id 
          WHERE o.userId = marketplaceusers.id 
          ORDER BY po.id DESC 
          LIMIT 1
        ) AS latestProcessOrderId,
        (
          SELECT po.invNo 
          FROM processorders po 
          JOIN orders o ON po.orderId = o.id 
          WHERE o.userId = marketplaceusers.id 
          ORDER BY po.id DESC 
          LIMIT 1
        ) AS latestInvNo
      FROM marketplaceusers
      ${whereClause}
      ORDER BY id DESC
      LIMIT ? OFFSET ?
    `;

    const [rows]: [any[], any] = await conn.query(selectQuery, [...values, limit, offset]);

    return {
      success: true,
      users: rows as MarketplaceUserRecord[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      availableBuyerTypes,
    };
  } catch (err: any) {
    console.error('Error in getMarketplaceUsersList:', err);
    return {
      success: false,
      error: err.message,
      users: [],
      total: 0,
      page: 1,
      limit,
      totalPages: 1,
      availableBuyerTypes: [],
    };
  } finally {
    if (conn) await conn.end().catch(() => {});
  }
}

export interface ExecutePolygonTriggerParams {
  env: PolygonEnvironmentKey;
  customApiUrl?: string;
  userId?: number | null;
  orderId?: number | null;
  title: string;
  message: string;
  eventType: string;
  isThinEvent?: boolean;
  data?: Record<string, any>;
}

export async function executeTriggerPolygonNotification(params: ExecutePolygonTriggerParams) {
  const {
    env,
    customApiUrl,
    userId,
    orderId,
    title,
    message,
    eventType = 'order_confirmed',
    isThinEvent = false,
    data = {},
  } = params;

  const baseConfig = POLYGON_ENVIRONMENTS[env] || POLYGON_ENVIRONMENTS.dev;
  const activeBaseUrl = (customApiUrl || baseConfig.polygonApiUrl).replace(/\/+$/, '');

  // If catalog update broadcast
  const isCatalog = eventType === 'catalog_updated' || eventType === 'catalog_update';
  const triggerEndpoint = isCatalog
    ? `${activeBaseUrl}/api/product/notify-update`
    : `${activeBaseUrl}/api/notification/trigger`;

  const payload: any = isCatalog
    ? {
        action: data?.action || 'update',
        packageId: data?.packageId || 326,
        timestamp: new Date().toISOString(),
      }
    : {
        userId: userId ? Number(userId) : null,
        orderId: orderId ? Number(orderId) : null,
        title: title.trim(),
        message: message.trim(),
        eventType: eventType.trim(),
        isThinEvent: Boolean(isThinEvent),
        data: data || {},
      };

  console.log(`📡 [Polygon Trigger] Target Endpoint: ${triggerEndpoint}`);
  console.log(`📦 [Polygon Trigger] Request Payload:`, JSON.stringify(payload, null, 2));

  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(triggerEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const latencyMs = Date.now() - startTime;
    const rawText = await res.text();
    let responseData: any = null;
    try {
      responseData = JSON.parse(rawText);
    } catch {
      responseData = rawText;
    }

    console.log(`📥 [Polygon Trigger] Response Status: ${res.status} (${latencyMs}ms)`);
    console.log(`📥 [Polygon Trigger] Response Body:`, responseData);

    const isSuccess = res.status >= 200 && res.status < 300;

    const displayMsg =
      typeof responseData === 'string' && responseData.includes('<pre>')
        ? responseData.replace(/<[^>]*>?/gm, '').trim()
        : typeof responseData === 'object'
        ? responseData?.message || JSON.stringify(responseData)
        : String(responseData || '');

    return {
      success: isSuccess,
      statusCode: res.status,
      endpoint: triggerEndpoint,
      latencyMs,
      data: responseData,
      payloadSent: payload,
      message: isSuccess
        ? responseData?.message || 'Notification triggered successfully to Polygon Mobile API'
        : `Polygon Mobile API returned HTTP ${res.status}: ${displayMsg}`,
    };
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    console.error(`❌ [Polygon Trigger] Error:`, err.message);
    return {
      success: false,
      statusCode: 0,
      endpoint: triggerEndpoint,
      latencyMs,
      data: null,
      payloadSent: payload,
      error: err.message,
      message: `Failed to trigger Polygon Mobile API: ${err.message}`,
    };
  }
}
