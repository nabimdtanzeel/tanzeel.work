const DB_NAME = 'portfolio_graphics_db';
const STORE_NAME = 'graphics_slots';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'slot' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveGraphicToDB(slot: number, imageUrl: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put({ slot, imageUrl, updatedAt: Date.now() });
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB save failed, falling back to localStorage:', err);
    try {
      localStorage.setItem(`graphic_slot_${slot}`, imageUrl);
    } catch {}
  }
}

export async function getGraphicFromDB(slot: number): Promise<string | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(slot);
    return new Promise((resolve) => {
      request.onsuccess = () => {
        if (request.result?.imageUrl) {
          resolve(request.result.imageUrl);
        } else {
          const local = localStorage.getItem(`graphic_slot_${slot}`);
          resolve(local || null);
        }
      };
      request.onerror = () => {
        const local = localStorage.getItem(`graphic_slot_${slot}`);
        resolve(local || null);
      };
    });
  } catch {
    const local = localStorage.getItem(`graphic_slot_${slot}`);
    return local || null;
  }
}

export async function getAllGraphicsFromDB(): Promise<{ slot: number; imageUrl: string }[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    return new Promise((resolve) => {
      request.onsuccess = () => {
        const results: { slot: number; imageUrl: string }[] = [];
        if (Array.isArray(request.result)) {
          for (const item of request.result) {
            if (item.slot && item.imageUrl) {
              results.push({ slot: item.slot, imageUrl: item.imageUrl });
            }
          }
        }
        for (let s = 1; s <= 6; s++) {
          if (!results.find((r) => r.slot === s)) {
            const local = localStorage.getItem(`graphic_slot_${s}`);
            if (local) results.push({ slot: s, imageUrl: local });
          }
        }
        resolve(results);
      };
      request.onerror = () => resolve([]);
    });
  } catch {
    const results: { slot: number; imageUrl: string }[] = [];
    for (let s = 1; s <= 6; s++) {
      const local = localStorage.getItem(`graphic_slot_${s}`);
      if (local) results.push({ slot: s, imageUrl: local });
    }
    return results;
  }
}

export async function deleteGraphicFromDB(slot: number): Promise<void> {
  try {
    localStorage.removeItem(`graphic_slot_${slot}`);
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(slot);
    return new Promise((resolve) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    localStorage.removeItem(`graphic_slot_${slot}`);
  }
}
