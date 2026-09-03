import mysql, { ConnectionOptions } from 'mysql2/promise';
import { ColumnInfo, DbConnectionConfig, TableInfo, TablePreviewData } from '../types';

function createMysqlConfig(config: DbConnectionConfig, databaseOverride?: string): ConnectionOptions {
  if (config.connectionString && config.connectionString.trim() !== '') {
    return {
      uri: config.connectionString.trim(),
      ssl: config.ssl ? { rejectUnauthorized: false } : undefined,
    };
  }

  return {
    host: config.host || 'localhost',
    port: config.port ? Number(config.port) : 3306,
    user: config.user || 'root',
    password: config.password || '',
    database: databaseOverride || config.database || undefined,
    ssl: config.ssl ? { rejectUnauthorized: false } : undefined,
    connectTimeout: 10000,
  };
}

async function withMysqlConnection<T>(
  config: DbConnectionConfig,
  databaseOverride: string | undefined,
  fn: (connection: mysql.Connection) => Promise<T>
): Promise<T> {
  const connection = await mysql.createConnection(createMysqlConfig(config, databaseOverride));
  try {
    return await fn(connection);
  } finally {
    await connection.end().catch(() => {});
  }
}

export async function testMysqlConnection(config: DbConnectionConfig) {
  const startTime = Date.now();
  return withMysqlConnection(config, undefined, async (conn) => {
    const [rows]: any = await conn.query('SELECT VERSION() as version;');
    const latency = Date.now() - startTime;
    return {
      success: true,
      message: 'MySQL connection successful!',
      version: rows?.[0]?.version || 'MySQL',
      latencyMs: latency,
    };
  });
}

export async function listMysqlDatabases(config: DbConnectionConfig): Promise<string[]> {
  return withMysqlConnection(config, undefined, async (conn) => {
    const [rows]: any = await conn.query('SHOW DATABASES;');
    const systemDbs = ['information_schema', 'mysql', 'performance_schema', 'sys'];
    return rows
      .map((r: any) => r.Database || Object.values(r)[0])
      .filter((db: string) => !systemDbs.includes(db.toLowerCase()));
  });
}

export async function listMysqlTables(
  config: DbConnectionConfig,
  database?: string
): Promise<TableInfo[]> {
  const targetDb = database || config.database;
  if (!targetDb) {
    throw new Error('Please specify a database name for MySQL.');
  }

  return withMysqlConnection(config, targetDb, async (conn) => {
    const query = `
      SELECT 
        TABLE_NAME as name,
        TABLE_SCHEMA as \`schema\`,
        COALESCE(TABLE_ROWS, 0) as rowCount
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = ?
        AND TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME ASC;
    `;

    const [rows]: any = await conn.query(query, [targetDb]);
    return rows.map((r: any) => ({
      name: r.name,
      schema: r.schema,
      rowCount: Number(r.rowCount) || 0,
    }));
  });
}

export async function getMysqlColumns(
  config: DbConnectionConfig,
  tableName: string,
  database?: string
): Promise<ColumnInfo[]> {
  const targetDb = database || config.database;
  if (!targetDb) {
    throw new Error('Please specify a database name for MySQL.');
  }

  return withMysqlConnection(config, targetDb, async (conn) => {
    const query = `
      SELECT 
        COLUMN_NAME as name,
        DATA_TYPE as type,
        IS_NULLABLE as nullable,
        COLUMN_DEFAULT as defaultValue,
        COLUMN_KEY as columnKey
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
      ORDER BY ORDINAL_POSITION ASC;
    `;

    const [rows]: any = await conn.query(query, [targetDb, tableName]);
    return rows.map((r: any) => ({
      name: r.name,
      type: r.type,
      nullable: r.nullable === 'YES',
      isPrimaryKey: r.columnKey === 'PRI',
      defaultValue: r.defaultValue,
    }));
  });
}

export async function getMysqlTablePreview(
  config: DbConnectionConfig,
  tableName: string,
  options: { page: number; pageSize: number; database?: string }
): Promise<TablePreviewData> {
  const targetDb = options.database || config.database;
  if (!targetDb) {
    throw new Error('Please specify a database name for MySQL.');
  }

  const page = Math.max(1, options.page);
  const pageSize = Math.min(100, Math.max(1, options.pageSize));
  const offset = (page - 1) * pageSize;

  return withMysqlConnection(config, targetDb, async (conn) => {
    const columns = await getMysqlColumns(config, tableName, targetDb);

    const safeDb = targetDb.replace(/`/g, '``');
    const safeTable = tableName.replace(/`/g, '``');
    const fullTable = `\`${safeDb}\`.\`${safeTable}\``;

    const [countRows]: any = await conn.query(`SELECT COUNT(*) as total FROM ${fullTable};`);
    const totalRows = Number(countRows?.[0]?.total || 0);

    const [dataRows]: any = await conn.query(
      `SELECT * FROM ${fullTable} LIMIT ? OFFSET ?;`,
      [pageSize, offset]
    );

    return {
      tableName,
      columns,
      rows: Array.isArray(dataRows) ? dataRows : [],
      totalRows,
      page,
      pageSize,
    };
  });
}

export async function getAllMysqlTableData(
  config: DbConnectionConfig,
  tableName: string,
  database?: string
): Promise<{ columns: ColumnInfo[]; rows: Record<string, any>[] }> {
  const targetDb = database || config.database;
  if (!targetDb) {
    throw new Error('Please specify a database name for MySQL.');
  }

  return withMysqlConnection(config, targetDb, async (conn) => {
    const columns = await getMysqlColumns(config, tableName, targetDb);
    const safeDb = targetDb.replace(/`/g, '``');
    const safeTable = tableName.replace(/`/g, '``');
    const fullTable = `\`${safeDb}\`.\`${safeTable}\``;

    const [rows]: any = await conn.query(`SELECT * FROM ${fullTable};`);
    return {
      columns,
      rows: Array.isArray(rows) ? rows : [],
    };
  });
}
