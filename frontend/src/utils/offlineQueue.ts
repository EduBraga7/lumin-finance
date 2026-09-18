export interface OfflineTransactionPayload {
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  is_paid?: boolean;
  repeat_months?: number;
}

export interface OfflineTransactionItem extends OfflineTransactionPayload {
  tempId: string;
  createdAt: string;
  status: 'pending' | 'syncing' | 'failed';
  is_offline: true;
}

const STORAGE_KEY = 'lumin_offline_queue';
const CACHE_PREFIX = 'lumin_cache_tx_';

export function getOfflineQueue(): OfflineTransactionItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Erro ao ler fila offline:', err);
    return [];
  }
}

export function addToOfflineQueue(payload: OfflineTransactionPayload): OfflineTransactionItem {
  const queue = getOfflineQueue();
  const newItem: OfflineTransactionItem = {
    ...payload,
    tempId: `offline_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
    status: 'pending',
    is_offline: true,
  };

  queue.push(newItem);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    window.dispatchEvent(new CustomEvent('lumin:queue_updated', { detail: { count: queue.length } }));
  } catch (err) {
    console.error('Erro ao salvar item na fila offline:', err);
  }

  return newItem;
}

export function removeFromOfflineQueue(tempId: string): void {
  const queue = getOfflineQueue().filter(item => item.tempId !== tempId);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    window.dispatchEvent(new CustomEvent('lumin:queue_updated', { detail: { count: queue.length } }));
  } catch (err) {
    console.error('Erro ao remover da fila offline:', err);
  }
}

export function cacheTransactionsLocally(month: number, year: number, data: any[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${CACHE_PREFIX}${month}_${year}`, JSON.stringify(data));
  } catch (err) {
    console.warn('Erro ao salvar cache de transações:', err);
  }
}

export function getCachedTransactionsLocally(month: number, year: number): any[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${month}_${year}`);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    return [];
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export async function syncOfflineQueue(
  token: string,
  onProgress?: (remaining: number, total: number) => void
): Promise<{ success: number; failed: number }> {
  const queue = getOfflineQueue();
  if (queue.length === 0) return { success: 0, failed: 0 };

  let successCount = 0;
  let failedCount = 0;
  const initialTotal = queue.length;

  for (const item of queue) {
    try {
      const payload = {
        title: item.title,
        amount: item.amount,
        type: item.type,
        category: item.category,
        date: item.date,
        is_paid: item.is_paid !== undefined ? item.is_paid : true,
        repeat_months: item.repeat_months || 1
      };

      const res = await fetch(`${API_URL}/api/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        removeFromOfflineQueue(item.tempId);
        successCount++;
      } else {
        failedCount++;
      }
    } catch (err) {
      console.warn('Falha de rede ao tentar sincronizar item:', item.title, err);
      failedCount++;
      break; // Interrompe caso a rede ainda não esteja estável
    }

    if (onProgress) {
      onProgress(initialTotal - (successCount + failedCount), initialTotal);
    }
  }

  if (successCount > 0) {
    window.dispatchEvent(new CustomEvent('lumin:synced', { detail: { count: successCount } }));
  }

  return { success: successCount, failed: failedCount };
}
