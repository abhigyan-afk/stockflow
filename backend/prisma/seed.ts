import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/auth.js';

const prisma = new PrismaClient();

async function main() {
  const email = 'demo@stockflow.io';
  const passwordHash = await hashPassword('demo1234');

  const organization = await prisma.organization.upsert({
    where: { id: 'demo-org' },
    update: { name: 'Demo Store', defaultLowStockThreshold: 10 },
    create: { id: 'demo-org', name: 'Demo Store', defaultLowStockThreshold: 10 },
  });

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, organizationId: organization.id },
    create: { email, passwordHash, organizationId: organization.id },
  });

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
      costPrice: 22,
      sellingPrice: 79.99,
      lowStockThreshold: 15,
    },
    {
      name: 'Running Shoes (Size 10)',
      sku: 'SHO-RUN-10',
      description: 'Lightweight mesh running shoes.',
      quantityOnHand: 8,
      costPrice: 35,
      sellingPrice: 99.95,
      lowStockThreshold: 10,
    },
    {
      name: 'Wireless Earbuds',
      sku: 'ELEC-WEB-01',
      description: 'Bluetooth earbuds, 24h battery life.',
      quantityOnHand: 3,
      costPrice: 18,
      sellingPrice: 49.99,
      lowStockThreshold: 5,
    },
    {
      name: 'Leather Wallet',
      sku: 'ACC-LWT-BRN',
      description: 'Genuine leather bifold wallet.',
      quantityOnHand: 0,
      costPrice: 12,
      sellingPrice: 34.99,
      lowStockThreshold: 5,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: {
        organizationId_sku: {
          organizationId: organization.id,
          sku: product.sku,
        },
      },
      update: product,
      create: { ...product, organizationId: organization.id },
    });
  }

  console.log('Seed complete');
  console.log({ email, password: 'demo1234', organizationId: organization.id, userId: user.id });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
