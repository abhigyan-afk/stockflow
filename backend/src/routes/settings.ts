import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { settingsSchema } from '../schemas/index.js';

export const settingsRouter = Router();

settingsRouter.use(requireAuth);

settingsRouter.get('/', async (req, res, next) => {
  try {
    const org = await prisma.organization.findUnique({ where: { id: req.auth!.organizationId } });
    return res.json({ defaultLowStockThreshold: org?.defaultLowStockThreshold ?? 5 });
  } catch (error) {
    return next(error);
  }
});

settingsRouter.put('/', async (req, res, next) => {
  try {
    const body = settingsSchema.parse(req.body);
    const org = await prisma.organization.update({
      where: { id: req.auth!.organizationId },
      data: { defaultLowStockThreshold: body.defaultLowStockThreshold },
    });

    return res.json({ defaultLowStockThreshold: org.defaultLowStockThreshold });
  } catch (error) {
    return next(error);
  }
});
