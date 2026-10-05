import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { MongoEngine } from '../lib/mongo/database';
import {
  saveMongoDbToIndexedDb,
  loadMongoDbFromIndexedDb,
  listMongoDbsFromIndexedDb,
  deleteMongoDbFromIndexedDb,
  saveActiveMongoDbName,
  loadActiveMongoDbName,
} from '../lib/mongo/storage';
import { MongoCollectionMeta, MongoExecutionResult, MongoDocument } from '../types/mongo';

interface MongoDatabaseContextType {
  engine: MongoEngine;
  dbName: string;
  isReady: boolean;
  isLoading: boolean;
  isSaving: boolean;
  collections: MongoCollectionMeta[];
  refreshCollections: () => void;
  createCollection: (name: string, initialDocs?: MongoDocument[]) => boolean;
  dropCollection: (name: string) => boolean;
  insertDocument: (collectionName: string, docData: Record<string, any>) => MongoDocument;
  updateDocument: (collectionName: string, id: string, docData: Record<string, any>) => MongoDocument;
  deleteDocument: (collectionName: string, id: string) => boolean;
  runFindQuery: (collectionName: string, filterObj?: Record<string, any>, projectionObj?: Record<string, any>) => MongoExecutionResult;
  runAggregationPipeline: (collectionName: string, pipeline: Array<Record<string, any>>) => MongoExecutionResult;
  renameDatabase: (newName: string) => Promise<boolean>;
  switchDatabase: (targetName: string) => Promise<boolean>;
  createNewDatabase: (name: string) => Promise<boolean>;
  deleteDatabase: (targetName: string) => Promise<boolean>;
  savedDatabases: string[];
  refreshSavedDatabasesList: () => Promise<void>;
  exportDatabaseJson: () => string;
  importDatabaseJson: (jsonStr: string) => Promise<boolean>;
}

const MongoDatabaseContext = createContext<MongoDatabaseContextType | null>(null);

