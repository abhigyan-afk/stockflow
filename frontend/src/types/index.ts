// ─── Core Domain Types ────────────────────────────────────────────────────────

export interface Organization {
  id: string;
  name: string;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  organizationId: string;
  organizationName: string;
  createdAt: string;
}

export interface Product {
  id: string;
  organizationId: string;
  name: string;
  sku: string;
  description: string;
  quantityOnHand: number;
  costPrice: number | null;
  sellingPrice: number | null;
  lowStockThreshold: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface StockAdjustment {
  id: string;
  productId: string;
  delta: number;      // positive = add, negative = remove
  note: string;
  createdAt: string;
}

export interface Settings {
  defaultLowStockThreshold: number;
}

// ─── Auth Types ───────────────────────────────────────────────────────────────

export interface SignupPayload {
  email: string;
  password: string;
  confirmPassword: string;
  organizationName: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

// ─── Dashboard Types ──────────────────────────────────────────────────────────

export interface DashboardSummary {
  totalProducts: number;
  totalQuantity: number;
  lowStockCount: number;
  lowStockItems: LowStockItem[];
  inventoryValue: number;
}

export interface LowStockItem {
  id: string;
  name: string;
  sku: string;
  quantityOnHand: number;
  lowStockThreshold: number;
}

// ─── Form Types ───────────────────────────────────────────────────────────────

export interface ProductFormData {
  name: string;
  sku: string;
  description: string;
  quantityOnHand: string;
  costPrice: string;
  sellingPrice: string;
  lowStockThreshold: string;
}

export type AppRoute =
  | 'login'
  | 'signup'
  | 'dashboard'
  | 'products'
  | 'products/new'
  | 'products/edit'
  | 'settings';
