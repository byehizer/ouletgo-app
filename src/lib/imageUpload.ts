/**
 * imageUpload.ts — Subida de imágenes para chat, reseñas y perfil.
 *
 * Backend:
 *   POST /api/buyer/uploads/chat-image    multipart/form-data  field: file → { url }
 *   POST /api/buyer/uploads/review-image  multipart/form-data  field: file → { url }
 *   POST /api/buyer/uploads/avatar        multipart/form-data  field: file → { url }
 */
import { apiClient } from '../api/client';
import { USE_MOCKS } from '../config/env';

export interface UploadImageResult {
  url: string;
}

async function uploadImage(localUri: string, endpoint: string): Promise<UploadImageResult> {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 300));
    return { url: localUri };
  }

  const formData = new FormData();
  const filename = localUri.split('/').pop() ?? 'photo.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';

  formData.append('file', { uri: localUri, name: filename, type } as unknown as Blob);
  return apiClient.post<UploadImageResult>(endpoint, formData);
}

export async function uploadChatImage(localUri: string): Promise<UploadImageResult> {
  return uploadImage(localUri, '/api/buyer/uploads/chat-image');
}

export async function uploadReviewImage(localUri: string): Promise<UploadImageResult> {
  return uploadImage(localUri, '/api/buyer/uploads/review-image');
}

/** Sube varias imágenes en paralelo y devuelve las URLs públicas. */
export async function uploadReviewImages(localUris: string[]): Promise<string[]> {
  const results = await Promise.all(localUris.map((uri) => uploadReviewImage(uri)));
  return results.map((r) => r.url);
}

export async function uploadAvatar(localUri: string): Promise<UploadImageResult> {
  return uploadImage(localUri, '/api/buyer/uploads/avatar');
}
