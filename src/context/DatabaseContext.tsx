import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Database } from 'sql.js';
import {
  createDatabaseInstance,
  runQuery,
  getUserTables,
  getTableMetadata,
  getTableSql,
  generateCreateTableSql,
  addColumn,
  dropTable,
  getTableRows,
  getForeignKeyOptions,
  insertRecord,
  updateRecord,
  deleteRecord,
  TableRowData,
  FkOption,
} from '../lib/database';
import {
  saveDatabaseToIndexedDb,
  loadDatabaseFromIndexedDb,
  deleteDatabaseFromIndexedDb,
  isValidSqliteHeader,
} from '../lib/storage';
import { ExecutionResult, ColumnDefinition, ForeignKeyDefinition, TableDefinition } from '../types/database';

interface DatabaseContextType {
  db: Database | null;
  isReady: boolean;
  isLoading: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  initError: string | null;
  tables: string[];
  refreshTables: () => void;
  exec: (sql: string) => ExecutionResult;
  getTableInfo: (tableName: string) => TableDefinition | null;
  getTableDdl: (tableName: string) => string | null;
  createTable: (tableName: string, columns: ColumnDefinition[], fks?: ForeignKeyDefinition[]) => ExecutionResult;
  deleteTable: (tableName: string) => ExecutionResult;
  addNewColumn: (tableName: string, col: ColumnDefinition) => ExecutionResult;
  getTableData: (tableName: string) => TableRowData;
  getTableFkOptions: (targetTable: string, targetCol: string) => FkOption[];
  insertRow: (tableName: string, data: Record<string, any>) => ExecutionResult;
  updateRow: (tableName: string, data: Record<string, any>, pkValues: Record<string, any>) => ExecutionResult;
  deleteRow: (tableName: string, pkValues: Record<string, any>) => ExecutionResult;
  saveNow: () => Promise<void>;
  downloadDatabaseFile: (filename?: string) => void;
  importDatabaseFile: (file: File) => Promise<ExecutionResult>;
  resetDatabase: () => Promise<void>;
  exportDatabase: () => Uint8Array | null;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [db, setDb] = useState<Database | null>(null);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const [tables, setTables] = useState<string[]>([]);

  const saveTimeoutRef = useRef<number | null>(null);

  const refreshTables = useCallback(() => {
    if (db) {
      const currentTables = getUserTables(db);
      setTables(currentTables);
    }
  }, [db]);

