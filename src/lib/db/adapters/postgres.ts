import { Client, ClientConfig } from 'pg';
import { ColumnInfo, DbConnectionConfig, TableInfo, TablePreviewData } from '../types';

function createPgConfig(config: DbConnectionConfig, databaseOverride?: string): ClientConfig {
  if (config.connectionString && config.connectionString.trim() !== '') {
    const connStr = config.connectionString.trim();
    return {
      connectionString: connStr,
      ssl: config.ssl ? { rejectUnauthorized: false } : undefined,
    };
  }

  return {
    host: config.host || 'localhost',
    port: config.port ? Number(config.port) : 5432,
    user: config.user || 'postgres',
    password: config.password || '',
    database: databaseOverride || config.database || 'postgres',
    ssl: config.ssl ? { rejectUnauthorized: false } : undefined,
    connectionTimeoutMillis: 10000,
  };
}

async function withPgClient<T>(
  config: DbConnectionConfig,
  databaseOverride: string | undefined,
  fn: (client: Client) => Promise<T>
): Promise<T> {
  const client = new Client(createPgConfig(config, databaseOverride));
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end().catch(() => {});
  }
}

export async function testPostgresConnection(config: DbConnectionConfig) {
  const startTime = Date.now();
  return withPgClient(config, undefined, async (client) => {
    const res = await client.query('SELECT version();');
    const latency = Date.now() - startTime;
    return {
      success: true,
      message: 'PostgreSQL connection successful!',
      version: res.rows[0]?.version || 'PostgreSQL',
      latencyMs: latency,
    };
  });
}

export async function listPostgresDatabases(config: DbConnectionConfig): Promise<string[]> {
  return withPgClient(config, undefined, async (client) => {
    const res = await client.query(
      `SELECT datname FROM pg_database 
       WHERE datistemplate = false AND datallowconn = true 
       ORDER BY datname ASC;`
    );
    return res.rows.map((r) => r.datname);
  });
}

export async function listPostgresTables(
  config: DbConnectionConfig,
  database?: string
): Promise<TableInfo[]> {
  return withPgClient(config, database, async (client) => {
    const query = `
      SELECT 
        t.table_schema,
        t.table_name,
        COALESCE(c.reltuples, 0)::bigint as estimated_rows
      FROM information_schema.tables t
      LEFT JOIN pg_namespace n ON n.nspname = t.table_schema
      LEFT JOIN pg_class c ON c.relname = t.table_name AND c.relnamespace = n.oid
      WHERE t.table_schema NOT IN ('information_schema', 'pg_catalog')
        AND t.table_type = 'BASE TABLE'
      ORDER BY t.table_schema, t.table_name;
    `;

    const res = await client.query(query);
    return res.rows.map((row) => ({
      name: row.table_name,
      schema: row.table_schema,
      rowCount: Math.max(0, parseInt(row.estimated_rows, 10) || 0),
    }));
  });
}

export async function getPostgresColumns(
  config: DbConnectionConfig,
  tableName: string,
  schema: string = 'public',
  database?: string
): Promise<ColumnInfo[]> {
  return withPgClient(config, database, async (client) => {
    const query = `
      SELECT 
        c.column_name,
        c.data_type,
        c.is_nullable,
        c.column_default,
        CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END as is_primary_key
      FROM information_schema.columns c
      LEFT JOIN (
        SELECT kcu.table_schema, kcu.table_name, kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
          ON tc.constraint_name = kcu.constraint_name 
          AND tc.table_schema = kcu.table_schema
        WHERE tc.constraint_type = 'PRIMARY KEY'
      ) pk ON pk.table_schema = c.table_schema AND pk.table_name = c.table_name AND pk.column_name = c.column_name
      WHERE c.table_schema = $1 AND c.table_name = $2
      ORDER BY c.ordinal_position;
    `;

    const res = await client.query(query, [schema, tableName]);
    return res.rows.map((r) => ({
      name: r.column_name,
      type: r.data_type,
      nullable: r.is_nullable === 'YES',
      isPrimaryKey: Boolean(r.is_primary_key),
      defaultValue: r.column_default,
    }));
  });
}

export async function getPostgresTablePreview(
  config: DbConnectionConfig,
  tableName: string,
  options: { page: number; pageSize: number; schema?: string; database?: string }
): Promise<TablePreviewData> {
  const schema = options.schema || 'public';
  const page = Math.max(1, options.page);
  const pageSize = Math.min(100, Math.max(1, options.pageSize));
  const offset = (page - 1) * pageSize;

  return withPgClient(config, options.database, async (client) => {
    const columns = await getPostgresColumns(config, tableName, schema, options.database);

    // Escape identifiers safely
    const safeTable = `"${schema.replace(/"/g, '""')}"."${tableName.replace(/"/g, '""')}"`;

    const countRes = await client.query(`SELECT count(*)::bigint as total FROM ${safeTable}`);
    const totalRows = parseInt(countRes.rows[0]?.total || '0', 10);

    const dataRes = await client.query(`SELECT * FROM ${safeTable} LIMIT $1 OFFSET $2`, [
      pageSize,
      offset,
    ]);

    return {
      tableName,
      columns,
      rows: dataRes.rows,
      totalRows,
      page,
      pageSize,
    };
  });
}

export async function getAllPostgresTableData(
  config: DbConnectionConfig,
  tableName: string,
  schema: string = 'public',
  database?: string
): Promise<{ columns: ColumnInfo[]; rows: Record<string, any>[] }> {
  return withPgClient(config, database, async (client) => {
    const columns = await getPostgresColumns(config, tableName, schema, database);
    const safeTable = `"${schema.replace(/"/g, '""')}"."${tableName.replace(/"/g, '""')}"`;
    const res = await client.query(`SELECT * FROM ${safeTable}`);
    return {
      columns,
      rows: res.rows,
    };
  });
}
