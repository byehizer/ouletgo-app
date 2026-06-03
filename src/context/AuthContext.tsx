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

import type { User } from '../api/types';

WebBrowser.maybeCompleteAuthSession();

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
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

  const redirectToApp = useCallback(() => {
    router.replace('/(tabs)');
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
    async (data: LoginRequest) => {
      const { token, user: loggedUser } = await loginWithEmail(data);
      await persistSession(token, loggedUser);
      setUser(loggedUser);
      redirectToApp();
    },
    [redirectToApp],
  );

  const register = useCallback(
    async (data: RegisterRequest) => {
      const { token, user: registeredUser } = await registerBuyer(data);
      await persistSession(token, registeredUser);
      setUser(registeredUser);
      redirectToApp();
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
  }, [completeOAuthSession]);

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