  // Persistir estado binario en IndexedDB
  const persistToStorage = useCallback(async (targetDb: Database): Promise<void> => {
    try {
      setIsSaving(true);
      const binary = targetDb.export();
      await saveDatabaseToIndexedDb(binary);
      setLastSaved(new Date());
    } catch (err) {
      console.error('Error al guardar en IndexedDB:', err);
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Auto-guardado con debounce de 600ms tras cualquier mutación
  const scheduleAutoSave = useCallback(() => {
    if (!db) return;
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = window.setTimeout(() => {
      persistToStorage(db);
    }, 600);
  }, [db, persistToStorage]);

  // Inicialización con hidratación desde IndexedDB
  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        setIsLoading(true);
        setInitError(null);

        // Comprobar si hay una base de datos guardada previamente en IndexedDB
        const storedBinary = await loadDatabaseFromIndexedDb();
        const database = await createDatabaseInstance(storedBinary || undefined);

        if (mounted) {
          setDb(database);
          setIsReady(true);
          setIsLoading(false);
          setTables(getUserTables(database));
          if (storedBinary) {
            setLastSaved(new Date());
          }
        }
      } catch (err: unknown) {
        if (mounted) {
          const msg = err instanceof Error ? err.message : String(err);
          setInitError(`Error al cargar el motor SQLite (WASM): ${msg}`);
          setIsLoading(false);
        }
      }
    }

    init();

    return () => {
      mounted = false;
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const exec = useCallback(
    (sql: string): ExecutionResult => {
      if (!db) {
        return {
          success: false,
          error: 'El motor SQLite aún no está inicializado.',
        };
      }

      const result = runQuery(db, sql);
      refreshTables();

      // Si la consulta modificó filas o alteró el esquema, disparar autoguardado
      const isMutating = /^\s*(CREATE|DROP|ALTER|INSERT|UPDATE|DELETE|REPLACE)\b/i.test(sql);
      if (result.success && isMutating) {
        scheduleAutoSave();
      }

      return result;
    },
    [db, refreshTables, scheduleAutoSave]
  );

  const getTableInfo = useCallback(
    (tableName: string): TableDefinition | null => {
      if (!db) return null;
      return getTableMetadata(db, tableName);
    },
    [db]
  );

  const getTableDdl = useCallback(
    (tableName: string): string | null => {
      if (!db) return null;
      return getTableSql(db, tableName);
    },
    [db]
  );

  const createTable = useCallback(
    (tableName: string, columns: ColumnDefinition[], fks: ForeignKeyDefinition[] = []): ExecutionResult => {
      if (!db) {
        return { success: false, error: 'La base de datos no está lista.' };
      }
      const sql = generateCreateTableSql(tableName, columns, fks);
      const res = runQuery(db, sql);
      if (res.success) {
        refreshTables();
        scheduleAutoSave();
      }
      return res;
    },
    [db, refreshTables, scheduleAutoSave]
  );

  const deleteTable = useCallback(
    (tableName: string): ExecutionResult => {
      if (!db) {
        return { success: false, error: 'La base de datos no está lista.' };
      }
      const res = dropTable(db, tableName);
      if (res.success) {
        refreshTables();
        scheduleAutoSave();
      }
      return res;
    },
    [db, refreshTables, scheduleAutoSave]
  );

  const addNewColumn = useCallback(
    (tableName: string, col: ColumnDefinition): ExecutionResult => {
      if (!db) {
        return { success: false, error: 'La base de datos no está lista.' };
      }
      const res = addColumn(db, tableName, col);
      if (res.success) {
        refreshTables();
        scheduleAutoSave();
      }
      return res;
    },
    [db, refreshTables, scheduleAutoSave]
  );

  const getTableData = useCallback(
    (tableName: string): TableRowData => {
      if (!db) return { columns: [], rows: [] };
      return getTableRows(db, tableName);
    },
    [db]
  );

  const getTableFkOptions = useCallback(
    (targetTable: string, targetCol: string): FkOption[] => {
      if (!db) return [];
      return getForeignKeyOptions(db, targetTable, targetCol);
    },
    [db]
  );

  const insertRow = useCallback(
    (tableName: string, data: Record<string, any>): ExecutionResult => {
      if (!db) {
        return { success: false, error: 'La base de datos no está lista.' };
      }
      const tableInfo = getTableMetadata(db, tableName);
      if (!tableInfo) {
        return { success: false, error: `No se encontró la tabla "${tableName}".` };
      }
      const res = insertRecord(db, tableName, data, tableInfo.columns);
      if (res.success) {
        scheduleAutoSave();
      }
      return res;
    },
    [db, scheduleAutoSave]
  );

  const updateRow = useCallback(
    (tableName: string, data: Record<string, any>, pkValues: Record<string, any>): ExecutionResult => {
      if (!db) {
        return { success: false, error: 'La base de datos no está lista.' };
      }
      const tableInfo = getTableMetadata(db, tableName);
      if (!tableInfo) {
        return { success: false, error: `No se encontró la tabla "${tableName}".` };
      }
      const res = updateRecord(db, tableName, data, tableInfo.columns, pkValues);
      if (res.success) {
        scheduleAutoSave();
      }
      return res;
    },
    [db, scheduleAutoSave]
  );

  const deleteRow = useCallback(
    (tableName: string, pkValues: Record<string, any>): ExecutionResult => {
      if (!db) {
        return { success: false, error: 'La base de datos no está lista.' };
      }
      const tableInfo = getTableMetadata(db, tableName);
      if (!tableInfo) {
        return { success: false, error: `No se encontró la tabla "${tableName}".` };
      }
      const res = deleteRecord(db, tableName, tableInfo.columns, pkValues);
      if (res.success) {
        scheduleAutoSave();
      }
      return res;
    },
    [db, scheduleAutoSave]
  );

  // Guardar manualmente ahora
  const saveNow = useCallback(async () => {
    if (!db) return;
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }
    await persistToStorage(db);
  }, [db, persistToStorage]);

  // Descargar archivo .sqlite
  const downloadDatabaseFile = useCallback(
    (filename = 'simulador_base_datos.sqlite') => {
      if (!db) return;
      const binary = db.export();
      const blob = new Blob([binary.buffer as ArrayBuffer], { type: 'application/x-sqlite3' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    [db]
  );

  // Importar archivo .sqlite o .db desde disco
  const importDatabaseFile = useCallback(
    async (file: File): Promise<ExecutionResult> => {
      try {
        setIsLoading(true);
        const buffer = await file.arrayBuffer();

        if (!isValidSqliteHeader(buffer)) {
          setIsLoading(false);
          return {
            success: false,
            error: 'El archivo seleccionado no es una base de datos SQLite válida (cabecera no reconocida).',
          };
        }

        const binary = new Uint8Array(buffer);
        if (db) {
          db.close();
        }

        const newDb = await createDatabaseInstance(binary);
        setDb(newDb);
        const loadedTables = getUserTables(newDb);
        setTables(loadedTables);
        await persistToStorage(newDb);
        setIsLoading(false);

        return {
          success: true,
          rowsAffected: loadedTables.length,
        };
      } catch (err: unknown) {
        setIsLoading(false);
        const msg = err instanceof Error ? err.message : String(err);
        return {
          success: false,
          error: `Error al importar la base de datos: ${msg}`,
        };
      }
    },
    [db, persistToStorage]
  );

  // Reiniciar base de datos en memoria y limpiar IndexedDB
  const resetDatabase = useCallback(async () => {
    try {
      setIsLoading(true);
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }
      if (db) {
        db.close();
      }
      await deleteDatabaseFromIndexedDb();
      setLastSaved(null);

      const newDb = await createDatabaseInstance();
      setDb(newDb);
      setTables([]);
      setIsLoading(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setInitError(`Error al reiniciar la base: ${msg}`);
      setIsLoading(false);
    }
  }, [db]);

  const exportDatabase = useCallback((): Uint8Array | null => {
    if (!db) return null;
    return db.export();
  }, [db]);

  const contextValue = useMemo<DatabaseContextType>(
    () => ({
      db,
      isReady,
      isLoading,
      isSaving,
      lastSaved,
      initError,
      tables,
      refreshTables,
      exec,
      getTableInfo,
      getTableDdl,
      createTable,
      deleteTable,
      addNewColumn,
      getTableData,
      getTableFkOptions,
      insertRow,
      updateRow,
      deleteRow,
      saveNow,
      downloadDatabaseFile,
      importDatabaseFile,
      resetDatabase,
      exportDatabase,
    }),
    [
      db,
      isReady,
      isLoading,
      isSaving,
      lastSaved,
      initError,
      tables,
      refreshTables,
      exec,
      getTableInfo,
      getTableDdl,
      createTable,
      deleteTable,
      addNewColumn,
      getTableData,
      getTableFkOptions,
      insertRow,
      updateRow,
      deleteRow,
      saveNow,
      downloadDatabaseFile,
      importDatabaseFile,
      resetDatabase,
      exportDatabase,
    ]
  );

  return (
    <DatabaseContext.Provider value={contextValue}>
      {children}
    </DatabaseContext.Provider>
  );
};

export function useDatabase(): DatabaseContextType {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase debe ser usado dentro de un DatabaseProvider');
  }
  return context;
}
