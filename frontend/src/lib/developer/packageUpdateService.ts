import mysql from 'mysql2/promise';
import {
  PackageUpdateEnvironmentKey,
  PackageDbConfig,
  MarketplacePackageRecord,
  PACKAGE_ENVIRONMENTS,
  PackageActionType,
} from './packageUpdateTypes';

export function getPackageDbConfig(
  env: PackageUpdateEnvironmentKey,
  customDb?: Partial<PackageDbConfig>
): PackageDbConfig {
  const base = PACKAGE_ENVIRONMENTS[env]?.db || PACKAGE_ENVIRONMENTS.dev.db;
  return {
    ...base,
    ...(customDb || {}),
  };
}

export async function createPackageDbConnection(
  env: PackageUpdateEnvironmentKey,
  customDb?: Partial<PackageDbConfig>
) {
  const config = getPackageDbConfig(env, customDb);
  return await mysql.createConnection({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    connectTimeout: 8000,
  });
}

export async function testPackageDbConnection(
  env: PackageUpdateEnvironmentKey,
  customDb?: Partial<PackageDbConfig>
) {
  const startTime = Date.now();
  let conn: mysql.Connection | null = null;
  try {
    conn = await createPackageDbConnection(env, customDb);
    const [rows]: [any[], any] = await conn.query('SELECT COUNT(*) as total FROM marketplacepackages');
    const latencyMs = Date.now() - startTime;
    return {
      success: true,
      latencyMs,
      totalPackages: rows[0]?.total ?? 0,
      host: getPackageDbConfig(env, customDb).host,
      database: getPackageDbConfig(env, customDb).database,
    };
  } catch (err: any) {
    return {
      success: false,
      latencyMs: Date.now() - startTime,
      error: err.message || 'Database connection failed',
      host: getPackageDbConfig(env, customDb).host,
      database: getPackageDbConfig(env, customDb).database,
    };
  } finally {
    if (conn) await conn.end().catch(() => {});
  }
}

export interface GetPackagesParams {
  env: PackageUpdateEnvironmentKey;
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
  customDb?: Partial<PackageDbConfig>;
}

export async function getMarketplacePackagesList(params: GetPackagesParams) {
  const { env, search, status, page = 1, limit = 15, customDb } = params;
  let conn: mysql.Connection | null = null;

  try {
    conn = await createPackageDbConnection(env, customDb);

    const conditions: string[] = [];
    const values: any[] = [];

    if (search && search.trim() !== '') {
      const searchTerm = `%${search.trim()}%`;
      conditions.push('(displayName LIKE ? OR description LIKE ? OR id LIKE ?)');
      values.push(searchTerm, searchTerm, searchTerm);
    }

    if (status && status !== 'all' && status.trim() !== '') {
      conditions.push('status = ?');
      values.push(status.trim());
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Total Count
    const [countRows]: [any[], any] = await conn.query(
      `SELECT COUNT(*) as total FROM marketplacepackages ${whereClause}`,
      values
    );
    const total = countRows[0]?.total ?? 0;

    // Distinct Statuses
    const [statusRows]: [any[], any] = await conn.query(
      `SELECT DISTINCT status FROM marketplacepackages WHERE status IS NOT NULL AND status != '' ORDER BY status ASC`
    );
    const availableStatuses = statusRows.map((r) => r.status);

    // Paginated records
    const offset = (page - 1) * limit;
    const [pkgRows]: [any[], any] = await conn.query(
      `SELECT id, displayName, status, isValid, productPrice, packageType, description, created_at 
       FROM marketplacepackages 
       ${whereClause} 
       ORDER BY id DESC 
       LIMIT ? OFFSET ?`,
      [...values, Number(limit), Number(offset)]
    );

    const packages: MarketplacePackageRecord[] = pkgRows.map((row: any) => ({
      id: row.id,
      displayName: row.displayName,
      status: row.status,
      isValid: row.isValid,
      productPrice: row.productPrice,
      packageType: row.packageType,
      description: row.description,
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
    }));

    return {
      success: true,
      packages,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      availableStatuses,
    };
  } catch (err: any) {
    console.error('Database query error in getMarketplacePackagesList:', err);
    return {
      success: false,
      error: err.message || 'Failed to fetch packages from database',
      packages: [],
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

export interface ExecutePackageUpdateParams {
  env: PackageUpdateEnvironmentKey;
  action: PackageActionType;
  packageId: number;
  extra?: Record<string, any>;
  notifySalesDash?: boolean;
  notifyPolygon?: boolean;
  customSalesDashUrl?: string;
  customPolygonUrl?: string;
}

export async function executePackageUpdateNotification(params: ExecutePackageUpdateParams) {
  const {
    env,
    action,
    packageId,
    extra = {},
    notifySalesDash = true,
    notifyPolygon = true,
    customSalesDashUrl,
    customPolygonUrl,
  } = params;

  const baseConfig = PACKAGE_ENVIRONMENTS[env] || PACKAGE_ENVIRONMENTS.dev;
  const activeSalesDashBase = (customSalesDashUrl || baseConfig.salesDashApiUrl).replace(/\/+$/, '');
  const activePolygonBase = (customPolygonUrl || baseConfig.polygonApiUrl).replace(/\/+$/, '');

  const salesDashEndpoint = `${activeSalesDashBase}/api/packages/notify-update`;
  const polygonEndpoint = `${activePolygonBase}/api/product/notify-update`;

  const payload = {
    action,
    packageId: Number(packageId),
    timestamp: new Date().toISOString(),
    ...extra,
  };

  const tasks: Promise<any>[] = [];

  // 1. Task: Sales Dash API
  if (notifySalesDash) {
    tasks.push(
      (async () => {
        const start = Date.now();
        console.log(`📡 [SalesDash Package Notify] Sending to: ${salesDashEndpoint}`);
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 6000);
          const res = await fetch(salesDashEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify(payload),
            signal: controller.signal,
          });
          clearTimeout(timer);
          const latency = Date.now() - start;
          const rawText = await res.text();
          let data: any = null;
          try {
            data = JSON.parse(rawText);
          } catch {
            data = rawText;
          }

          const isSuccess = res.status >= 200 && res.status < 300;
          const displayMsg = typeof data === 'string' && data.includes('<pre>')
            ? data.replace(/<[^>]*>?/gm, '').trim()
            : typeof data === 'object'
            ? data?.message || JSON.stringify(data)
            : String(data || '');

          return {
            target: 'salesdash',
            name: 'Sales Dash Mobile API',
            endpoint: salesDashEndpoint,
            success: isSuccess,
            statusCode: res.status,
            latencyMs: latency,
            data,
            message: isSuccess ? data?.message || 'Cache refreshed & WebSocket emitted' : `HTTP ${res.status}: ${displayMsg}`,
          };
        } catch (err: any) {
          return {
            target: 'salesdash',
            name: 'Sales Dash Mobile API',
            endpoint: salesDashEndpoint,
            success: false,
            statusCode: 0,
            latencyMs: Date.now() - start,
            data: null,
            error: err.message,
            message: `Connection failed: ${err.message}`,
          };
        }
      })()
    );
  }

  // 2. Task: Polygon (GoviMart) API
  if (notifyPolygon) {
    tasks.push(
      (async () => {
        const start = Date.now();
        console.log(`📡 [Polygon Package Notify] Sending to: ${polygonEndpoint}`);
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 6000);
          const res = await fetch(polygonEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify(payload),
            signal: controller.signal,
          });
          clearTimeout(timer);
          const latency = Date.now() - start;
          const rawText = await res.text();
          let data: any = null;
          try {
            data = JSON.parse(rawText);
          } catch {
            data = rawText;
          }

          const isSuccess = res.status >= 200 && res.status < 300;
          const displayMsg = typeof data === 'string' && data.includes('<pre>')
            ? data.replace(/<[^>]*>?/gm, '').trim()
            : typeof data === 'object'
            ? data?.message || JSON.stringify(data)
            : String(data || '');

          return {
            target: 'polygon',
            name: 'Polygon (GoviMart) Mobile API',
            endpoint: polygonEndpoint,
            success: isSuccess,
            statusCode: res.status,
            latencyMs: latency,
            data,
            message: isSuccess ? data?.message || 'Catalog updated & WebSocket emitted' : `HTTP ${res.status}: ${displayMsg}`,
          };
        } catch (err: any) {
          return {
            target: 'polygon',
            name: 'Polygon (GoviMart) Mobile API',
            endpoint: polygonEndpoint,
            success: false,
            statusCode: 0,
            latencyMs: Date.now() - start,
            data: null,
            error: err.message,
            message: `Connection failed: ${err.message}`,
          };
        }
      })()
    );
  }

  const results = await Promise.allSettled(tasks);
  const targets = results.map((r) => (r.status === 'fulfilled' ? r.value : null)).filter(Boolean);

  const overallSuccess = targets.some((t) => t.success);

  return {
    success: overallSuccess,
    action,
    packageId: Number(packageId),
    payloadSent: payload,
    targets,
  };
}

