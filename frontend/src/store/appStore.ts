/**
 * appStore.ts
 * ──────────────────────────────────────────────────────────────────────────────
 * Lightweight in-memory store (simulates backend + SQLite DB for the demo).
 * In the real implementation replace this with API calls to the Express backend.
 *
 * Data is persisted to localStorage so sessions survive page refresh.
 * ──────────────────────────────────────────────────────────────────────────────
 */

import { Product, User, Organization, Settings, StockAdjustment } from '../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const uid = () => crypto.randomUUID();
const now = () => new Date().toISOString();

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// ─── State Keys ───────────────────────────────────────────────────────────────

const KEYS = {
  users: 'sf_users',
  orgs: 'sf_orgs',
  products: 'sf_products',
  adjustments: 'sf_adjustments',
  settings: 'sf_settings',
  session: 'sf_session',
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const appStore = {
  // ── Auth ────────────────────────────────────────────────────────────────────

  signup(email: string, password: string, orgName: string): { ok: boolean; error?: string } {
    const users = load<User[]>(KEYS.users, []);
    if (users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return { ok: false, error: 'An account with this email already exists.' };
    }
    const org: Organization = { id: uid(), name: orgName, createdAt: now() };
    const orgs = load<Organization[]>(KEYS.orgs, []);
    orgs.push(org);
    save(KEYS.orgs, orgs);

    // Store hashed-ish password (demo only; in prod use bcrypt on the backend)
    const user: User & { _pw: string } = {
      id: uid(),
      email,
      organizationId: org.id,
      organizationName: org.name,
      createdAt: now(),
      _pw: btoa(password), // NOT secure – for demo only
    };
    users.push(user as unknown as User);
    save(KEYS.users, users);

    // Default settings for org
    const allSettings = load<Record<string, Settings>>(KEYS.settings, {});
    allSettings[org.id] = { defaultLowStockThreshold: 5 };
    save(KEYS.settings, allSettings);

    return { ok: true };
  },

  login(email: string, password: string): { ok: boolean; user?: User; error?: string } {
    const users = load<(User & { _pw: string })[]>(KEYS.users, []);
    const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!found) return { ok: false, error: 'No account found with this email.' };
    if (found._pw !== btoa(password)) return { ok: false, error: 'Incorrect password.' };
    const { _pw: _, ...user } = found;
    save(KEYS.session, user);
    return { ok: true, user };
  },

  logout() {
    localStorage.removeItem(KEYS.session);
  },

  getSession(): User | null {
    return load<User | null>(KEYS.session, null);
  },

  // ── Products ─────────────────────────────────────────────────────────────────

  getProducts(orgId: string): Product[] {
    return load<Product[]>(KEYS.products, []).filter((p) => p.organizationId === orgId);
  },

  getProduct(orgId: string, id: string): Product | undefined {
    return this.getProducts(orgId).find((p) => p.id === id);
  },

  createProduct(orgId: string, data: Omit<Product, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>): { ok: boolean; product?: Product; error?: string } {
    const all = load<Product[]>(KEYS.products, []);
    const orgProducts = all.filter((p) => p.organizationId === orgId);
    if (orgProducts.find((p) => p.sku.toLowerCase() === data.sku.toLowerCase())) {
      return { ok: false, error: 'A product with this SKU already exists in your organization.' };
    }
    const product: Product = {
      id: uid(),
      organizationId: orgId,
      createdAt: now(),
      updatedAt: now(),
      ...data,
    };
    all.push(product);
    save(KEYS.products, all);
    return { ok: true, product };
  },

  updateProduct(orgId: string, id: string, data: Partial<Omit<Product, 'id' | 'organizationId' | 'createdAt'>>): { ok: boolean; product?: Product; error?: string } {
    const all = load<Product[]>(KEYS.products, []);
    const idx = all.findIndex((p) => p.id === id && p.organizationId === orgId);
    if (idx === -1) return { ok: false, error: 'Product not found.' };

    // Check SKU uniqueness if SKU is being changed
    if (data.sku) {
      const conflict = all.find(
        (p) => p.organizationId === orgId && p.sku.toLowerCase() === data.sku!.toLowerCase() && p.id !== id
      );
      if (conflict) return { ok: false, error: 'Another product with this SKU already exists.' };
    }

    all[idx] = { ...all[idx], ...data, updatedAt: now() };
    save(KEYS.products, all);
    return { ok: true, product: all[idx] };
  },

  deleteProduct(orgId: string, id: string): { ok: boolean; error?: string } {
    const all = load<Product[]>(KEYS.products, []);
    const filtered = all.filter((p) => !(p.id === id && p.organizationId === orgId));
    if (filtered.length === all.length) return { ok: false, error: 'Product not found.' };
    save(KEYS.products, filtered);
    return { ok: true };
  },

  adjustStock(orgId: string, productId: string, delta: number, note: string): { ok: boolean; error?: string } {
    const all = load<Product[]>(KEYS.products, []);
    const idx = all.findIndex((p) => p.id === productId && p.organizationId === orgId);
    if (idx === -1) return { ok: false, error: 'Product not found.' };
    const newQty = Math.max(0, all[idx].quantityOnHand + delta);
    all[idx] = { ...all[idx], quantityOnHand: newQty, updatedAt: now() };
    save(KEYS.products, all);

    // Save adjustment log
    const adjustments = load<StockAdjustment[]>(KEYS.adjustments, []);
    adjustments.push({ id: uid(), productId, delta, note, createdAt: now() });
    save(KEYS.adjustments, adjustments);

    return { ok: true };
  },

  // ── Settings ─────────────────────────────────────────────────────────────────

  getSettings(orgId: string): Settings {
    const all = load<Record<string, Settings>>(KEYS.settings, {});
    return all[orgId] ?? { defaultLowStockThreshold: 5 };
  },

  saveSettings(orgId: string, settings: Settings): void {
    const all = load<Record<string, Settings>>(KEYS.settings, {});
    all[orgId] = settings;
    save(KEYS.settings, all);
  },

  // ── Dashboard ─────────────────────────────────────────────────────────────────

  getDashboardSummary(orgId: string) {
    const products = this.getProducts(orgId);
    const settings = this.getSettings(orgId);
    const defaultThreshold = settings.defaultLowStockThreshold;

    const totalProducts = products.length;
    const totalQuantity = products.reduce((s, p) => s + p.quantityOnHand, 0);

    const lowStockItems = products
      .filter((p) => {
        const threshold = p.lowStockThreshold ?? defaultThreshold;
        return p.quantityOnHand <= threshold;
      })
      .map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        quantityOnHand: p.quantityOnHand,
        lowStockThreshold: p.lowStockThreshold ?? defaultThreshold,
      }));

    return { totalProducts, totalQuantity, lowStockCount: lowStockItems.length, lowStockItems };
  },
};
