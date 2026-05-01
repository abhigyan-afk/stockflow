import { z } from 'zod';

const integerFromBody = (schema: z.ZodNumber) =>
  z.preprocess((value) => {
    if (value === '' || value === null || value === undefined) return undefined;
    const parsed = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(parsed) ? Math.trunc(parsed) : value;
  }, schema.int());

const numberFromBody = (schema: z.ZodNumber) =>
  z.preprocess((value) => {
    if (value === '' || value === null || value === undefined) return undefined;
    const parsed = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : value;
  }, schema);

export const signupSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6),
  organizationName: z.string().trim().min(1),
});

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export const productSchema = z.object({
  name: z.string().trim().min(1),
  sku: z.string().trim().min(1),
  description: z.string().trim().optional().default(''),
  quantityOnHand: integerFromBody(z.number().min(0)).default(0),
  costPrice: numberFromBody(z.number().min(0)).optional().nullable(),
  sellingPrice: numberFromBody(z.number().min(0)).optional().nullable(),
  lowStockThreshold: integerFromBody(z.number().min(0)).optional().nullable(),
});

export const updateProductSchema = productSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  'At least one field must be provided'
);

export const adjustStockSchema = z.object({
  delta: integerFromBody(z.number()).refine((value) => value !== 0, 'Delta cannot be zero'),
  note: z.string().trim().optional().default(''),
});

export const settingsSchema = z.object({
  defaultLowStockThreshold: integerFromBody(z.number().min(0)),
});

export const productQuerySchema = z.object({
  q: z.string().optional().default(''),
});
