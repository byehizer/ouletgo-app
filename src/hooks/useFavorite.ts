import { useCallback, useEffect, useState } from 'react';

import {
  addFavoriteProduct,
  addFavoriteStore,
  isProductFavorite,
  isStoreFavorite,
  removeFavoriteProduct,
  removeFavoriteStore,
  type FavoriteProductMeta,
  type FavoriteStoreMeta,
} from '../api/favoritesApi';

type FavoriteType = 'product' | 'store';

export function useFavorite(
  type: FavoriteType,
  id: string,
  meta?: FavoriteProductMeta | FavoriteStoreMeta,
) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  const check = useCallback(async () => {
    if (!id) {
      setIsFavorite(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const fav =
        type === 'product' ? await isProductFavorite(id) : await isStoreFavorite(id);
      setIsFavorite(fav);
    } catch {
      setIsFavorite(false);
    } finally {
      setLoading(false);
    }
  }, [type, id]);

  useEffect(() => {
    void check();
  }, [check]);

  const toggle = useCallback(async () => {
    if (!id || toggling) return;
    setToggling(true);
    try {
      if (isFavorite) {
        if (type === 'product') await removeFavoriteProduct(id);
        else await removeFavoriteStore(id);
        setIsFavorite(false);
      } else {
        if (type === 'product') {
          if (!meta || !('productName' in meta)) {
            throw new Error('Datos del producto incompletos.');
          }
          await addFavoriteProduct(id, meta as FavoriteProductMeta);
        } else {
          if (!meta || !('storeName' in meta)) {
            throw new Error('Datos de la tienda incompletos.');
          }
          await addFavoriteStore(id, meta as FavoriteStoreMeta);
        }
        setIsFavorite(true);
      }
    } finally {
      setToggling(false);
    }
  }, [type, id, isFavorite, meta, toggling]);

  return { isFavorite, loading, toggling, toggle, refresh: check };
}
