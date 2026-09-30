import mysql from 'mysql2/promise';
import {
  SalesDashEnvironmentKey,
  SalesDashDbConfig,
  SalesAgentRecord,
  SALES_DASH_ENVIRONMENTS,
  TriggerNotificationPayload,
} from './salesDashTypes';

export function getSalesDashDbConfig(
  env: SalesDashEnvironmentKey,
  customDb?: Partial<SalesDashDbConfig>
): SalesDashDbConfig {
  const base = SALES_DASH_ENVIRONMENTS[env]?.db || SALES_DASH_ENVIRONMENTS.dev.db;
  return {
    ...base,
    ...(customDb || {}),
  };
}

export async function createSalesDashDbConnection(
  env: SalesDashEnvironmentKey,
  customDb?: Partial<SalesDashDbConfig>
) {
  const config = getSalesDashDbConfig(env, customDb);
  return await mysql.createConnection({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    connectTimeout: 8000,
  });
}

export async function testSalesDashDbConnection(
  env: SalesDashEnvironmentKey,
  customDb?: Partial<SalesDashDbConfig>
) {
  const startTime = Date.now();
  let conn: mysql.Connection | null = null;
  try {
    conn = await createSalesDashDbConnection(env, customDb);
    const [rows]: [any[], any] = await conn.query('SELECT COUNT(*) as total FROM salesagent');
    const latencyMs = Date.now() - startTime;
    return {
      success: true,
      latencyMs,
      totalSalesAgents: rows[0]?.total ?? 0,
      host: getSalesDashDbConfig(env, customDb).host,
      database: getSalesDashDbConfig(env, customDb).database,
    };
  } catch (err: any) {
    return {
      success: false,
      latencyMs: Date.now() - startTime,
      error: err.message || 'Database connection failed',
      host: getSalesDashDbConfig(env, customDb).host,
      database: getSalesDashDbConfig(env, customDb).database,
    };
  } finally {
    if (conn) await conn.end().catch(() => {});
  }
}

export interface GetSalesAgentsParams {
  env: SalesDashEnvironmentKey;
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
  customDb?: Partial<SalesDashDbConfig>;
}

export async function getSalesAgentsList(params: GetSalesAgentsParams) {
  const { env, search, status, page = 1, limit = 15, customDb } = params;
  let conn: mysql.Connection | null = null;

  try {
    conn = await createSalesDashDbConnection(env, customDb);

    const conditions: string[] = [];
    const values: any[] = [];

    if (search && search.trim() !== '') {
      const searchTerm = `%${search.trim()}%`;
      conditions.push(
        '(empId LIKE ? OR firstName LIKE ? OR lastName LIKE ? OR email LIKE ? OR phoneNumber1 LIKE ?)'
      );
      values.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (status && status !== 'all' && status.trim() !== '') {
      conditions.push('status = ?');
      values.push(status.trim());
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Total Count
    const [countRows]: [any[], any] = await conn.query(
      `SELECT COUNT(*) as total FROM salesagent ${whereClause}`,
      values
    );
    const total = countRows[0]?.total ?? 0;

    // Distinct Statuses
    const [statusRows]: [any[], any] = await conn.query(
      `SELECT DISTINCT status FROM salesagent WHERE status IS NOT NULL AND status != '' ORDER BY status ASC`
    );
    const availableStatuses = statusRows.map((r) => r.status);

    // Paginated records
    const offset = (page - 1) * limit;
    const [agentRows]: [any[], any] = await conn.query(
      `SELECT id, empId, firstName, lastName, email, phoneNumber1, status, createdAt 
       FROM salesagent 
       ${whereClause} 
       ORDER BY id DESC 
       LIMIT ? OFFSET ?`,
      [...values, Number(limit), Number(offset)]
    );

    const agents: SalesAgentRecord[] = agentRows.map((row: any) => ({
      id: row.id,
      empId: row.empId,
      firstName: row.firstName,
      lastName: row.lastName,
      email: row.email,
      phoneNumber1: row.phoneNumber1,
      status: row.status,
      createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null,
    }));

    return {
      success: true,
      agents,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      availableStatuses,
    };
  } catch (err: any) {
    console.error('Database query error in getSalesAgentsList:', err);
    return {
      success: false,
      error: err.message || 'Failed to fetch sales agents from database',
      agents: [],
      total: 0,
      page: 1,
      limit,
      totalPages: 1,
      availableStatuses: [],
    };
  } finally {
    if (conn) await conn.end().catch(() => {});
  }
}

export interface ExecuteTriggerParams {
  env: SalesDashEnvironmentKey;
  customApiUrl?: string;
  orderId?: number | null;
  salesAgentId?: number | null;
  title: string;
  message: string;
  eventType: string;
  data?: Record<string, any>;
}

export async function executeTriggerSalesDashNotification(params: ExecuteTriggerParams) {
  const {
    env,
    customApiUrl,
    orderId,
    salesAgentId,
    title,
    message,
    eventType = 'order_placed',
    data = {},
  } = params;

  const baseConfig = SALES_DASH_ENVIRONMENTS[env] || SALES_DASH_ENVIRONMENTS.dev;
  const activeBaseUrl = (customApiUrl || baseConfig.salesDashApiUrl).replace(/\/+$/, '');
  const triggerEndpoint = `${activeBaseUrl}/api/notifications/trigger`;

  const payload: TriggerNotificationPayload = {
    orderId: orderId ? Number(orderId) : null,
    salesAgentId: salesAgentId ? Number(salesAgentId) : null,
    title: title.trim(),
    message: message.trim(),
    eventType: eventType.trim(),
    data: data || {},
  };

  console.log(`📡 [SalesDash Trigger] Target Endpoint: ${triggerEndpoint}`);
  console.log(`📦 [SalesDash Trigger] Request Payload:`, JSON.stringify(payload, null, 2));

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

    console.log(`📥 [SalesDash Trigger] Response Status: ${res.status} (${latencyMs}ms)`);
    console.log(`📥 [SalesDash Trigger] Response Body:`, responseData);

    const isSuccess = res.status >= 200 && res.status < 300;

    const displayMsg = typeof responseData === 'string' && responseData.includes('<pre>')
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
        ? responseData?.message || 'Notification triggered successfully'
        : `Sales Dash API returned HTTP ${res.status}: ${displayMsg}`,
    };
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    console.error(`❌ [SalesDash Trigger] Error:`, err.message);
    return {
      success: false,
      statusCode: 0,
      endpoint: triggerEndpoint,
      latencyMs,
      data: null,
      payloadSent: payload,
      error: err.message,
      message: `Failed to trigger Sales Dash Mobile API: ${err.message}`,
    };
  }
}
