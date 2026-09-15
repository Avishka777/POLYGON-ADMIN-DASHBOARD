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

export interface ForeignKeyInfo {
  constraintName: string;
  columnName: string;
  foreignTable: string;
  foreignColumn: string;
}

export interface TableRelationship {
  constraintName: string;
  sourceTable: string;
  sourceColumn: string;
  targetTable: string;
  targetColumn: string;
}

export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
  foreignKeyInfo?: ForeignKeyInfo;
  defaultValue?: string | null;
}

export interface TablePreviewData {
  tableName: string;
  columns: ColumnInfo[];
  rows: Record<string, any>[];
  totalRows: number;
  page: number;
  pageSize: number;
  relationships?: TableRelationship[];
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
