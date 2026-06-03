import type { LensSearchResult } from '../lensApi';
import type { CatalogProduct } from '../catalogApi';

const delay = (ms = 1200) => new Promise((r) => setTimeout(r, ms));

/** Productos mock que "coinciden visualmente" según el grupo de la imagen. */
const RESULT_GROUPS: Array<{ tags: string[]; products: CatalogProduct[] }> = [
  {
    tags: ['remera', 'algodón', 'casual'],
    products: [
      {
        id: 'mock-prod-1',
        name: 'Remera básica algodón 1',
        thumbnailUrl: 'https://picsum.photos/seed/prod1/300/300',
        price: 4500,
        storeName: 'Textil Avellaneda',
        storeId: 'mock-store-1',
        ratingAvg: 4.2,
        ratingCount: 18,
      },
      {
        id: 'mock-prod-2',
        name: 'Remera oversize 2',
        thumbnailUrl: 'https://picsum.photos/seed/prod2/300/300',
        price: 5900,
        storeName: 'Moda Sur',
        storeId: 'mock-store-2',
        ratingAvg: 4.5,
        ratingCount: 31,
      },
      {
        id: 'mock-prod-3',
        name: 'Remera estampada 3',
        thumbnailUrl: 'https://picsum.photos/seed/prod3/300/300',
        price: 4200,
        storeName: 'Outlet Premium',
        storeId: 'mock-store-3',
        ratingAvg: 4.0,
        ratingCount: 12,
      },
      {
        id: 'mock-prod-4',
        name: 'Remera deportiva 4',
        thumbnailUrl: 'https://picsum.photos/seed/prod4/300/300',
        price: 6800,
        storeName: 'Urban Stock',
        storeId: 'mock-store-5',
        ratingAvg: null,
        ratingCount: 0,
      },
    ],
  },
  {
    tags: ['pantalón', 'denim', 'jean'],
    products: [
      {
        id: 'mock-prod-9',
        name: 'Jean slim 1',
        thumbnailUrl: 'https://picsum.photos/seed/prod9/300/300',
        price: 12000,
        storeName: 'Polo Jeans',
        storeId: 'mock-store-4',
        ratingAvg: 4.1,
        ratingCount: 22,
      },
      {
        id: 'mock-prod-10',
        name: 'Pantalón cargo 2',
        thumbnailUrl: 'https://picsum.photos/seed/prod10/300/300',
        price: 9500,
        storeName: 'Moda Sur',
        storeId: 'mock-store-2',
        ratingAvg: 3.9,
        ratingCount: 8,
      },
    ],
  },
  {
    tags: ['campera', 'abrigo', 'invierno'],
    products: [
      {
        id: 'mock-prod-17',
        name: 'Campera rompeviento 1',
        thumbnailUrl: 'https://picsum.photos/seed/prod17/300/300',
        price: 22000,
        storeName: 'Urban Stock',
        storeId: 'mock-store-5',
        ratingAvg: 4.7,
        ratingCount: 44,
      },
      {
        id: 'mock-prod-18',
        name: 'Bomber jacket 2',
        thumbnailUrl: 'https://picsum.photos/seed/prod18/300/300',
        price: 28000,
        storeName: 'Outlet Premium',
        storeId: 'mock-store-3',
        ratingAvg: 4.6,
        ratingCount: 29,
      },
      {
        id: 'mock-prod-20',
        name: 'Parka impermeable 4',
        thumbnailUrl: 'https://picsum.photos/seed/prod20/300/300',
        price: 35000,
        storeName: 'Textil Avellaneda',
        storeId: 'mock-store-1',
        ratingAvg: 4.8,
        ratingCount: 57,
      },
    ],
  },
];

let groupIndex = 0;

export async function mockSearchByImage(_localUri: string): Promise<LensSearchResult> {
  await delay();
  // Rotamos entre grupos para que la demo sea variada
  const group = RESULT_GROUPS[groupIndex % RESULT_GROUPS.length]!;
  groupIndex += 1;
  return {
    products: group.products,
    detectedTags: group.tags,
    hasMeaningfulResults: true,
  };
}
