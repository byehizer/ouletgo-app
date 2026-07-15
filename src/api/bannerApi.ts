import { apiClient } from './client';
import { USE_MOCKS } from '../config/env';
import type { TopRatedStore } from './storeApi';
import type { CatalogProduct } from './catalogApi';

export interface PromotionalBanner {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  type: 'CAMPAIGN' | 'STORE' | 'PRODUCT';
  startDate: string;
  endDate: string;
}

export interface CampaignDetails {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  stores: TopRatedStore[];
  products: CatalogProduct[];
}

// MOCKS LOCALES
const mockBanners: PromotionalBanner[] = [
  {
    id: 'banner-1',
    title: 'Gran Campaña de Invierno',
    description: 'Prendas y tiendas seleccionadas con hasta 50% de descuento',
    imageUrl: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=600&auto=format&fit=crop',
    type: 'CAMPAIGN',
    startDate: '2026-07-01T00:00:00Z',
    endDate: '2026-08-31T23:59:59Z',
  },
  {
    id: 'banner-2',
    title: 'Día del Zapato',
    description: 'Todo el calzado participante reunido en un solo lugar',
    imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=600&auto=format&fit=crop',
    type: 'CAMPAIGN',
    startDate: '2026-07-10T00:00:00Z',
    endDate: '2026-07-20T23:59:59Z',
  },
];

const mockCampaignDetails: Record<string, CampaignDetails> = {
  'banner-1': {
    id: 'banner-1',
    title: 'Gran Campaña de Invierno',
    description: 'Prendas y tiendas seleccionadas con hasta 50% de descuento',
    imageUrl: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=600&auto=format&fit=crop',
    stores: [
      {
        id: 'tienda-1',
        name: 'Palermo Outlets',
        ratingAvg: 4.8,
        ratingCount: 142,
        address: 'Gurruchaga 1240, Palermo',
        imageUrl: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?q=80&w=400&auto=format&fit=crop',
      },
      {
        id: 'tienda-2',
        name: 'Urban Sport',
        ratingAvg: 4.6,
        ratingCount: 88,
        address: 'Av. Santa Fe 3400, Palermo',
        imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=400&auto=format&fit=crop',
      },
    ],
    products: [
      {
        id: 'prod-1',
        name: 'Campera de Abrigo Impermeable',
        price: 45000,
        ratingAvg: 4.7,
        ratingCount: 34,
        thumbnailUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=300&auto=format&fit=crop',
        storeId: 'tienda-1',
        storeName: 'Palermo Outlets',
      },
      {
        id: 'prod-2',
        name: 'Sweater de Hilo Invierno',
        price: 28000,
        ratingAvg: 4.5,
        ratingCount: 18,
        thumbnailUrl: 'https://images.unsplash.com/photo-1614975058789-41316d0e2e9c?q=80&w=300&auto=format&fit=crop',
        storeId: 'tienda-1',
        storeName: 'Palermo Outlets',
      },
      {
        id: 'prod-3',
        name: 'Zapatillas Deportivas Run',
        price: 55000,
        ratingAvg: 4.9,
        ratingCount: 52,
        thumbnailUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=300&auto=format&fit=crop',
        storeId: 'tienda-2',
        storeName: 'Urban Sport',
      },
    ],
  },
  'banner-2': {
    id: 'banner-2',
    title: 'Día del Zapato',
    description: 'Todo el calzado participante reunido en un solo lugar',
    imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=600&auto=format&fit=crop',
    stores: [
      {
        id: 'tienda-3',
        name: 'Zapatoteca CABA',
        ratingAvg: 4.9,
        ratingCount: 215,
        address: 'Thames 1540, Palermo',
        imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=400&auto=format&fit=crop',
      },
    ],
    products: [
      {
        id: 'prod-4',
        name: 'Mocasines de Cuero Premium',
        price: 65000,
        ratingAvg: 4.8,
        ratingCount: 22,
        thumbnailUrl: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?q=80&w=300&auto=format&fit=crop',
        storeId: 'tienda-3',
        storeName: 'Zapatoteca CABA',
      },
      {
        id: 'prod-5',
        name: 'Botas de Gamuza Invierno',
        price: 72000,
        ratingAvg: 4.6,
        ratingCount: 15,
        thumbnailUrl: 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?q=80&w=300&auto=format&fit=crop',
        storeId: 'tienda-3',
        storeName: 'Zapatoteca CABA',
      },
    ],
  },
};

export async function fetchActiveBanners(): Promise<PromotionalBanner[]> {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 200));
    return [...mockBanners];
  }
  return apiClient.get<PromotionalBanner[]>('/api/banners/active');
}

export async function fetchCampaignDetails(id: string): Promise<CampaignDetails> {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 300));
    const details = mockCampaignDetails[id];
    if (!details) {
      // Fallback a mock default para IDs creados dinámicamente en testing
      return {
        id,
        title: 'Campaña Activa Especial',
        description: 'Promociones exclusivas por tiempo limitado.',
        imageUrl: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=600&auto=format&fit=crop',
        stores: [
          {
            id: 'tienda-1',
            name: 'Palermo Outlets',
            ratingAvg: 4.8,
            ratingCount: 142,
            address: 'Gurruchaga 1240, Palermo',
            imageUrl: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?q=80&w=400&auto=format&fit=crop',
          }
        ],
        products: [
          {
            id: 'prod-1',
            name: 'Producto en Oferta',
            price: 15000,
            ratingAvg: 4.5,
            ratingCount: 10,
            thumbnailUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=300&auto=format&fit=crop',
            storeId: 'tienda-1',
            storeName: 'Palermo Outlets',
          }
        ]
      };
    }
    return details;
  }
  return apiClient.get<CampaignDetails>(`/api/banners/${id}/details`);
}
