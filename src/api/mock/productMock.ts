import type { ProductDetail, ProductReview, ProductVariation } from '../productApi';

const delay = (ms = 350) => new Promise((r) => setTimeout(r, ms));

const COLORS = ['Negro', 'Blanco', 'Azul', 'Gris'] as const;

const STORE_NAMES = ['Textil Avellaneda', 'Moda Sur', 'Outlet Premium', 'Polo Jeans', 'Urban Stock'];

const PRODUCT_NAMES: Record<string, string[]> = {
  'cat-remeras': ['Remera básica algodón', 'Remera oversize', 'Remera estampada', 'Remera deportiva'],
  'cat-pantalones': ['Jean slim', 'Pantalón cargo', 'Jogging unisex', 'Babucha frisa'],
  'cat-camperas': ['Campera rompeviento', 'Campera jean', 'Bomber jacket', 'Parka impermeable'],
  'cat-calzado': ['Zapatilla de lona urbana', 'Zapatilla running deportiva', 'Zapato de vestir cuero', 'Bota urbana negra'],
  'cat-accesorios': ['Cinturón cuero', 'Gorra trucker', 'Bufanda lana', 'Riñonera urbana'],
};

const MOCK_CATEGORIES = [
  { id: 'cat-remeras', name: 'Remeras' },
  { id: 'cat-pantalones', name: 'Pantalones' },
  { id: 'cat-camperas', name: 'Camperas' },
  { id: 'cat-calzado', name: 'Zapatos' },
  { id: 'cat-accesorios', name: 'Accesorios' },
];

function getProductName(idx: number): string {
  const catIndex = Math.floor((idx - 1) / 8);
  const category = MOCK_CATEGORIES[catIndex];
  const names = (category ? PRODUCT_NAMES[category.id] : undefined) ?? ['Producto outlet'];
  const i = (idx - 1) % 8;
  const base = names[i % names.length] ?? 'Producto outlet';
  return `${base} ${i + 1}`;
}

function buildVariations(productId: string, basePrice: number, sizes: string[]): ProductVariation[] {
  const variations: ProductVariation[] = [];
  let vi = 0;

  for (const size of sizes) {
    for (const color of COLORS.slice(0, 2)) {
      vi += 1;
      variations.push({
        id: `${productId}-var-${vi}`,
        size,
        color,
        stock: vi % 4 === 0 ? 0 : 3 + (vi % 8),
        price: basePrice + (vi % 3) * 500,
      });
    }
  }

  return variations;
}

function buildReviews(productId: string): ProductReview[] {
  return [
    {
      id: `${productId}-rev-1`,
      rating: 5,
      comment: 'Excelente calidad de tela, tal como en las fotos.',
      authorName: 'Laura M.',
      createdAt: '2026-03-15T14:30:00.000Z',
      isVisible: true,
      imageUrls: [
        'https://picsum.photos/seed/review-a1/400/400',
        'https://picsum.photos/seed/review-a2/400/400',
      ],
    },
    {
      id: `${productId}-rev-2`,
      rating: 4,
      comment: 'Muy buen precio para outlet. Llegó rápido a retirar.',
      authorName: 'Carlos R.',
      createdAt: '2026-02-20T10:00:00.000Z',
      isVisible: true,
      imageUrls: [],
    },
    {
      id: `${productId}-rev-3`,
      rating: 2,
      comment: 'Reseña oculta por moderación.',
      authorName: 'Anónimo',
      createdAt: '2026-01-10T08:00:00.000Z',
      isVisible: false,
      imageUrls: [],
    },
  ];
}

function parseMockProductIndex(id: string): number {
  const match = id.match(/mock-prod-(\d+)/);
  return match?.[1] ? Number(match[1]) : 1;
}

export async function mockFetchProductDetail(productId: string): Promise<ProductDetail> {
  await delay();

  const idx = parseMockProductIndex(productId);
  const storeIdx = idx % STORE_NAMES.length;
  const storeName = STORE_NAMES[storeIdx] ?? 'Tienda';
  const storeId = `mock-store-${storeIdx + 1}`;
  const basePrice = 8500 + idx * 1250;

  const catIndex = Math.floor((idx - 1) / 8);
  const category = MOCK_CATEGORIES[catIndex];
  const isFootwear = category?.id === 'cat-calzado';

  const sizes = isFootwear
    ? ['38', '39', '40', '41', '42'].filter((_, i) => (idx + i) % 2 === 0)
    : ['S', 'M', 'L', 'XL'].filter((_, i) => (idx + i) % 2 === 0);

  const fallbackSizes = isFootwear ? ['40', '41'] : ['M', 'L'];

  return {
    id: productId,
    name: getProductName(idx),
    description:
      'Prenda de outlet del polo textil de Avellaneda. ' +
      'Material de calidad, ideal para revendedores y consumo final. ' +
      'Retiro en local del vendedor.',
    imageUrls: [],
    thumbnailUrl: null,
    price: basePrice,
    storeId,
    storeName,
    ratingAvg: idx % 3 === 0 ? null : 4.2,
    ratingCount: idx * 2,
    variations: buildVariations(productId, basePrice, sizes.length > 0 ? sizes : fallbackSizes),
    reviews: buildReviews(productId),
  };
}

export async function mockFetchSimilarProducts(productId: string): Promise<any[]> {
  await delay(250);
  const idx = parseMockProductIndex(productId);

  const similarProducts: any[] = [];
  for (let i = 1; i <= 4; i++) {
    const similarIdx = idx + i * 2;
    const storeIdx = similarIdx % STORE_NAMES.length;
    const storeName = STORE_NAMES[storeIdx] ?? 'Tienda';
    const storeId = `mock-store-${storeIdx + 1}`;
    const price = 8500 + similarIdx * 1250;

    similarProducts.push({
      id: `mock-prod-${similarIdx}`,
      name: getProductName(similarIdx),
      thumbnailUrl: `https://picsum.photos/seed/prod-${similarIdx}/300/300`,
      price,
      storeId,
      storeName,
      ratingAvg: similarIdx % 3 === 0 ? null : 4.5,
      ratingCount: similarIdx * 3,
    });
  }

  return similarProducts;
}

