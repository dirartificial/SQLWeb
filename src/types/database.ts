export type SqliteDataType = 'INTEGER' | 'TEXT' | 'REAL' | 'DATE' | 'BOOLEAN';

export type SqlValue = number | string | Uint8Array | null | boolean;

export interface ColumnDefinition {
  name: string;
  type: SqliteDataType;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  foreignKeyTable?: string;
  foreignKeyColumn?: string;
  isNullable: boolean;
  defaultValue?: string | number | null;
}

export interface ForeignKeyDefinition {
  columnName: string;
  targetTable: string;
  targetColumn: string;
}

export interface TableDefinition {
  name: string;
  columns: ColumnDefinition[];
  foreignKeys?: ForeignKeyDefinition[];
}

export interface QueryResult {
  columns: string[];
  values: SqlValue[][];
}

export interface ExecutionResult {
  success: boolean;
  results?: QueryResult[];
  error?: string;
  rowsAffected?: number;
  executionTimeMs?: number;
}
