import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { adjustStockSchema, productQuerySchema, productSchema, updateProductSchema } from '../schemas/index.js';
import { serializeProduct } from '../utils/serializers.js';

export const productsRouter = Router();

productsRouter.use(requireAuth);

productsRouter.get('/', async (req, res, next) => {
  try {
    const { q } = productQuerySchema.parse(req.query);
    const products = await prisma.product.findMany({
      where: {
        organizationId: req.auth!.organizationId,
        OR: q
          ? [
              { name: { contains: q } },
              { sku: { contains: q } },
            ]
          : undefined,
      },
      orderBy: { updatedAt: 'desc' },
    });

    return res.json({ products: products.map(serializeProduct) });
  } catch (error) {
    return next(error);
  }
});

productsRouter.post('/', async (req, res, next) => {
  try {
    const body = productSchema.parse(req.body);
    const product = await prisma.product.create({
      data: {
        organizationId: req.auth!.organizationId,
        name: body.name,
        sku: body.sku.toUpperCase(),
        description: body.description || null,
        quantityOnHand: body.quantityOnHand,
        costPrice: body.costPrice ?? null,
        sellingPrice: body.sellingPrice ?? null,
        lowStockThreshold: body.lowStockThreshold ?? null,
      },
    });

    return res.status(201).json({ product: serializeProduct(product) });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(409).json({ error: 'A product with this SKU already exists in your organization.' });
    }
    return next(error);
  }
});

productsRouter.get('/:id', async (req, res, next) => {
  try {
    const product = await prisma.product.findFirst({
      where: { id: req.params.id, organizationId: req.auth!.organizationId },
    });

    if (!product) return res.status(404).json({ error: 'Product not found' });
    return res.json({ product: serializeProduct(product) });
  } catch (error) {
    return next(error);
  }
});

productsRouter.patch('/:id', async (req, res, next) => {
  try {
    const body = updateProductSchema.parse(req.body);
    const existing = await prisma.product.findFirst({
      where: { id: req.params.id, organizationId: req.auth!.organizationId },
    });
    if (!existing) return res.status(404).json({ error: 'Product not found' });

    const product = await prisma.product.update({
      where: { id: existing.id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.sku !== undefined && { sku: body.sku.toUpperCase() }),
        ...(body.description !== undefined && { description: body.description || null }),
        ...(body.quantityOnHand !== undefined && { quantityOnHand: body.quantityOnHand }),
        ...(body.costPrice !== undefined && { costPrice: body.costPrice }),
        ...(body.sellingPrice !== undefined && { sellingPrice: body.sellingPrice }),
        ...(body.lowStockThreshold !== undefined && { lowStockThreshold: body.lowStockThreshold }),
      },
    });

    return res.json({ product: serializeProduct(product) });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(409).json({ error: 'Another product with this SKU already exists.' });
    }
    return next(error);
  }
});

productsRouter.delete('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.product.findFirst({
      where: { id: req.params.id, organizationId: req.auth!.organizationId },
      select: { id: true },
    });
    if (!existing) return res.status(404).json({ error: 'Product not found' });

    await prisma.product.delete({ where: { id: existing.id } });
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

productsRouter.post('/:id/adjust', async (req, res, next) => {
  try {
    const body = adjustStockSchema.parse(req.body);

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.product.findFirst({
        where: { id: req.params.id, organizationId: req.auth!.organizationId },
      });
      if (!existing) return null;

      const nextQty = Math.max(0, existing.quantityOnHand + body.delta);
      const product = await tx.product.update({
        where: { id: existing.id },
        data: { quantityOnHand: nextQty },
      });
      const adjustment = await tx.stockAdjustment.create({
        data: {
          productId: existing.id,
          userId: req.auth!.userId,
          delta: body.delta,
          note: body.note || null,
        },
      });

      return { product, adjustment };
    });

    if (!result) return res.status(404).json({ error: 'Product not found' });
    return res.json({
      product: serializeProduct(result.product),
      adjustment: {
        id: result.adjustment.id,
        productId: result.adjustment.productId,
        delta: result.adjustment.delta,
        note: result.adjustment.note ?? '',
        createdAt: result.adjustment.createdAt.toISOString(),
      },
    });
  } catch (error) {
    return next(error);
  }
});
