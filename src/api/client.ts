import { API_BASE_URL } from '../config/env';
import { getToken } from '../lib/secureStore';
import { dispatchUnauthorized } from '../lib/onUnauthorized';

import type { ApiErrorBody, Page } from './types';

export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, body: unknown, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

export interface ApiFetchInit extends Omit<RequestInit, 'body'> {
  /** No adjunta Authorization (endpoints públicos). */
  skipAuth?: boolean;
  /** Token explícito (OAuth callback antes de persistir). */
  bearerToken?: string;
  /** Idempotency key para pagos y confirmación de pedidos. */
  idempotencyKey?: string;
  /** No dispara logout global en 401 (login/register con credenciales inválidas). */
  suppressUnauthorizedEvent?: boolean;
}

const MAX_429_RETRIES = 2;
const RETRY_BASE_MS = 1000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function messageFromBody(body: unknown, status: number): string {
  if (status === 429) {
    return 'Demasiados intentos. Esperá un momento.';
  }
  if (!body || typeof body !== 'object') {
    return 'Algo salió mal. Intentá de nuevo.';
  }
  const parsed = body as ApiErrorBody;
  if (parsed.error?.message) {
    return parsed.error.message;
  }
  if (parsed.message) {
    return parsed.message;
  }
  return 'Algo salió mal. Intentá de nuevo.';
}

function resolveUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const base = API_BASE_URL.replace(/\/$/, '');
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalized}`;
}

async function parseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (text === '') {
    return null;
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

async function authorizeHeaders(
  headers: Headers,
  skipAuth: boolean | undefined,
  bearerToken: string | undefined,
): Promise<void> {
  if (skipAuth) {
    return;
  }
  const token = bearerToken ?? (await getToken());
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
}

function buildHeadersWithJsonBody(
  initHeaders: HeadersInit | undefined,
  body: unknown,
): { headers: Headers; serialized: BodyInit | undefined } {
  const headers = new Headers(initHeaders);
  if (body === undefined) {
    return { headers, serialized: undefined };
  }
  if (body instanceof FormData || body instanceof URLSearchParams) {
    return { headers, serialized: body };
  }
  if (typeof body === 'string') {
    return { headers, serialized: body };
  }
  headers.set('Content-Type', 'application/json');
  return { headers, serialized: JSON.stringify(body) };
}

/**
 * Normaliza Page<T> del backend con coerción defensiva snake_case.
 */
export function normalizePage<T>(raw: unknown): Page<T> {
  if (!raw || typeof raw !== 'object') {
    return { content: [], totalElements: 0, number: 0, size: 0 };
  }
  const obj = raw as Record<string, unknown>;
  const content = Array.isArray(obj['content']) ? (obj['content'] as T[]) : [];
  const totalElements =
    typeof obj['totalElements'] === 'number'
      ? obj['totalElements']
      : typeof obj['total_elements'] === 'number'
        ? obj['total_elements']
        : content.length;
  const number = typeof obj['number'] === 'number' ? obj['number'] : 0;
  const size = typeof obj['size'] === 'number' ? obj['size'] : content.length;
  return { content, totalElements, number, size };
}

async function request<T>(
  path: string,
  init: ApiFetchInit & { body?: BodyInit | null },
  attempt = 0,
): Promise<T> {
  const { skipAuth, bearerToken, idempotencyKey, suppressUnauthorizedEvent, body, ...fetchInit } = init;
  const url = resolveUrl(path);
  const headers = new Headers(fetchInit.headers);

  await authorizeHeaders(headers, skipAuth, bearerToken);

  if (idempotencyKey) {
    headers.set('Idempotency-Key', idempotencyKey);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...fetchInit,
      headers,
      body,
    });
  } catch {
    throw new ApiError(
      0,
      null,
      'Sin conexión. Verificá tu internet.',
    );
  }

  if (response.status === 429 && attempt < MAX_429_RETRIES) {
    const retryAfterHeader = response.headers.get('Retry-After');
    const retryAfterSec = retryAfterHeader ? Number(retryAfterHeader) : NaN;
    const delayMs = Number.isFinite(retryAfterSec)
      ? retryAfterSec * 1000
      : RETRY_BASE_MS * (attempt + 1);
    await sleep(delayMs);
    return request<T>(path, init, attempt + 1);
  }

  const payload = await parseBody(response);

  if (response.status === 401) {
    if (!suppressUnauthorizedEvent) {
      dispatchUnauthorized();
    }
    throw new ApiError(401, payload, messageFromBody(payload, 401));
  }

  if (!response.ok) {
    throw new ApiError(
      response.status,
      payload,
      messageFromBody(payload, response.status),
    );
  }

  return payload as T;
}

export const apiClient = {
  get: <T>(path: string, init?: ApiFetchInit) =>
    request<T>(path, { ...init, method: 'GET' }),

  post: <T>(path: string, body?: unknown, init?: ApiFetchInit) => {
    const { headers, serialized } = buildHeadersWithJsonBody(init?.headers, body);
    return request<T>(path, {
      ...init,
      method: 'POST',
      headers,
      body: serialized,
    });
  },

  put: <T>(path: string, body?: unknown, init?: ApiFetchInit) => {
    const { headers, serialized } = buildHeadersWithJsonBody(init?.headers, body);
    return request<T>(path, {
      ...init,
      method: 'PUT',
      headers,
      body: serialized,
    });
  },

  patch: <T>(path: string, body?: unknown, init?: ApiFetchInit) => {
    const { headers, serialized } = buildHeadersWithJsonBody(init?.headers, body);
    return request<T>(path, {
      ...init,
      method: 'PATCH',
      headers,
      body: serialized,
    });
  },

  delete: <T>(path: string, init?: ApiFetchInit) =>
    request<T>(path, { ...init, method: 'DELETE' }),
};
