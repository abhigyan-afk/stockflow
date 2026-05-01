import type { DashboardSummary, Product, Settings, User } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';
const TOKEN_KEY = 'sf_api_token';
const USER_KEY = 'sf_api_user';

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  auth?: boolean;
};

export const session = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },
  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },
  getUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      localStorage.removeItem(USER_KEY);
      return null;
    }
  },
  setUser(user: User) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (options.auth !== false) {
    const token = session.getToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const contentType = response.headers.get('content-type') ?? '';
  const data = contentType.includes('application/json') ? await response.json() : null;

  if (!response.ok) {
    if (response.status === 401) session.clear();
    const message = data?.error ?? `Request failed (${response.status})`;
    throw new Error(message);
  }

  return data as T;
}

function persistAuth(result: { token: string; user: User }) {
  session.setToken(result.token);
  session.setUser(result.user);
  return result.user;
}

export const api = {
  auth: {
    async signup(payload: { email: string; password: string; organizationName: string }) {
      const result = await request<{ token: string; user: User }>('/api/auth/signup', {
        method: 'POST',
        body: payload,
        auth: false,
      });
      return persistAuth(result);
    },
    async login(payload: { email: string; password: string }) {
      const result = await request<{ token: string; user: User }>('/api/auth/login', {
        method: 'POST',
        body: payload,
        auth: false,
      });
      return persistAuth(result);
    },
    async me() {
      const result = await request<{ user: User }>('/api/auth/me');
      session.setUser(result.user);
      return result.user;
    },
    logout() {
      session.clear();
    },
  },
  products: {
    async list(q = '') {
      const query = q.trim() ? `?q=${encodeURIComponent(q.trim())}` : '';
      const result = await request<{ products: Product[] }>(`/api/products${query}`);
      return result.products;
    },
    async get(id: string) {
      const result = await request<{ product: Product }>(`/api/products/${id}`);
      return result.product;
    },
    async create(payload: Omit<Product, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>) {
      const result = await request<{ product: Product }>('/api/products', {
        method: 'POST',
        body: payload,
      });
      return result.product;
    },
    async update(id: string, payload: Partial<Omit<Product, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>>) {
      const result = await request<{ product: Product }>(`/api/products/${id}`, {
        method: 'PATCH',
        body: payload,
      });
      return result.product;
    },
    async delete(id: string) {
      await request<null>(`/api/products/${id}`, { method: 'DELETE' });
    },
    async adjust(id: string, delta: number, note: string) {
      const result = await request<{ product: Product }>(`/api/products/${id}/adjust`, {
        method: 'POST',
        body: { delta, note },
      });
      return result.product;
    },
  },
  dashboard: {
    async get() {
      return request<DashboardSummary>('/api/dashboard');
    },
  },
  settings: {
    async get() {
      return request<Settings>('/api/settings');
    },
    async save(settings: Settings) {
      return request<Settings>('/api/settings', {
        method: 'PUT',
        body: settings,
      });
    },
  },
};
