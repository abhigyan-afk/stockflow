import type { Organization, Product, User } from '@prisma/client';

export function serializeUser(user: User & { organization?: Organization }) {
  return {
    id: user.id,
    email: user.email,
    organizationId: user.organizationId,
    organizationName: user.organization?.name ?? '',
    createdAt: user.createdAt.toISOString(),
  };
}

export function serializeProduct(product: Product) {
  return {
    id: product.id,
    organizationId: product.organizationId,
    name: product.name,
    sku: product.sku,
    description: product.description ?? '',
    quantityOnHand: product.quantityOnHand,
    costPrice: product.costPrice,
    sellingPrice: product.sellingPrice,
    lowStockThreshold: product.lowStockThreshold,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}
