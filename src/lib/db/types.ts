export type DbType = 'postgres' | 'mysql';

export interface DbConnectionConfig {
  type: DbType;
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
  ssl?: boolean;
  connectionString?: string;
}

export interface TableInfo {
  name: string;
  schema?: string;
  rowCount?: number;
  columnCount?: number;
  sizeFormatted?: string;
}

export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  isPrimaryKey?: boolean;
  defaultValue?: string | null;
}

export interface TablePreviewData {
  tableName: string;
  columns: ColumnInfo[];
  rows: Record<string, any>[];
  totalRows: number;
  page: number;
  pageSize: number;
}

export interface TableExportPayload {
  tableName: string;
  columns: ColumnInfo[];
  rows: Record<string, any>[];
}

export interface SavedConnection {
  id: string;
  name: string;
  config: DbConnectionConfig;
  lastConnectedAt?: string;
}
