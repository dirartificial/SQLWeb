import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import { ColumnDefinition, ForeignKeyDefinition, TableDefinition, ExecutionResult, QueryResult, SqlValue } from '../types/database';

let sqlPromise: Promise<SqlJsStatic> | null = null;

/**
 * Inicializa el motor SQL.js WebAssembly.
 * Busca el archivo sql-wasm.wasm en la raíz pública de la aplicación.
 */
export async function getSqlEngine(): Promise<SqlJsStatic> {
  if (!sqlPromise) {
    const initFn = typeof initSqlJs === 'function' ? initSqlJs : (initSqlJs as any)?.default;

    sqlPromise = initFn({
      locateFile: (file: string) => {
        if (typeof window !== 'undefined') {
          const base = import.meta.env.BASE_URL || './';
          return new URL(file, new URL(base, window.location.href)).href;
        }
        return file;
      },
    });
  }
  return await sqlPromise!;
}

/**
 * Crea una nueva instancia de base de datos en memoria SQLite.
 * Si se pasa initialData, restaura la base desde un Uint8Array (export previo).
 */
export async function createDatabaseInstance(initialData?: Uint8Array): Promise<Database> {
  const SQL = await getSqlEngine();
  const db = initialData ? new SQL.Database(initialData) : new SQL.Database();
  
  // Habilitar chequeo de claves foráneas obligatorio en SQLite
  db.run('PRAGMA foreign_keys = ON;');
  
  return db;
}

/**
 * Ejecuta una o varias sentencias SQL y mide el tiempo de respuesta.
 */
export function runQuery(db: Database, sql: string): ExecutionResult {
  const trimmed = sql.trim();
  if (!trimmed) {
    return {
      success: true,
      results: [],
      executionTimeMs: 0,
    };
  }

  const startTime = performance.now();

  try {
    const rawResults = db.exec(trimmed);
    const executionTimeMs = Math.round((performance.now() - startTime) * 100) / 100;

    const results: QueryResult[] = rawResults.map((res) => ({
      columns: res.columns,
      values: res.values,
    }));

    return {
      success: true,
      results,
      rowsAffected: db.getRowsModified ? db.getRowsModified() : undefined,
      executionTimeMs,
    };
  } catch (err: unknown) {
    const executionTimeMs = Math.round((performance.now() - startTime) * 100) / 100;
    const errorMessage = err instanceof Error ? err.message : String(err);
    
    return {
      success: false,
      error: errorMessage,
      executionTimeMs,
    };
  }
}

/**
 * Obtiene la lista de tablas de usuario existentes en la base de datos.
 */
export function getUserTables(db: Database): string[] {
  try {
    const res = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;");
    if (!res || res.length === 0) return [];
    return res[0].values.map((row) => String(row[0]));
  } catch {
    return [];
  }
}

/**
 * Obtiene la sentencia DDL original de una tabla desde sqlite_master.
 */
