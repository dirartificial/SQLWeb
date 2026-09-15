const DB_NAME = 'SQLWeb_Storage';
const STORE_NAME = 'databases';
const DB_KEY = 'active_sqlite_db';
const DB_VERSION = 1;

/**
 * Abre la conexión a IndexedDB creando el almacén de objetos si no existe.
 */
function openIndexedDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

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

/**
 * Guarda el binario Uint8Array de SQLite en IndexedDB.
 */
export async function saveDatabaseToIndexedDb(binary: Uint8Array): Promise<void> {
  const db = await openIndexedDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(binary, DB_KEY);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Recupera el binario Uint8Array de SQLite almacenado en IndexedDB.
 */
export async function loadDatabaseFromIndexedDb(): Promise<Uint8Array | null> {
  const db = await openIndexedDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(DB_KEY);

    request.onsuccess = () => {
      const result = request.result;
      if (result instanceof Uint8Array) {
        resolve(result);
      } else if (result) {
        resolve(new Uint8Array(result));
      } else {
        resolve(null);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Elimina la base de datos almacenada en IndexedDB.
 */
export async function deleteDatabaseFromIndexedDb(): Promise<void> {
  const db = await openIndexedDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(DB_KEY);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Verifica si un ArrayBuffer o Uint8Array tiene la cabecera estándar de SQLite 3.
 * Cabecera mágica: "SQLite format 3\000" (16 bytes).
 */
export function isValidSqliteHeader(buffer: ArrayBuffer | Uint8Array): boolean {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  if (bytes.length < 16) return false;

  const magicHeader = 'SQLite format 3\0';
  for (let i = 0; i < 16; i++) {
    if (bytes[i] !== magicHeader.charCodeAt(i)) {
      return false;
    }
  }
  return true;
}
