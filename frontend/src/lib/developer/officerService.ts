import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import {
  EnvironmentKey,
  DbConfig,
  EnvironmentUrls,
  OfficerEnvironmentConfig,
  ENVIRONMENTS,
  OfficerRecord,
} from './officerTypes';

export {
  type EnvironmentKey,
  type DbConfig,
  type EnvironmentUrls,
  type OfficerEnvironmentConfig,
  ENVIRONMENTS,
  type OfficerRecord,
};


export interface GetOfficersParams {
  env: EnvironmentKey;
  search?: string;
  status?: string;
  jobRole?: string;
  page?: number;
  limit?: number;
  customDb?: Partial<DbConfig>;
}

export function getDbConnectionConfig(env: EnvironmentKey, customDb?: Partial<DbConfig>): DbConfig {
  const base = ENVIRONMENTS[env]?.db || ENVIRONMENTS.dev.db;
  return {
    ...base,
    ...(customDb || {}),
  };
}

export async function createDbConnection(env: EnvironmentKey, customDb?: Partial<DbConfig>) {
  const config = getDbConnectionConfig(env, customDb);
  return await mysql.createConnection({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    connectTimeout: 8000,
  });
}

export async function testDbConnection(env: EnvironmentKey, customDb?: Partial<DbConfig>) {
  const startTime = Date.now();
  let conn: mysql.Connection | null = null;
  try {
    conn = await createDbConnection(env, customDb);
    const [rows]: [any[], any] = await conn.query('SELECT COUNT(*) as total FROM collectionofficer');
    const latencyMs = Date.now() - startTime;
    return {
      success: true,
      latencyMs,
      totalOfficers: rows[0]?.total ?? 0,
      host: getDbConnectionConfig(env, customDb).host,
      database: getDbConnectionConfig(env, customDb).database,
    };
  } catch (err: any) {
    return {
      success: false,
      latencyMs: Date.now() - startTime,
      error: err.message || 'Database connection failed',
      host: getDbConnectionConfig(env, customDb).host,
      database: getDbConnectionConfig(env, customDb).database,
    };
  } finally {
    if (conn) await conn.end().catch(() => {});
  }
}