export function getTableSql(db: Database, tableName: string): string | null {
  try {
    const res = db.exec(`SELECT sql FROM sqlite_master WHERE type='table' AND name = '${tableName}';`);
    if (res && res.length > 0 && res[0].values.length > 0) {
      return String(res[0].values[0][0]);
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Introspecciona una tabla usando PRAGMA table_info y PRAGMA foreign_key_list.
 */
export function getTableMetadata(db: Database, tableName: string): TableDefinition | null {
  try {
    const infoRes = db.exec(`PRAGMA table_info("${tableName}");`);
    if (!infoRes || infoRes.length === 0) return null;

    const fkRes = db.exec(`PRAGMA foreign_key_list("${tableName}");`);
    const foreignKeys: ForeignKeyDefinition[] = [];
    if (fkRes && fkRes.length > 0) {
      const tableIdx = fkRes[0].columns.indexOf('table');
      const fromIdx = fkRes[0].columns.indexOf('from');
      const toIdx = fkRes[0].columns.indexOf('to');
      for (const row of fkRes[0].values) {
        foreignKeys.push({
          targetTable: String(row[tableIdx]),
          columnName: String(row[fromIdx]),
          targetColumn: String(row[toIdx]),
        });
      }
    }

    const nameIdx = infoRes[0].columns.indexOf('name');
    const typeIdx = infoRes[0].columns.indexOf('type');
    const notnullIdx = infoRes[0].columns.indexOf('notnull');
    const dfltIdx = infoRes[0].columns.indexOf('dflt_value');
    const pkIdx = infoRes[0].columns.indexOf('pk');

    const columns: ColumnDefinition[] = infoRes[0].values.map((row) => {
      const colName = String(row[nameIdx]);
      const fkMatch = foreignKeys.find((fk) => fk.columnName === colName);
      const rawType = String(row[typeIdx]).toUpperCase();
      let type: 'INTEGER' | 'TEXT' | 'REAL' | 'DATE' | 'BOOLEAN' = 'TEXT';
      if (rawType.includes('INT')) type = 'INTEGER';
      else if (rawType.includes('REAL') || rawType.includes('FLOA') || rawType.includes('DOUB') || rawType.includes('NUM')) type = 'REAL';
      else if (rawType.includes('DATE') || rawType.includes('TIME')) type = 'DATE';
      else if (rawType.includes('BOOL')) type = 'BOOLEAN';
      else type = 'TEXT';

      return {
        name: colName,
        type,
        isPrimaryKey: Number(row[pkIdx]) > 0,
        isForeignKey: Boolean(fkMatch),
        foreignKeyTable: fkMatch?.targetTable,
        foreignKeyColumn: fkMatch?.targetColumn,
        isNullable: Number(row[notnullIdx]) === 0,
        defaultValue: row[dfltIdx] as string | number | null,
      };
    });

    return {
      name: tableName,
      columns,
      foreignKeys,
    };
  } catch (e) {
    console.error(`Error al inspeccionar metadata de ${tableName}:`, e);
    return null;
  }
}

/**
 * Genera la sentencia DDL CREATE TABLE formateada y educativa.
 */
export function generateCreateTableSql(
  tableName: string,
  columns: ColumnDefinition[],
  foreignKeys: ForeignKeyDefinition[] = []
): string {
  const lines: string[] = [];
  const pkColumns = columns.filter((c) => c.isPrimaryKey);
  const useCompositePk = pkColumns.length > 1;

  for (const col of columns) {
    let colDef = `  "${col.name}" ${col.type}`;
    if (col.isPrimaryKey && !useCompositePk) {
      colDef += ' PRIMARY KEY';
    }
    if (!col.isNullable) {
      colDef += ' NOT NULL';
    }
    lines.push(colDef);
  }

  if (useCompositePk) {
    const pks = pkColumns.map((c) => `"${c.name}"`).join(', ');
    lines.push(`  PRIMARY KEY (${pks})`);
  }

  for (const fk of foreignKeys) {
    lines.push(`  FOREIGN KEY ("${fk.columnName}") REFERENCES "${fk.targetTable}" ("${fk.targetColumn}")`);
  }

  return `CREATE TABLE "${tableName}" (\n${lines.join(',\n')}\n);`;
}

/**
 * Genera y ejecuta un ALTER TABLE ADD COLUMN.
 */
export function addColumn(db: Database, tableName: string, column: ColumnDefinition): ExecutionResult {
  const sql = `ALTER TABLE "${tableName}" ADD COLUMN "${column.name}" ${column.type}${!column.isNullable ? ' NOT NULL' : ''};`;
  return runQuery(db, sql);
}

/**
 * Elimina una tabla con DROP TABLE.
 */
export function dropTable(db: Database, tableName: string): ExecutionResult {
  return runQuery(db, `DROP TABLE "${tableName}";`);
}

/**
 * Traduce errores técnicos de SQLite a explicaciones pedagógicas claras.
 */
export function formatSqliteError(errorMsg: string): string {
  if (!errorMsg) return 'Ha ocurrido un error desconocido al ejecutar la consulta.';

  if (errorMsg.includes('FOREIGN KEY constraint failed')) {
    return 'Violación de Clave Foránea (FK): El valor seleccionado para la relación no existe en la tabla de destino, o intentas eliminar un registro que está referenciado por otra tabla.';
  }
  if (errorMsg.includes('NOT NULL constraint failed')) {
    const parts = errorMsg.split(': ');
    const field = parts[1] || '';
    return `El campo obligatorio "${field}" (NOT NULL) no puede quedar vacío.`;
  }
  if (errorMsg.includes('UNIQUE constraint failed')) {
    const parts = errorMsg.split(': ');
    const field = parts[1] || '';
    return `Valor duplicado en "${field}": Ya existe un registro con este mismo valor (restricción UNIQUE o Clave Primaria).`;
  }
  if (errorMsg.includes('datatype mismatch')) {
    return 'Incompatibilidad de tipo de dato: El valor ingresado no corresponde con el tipo definido en la columna.';
  }

  return errorMsg;
}

/**
 * Formatea un valor según el tipo de columna para sentencias SQL seguras.
 */
function formatSqlLiteral(value: any, type: string, isNullable: boolean): string {
  if (value === null || value === undefined || value === '') {
    return isNullable ? 'NULL' : 'NULL';
  }

  if (type === 'INTEGER') {
    const n = parseInt(String(value), 10);
    return isNaN(n) ? 'NULL' : String(n);
  }

  if (type === 'REAL') {
    const n = parseFloat(String(value));
    return isNaN(n) ? 'NULL' : String(n);
  }

  if (type === 'BOOLEAN') {
    return value === true || value === 1 || value === '1' || value === 'true' ? '1' : '0';
  }

  // TEXT, DATE u otros
  const str = String(value).replace(/'/g, "''");
  return `'${str}'`;
}

export interface TableRowData {
  columns: string[];
  rows: Record<string, SqlValue>[];
}

/**
 * Obtiene todos los registros de una tabla como un array de objetos clave-valor.
 */
export function getTableRows(db: Database, tableName: string): TableRowData {
  try {
    const res = db.exec(`SELECT * FROM "${tableName}";`);
    if (!res || res.length === 0) return { columns: [], rows: [] };

    const columns = res[0].columns;
    const rows = res[0].values.map((valArray) => {
      const obj: Record<string, SqlValue> = {};
      columns.forEach((col, idx) => {
        obj[col] = valArray[idx];
      });
      return obj;
    });

    return { columns, rows };
  } catch (e) {
    console.error(`Error al obtener registros de ${tableName}:`, e);
    return { columns: [], rows: [] };
  }
}

export interface FkOption {
  value: SqlValue;
  label: string;
}

/**
 * Obtiene los registros de una tabla destino para poblar un <select> de Clave Foránea.
 * Busca una columna legible (nombre, titulo, descripcion) para mostrar además del ID.
 */
export function getForeignKeyOptions(db: Database, targetTable: string, targetCol: string): FkOption[] {
  try {
    const res = db.exec(`SELECT * FROM "${targetTable}";`);
    if (!res || res.length === 0 || res[0].values.length === 0) return [];

    const columns = res[0].columns;
    const targetIdx = columns.indexOf(targetCol);
    if (targetIdx === -1) return [];

    // Buscar columna descriptiva (nombre, title, descripcion, etc.)
    const descriptiveNames = ['nombre', 'name', 'titulo', 'title', 'descripcion', 'desc', 'denominacion', 'apellido'];
    const descIdx = columns.findIndex((c) => descriptiveNames.some((d) => c.toLowerCase().includes(d)));
    const labelIdx = descIdx !== -1 && descIdx !== targetIdx ? descIdx : (columns.length > 1 && targetIdx === 0 ? 1 : targetIdx);

    return res[0].values.map((row) => {
      const val = row[targetIdx];
      const labelText = row[labelIdx];
      const label = labelIdx !== targetIdx && labelText !== null && labelText !== undefined
        ? `${val} - ${labelText}`
        : String(val);
      return { value: val, label };
    });
  } catch {
    return [];
  }
}

/**
 * Inserta un nuevo registro en la tabla especificada.
 */
export function insertRecord(
  db: Database,
  tableName: string,
  data: Record<string, any>,
  columns: ColumnDefinition[]
): ExecutionResult {
  const colsToInsert: string[] = [];
  const valsToInsert: string[] = [];

  for (const col of columns) {
    const rawVal = data[col.name];
    // Si es PK INTEGER y está vacío, omitir para permitir AUTOINCREMENT automático de SQLite
    if (col.isPrimaryKey && col.type === 'INTEGER' && (rawVal === undefined || rawVal === '' || rawVal === null)) {
      continue;
    }

    colsToInsert.push(`"${col.name}"`);
    valsToInsert.push(formatSqlLiteral(rawVal, col.type, col.isNullable));
  }

  const sql = `INSERT INTO "${tableName}" (${colsToInsert.join(', ')}) VALUES (${valsToInsert.join(', ')});`;
  const result = runQuery(db, sql);
  if (!result.success && result.error) {
    return { ...result, error: formatSqliteError(result.error) };
  }
  return result;
}

/**
 * Actualiza un registro existente según su Clave Primaria.
 */
export function updateRecord(
  db: Database,
  tableName: string,
  data: Record<string, any>,
  columns: ColumnDefinition[],
  pkValues: Record<string, any>
): ExecutionResult {
  const setClauses: string[] = [];
  const whereClauses: string[] = [];

  for (const col of columns) {
    if (!col.isPrimaryKey) {
      const formatted = formatSqlLiteral(data[col.name], col.type, col.isNullable);
      setClauses.push(`"${col.name}" = ${formatted}`);
    }
  }

  for (const [pkName, pkVal] of Object.entries(pkValues)) {
    const colDef = columns.find((c) => c.name === pkName);
    const formatted = formatSqlLiteral(pkVal, colDef?.type || 'TEXT', false);
    whereClauses.push(`"${pkName}" = ${formatted}`);
  }

  if (setClauses.length === 0) {
    return { success: true, rowsAffected: 0 };
  }

  const sql = `UPDATE "${tableName}" SET ${setClauses.join(', ')} WHERE ${whereClauses.join(' AND ')};`;
  const result = runQuery(db, sql);
  if (!result.success && result.error) {
    return { ...result, error: formatSqliteError(result.error) };
  }
  return result;
}

/**
 * Elimina un registro existente según su Clave Primaria.
 */
export function deleteRecord(
  db: Database,
  tableName: string,
  columns: ColumnDefinition[],
  pkValues: Record<string, any>
): ExecutionResult {
  const whereClauses: string[] = [];

  for (const [pkName, pkVal] of Object.entries(pkValues)) {
    const colDef = columns.find((c) => c.name === pkName);
    const formatted = formatSqlLiteral(pkVal, colDef?.type || 'TEXT', false);
    whereClauses.push(`"${pkName}" = ${formatted}`);
  }

  const sql = `DELETE FROM "${tableName}" WHERE ${whereClauses.join(' AND ')};`;
  const result = runQuery(db, sql);
  if (!result.success && result.error) {
    return { ...result, error: formatSqliteError(result.error) };
  }
  return result;
}
