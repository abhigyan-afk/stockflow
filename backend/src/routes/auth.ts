import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { loginSchema, signupSchema } from '../schemas/index.js';
import { comparePassword, hashPassword, signAccessToken } from '../utils/auth.js';
import { serializeUser } from '../utils/serializers.js';
import { requireAuth } from '../middleware/auth.js';

export const authRouter = Router();

authRouter.post('/signup', async (req, res, next) => {
  try {
    const body = signupSchema.parse(req.body);
    const passwordHash = await hashPassword(body.password);

    const result = await prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: { name: body.organizationName },
      });

      const user = await tx.user.create({
        data: {
          email: body.email.toLowerCase(),
          passwordHash,
          organizationId: organization.id,
        },
        include: { organization: true },
      });

      return { user };
    });

    const token = signAccessToken({
      userId: result.user.id,
      organizationId: result.user.organizationId,
      email: result.user.email,
    });

    return res.status(201).json({ token, user: serializeUser(result.user) });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }
    return next(error);
  }
});

authRouter.post('/login', async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
      include: { organization: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const ok = await comparePassword(body.password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = signAccessToken({
      userId: user.id,
      organizationId: user.organizationId,
      email: user.email,
    });

    return res.json({ token, user: serializeUser(user) });
  } catch (error) {
    return next(error);
  }
});

authRouter.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findFirst({
      where: { id: req.auth!.userId, organizationId: req.auth!.organizationId },
      include: { organization: true },
    });

    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ user: serializeUser(user) });
  } catch (error) {
    return next(error);
  }
});
