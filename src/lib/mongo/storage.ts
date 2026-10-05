
const INDEXEDDB_NAME = 'SQLWeb_Mongo_Databases_DB';
const STORE_NAME = 'mongo_databases';
const ACTIVE_DB_KEY = 'SQLWeb_Active_Mongo_DB_Name';

function openMongoDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(INDEXEDDB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveMongoDbToIndexedDb(name: string, jsonContent: string): Promise<void> {
  const db = await openMongoDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(jsonContent, name);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function loadMongoDbFromIndexedDb(name: string): Promise<string | null> {
  const db = await openMongoDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(name);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function listMongoDbsFromIndexedDb(): Promise<string[]> {
  const db = await openMongoDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAllKeys();
    request.onsuccess = () => resolve((request.result || []).map(k => String(k)));
    request.onerror = () => reject(request.error);
  });
}

export async function deleteMongoDbFromIndexedDb(name: string): Promise<void> {
  const db = await openMongoDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(name);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export function saveActiveMongoDbName(name: string): void {
  try {
    localStorage.setItem(ACTIVE_DB_KEY, name);
  } catch (e) {
    console.error('Error al guardar nombre activo de Mongo DB en localStorage:', e);
  }
}

export function loadActiveMongoDbName(): string {
  try {
    return localStorage.getItem(ACTIVE_DB_KEY) || 'mi_base_mongo';
  } catch (e) {
    return 'mi_base_mongo';
  }
}
