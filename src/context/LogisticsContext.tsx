import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, useCallback, useMemo, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import {
  fetchUserAddresses,
  createUserAddress,
  updateLogisticsPreference,
  type UserAddress,
  type CreateAddressRequest,
} from '../api/addressApi';
import { getPickupPoints, type OutletGoPickupPoint } from '../api/shippingApi';

export type LogisticsType = 'PICKUP' | 'DELIVERY';

export interface LogisticsPreference {
  type: LogisticsType;
  referenceId: string;
  label: string;
}

interface LogisticsContextValue {
  preference: LogisticsPreference | null;
  addresses: UserAddress[];
  pickupPoints: OutletGoPickupPoint[];
  loading: boolean;
  setPreference: (pref: LogisticsPreference) => Promise<void>;
  addAddress: (req: CreateAddressRequest) => Promise<UserAddress>;
  refreshLogisticsData: () => Promise<void>;
}

const LogisticsContext = createContext<LogisticsContextValue | null>(null);

const STORAGE_KEY = 'outletgo_logistics_preference';

export function LogisticsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [preference, setPreferenceState] = useState<LogisticsPreference | null>(null);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [pickupPoints, setPickupPoints] = useState<OutletGoPickupPoint[]>([]);
  const [loading, setLoading] = useState(true);

  // Carga inicial y recarga
  const refreshLogisticsData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Obtener puntos de retiro (públicos)
      const points = await getPickupPoints();
      setPickupPoints(points);

      // 2. Obtener direcciones si está autenticado
      if (isAuthenticated) {
        const addrs = await fetchUserAddresses();
        setAddresses(addrs);
      } else {
        setAddresses([]);
      }
    } catch (err) {
      console.warn('Error al cargar datos logísticos:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Carga inicial de datos logísticos y persistencia local
  useEffect(() => {
    void refreshLogisticsData();
  }, [refreshLogisticsData]);

  useEffect(() => {
    void (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          setPreferenceState(JSON.parse(stored) as LogisticsPreference);
        }
      } catch (err) {
        console.warn('Error al cargar preferencia logística persistida:', err);
      }
    })();
  }, []);

  // Actualizar la preferencia lograda y persistirla
  const setPreference = useCallback(
    async (pref: LogisticsPreference) => {
      setPreferenceState(pref);
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(pref));
        if (isAuthenticated) {
          // Si está autenticado, sincronizar con el backend
          await updateLogisticsPreference({
            type: pref.type,
            referenceId: pref.referenceId,
          });
        }
      } catch (err) {
        console.warn('Error al guardar preferencia logística:', err);
      }
    },
    [isAuthenticated],
  );

  // Agregar una nueva dirección
  const addAddress = useCallback(
    async (req: CreateAddressRequest) => {
      const newAddr = await createUserAddress(req);
      setAddresses((prev) => [...prev, newAddr]);
      return newAddr;
    },
    [],
  );

  const value = useMemo<LogisticsContextValue>(
    () => ({
      preference,
      addresses,
      pickupPoints,
      loading,
      setPreference,
      addAddress,
      refreshLogisticsData,
    }),
    [preference, addresses, pickupPoints, loading, setPreference, addAddress, refreshLogisticsData],
  );

  return <LogisticsContext.Provider value={value}>{children}</LogisticsContext.Provider>;
}

export function useLogistics(): LogisticsContextValue {
  const context = useContext(LogisticsContext);
  if (!context) {
    throw new Error('useLogistics debe ser utilizado dentro de un LogisticsProvider.');
  }
  return context;
}
