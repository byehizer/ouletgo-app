import { mockFetchCatalogProducts } from './catalogMock';
import { getMockStoreSchedule } from './storeScheduleMock';
import type { CatalogProduct } from '../catalogApi';
import type { NearbyStore, NearbyStoresQuery, StoreProfile, StoreProductsQuery, StoreSearchQuery } from '../storeApi';
import type { ProductReview } from '../productApi';
import type { Page } from '../types';
import { computeDistanceKm, type Coordinates } from '../../lib/location';
import { isStoreOpenNow } from '../../lib/storeSchedule';

const delay = (ms = 350) => new Promise((r) => setTimeout(r, ms));

const FALLBACK_ORIGIN: Coordinates = { latitude: -34.6627, longitude: -58.3647 };

interface MockStoreSeed {
  id: string;
  name: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  ratingAvg: number | null;
  ratingCount: number;
  instagramUrl: string | null;
  whatsapp: string | null;
  reviews: ProductReview[];
}

const MOCK_STORES: MockStoreSeed[] = [
  {
    id: 'mock-store-1',
    name: 'Textil Avellaneda',
    description:
      'Mayorista y minorista de indumentaria en Avellaneda. Remeras, pantalones y camperas con stock permanente.',
    address: 'Av. Mitre 2847, Avellaneda, Buenos Aires',
    latitude: -34.6627,
    longitude: -58.3647,
    ratingAvg: 4.3,
    ratingCount: 128,
    instagramUrl: 'https://instagram.com/textilavellaneda',
    whatsapp: '5491123456701',
    reviews: [
      { id: 'store-rev-1-1', rating: 5, comment: 'Excelente atención y precios mayoristas reales.', authorName: 'María G.', createdAt: '2026-04-12T14:30:00Z', isVisible: true, imageUrls: [] },
      { id: 'store-rev-1-2', rating: 4, comment: 'Buena variedad de talles, volvería.', authorName: 'Lucas P.', createdAt: '2026-03-28T10:15:00Z', isVisible: true, imageUrls: [] },
    ],
  },
  {
    id: 'mock-store-2',
    name: 'Moda Sur',
    description: 'Ropa urbana y streetwear. Novedades semanales en remeras oversize y joggings.',
    address: 'Lavalle 1520, Avellaneda, Buenos Aires',
    latitude: -34.6589,
    longitude: -58.3712,
    ratingAvg: 4.1,
    ratingCount: 86,
    instagramUrl: 'https://instagram.com/modasur.outlet',
    whatsapp: '5491123456702',
    reviews: [
      { id: 'store-rev-2-1', rating: 4, comment: 'Local prolijo, buena calidad en remeras.', authorName: 'Sofía R.', createdAt: '2026-05-01T16:00:00Z', isVisible: true, imageUrls: [] },
    ],
  },
  {
    id: 'mock-store-3',
    name: 'Outlet Premium',
    description: 'Outlet de marcas con descuentos por volumen. Ideal para revendedores.',
    address: 'Monteagudo 890, Avellaneda, Buenos Aires',
    latitude: -34.6712,
    longitude: -58.3551,
    ratingAvg: 4.6,
    ratingCount: 204,
    instagramUrl: 'https://instagram.com/outletpremium.ba',
    whatsapp: '5491123456703',
    reviews: [
      { id: 'store-rev-3-1', rating: 5, comment: 'Los mejores precios de la zona.', authorName: 'Diego M.', createdAt: '2026-05-10T11:45:00Z', isVisible: true, imageUrls: [] },
      { id: 'store-rev-3-2', rating: 4, comment: null, authorName: 'Ana L.', createdAt: '2026-04-20T09:20:00Z', isVisible: true, imageUrls: [] },
    ],
  },
  {
    id: 'mock-store-4',
    name: 'Polo Jeans',
    description: 'Especialistas en denim y pantalones. Talles del 36 al 50.',
    address: 'Sáenz Peña 1105, Avellaneda, Buenos Aires',
    latitude: -34.6555,
    longitude: -58.3488,
    ratingAvg: 3.9,
    ratingCount: 57,
    instagramUrl: null,
    whatsapp: '5491123456704',
    reviews: [],
  },
  {
    id: 'mock-store-5',
    name: 'Urban Stock',
    description: 'Stock permanente de camperas, buzos y accesorios. Retiro en local.',
    address: 'Av. Bartolomé Mitre 3201, Avellaneda, Buenos Aires',
    latitude: -34.6688,
    longitude: -58.3799,
    ratingAvg: 4.0,
    ratingCount: 73,
    instagramUrl: 'https://instagram.com/urbanstock.av',
    whatsapp: null,
    reviews: [
      { id: 'store-rev-5-1', rating: 4, comment: 'Camperas de buena calidad a precio outlet.', authorName: 'Carla V.', createdAt: '2026-05-15T13:10:00Z', isVisible: true, imageUrls: [] },
    ],
  },
];

