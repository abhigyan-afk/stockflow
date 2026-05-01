import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

export const dashboardRouter = Router();

dashboardRouter.use(requireAuth);

dashboardRouter.get('/', async (req, res, next) => {
  try {
    const [org, products] = await Promise.all([
      prisma.organization.findUnique({ where: { id: req.auth!.organizationId } }),
      prisma.product.findMany({ where: { organizationId: req.auth!.organizationId } }),
    ]);

    const defaultThreshold = org?.defaultLowStockThreshold ?? 5;
    const lowStockItems = products
      .filter((product) => product.quantityOnHand <= (product.lowStockThreshold ?? defaultThreshold))
      .map((product) => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        quantityOnHand: product.quantityOnHand,
        lowStockThreshold: product.lowStockThreshold ?? defaultThreshold,
      }));

    const totalQuantity = products.reduce((sum, product) => sum + product.quantityOnHand, 0);
    const inventoryValue = products.reduce(
      (sum, product) => sum + (product.sellingPrice ?? 0) * product.quantityOnHand,
      0
    );

    return res.json({
      totalProducts: products.length,
      totalQuantity,
      lowStockCount: lowStockItems.length,
      lowStockItems,
      inventoryValue,
    });
  } catch (error) {
    return next(error);
  }
});
