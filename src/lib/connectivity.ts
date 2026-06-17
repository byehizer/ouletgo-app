import { useEffect, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { API_BASE_URL } from '../config/env';

/**
 * Verifica conectividad haciendo HEAD al endpoint de salud del propio backend.
 * Fallback: google.com/generate_204 por si el backend está abajo (distingue "sin red" vs "API caída").
 */
export async function checkOnline(): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);
  try {
    // Usamos el endpoint oficial de Android/Google para verificar conectividad.
    // Realizar un GET a generate_204 es la forma más estable en React Native Android.
    const res = await fetch('https://clients3.google.com/generate_204', {
      method: 'GET',
      signal: controller.signal,
    });
    return res.status === 204 || res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

export function useConnectivity(): boolean {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    void checkOnline().then(setOnline);

    const onAppState = (state: AppStateStatus) => {
      if (state === 'active') {
        void checkOnline().then(setOnline);
      }
    };

    const sub = AppState.addEventListener('change', onAppState);
    const interval = setInterval(() => {
      void checkOnline().then(setOnline);
    }, 30_000);

    return () => {
      sub.remove();
      clearInterval(interval);
    };
  }, []);

  return online;
}