export interface UpdatePackageStatusParams {
  env: PackageUpdateEnvironmentKey;
  packageId: number;
  newStatus: 'Enabled' | 'Disabled';
  notifySalesDash?: boolean;
  notifyPolygon?: boolean;
  customSalesDashUrl?: string;
  customPolygonUrl?: string;
  customDb?: Partial<PackageDbConfig>;
}

export async function updatePackageStatusInDb(
  env: PackageUpdateEnvironmentKey,
  packageId: number,
  newStatus: 'Enabled' | 'Disabled',
  customDb?: Partial<PackageDbConfig>
) {
  let conn: mysql.Connection | null = null;
  try {
    conn = await createPackageDbConnection(env, customDb);
    const [result]: [any, any] = await conn.query(
      'UPDATE marketplacepackages SET status = ?, isValid = ? WHERE id = ?',
      [newStatus, newStatus === 'Enabled' ? 1 : 0, Number(packageId)]
    );
    return {
      success: true,
      affectedRows: result.affectedRows,
      packageId: Number(packageId),
      newStatus,
    };
  } catch (err: any) {
    console.error('Error updating package status in DB:', err);
    return {
      success: false,
      error: err.message || 'Database update failed',
      packageId: Number(packageId),
      newStatus,
    };
  } finally {
    if (conn) await conn.end().catch(() => {});
  }
}

export async function updatePackageStatusAndNotify(params: UpdatePackageStatusParams) {
  const {
    env,
    packageId,
    newStatus,
    notifySalesDash = true,
    notifyPolygon = true,
    customSalesDashUrl,
    customPolygonUrl,
    customDb,
  } = params;

  // 1. Update Database
  const dbResult = await updatePackageStatusInDb(env, packageId, newStatus, customDb);

  // 2. Broadcast Webhook Notification to Mobile APIs
  const broadcastResult = await executePackageUpdateNotification({
    env,
    action: 'status_change',
    packageId,
    extra: {
      status: newStatus,
      isValid: newStatus === 'Enabled' ? 1 : 0,
    },
    notifySalesDash,
    notifyPolygon,
    customSalesDashUrl,
    customPolygonUrl,
  });

  return {
    success: dbResult.success && broadcastResult.success,
    packageId: Number(packageId),
    newStatus,
    dbResult,
    broadcastResult,
  };
}
