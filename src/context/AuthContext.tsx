import * as WebBrowser from 'expo-web-browser';
import { router } from 'expo-router';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  fetchCurrentUser,
  fetchGoogleInitUrl,
  fetchMeWithToken,
  loginWithEmail,
  recoverPassword,
  registerBuyer,
  type LoginRequest,
  type RegisterRequest,
} from '../api/authApi';
import { ApiError } from '../api/client';
import { mockGoogleLogin } from '../api/mock/authMock';
import { USE_MOCKS } from '../config/env';
import { extractTokenFromAuthUrl, getOAuthRedirectUrl } from '../lib/authRedirect';
import { unregisterPushNotifications } from '../lib/notifications';
import { onUnauthorized } from '../lib/onUnauthorized';
import {
  clearSession,
  getToken,
  getUser,
  saveToken,
  saveUser,
} from '../lib/secureStore';
import { supabase } from '../lib/supabase';

import type { User } from '../api/types';

WebBrowser.maybeCompleteAuthSession();

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginRequest, redirectPath?: string) => Promise<void>;
  register: (data: RegisterRequest, redirectPath?: string) => Promise<void>;
  logout: () => Promise<void>;
  recoverPassword: (email: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  completeOAuthSession: (token: string) => Promise<void>;
  /** Actualiza usuario en memoria y AsyncStorage (tras editar perfil). */
  updateSessionUser: (user: User) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function persistSession(token: string, user: User): Promise<void> {
  await saveToken(token);
  await saveUser(user);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const redirectToLogin = useCallback(() => {
    router.replace('/(auth)/login');
  }, []);

  const redirectToApp = useCallback((customPath?: string) => {
    if (customPath) {
      router.replace(customPath as any);
    } else {
      router.replace('/(tabs)');
    }
  }, []);

  const handleSessionExpired = useCallback(async () => {
    await unregisterPushNotifications();
    await clearSession();
    setUser(null);
    redirectToLogin();
  }, [redirectToLogin]);

  useEffect(() => {
    return onUnauthorized(() => {
      void handleSessionExpired();
    });
  }, [handleSessionExpired]);

  useEffect(() => {
    void (async () => {
      try {
        const [token, storedUser] = await Promise.all([
          getToken(),
          getUser<User>(),
        ]);

        if (!token) {
          setUser(null);
          return;
        }

        if (storedUser) {
          setUser(storedUser);
        }

        try {
          const freshUser = await fetchCurrentUser({ silent401: true });
          setUser(freshUser);
          await saveUser(freshUser);
        } catch {
          await clearSession();
          setUser(null);
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const completeOAuthSession = useCallback(
    async (token: string) => {
      const me = await fetchMeWithToken(token);
      await persistSession(token, me);
      setUser(me);
      redirectToApp();
    },
    [redirectToApp],
  );

  const login = useCallback(
    async (data: LoginRequest, redirectPath?: string) => {
      const { token, user: loggedUser } = await loginWithEmail(data);
      await persistSession(token, loggedUser);
      setUser(loggedUser);
      redirectToApp(redirectPath);
    },
    [redirectToApp],
  );

  const register = useCallback(
    async (data: RegisterRequest, redirectPath?: string) => {
      const { token, user: registeredUser } = await registerBuyer(data);
      await persistSession(token, registeredUser);
      setUser(registeredUser);
      redirectToApp(redirectPath);
    },
    [redirectToApp],
  );

  const logout = useCallback(async () => {
    await unregisterPushNotifications();
    await clearSession();
    setUser(null);
    redirectToLogin();
  }, [redirectToLogin]);

  const updateSessionUser = useCallback(async (next: User) => {
    setUser(next);
    await saveUser(next);
  }, []);

  const recoverPasswordHandler = useCallback(async (email: string) => {
    await recoverPassword({ email });
  }, []);

  const loginWithGoogle = useCallback(async () => {
    if (USE_MOCKS) {
      const { token } = await mockGoogleLogin();
      await completeOAuthSession(token);
      return;
    }

    const hasSupabase =
      Boolean(process.env.EXPO_PUBLIC_SUPABASE_URL) &&
      Boolean(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

    if (hasSupabase) {
      const redirectUrl = getOAuthRedirectUrl();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
        if (result.type === 'success' && result.url) {
          // Extraer hash/params devueltos por Supabase
          const urlStr = result.url;
          let session = (await supabase.auth.getSession()).data.session;

          if (!session && urlStr.includes('#')) {
            const hash = urlStr.split('#')[1];
            const params = new URLSearchParams(hash);
            const accessToken = params.get('access_token');
            const refreshToken = params.get('refresh_token');
            if (accessToken && refreshToken) {
              const res = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });
              session = res.data.session;
            }
          }

          // Obtener email y metadata del usuario de Supabase
          const email = session?.user?.email;
          if (!email) {
            throw new Error('No se pudo obtener el email de Google.');
          }

          const name =
            session?.user?.user_metadata?.full_name ??
            session?.user?.user_metadata?.name ??
            null;
          const avatarUrl =
            session?.user?.user_metadata?.avatar_url ??
            session?.user?.user_metadata?.picture ??
            null;

          // Llamar al backend para obtener nuestro propio JWT
          // Si el usuario ya existe → login; si no → registro automático como CLIENT
          const { EXPO_PUBLIC_BACKEND_URL } = process.env;
          const backendRes = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/auth/google/callback`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, name, avatarUrl }),
          });

          if (!backendRes.ok) {
            const errBody = await backendRes.text();
            throw new Error(`Error al autenticar con el servidor: ${errBody}`);
          }

          const { token, user: backendUser } = await backendRes.json();
          await persistSession(token, backendUser);
          setUser(backendUser);
          redirectToApp();
          return;
        }
      }
      return;
    }

    try {
      const googleUrl = await fetchGoogleInitUrl();
      const redirectUrl = getOAuthRedirectUrl();
      const result = await WebBrowser.openAuthSessionAsync(googleUrl, redirectUrl);

      if (result.type !== 'success') {
        return;
      }

      const token = extractTokenFromAuthUrl(result.url);
      if (!token) {
        throw new Error('No se recibió el token de Google.');
      }

      await completeOAuthSession(token);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (
        message.includes('404') ||
        message.includes('static resource') ||
        message.includes('No static resource') ||
        message.includes('Network request failed')
      ) {
        const { token } = await mockGoogleLogin();
        await completeOAuthSession(token);
        return;
      }
      throw err;
    }
  }, [completeOAuthSession, redirectToApp]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: user !== null,
      login,
      register,
      logout,
      recoverPassword: recoverPasswordHandler,
      loginWithGoogle,
      completeOAuthSession,
      updateSessionUser,
    }),
    [
      user,
      isLoading,
      login,
      register,
      logout,
      recoverPasswordHandler,
      loginWithGoogle,
      completeOAuthSession,
      updateSessionUser,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return ctx;
}

export function getAuthErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return 'Credenciales inválidas.';
    }
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Algo salió mal. Intentá de nuevo.';
}
