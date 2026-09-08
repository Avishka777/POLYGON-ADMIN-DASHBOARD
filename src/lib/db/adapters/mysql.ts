import mysql, { ConnectionOptions } from 'mysql2/promise';
import { ColumnInfo, DbConnectionConfig, TableInfo, TablePreviewData, TableRelationship } from '../types';

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

export async function getMysqlForeignKeys(
  config: DbConnectionConfig,
  database?: string,
  tableName?: string
): Promise<TableRelationship[]> {
  const targetDb = database || config.database;
  if (!targetDb) return [];

  return withMysqlConnection(config, targetDb, async (conn) => {
    let query = `
      SELECT 
        CONSTRAINT_NAME as constraintName,
        TABLE_NAME as sourceTable,
        COLUMN_NAME as sourceColumn,
        REFERENCED_TABLE_NAME as targetTable,
        REFERENCED_COLUMN_NAME as targetColumn
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = ? 
        AND REFERENCED_TABLE_NAME IS NOT NULL
    `;
    const params: any[] = [targetDb];

    if (tableName) {
      query += ` AND (TABLE_NAME = ? OR REFERENCED_TABLE_NAME = ?)`;
      params.push(tableName, tableName);
    }

    query += ` ORDER BY TABLE_NAME, CONSTRAINT_NAME;`;

    const [rows]: any = await conn.query(query, params);
    return (rows || []).map((r: any) => ({
      constraintName: r.constraintName,
      sourceTable: r.sourceTable,
      sourceColumn: r.sourceColumn,
      targetTable: r.targetTable,
      targetColumn: r.targetColumn,
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
    const colQuery = `
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

    const [colRows]: any = await conn.query(colQuery, [targetDb, tableName]);

    // Fetch FK constraints for this table
    const fkQuery = `
      SELECT 
        CONSTRAINT_NAME as constraintName,
        COLUMN_NAME as columnName,
        REFERENCED_TABLE_NAME as foreignTable,
        REFERENCED_COLUMN_NAME as foreignColumn
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND REFERENCED_TABLE_NAME IS NOT NULL;
    `;
    const [fkRows]: any = await conn.query(fkQuery, [targetDb, tableName]);

    const fkMap = new Map<string, any>();
    if (Array.isArray(fkRows)) {
      fkRows.forEach((r: any) => {
        fkMap.set(r.columnName, {
          constraintName: r.constraintName,
          columnName: r.columnName,
          foreignTable: r.foreignTable,
          foreignColumn: r.foreignColumn,
        });
      });
    }

    return colRows.map((r: any) => {
      const fk = fkMap.get(r.name);
      return {
        name: r.name,
        type: r.type,
        nullable: r.nullable === 'YES',
        isPrimaryKey: r.columnKey === 'PRI',
        isForeignKey: Boolean(fk),
        foreignKeyInfo: fk,
        defaultValue: r.defaultValue,
      };
    });
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
    const relationships = await getMysqlForeignKeys(config, targetDb, tableName);

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
      relationships,
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
