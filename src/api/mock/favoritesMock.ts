import type {
  FavoriteProduct,
  FavoriteProductMeta,
  FavoriteStore,
  FavoriteStoreMeta,
} from '../favoritesApi';
import { getMockProfileUser } from './mockUserState';

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

interface MockFavoriteProduct extends FavoriteProduct {
  userEmail: string;
}

interface MockFavoriteStore extends FavoriteStore {
  userEmail: string;
}

const SEED_PRODUCTS: MockFavoriteProduct[] = [
  {
    userEmail: 'comprador@outletgo.com',
    productId: 'mock-prod-1',
    productName: 'Remera básica algodón 1',
    thumbnailUrl: 'https://picsum.photos/seed/prod1/200/200',
    price: 4500,
    storeId: 'mock-store-1',
    storeName: 'Textil Avellaneda',
    addedAt: '2026-05-01T10:00:00.000Z',
  },
  {
    userEmail: 'comprador@outletgo.com',
    productId: 'mock-prod-9',
    productName: 'Jean slim 1',
    thumbnailUrl: 'https://picsum.photos/seed/prod9/200/200',
    price: 12000,
    storeId: 'mock-store-2',
    storeName: 'Moda Sur',
    addedAt: '2026-05-10T14:30:00.000Z',
  },
];

const SEED_STORES: MockFavoriteStore[] = [
  {
    userEmail: 'comprador@outletgo.com',
    storeId: 'mock-store-1',
    storeName: 'Textil Avellaneda',
    address: 'Av. Mitre 2847, Avellaneda, Buenos Aires',
    ratingAvg: 4.3,
    ratingCount: 128,
    addedAt: '2026-04-20T09:00:00.000Z',
  },
  {
    userEmail: 'comprador@outletgo.com',
    storeId: 'mock-store-3',
    storeName: 'Outlet Premium',
    address: 'Monteagudo 890, Avellaneda, Buenos Aires',
    ratingAvg: 4.6,
    ratingCount: 204,
    addedAt: '2026-05-12T16:00:00.000Z',
  },
];

let productFavorites = [...SEED_PRODUCTS];
let storeFavorites = [...SEED_STORES];

export async function mockFetchFavoriteProducts(): Promise<FavoriteProduct[]> {
  await delay();
  const user = await getMockProfileUser();
  const userEmail = user?.email ?? '';
  return productFavorites.filter(
    (p) => p.userEmail.toLowerCase() === userEmail.toLowerCase(),
  );
}

export async function mockFetchFavoriteStores(): Promise<FavoriteStore[]> {
  await delay();
  const user = await getMockProfileUser();
  const userEmail = user?.email ?? '';
  return storeFavorites.filter(
    (s) => s.userEmail.toLowerCase() === userEmail.toLowerCase(),
  );
}

export async function mockIsProductFavorite(productId: string): Promise<boolean> {
  await delay(100);
  const user = await getMockProfileUser();
  const userEmail = user?.email ?? '';
  return productFavorites.some(
    (p) => p.productId === productId && p.userEmail.toLowerCase() === userEmail.toLowerCase(),
  );
}

export async function mockIsStoreFavorite(storeId: string): Promise<boolean> {
  await delay(100);
  const user = await getMockProfileUser();
  const userEmail = user?.email ?? '';
  return storeFavorites.some(
    (s) => s.storeId === storeId && s.userEmail.toLowerCase() === userEmail.toLowerCase(),
  );
}

export async function mockAddFavoriteProduct(
  productId: string,
  meta: FavoriteProductMeta,
): Promise<void> {
  await delay(200);
  const user = await getMockProfileUser();
  const userEmail = user?.email ?? '';

  if (
    productFavorites.some(
      (p) => p.productId === productId && p.userEmail.toLowerCase() === userEmail.toLowerCase(),
    )
  ) {
    return;
  }

  productFavorites = [
    ...productFavorites,
    {
      userEmail,
      productId,
      productName: meta.productName,
      thumbnailUrl: meta.thumbnailUrl,
      price: meta.price,
      storeId: meta.storeId,
      storeName: meta.storeName,
      addedAt: new Date().toISOString(),
    },
  ];
}

export async function mockRemoveFavoriteProduct(productId: string): Promise<void> {
  await delay(200);
  const user = await getMockProfileUser();
  const userEmail = user?.email ?? '';

  productFavorites = productFavorites.filter(
    (p) => !(p.productId === productId && p.userEmail.toLowerCase() === userEmail.toLowerCase()),
  );
}

export async function mockAddFavoriteStore(storeId: string, meta: FavoriteStoreMeta): Promise<void> {
  await delay(200);
  const user = await getMockProfileUser();
  const userEmail = user?.email ?? '';

  if (
    storeFavorites.some(
      (s) => s.storeId === storeId && s.userEmail.toLowerCase() === userEmail.toLowerCase(),
    )
  ) {
    return;
  }

  storeFavorites = [
    ...storeFavorites,
    {
      userEmail,
      storeId,
      storeName: meta.storeName,
      address: meta.address,
      ratingAvg: meta.ratingAvg,
      ratingCount: meta.ratingCount,
      addedAt: new Date().toISOString(),
    },
  ];
}

export async function mockRemoveFavoriteStore(storeId: string): Promise<void> {
  await delay(200);
  const user = await getMockProfileUser();
  const userEmail = user?.email ?? '';

  storeFavorites = storeFavorites.filter(
    (s) => !(s.storeId === storeId && s.userEmail.toLowerCase() === userEmail.toLowerCase()),
  );
}
