import { openDB, DBSchema } from 'idb';

interface KiranaDB extends DBSchema {
  products: {
    key: string;
    value: {
      id: string;
      name: string;
      localName?: string;
      barcode?: string;
      sellingPrice: number;
      purchasePrice: number;
      unit: string;
      taxRate: number;
      currentStock: number;
      minimumStock: number;
      aliases?: string[];
    };
    indexes: { 'by-barcode': string };
  };
  offlineSales: {
    key: string;
    value: {
      syncId: string;
      idempotencyKey: string;
      items: any[];
      discount: number;
      paymentMethod: string;
      customerPhone?: string;
      totalAmount: number;
      createdAt: string;
      synced: boolean;
    };
  };
}

const DB_NAME = 'kiranapro_offline_db';
const DB_VERSION = 1;

export async function getDB() {
  return openDB<KiranaDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('products')) {
        const prodStore = db.createObjectStore('products', { keyPath: 'id' });
        prodStore.createIndex('by-barcode', 'barcode');
      }
      if (!db.objectStoreNames.contains('offlineSales')) {
        db.createObjectStore('offlineSales', { keyPath: 'syncId' });
      }
    },
  });
}

export async function cacheProductsLocally(products: any[]) {
  const db = await getDB();
  const tx = db.transaction('products', 'readwrite');
  await tx.objectStore('products').clear();
  for (const prod of products) {
    await tx.objectStore('products').put(prod);
  }
  await tx.done;
}

export async function getLocalProducts() {
  const db = await getDB();
  return db.getAll('products');
}

export async function queueOfflineSale(salePayload: any) {
  const db = await getDB();
  const syncId = `offline-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const record = {
    syncId,
    idempotencyKey: salePayload.idempotencyKey || syncId,
    ...salePayload,
    createdAt: new Date().toISOString(),
    synced: false,
  };
  await db.put('offlineSales', record);
  return record;
}

export async function getUnsyncedOfflineSales() {
  const db = await getDB();
  const all = await db.getAll('offlineSales');
  return all.filter((s) => !s.synced);
}

export async function markOfflineSaleSynced(syncId: string) {
  const db = await getDB();
  const record = await db.get('offlineSales', syncId);
  if (record) {
    record.synced = true;
    await db.put('offlineSales', record);
  }
}
