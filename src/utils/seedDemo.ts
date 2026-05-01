/**
 * seedDemo.ts
 * Creates a demo account + sample products on first run.
 * Called once from App.tsx at initialization.
 */
import { appStore } from '../store/appStore';

export function seedDemoData() {
  const SEED_KEY = 'sf_seeded_v1';
  if (localStorage.getItem(SEED_KEY)) return;

  // Create demo account
  const result = appStore.signup('demo@stockflow.io', 'demo1234', 'Demo Store');
  if (!result.ok) return;

  // Login to get orgId
  const loginResult = appStore.login('demo@stockflow.io', 'demo1234');
  if (!loginResult.ok || !loginResult.user) return;
  appStore.logout(); // Clear the session, just seeding products

  const orgId = loginResult.user.organizationId;

  // Set default threshold to 10
  appStore.saveSettings(orgId, { defaultLowStockThreshold: 10 });

  // Seed products
  const products = [
    {
      name: 'Classic White Tee',
      sku: 'TEE-WHT-M',
      description: 'Crew-neck cotton t-shirt, medium size.',
      quantityOnHand: 120,
      costPrice: 8.5,
      sellingPrice: 24.99,
      lowStockThreshold: 20,
    },
    {
      name: 'Blue Denim Jeans',
      sku: 'JNS-BLU-32',
      description: 'Slim fit, 32" waist.',
      quantityOnHand: 45,
      costPrice: 22.0,
      sellingPrice: 79.99,
      lowStockThreshold: 15,
    },
    {
      name: 'Running Shoes (Size 10)',
      sku: 'SHO-RUN-10',
      description: 'Lightweight mesh running shoes.',
      quantityOnHand: 8,
      costPrice: 35.0,
      sellingPrice: 99.95,
      lowStockThreshold: 10,
    },
    {
      name: 'Wireless Earbuds',
      sku: 'ELEC-WEB-01',
      description: 'Bluetooth 5.0, 24h battery life.',
      quantityOnHand: 3,
      costPrice: 18.0,
      sellingPrice: 49.99,
      lowStockThreshold: 5,
    },
    {
      name: 'Leather Wallet',
      sku: 'ACC-LWT-BRN',
      description: 'Genuine leather bifold wallet.',
      quantityOnHand: 0,
      costPrice: 12.0,
      sellingPrice: 34.99,
      lowStockThreshold: 5,
    },
    {
      name: 'Stainless Water Bottle',
      sku: 'KIT-SWB-500',
      description: '500ml vacuum insulated bottle.',
      quantityOnHand: 200,
      costPrice: 7.0,
      sellingPrice: 22.5,
      lowStockThreshold: 30,
    },
    {
      name: 'Yoga Mat',
      sku: 'SPT-YMA-PUR',
      description: 'Non-slip, 6mm thick, purple.',
      quantityOnHand: 18,
      costPrice: 15.0,
      sellingPrice: 45.0,
      lowStockThreshold: null,
    },
    {
      name: 'Protein Powder (Vanilla)',
      sku: 'NUT-PP-VAN-1',
      description: 'Whey protein, 1kg bag.',
      quantityOnHand: 7,
      costPrice: 20.0,
      sellingPrice: 54.99,
      lowStockThreshold: 8,
    },
  ];

  products.forEach((p) => appStore.createProduct(orgId, p));

  localStorage.setItem(SEED_KEY, '1');
}