export async function getOfficersList(params: GetOfficersParams) {
  const { env, search, status, jobRole, page = 1, limit = 20, customDb } = params;
  let conn: mysql.Connection | null = null;

  try {
    conn = await createDbConnection(env, customDb);

    const conditions: string[] = [];
    const values: any[] = [];

    if (search && search.trim() !== '') {
      const searchTerm = `%${search.trim()}%`;
      conditions.push(
        '(empId LIKE ? OR firstNameEnglish LIKE ? OR lastNameEnglish LIKE ? OR email LIKE ? OR phoneNumber01 LIKE ?)'
      );
      values.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (status && status !== 'all' && status.trim() !== '') {
      conditions.push('status = ?');
      values.push(status.trim());
    }

    if (jobRole && jobRole !== 'all' && jobRole.trim() !== '') {
      conditions.push('jobRole = ?');
      values.push(jobRole.trim());
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 1. Get total matching count
    const [countRows]: [any[], any] = await conn.query(
      `SELECT COUNT(*) as total FROM collectionofficer ${whereClause}`,
      values
    );
    const total = countRows[0]?.total ?? 0;

    // 2. Query paginated records
    const offset = Math.max(0, (page - 1) * limit);
    const querySql = `
      SELECT 
        id, 
        empId, 
        firstNameEnglish, 
        lastNameEnglish, 
        jobRole, 
        email, 
        phoneNumber01, 
        status, 
        passwordUpdated, 
        onlineStatus, 
        createdAt 
      FROM collectionofficer 
      ${whereClause} 
      ORDER BY id DESC 
      LIMIT ? OFFSET ?
    `;

    const [rows]: [any[], any] = await conn.query(querySql, [...values, limit, offset]);

    // 3. Get distinct statuses and job roles for filter dropdowns
    const [statusRows]: [any[], any] = await conn.query(
      'SELECT DISTINCT status FROM collectionofficer WHERE status IS NOT NULL AND status != ""'
    );
    const [roleRows]: [any[], any] = await conn.query(
      'SELECT DISTINCT jobRole FROM collectionofficer WHERE jobRole IS NOT NULL AND jobRole != "" ORDER BY jobRole ASC'
    );

    return {
      success: true,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      officers: rows as OfficerRecord[],
      availableStatuses: statusRows.map((r) => r.status.trim()).filter(Boolean),
      availableRoles: roleRows.map((r) => r.jobRole.trim()).filter(Boolean),
    };
  } finally {
    if (conn) await conn.end().catch(() => {});
  }
}

export async function getOfficerById(env: EnvironmentKey, id: number | string, customDb?: Partial<DbConfig>) {
  let conn: mysql.Connection | null = null;
  try {
    conn = await createDbConnection(env, customDb);
    const [rows]: [any[], any] = await conn.query(
      `SELECT id, empId, firstNameEnglish, lastNameEnglish, jobRole, email, phoneNumber01, status, passwordUpdated, onlineStatus, createdAt
       FROM collectionofficer WHERE id = ? LIMIT 1`,
      [id]
    );
    if (!rows || rows.length === 0) return null;
    return rows[0] as OfficerRecord;
  } finally {
    if (conn) await conn.end().catch(() => {});
  }
}

export interface UpdateStatusOptions {
  env: EnvironmentKey;
  id: number | string;
  status: string;
  customPassword?: string;
  sendEmail?: boolean;
  collectorApiUrl?: string;
  transporterApiUrl?: string;
  customDb?: Partial<DbConfig>;
}

export interface SyncResult {
  target: 'transporter' | 'collector' | 'none';
  endpoint?: string;
  success: boolean;
  statusCode?: number;
  message?: string;
  data?: any;
}

export async function executeUpdateStatusAndSendPassword(options: UpdateStatusOptions) {
  const {
    env,
    id,
    status,
    customPassword,
    sendEmail = false,
    collectorApiUrl,
    transporterApiUrl,
    customDb,
  } = options;

  if (!id || !status) {
    throw new Error('ID and status are required.');
  }

  const envConfig = ENVIRONMENTS[env] || ENVIRONMENTS.dev;
  const activeCollectorUrl = (collectorApiUrl || envConfig.urls.collectorApiUrl).replace(/\/+$/, '');
  const activeTransporterUrl = (transporterApiUrl || envConfig.urls.transporterApiUrl).replace(/\/+$/, '');

  let conn: mysql.Connection | null = null;

  try {
    conn = await createDbConnection(env, customDb);

    // 1. Fetch officer details including jobRole
    const [officerRows]: [any[], any] = await conn.query(
      `SELECT id, email, firstNameEnglish, empId, jobRole FROM collectionofficer WHERE id = ? LIMIT 1`,
      [id]
    );

    if (!officerRows || officerRows.length === 0) {
      throw new Error(`Collection officer with ID '${id}' not found.`);
    }

    const officerData = officerRows[0];
    const { email, firstNameEnglish, empId, jobRole } = officerData;

    // Generate random password or use custom password & hash
    const generatedPassword = customPassword && customPassword.trim().length > 0
      ? customPassword.trim()
      : Math.random().toString(36).slice(-8);

    const hashedPassword = await bcrypt.hash(generatedPassword, 10);

    // If status is 'Approved' and sendEmail requested
    let emailResult = { success: true, attempted: false, message: 'Email sending skipped' };
    if (status === 'Approved' && sendEmail) {
      // In development/admin console, if email is simulated or requested:
      emailResult = {
        success: true,
        attempted: true,
        message: `Password notification prepared for ${email || 'officer'}.`,
      };
    }

    // 2. Update status and password in the database
    const [updateResult]: [any, any] = await conn.query(
      `UPDATE collectionofficer SET status = ?, password = ?, passwordUpdated = 1 WHERE id = ?`,
      [status, hashedPassword, id]
    );

    if (updateResult.affectedRows === 0) {
      throw new Error('Failed to update status and password in database. No rows affected.');
    }

    // 3a. ONLY call Transporter Mobile API if user is a Driver (2 roles)
    const isDriver =
      jobRole === 'Light Weight Driver' ||
      jobRole === 'Heavy Weight Driver';

    let syncResult: SyncResult = {
      target: 'none',
      success: true,
      message: `No mobile API sync needed for role: ${jobRole}`,
    };

    if (isDriver) {
      const notifyEndpoint = `${activeTransporterUrl}/api/auth/notify-status-changed`;
      syncResult = {
        target: 'transporter',
        endpoint: notifyEndpoint,
        success: false,
      };

      try {
        const payload = { userId: Number(id) };
        console.log(`📡 [Transporter Sync] Sending POST to: ${notifyEndpoint}`);
        console.log(`📦 [Transporter Sync] Request Payload:`, JSON.stringify(payload, null, 2));

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        const res = await fetch(notifyEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        let data: any = null;
        const rawText = await res.text();
        try {
          data = JSON.parse(rawText);
        } catch {
          data = rawText;
        }

        console.log(`📥 [Transporter Sync] Response status: ${res.status}`);
        console.log(`📥 [Transporter Sync] Response body:`, data);

        syncResult.statusCode = res.status;
        syncResult.data = data;
        syncResult.success = res.status >= 200 && res.status < 300;
        syncResult.message = syncResult.success
          ? 'Transporter Mobile API notified successfully'
          : `Transporter API returned HTTP ${res.status}`;
      } catch (syncErr: any) {
        syncResult.success = false;
        syncResult.message = `Could not notify Transporter Mobile API: ${syncErr.message}`;
      }
    }

    // 3b. Call Collector Mobile API if user is in any of the 4 Collector/Distribution roles
    const isCollectorOrDistribution =
      jobRole === 'Collection Officer' ||
      jobRole === 'Collection Centre Manager' ||
      jobRole === 'Distribution Officer' ||
      jobRole === 'Distribution Centre Manager';

    if (isCollectorOrDistribution) {
      const notifyEndpoint = `${activeCollectorUrl}/api/auth/notify-status-changed`;
      syncResult = {
        target: 'collector',
        endpoint: notifyEndpoint,
        success: false,
      };

      try {
        const payload = { userId: Number(id) };
        console.log(`📡 [Collector Sync] Sending POST to: ${notifyEndpoint}`);
        console.log(`📦 [Collector Sync] Request Payload:`, JSON.stringify(payload, null, 2));

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        const res = await fetch(notifyEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        let data: any = null;
        const rawText = await res.text();
        try {
          data = JSON.parse(rawText);
        } catch {
          data = rawText;
        }

        console.log(`📥 [Collector Sync] Response status: ${res.status}`);
        console.log(`📥 [Collector Sync] Response body:`, data);

        syncResult.statusCode = res.status;
        syncResult.data = data;
        syncResult.success = res.status >= 200 && res.status < 300;
        syncResult.message = syncResult.success
          ? 'Collector Mobile API notified successfully'
          : `Collector API returned HTTP ${res.status}`;
      } catch (syncErr: any) {
        syncResult.success = false;
        syncResult.message = `Could not notify Collector Mobile API: ${syncErr.message}`;
      }
    }

    return {
      message: 'Status updated and password updated successfully.',
      status: true,
      data: {
        id: Number(id),
        empId,
        email,
        firstNameEnglish,
        jobRole,
        newStatus: status,
        plainPassword: generatedPassword,
        emailResult,
        syncResult,
        environment: env,
      },
    };
  } finally {
    if (conn) await conn.end().catch(() => {});
  }
}
