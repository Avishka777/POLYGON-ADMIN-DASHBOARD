import {
  getAllPostgresTableData,
  getPostgresTablePreview,
  listPostgresDatabases,
  listPostgresTables,
  testPostgresConnection,
} from './adapters/postgres';
import {
  getAllMysqlTableData,
  getMysqlForeignKeys,
  getMysqlTablePreview,
  listMysqlDatabases,
  listMysqlTables,
  testMysqlConnection,
} from './adapters/mysql';
import { DbConnectionConfig, TableInfo, TablePreviewData, TableRelationship } from './types';

export async function testConnection(config: DbConnectionConfig) {
  if (config.type === 'postgres') {
    return await testPostgresConnection(config);
  } else if (config.type === 'mysql') {
    return await testMysqlConnection(config);
  }
  throw new Error(`Unsupported database type: ${config.type}`);
}

export async function listDatabases(config: DbConnectionConfig): Promise<string[]> {
  if (config.type === 'postgres') {
    return await listPostgresDatabases(config);
  } else if (config.type === 'mysql') {
    return await listMysqlDatabases(config);
  }
  throw new Error(`Unsupported database type: ${config.type}`);
}

export async function listTables(
  config: DbConnectionConfig,
  database?: string
): Promise<TableInfo[]> {
  if (config.type === 'postgres') {
    return await listPostgresTables(config, database);
  } else if (config.type === 'mysql') {
    return await listMysqlTables(config, database);
  }
  throw new Error(`Unsupported database type: ${config.type}`);
}

export async function getForeignKeys(
  config: DbConnectionConfig,
  database?: string,
  tableName?: string
): Promise<TableRelationship[]> {
  if (config.type === 'mysql') {
    return await getMysqlForeignKeys(config, database, tableName);
  }
  return [];
}

export async function getTablePreview(
  config: DbConnectionConfig,
  tableName: string,
  options: { page: number; pageSize: number; schema?: string; database?: string }
): Promise<TablePreviewData> {
  if (config.type === 'postgres') {
    return await getPostgresTablePreview(config, tableName, options);
  } else if (config.type === 'mysql') {
    return await getMysqlTablePreview(config, tableName, options);
  }
  throw new Error(`Unsupported database type: ${config.type}`);
}

export async function getAllTableData(
  config: DbConnectionConfig,
  tableName: string,
  schema?: string,
  database?: string
) {
  if (config.type === 'postgres') {
    return await getAllPostgresTableData(config, tableName, schema, database);
  } else if (config.type === 'mysql') {
    return await getAllMysqlTableData(config, tableName, database);
  }
  throw new Error(`Unsupported database type: ${config.type}`);
}