export const MongoDatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [engine] = useState<MongoEngine>(() => new MongoEngine(loadActiveMongoDbName()));
  const [dbName, setDbName] = useState<string>(loadActiveMongoDbName());
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [collections, setCollections] = useState<MongoCollectionMeta[]>([]);
  const [savedDatabases, setSavedDatabases] = useState<string[]>([]);

  const refreshCollections = useCallback(() => {
    setCollections(engine.getCollectionsMetadata());
  }, [engine]);

  const refreshSavedDatabasesList = useCallback(async () => {
    const list = await listMongoDbsFromIndexedDb();
    setSavedDatabases(list);
  }, []);

  const autoSaveToIndexedDb = useCallback(async () => {
    setIsSaving(true);
    try {
      const jsonStr = engine.exportToJson();
      await saveMongoDbToIndexedDb(engine.dbName, jsonStr);
    } catch (e) {
      console.error('Error al guardar Mongo DB en IndexedDB:', e);
    } finally {
      setIsSaving(false);
    }
  }, [engine]);

  // Load active DB on mount
  useEffect(() => {
    let isMounted = true;
    async function init() {
      setIsLoading(true);
      try {
        const storedName = loadActiveMongoDbName();
        const storedData = await loadMongoDbFromIndexedDb(storedName);
        
        if (storedData) {
          engine.importFromJson(storedData);
        } else {
          // Initialize sample collection for quick start
          engine.createCollection('clientes', [
            { _id: engine.generateObjectId(), nombre: 'Juan Pérez', email: 'juan@ejemplo.com', edad: 28, activo: true, ciudad: 'Buenos Aires' },
            { _id: engine.generateObjectId(), nombre: 'Maria Gómez', email: 'maria@ejemplo.com', edad: 34, activo: true, ciudad: 'Córdoba' },
            { _id: engine.generateObjectId(), nombre: 'Carlos López', email: 'carlos@ejemplo.com', edad: 22, activo: false, ciudad: 'Rosario' },
          ]);
          engine.createCollection('pedidos', [
            { _id: engine.generateObjectId(), cliente_email: 'juan@ejemplo.com', total: 4500, fecha: '2026-09-15', items: ['Laptop', 'Mouse'] },
            { _id: engine.generateObjectId(), cliente_email: 'maria@ejemplo.com', total: 1200, fecha: '2026-09-20', items: ['Teclado'] },
          ]);
          await saveMongoDbToIndexedDb(storedName, engine.exportToJson());
        }

        if (isMounted) {
          setDbName(engine.dbName);
          refreshCollections();
          await refreshSavedDatabasesList();
          setIsReady(true);
        }
      } catch (err) {
        console.error('Error al inicializar Mongo Engine:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    init();

    return () => { isMounted = false; };
  }, [engine, refreshCollections, refreshSavedDatabasesList]);

  const createCollection = useCallback((name: string, initialDocs: MongoDocument[] = []): boolean => {
    const res = engine.createCollection(name, initialDocs);
    refreshCollections();
    autoSaveToIndexedDb();
    return res;
  }, [engine, refreshCollections, autoSaveToIndexedDb]);

  const dropCollection = useCallback((name: string): boolean => {
    const res = engine.dropCollection(name);
    refreshCollections();
    autoSaveToIndexedDb();
    return res;
  }, [engine, refreshCollections, autoSaveToIndexedDb]);

  const insertDocument = useCallback((collectionName: string, docData: Record<string, any>): MongoDocument => {
    const res = engine.insertDocument(collectionName, docData);
    refreshCollections();
    autoSaveToIndexedDb();
    return res;
  }, [engine, refreshCollections, autoSaveToIndexedDb]);

  const updateDocument = useCallback((collectionName: string, id: string, docData: Record<string, any>): MongoDocument => {
    const res = engine.updateDocument(collectionName, id, docData);
    refreshCollections();
    autoSaveToIndexedDb();
    return res;
  }, [engine, refreshCollections, autoSaveToIndexedDb]);

  const deleteDocument = useCallback((collectionName: string, id: string): boolean => {
    const res = engine.deleteDocument(collectionName, id);
    refreshCollections();
    autoSaveToIndexedDb();
    return res;
  }, [engine, refreshCollections, autoSaveToIndexedDb]);

  const runFindQuery = useCallback((collectionName: string, filterObj: Record<string, any> = {}, projectionObj?: Record<string, any>): MongoExecutionResult => {
    return engine.runFindQuery(collectionName, filterObj, projectionObj);
  }, [engine]);

  const runAggregationPipeline = useCallback((collectionName: string, pipeline: Array<Record<string, any>>): MongoExecutionResult => {
    return engine.runAggregationPipeline(collectionName, pipeline);
  }, [engine]);

  const renameDatabase = useCallback(async (newName: string): Promise<boolean> => {
    const clean = newName.trim();
    if (!clean || clean === engine.dbName) return false;
    const oldName = engine.dbName;
    engine.dbName = clean;
    setDbName(clean);
    saveActiveMongoDbName(clean);
    await saveMongoDbToIndexedDb(clean, engine.exportToJson());
    await deleteMongoDbFromIndexedDb(oldName);
    await refreshSavedDatabasesList();
    return true;
  }, [engine, refreshSavedDatabasesList]);

  const switchDatabase = useCallback(async (targetName: string): Promise<boolean> => {
    const jsonStr = await loadMongoDbFromIndexedDb(targetName);
    if (!jsonStr) return false;
    engine.importFromJson(jsonStr);
    engine.dbName = targetName;
    setDbName(targetName);
    saveActiveMongoDbName(targetName);
    refreshCollections();
    await refreshSavedDatabasesList();
    return true;
  }, [engine, refreshCollections, refreshSavedDatabasesList]);

  const createNewDatabase = useCallback(async (name: string): Promise<boolean> => {
    const clean = name.trim();
    if (!clean) return false;
    const newEng = new MongoEngine(clean);
    const jsonStr = newEng.exportToJson();
    await saveMongoDbToIndexedDb(clean, jsonStr);
    await switchDatabase(clean);
    return true;
  }, [switchDatabase]);

  const deleteDatabase = useCallback(async (targetName: string): Promise<boolean> => {
    await deleteMongoDbFromIndexedDb(targetName);
    await refreshSavedDatabasesList();
    if (targetName === engine.dbName) {
      await createNewDatabase('mi_base_mongo');
    }
    return true;
  }, [engine.dbName, refreshSavedDatabasesList, createNewDatabase]);

  const exportDatabaseJson = useCallback((): string => {
    return engine.exportToJson();
  }, [engine]);

  const importDatabaseJson = useCallback(async (jsonStr: string): Promise<boolean> => {
    try {
      engine.importFromJson(jsonStr);
      setDbName(engine.dbName);
      saveActiveMongoDbName(engine.dbName);
      refreshCollections();
      await autoSaveToIndexedDb();
      await refreshSavedDatabasesList();
      return true;
    } catch (e) {
      console.error('Error al importar JSON Mongo DB:', e);
      return false;
    }
  }, [engine, refreshCollections, autoSaveToIndexedDb, refreshSavedDatabasesList]);

  const value = useMemo(() => ({
    engine,
    dbName,
    isReady,
    isLoading,
    isSaving,
    collections,
    refreshCollections,
    createCollection,
    dropCollection,
    insertDocument,
    updateDocument,
    deleteDocument,
    runFindQuery,
    runAggregationPipeline,
    renameDatabase,
    switchDatabase,
    createNewDatabase,
    deleteDatabase,
    savedDatabases,
    refreshSavedDatabasesList,
    exportDatabaseJson,
    importDatabaseJson
  }), [
    engine, dbName, isReady, isLoading, isSaving, collections, refreshCollections,
    createCollection, dropCollection, insertDocument, updateDocument, deleteDocument,
    runFindQuery, runAggregationPipeline, renameDatabase, switchDatabase, createNewDatabase,
    deleteDatabase, savedDatabases, refreshSavedDatabasesList, exportDatabaseJson, importDatabaseJson
  ]);

  return (
    <MongoDatabaseContext.Provider value={value}>
      {children}
    </MongoDatabaseContext.Provider>
  );
};

export const useMongoDatabase = () => {
  const context = useContext(MongoDatabaseContext);
  if (!context) {
    throw new Error('useMongoDatabase debe usarse dentro de un MongoDatabaseProvider');
  }
  return context;
};
