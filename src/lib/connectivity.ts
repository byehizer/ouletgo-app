import { useEffect, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { API_BASE_URL } from '../config/env';

/**
 * Verifica conectividad haciendo HEAD al endpoint de salud del propio backend.
 * Fallback: google.com/generate_204 por si el backend está abajo (distingue "sin red" vs "API caída").
 */
export async function checkOnline(): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const healthUrl = `${API_BASE_URL.replace(/\/$/, '')}/actuator/health`;
    const res = await fetch(healthUrl, { method: 'HEAD', signal: controller.signal });
    clearTimeout(timeout);
    return res.ok || res.status < 500;
  } catch {
    // Fallback: red general
    try {
      const fallback = new AbortController();
      const fallbackTimeout = setTimeout(() => fallback.abort(), 4000);
      const res = await fetch('https://www.google.com/generate_204', {
        method: 'HEAD',
        signal: fallback.signal,
      });
      clearTimeout(fallbackTimeout);
      return res.ok;
    } catch {
      return false;
    }
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
