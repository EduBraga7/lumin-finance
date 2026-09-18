"use client";

import { useEffect, useState, useCallback } from 'react';
import { WifiOff, CloudUpload, CheckCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getOfflineQueue, syncOfflineQueue } from '@/utils/offlineQueue';

export default function OfflineSyncBanner() {
  const [isOnline, setIsOnline] = useState(true);
  const [queueCount, setQueueCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncSuccessMsg, setLastSyncSuccessMsg] = useState<string | null>(null);

  const { session } = useAuth();

  const updateQueueState = useCallback(() => {
    const q = getOfflineQueue();
    setQueueCount(q.length);
  }, []);

  const triggerSync = useCallback(async () => {
    if (!session?.access_token || isSyncing) return;
    const currentQueue = getOfflineQueue();
    if (currentQueue.length === 0) return;

    setIsSyncing(true);
    try {
      const result = await syncOfflineQueue(session.access_token);
      if (result.success > 0) {
        setLastSyncSuccessMsg(`${result.success} lançamento(s) offline sincronizado(s) com sucesso!`);
        setTimeout(() => setLastSyncSuccessMsg(null), 4500);
      }
    } catch (err) {
      console.warn('Erro ao disparar sincronização:', err);
    } finally {
      setIsSyncing(false);
      updateQueueState();
    }
  }, [session?.access_token, isSyncing, updateQueueState]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!navigator.onLine) {
      setTimeout(() => setIsOnline(false), 0);
    }
    updateQueueState();

    const handleOnline = () => {
      setIsOnline(true);
      triggerSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    const handleQueueUpdated = (e: Event) => {
      const customEv = e as CustomEvent<{ count?: number }>;
      setQueueCount(customEv?.detail?.count ?? getOfflineQueue().length);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('lumin:queue_updated', handleQueueUpdated);

    // Se já estiver online e houver pendências, sincroniza
    if (navigator.onLine && getOfflineQueue().length > 0) {
      triggerSync();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('lumin:queue_updated', handleQueueUpdated);
    };
  }, [triggerSync, updateQueueState]);

  if (isOnline && queueCount === 0 && !lastSyncSuccessMsg && !isSyncing) {
    return null;
  }

  return (
    <div style={{
      position: 'sticky',
      top: 0,
      zIndex: 999,
      width: '100%',
      padding: '0.55rem 1rem',
      fontSize: '0.82rem',
      fontWeight: 500,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.6rem',
      transition: 'all 0.3s ease',
      boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
      ...(lastSyncSuccessMsg ? {
        background: 'rgba(16, 185, 129, 0.95)',
        color: '#ffffff'
      } : !isOnline ? {
        background: 'rgba(234, 179, 8, 0.95)',
        color: '#1c1917'
      } : {
        background: 'rgba(59, 130, 246, 0.95)',
        color: '#ffffff'
      })
    }}>
      {lastSyncSuccessMsg ? (
        <>
          <CheckCircle size={16} />
          <span>{lastSyncSuccessMsg}</span>
        </>
      ) : !isOnline ? (
        <>
          <WifiOff size={16} />
          <span>
            <strong>Você está offline.</strong> Seus lançamentos serão salvos no aparelho e sincronizados ao reconectar ({queueCount} pendente{queueCount === 1 ? '' : 's'}).
          </span>
        </>
      ) : isSyncing ? (
        <>
          <RefreshCw size={16} className="animate-spin" />
          <span>Sincronizando {queueCount} lançamento(s) salvo(s) offline com a nuvem...</span>
        </>
      ) : queueCount > 0 ? (
        <>
          <CloudUpload size={16} />
          <span>Conexão restabelecida! {queueCount} lançamento(s) aguardando sincronização.</span>
          <button
            onClick={triggerSync}
            style={{
              background: 'rgba(255,255,255,0.25)',
              border: 'none',
              borderRadius: '4px',
              color: '#ffffff',
              padding: '0.2rem 0.5rem',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              marginLeft: '0.5rem'
            }}
          >
            Sincronizar agora
          </button>
        </>
      ) : null}
    </div>
  );
}
