/**
 * lensApi.ts — Búsqueda visual por imagen.
 *
 * Flujo:
 *   1. El cliente sube la imagen como multipart/form-data
 *   2. El backend hace proxy a Google Cloud Vision / Lens
 *   3. Devuelve productos del catálogo OutletGo que coinciden visualmente
 *
 * Backend: POST /api/buyer/search/visual
 *   Body: multipart/form-data, campo "image"
 *   Response: LensSearchResult
 */
import { apiClient } from './client';
import { USE_MOCKS } from '../config/env';
import { mockSearchByImage } from './mock/lensMock';

import type { CatalogProduct } from './catalogApi';

export interface LensSearchResult {
  /** Productos del catálogo OutletGo que coinciden visualmente con la imagen. */
  products: CatalogProduct[];
  /** Etiquetas/categorías detectadas en la imagen (para mostrar al usuario). */
  detectedTags: string[];
  /** Indica si el backend encontró coincidencias reales o devolvió fallback por baja confianza. */
  hasMeaningfulResults: boolean;
}

export async function searchByImage(localUri: string): Promise<LensSearchResult> {
  if (USE_MOCKS) {
    return mockSearchByImage(localUri);
  }

  const formData = new FormData();
  const filename = localUri.split('/').pop() ?? 'photo.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';

  formData.append('image', { uri: localUri, name: filename, type } as unknown as Blob);

  return apiClient.post<LensSearchResult>('/api/buyer/search/visual', formData);
}
