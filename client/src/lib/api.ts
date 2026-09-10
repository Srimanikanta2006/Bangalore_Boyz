/**
 * Typed fetch client for the canonical ClimateShield backend (cline_backend).
 *
 * Contract:
 *  - Success: { success: true, data: <T> }
 *  - Error:   { success: false, error: { code, message } }
 *
 * The base URL defaults to `/api` (proxied to the backend by Vite in dev). Set
 * VITE_API_URL to call a fully-qualified backend origin instead.
 */

const API_BASE = (import.meta.env?.VITE_API_URL as string) || '/api';

const TOKEN_STORAGE_KEY = 'cs_auth_token';

/** In-memory token, hydrated from localStorage on load and kept in sync by the auth store. */
let authToken: string | null =
  typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_STORAGE_KEY) : null;

export function setAuthToken(token: string | null): void {
  authToken = token;
  if (typeof localStorage === 'undefined') return;
  if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token);
  else localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export function getAuthToken(): string | null {
  return authToken;
}

export class ApiError extends Error {
  code: string;
  status: number;
  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
  /** Skip attaching the Authorization header (e.g. for the login call). */
  anonymous?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers: Record<string, string> = {};
  // FormData: let the browser set Content-Type (with multipart boundary) itself.
  if (options.body !== undefined && !isFormData) headers['Content-Type'] = 'application/json';
  if (!options.anonymous && authToken) headers.Authorization = `Bearer ${authToken}`;

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : isFormData ? (options.body as FormData) : JSON.stringify(options.body),
      signal: options.signal,
    });
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') throw err;
    throw new ApiError('NETWORK_ERROR', 'Unable to reach the server. Check your connection.', 0);
  }

  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    /* some responses (e.g. 204) have no body */
  }

  const envelope = json as { success?: boolean; data?: T; error?: { code?: string; message?: string } } | null;

  if (!res.ok || envelope?.success === false) {
    const code = envelope?.error?.code ?? `HTTP_${res.status}`;
    const message = envelope?.error?.message ?? res.statusText ?? 'Request failed';
    throw new ApiError(code, message, res.status);
  }

  return (envelope?.data ?? (json as T)) as T;
}

export const api = {
  get: <T>(path: string, opts?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...opts, method: 'GET' }),
  post: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...opts, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...opts, method: 'PATCH', body }),
};
