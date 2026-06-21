import type { CatalogCategory, CatalogProduct, CatalogQuery } from '../catalogApi';
import type { Page } from '../types';
import { getMockStoreSchedule } from './storeScheduleMock';
import { isStoreOpenNow } from '../../lib/storeSchedule';

const delay = (ms = 350) => new Promise((r) => setTimeout(r, ms));

export const MOCK_CATEGORIES: CatalogCategory[] = [
  { id: 'cat-remeras', name: 'Remeras' },
  { id: 'cat-pantalones', name: 'Pantalones' },
  { id: 'cat-camperas', name: 'Camperas' },
  { id: 'cat-calzado', name: 'Zapatos' },
  { id: 'cat-accesorios', name: 'Accesorios' },
];

const STORE_NAMES = ['Textil Avellaneda', 'Moda Sur', 'Outlet Premium', 'Polo Jeans', 'Urban Stock'];

/** Coordenadas ficticias cerca de Avellaneda para demo de distancia. */
const STORE_COORDS: Record<string, { lat: number; lng: number }> = {
  'mock-store-1': { lat: -34.6627, lng: -58.3647 },
  'mock-store-2': { lat: -34.6589, lng: -58.3712 },
  'mock-store-3': { lat: -34.6712, lng: -58.3551 },
  'mock-store-4': { lat: -34.6555, lng: -58.3488 },
  'mock-store-5': { lat: -34.6688, lng: -58.3799 },
};

const PRODUCT_NAMES: Record<string, string[]> = {
  'cat-remeras': ['Remera básica algodón', 'Remera oversize', 'Remera estampada', 'Remera deportiva'],
  'cat-pantalones': ['Jean slim', 'Pantalón cargo', 'Jogging unisex', 'Babucha frisa'],
  'cat-camperas': ['Campera rompeviento', 'Campera jean', 'Bomber jacket', 'Parka impermeable'],
  'cat-calzado': ['Zapatilla de lona urbana', 'Zapatilla running deportiva', 'Zapato de vestir cuero', 'Bota urbana negra'],
  'cat-accesorios': ['Cinturón cuero', 'Gorra trucker', 'Bufanda lana', 'Riñonera urbana'],
};

const SIZE_POOL = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const;

interface MockProductInternal extends CatalogProduct {
  categoryId: string;
  sizes: readonly string[];
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function buildMockProducts(): MockProductInternal[] {
  const items: MockProductInternal[] = [];
  let idx = 0;

  for (const category of MOCK_CATEGORIES) {
    const names = PRODUCT_NAMES[category.id] ?? ['Producto outlet'];
    for (let i = 0; i < 8; i += 1) {
      idx += 1;
      const storeIdx = (idx % STORE_NAMES.length) + 1;
      const storeId = `mock-store-${storeIdx}`;
      const name = names[i % names.length] ?? 'Producto outlet';

      const isFootwear = category.id === 'cat-calzado';
      const sizes = isFootwear
        ? ['37', '38', '39', '40', '41', '42'].filter((_, si) => (idx + si) % 2 === 0)
        : SIZE_POOL.filter((_, si) => (idx + si) % 2 === 0);

      items.push({
        id: `mock-prod-${idx}`,
        name: `${name} ${i + 1}`,
        thumbnailUrl: null,
        price: 8500 + idx * 1250,
        storeName: STORE_NAMES[idx % STORE_NAMES.length] ?? 'Tienda',
        storeId,
        ratingAvg: idx % 3 === 0 ? null : 3.5 + (idx % 15) / 10,
        ratingCount: idx * 3,
        categoryId: category.id,
        sizes,
      });
    }
  }

  return items;
}

const ALL_PRODUCTS = buildMockProducts();

export async function mockFetchCategories(): Promise<CatalogCategory[]> {
  await delay(200);
  return MOCK_CATEGORIES;
}

export async function mockFetchCatalogProducts(params: CatalogQuery): Promise<Page<CatalogProduct>> {
  await delay(400);

  const page = params.page ?? 0;
  const size = params.size ?? 10;

  let filtered = [...ALL_PRODUCTS];

  if (params.categoryId) {
    filtered = filtered.filter((p) => p.categoryId === params.categoryId);
  }

  if (params.storeId) {
    filtered = filtered.filter((p) => p.storeId === params.storeId);
  }

  if (params.name?.trim()) {
    const q = params.name.trim().toLowerCase();
    filtered = filtered.filter((p) => p.name.toLowerCase().includes(q));
  }

  if (params.minPrice != null) {
    filtered = filtered.filter((p) => p.price >= params.minPrice!);
  }

  if (params.maxPrice != null) {
    filtered = filtered.filter((p) => p.price <= params.maxPrice!);
  }

  if (params.sizeFilter) {
    filtered = filtered.filter((p) => p.sizes.includes(params.sizeFilter!));
  }

  if (params.openNow) {
    filtered = filtered.filter((p) => {
      const schedule = getMockStoreSchedule(p.storeId);
      return isStoreOpenNow(schedule);
    });
  }

  if (
    params.latitude != null &&
    params.longitude != null &&
    params.radiusKm != null
  ) {
    filtered = filtered.filter((p) => {
      const store = STORE_COORDS[p.storeId];
      if (!store) return false;
      const dist = haversineKm(params.latitude!, params.longitude!, store.lat, store.lng);
      return dist <= params.radiusKm!;
    });
  }

  const withDistance: CatalogProduct[] = filtered.map((p) => {
    const { categoryId: _c, sizes: _s, ...product } = p;
    if (params.latitude != null && params.longitude != null) {
      const store = STORE_COORDS[p.storeId];
      if (store) {
        return {
          ...product,
          distanceKm: haversineKm(params.latitude, params.longitude, store.lat, store.lng),
        };
      }
    }
    return product;
  });

  const start = page * size;
  const content = withDistance.slice(start, start + size);

  return {
    content,
    totalElements: withDistance.length,
    number: page,
    size,
  };
}
