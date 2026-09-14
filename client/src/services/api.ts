import { cacheProductsLocally, getLocalProducts, queueOfflineSale, getUnsyncedOfflineSales, markOfflineSaleSynced } from './db';

const API_BASE = '/api/v1';

export function getAuthToken(): string | null {
  return localStorage.getItem('kiranapro_token');
}

export function setAuthToken(token: string) {
  localStorage.setItem('kiranapro_token', token);
}

export async function ensureAuthToken() {
  if (!getAuthToken()) {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: '9876543210', password: 'Kirana123!' }),
      });
      const data = await response.json();
      if (data.success && data.data?.token) {
        setAuthToken(data.data.token);
      }
    } catch (err) {
      console.warn('Auto login failed:', err);
    }
  }
}

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  await ensureAuthToken();
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }
    return data.data;
  } catch (err: any) {
    console.warn(`[API Network Call Failed - ${endpoint}]:`, err.message);
    throw err;
  }
}

// Product API with Offline Fallback
export async function fetchProducts(query: string = '') {
  try {
    const products = await apiRequest(`/products${query ? `?q=${encodeURIComponent(query)}` : ''}`);
    // Cache products locally in IndexedDB
    if (!query) {
      await cacheProductsLocally(products);
    }
    return products;
  } catch (err) {
    console.log('[Offline Mode] Falling back to IndexedDB local catalog');
    const local = await getLocalProducts();
    if (query) {
      const q = query.toLowerCase();
      return local.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.localName && p.localName.toLowerCase().includes(q)) ||
          (p.barcode && p.barcode.includes(q)) ||
          (p.aliases && p.aliases.some((a: string) => a.toLowerCase().includes(q)))
      );
    }
    return local;
  }
}

// Complete Sale with Offline Sync Queueing
export async function completeSale(saleData: any) {
  try {
    const result = await apiRequest('/sales', {
      method: 'POST',
      body: JSON.stringify(saleData),
    });
    return { ...result, isOffline: false };
  } catch (err) {
    console.log('[Offline Billing] Connection unavailable. Queueing sale locally in IndexedDB...');
    const queued = await queueOfflineSale(saleData);
    return {
      id: queued.syncId,
      billNumber: `TEMP-${queued.syncId.slice(-6).toUpperCase()}`,
      totalAmount: saleData.totalAmount || 0,
      isOffline: true,
      message: 'Bill saved locally offline. Will synchronize automatically when network returns.',
    };
  }
}

// Background Sync Worker
export async function syncOfflineSales() {
  const unsynced = await getUnsyncedOfflineSales();
  if (unsynced.length === 0) return;

  console.log(`[Sync Worker] Found ${unsynced.length} unsynced offline transactions.`);
  for (const item of unsynced) {
    try {
      await apiRequest('/sales', {
        method: 'POST',
        body: JSON.stringify({
          idempotencyKey: item.idempotencyKey,
          items: item.items,
          discount: item.discount,
          paymentMethod: item.paymentMethod,
          customerPhone: item.customerPhone,
        }),
      });
      await markOfflineSaleSynced(item.syncId);
      console.log(`[Sync Worker] Successfully synchronized bill ${item.syncId}`);
    } catch (err) {
      console.error(`[Sync Worker] Failed to sync ${item.syncId}, will retry later.`, err);
    }
  }
}

export async function createProduct(productData: any) {
  return apiRequest('/products', {
    method: 'POST',
    body: JSON.stringify(productData),
  });
}
