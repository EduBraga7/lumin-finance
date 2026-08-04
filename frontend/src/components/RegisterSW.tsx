"use client";

import { useEffect } from 'react';

export default function RegisterSW() {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('Service Worker registrado com sucesso:', reg.scope);
          })
          .catch((err) => {
            console.error('Falha ao registrar Service Worker:', err);
          });
      });
    }
  }, []);

  return null;
}