function findStore(storeId: string): MockStoreSeed | undefined {
  return MOCK_STORES.find((s) => s.id === storeId);
}

function withDistance(store: MockStoreSeed, coords?: Coordinates | null): StoreProfile {
  let distanceKm: number | null = null;
  if (coords) {
    distanceKm = computeDistanceKm(coords, {
      latitude: store.latitude,
      longitude: store.longitude,
    });
  }

  const schedule = getMockStoreSchedule(store.id);

  return {
    ...store,
    schedule,
    isOpenNow: isStoreOpenNow(schedule),
    distanceKm,
  };
}

export async function mockFetchStoreProfile(
  storeId: string,
  coords?: Coordinates | null,
): Promise<StoreProfile> {
  await delay(300);

  const store = findStore(storeId);
  if (!store) {
    throw new Error('Tienda no encontrada.');
  }

  return withDistance(store, coords);
}

export async function mockFetchStoreProducts(
  storeId: string,
  params: StoreProductsQuery,
): Promise<Page<CatalogProduct>> {
  await delay(350);

  const store = findStore(storeId);
  if (!store) {
    throw new Error('Tienda no encontrada.');
  }

  return mockFetchCatalogProducts({
    page: params.page,
    size: params.size,
    storeId,
    latitude: params.latitude,
    longitude: params.longitude,
    name: params.name,
    categoryId: params.categoryId,
    minPrice: params.minPrice,
    maxPrice: params.maxPrice,
    sizeFilter: params.sizeFilter,
  });
}

function toNearbyStore(store: MockStoreSeed, origin: Coordinates): NearbyStore {
  const schedule = getMockStoreSchedule(store.id);
  return {
    id: store.id,
    name: store.name,
    address: store.address,
    latitude: store.latitude,
    longitude: store.longitude,
    ratingAvg: store.ratingAvg,
    ratingCount: store.ratingCount,
    distanceKm: computeDistanceKm(origin, {
      latitude: store.latitude,
      longitude: store.longitude,
    }),
    isOpenNow: isStoreOpenNow(schedule),
  };
}

export async function mockFetchNearbyStores(query: NearbyStoresQuery): Promise<NearbyStore[]> {
  await delay(400);

  const origin = { latitude: query.latitude, longitude: query.longitude };
  const hasRadiusLimit = query.radiusKm != null;

  let results = MOCK_STORES.map((store) => toNearbyStore(store, origin))
    .filter((s) => !hasRadiusLimit || s.distanceKm <= query.radiusKm!)
    .sort((a, b) => a.distanceKm - b.distanceKm);

  if (query.openNow) {
    results = results.filter((s) => s.isOpenNow);
  }

  return results;
}

export async function mockSearchStoresByName(query: StoreSearchQuery): Promise<NearbyStore[]> {
  await delay(280);

  const q = query.name.trim().toLowerCase();
  if (q.length < 2) return [];

  const origin: Coordinates = {
    latitude: query.latitude ?? FALLBACK_ORIGIN.latitude,
    longitude: query.longitude ?? FALLBACK_ORIGIN.longitude,
  };

  const limit = query.limit ?? 8;

  return MOCK_STORES.filter(
    (store) =>
      store.name.toLowerCase().includes(q) ||
      store.address.toLowerCase().includes(q),
  )
    .map((store) => toNearbyStore(store, origin))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
}
