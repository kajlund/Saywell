import { z } from 'zod';

export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ID format');

const proverbFields = {
  _id: objectIdSchema.optional(),
  userId: objectIdSchema,
  title: z.string().trim().min(3),
  author: z.string().trim().min(3),
  content: z.string().trim().min(10),
  description: z.string().trim(),
  lang: z.enum(['eng', 'swe', 'fin']),
  category: z.string().trim().min(3),
  tags: z.array(z.string().trim().min(1)),
  favorite: z.boolean(),
};

export const proverbSchema = z.object({
  ...proverbFields,
  description: proverbFields.description.default(''),
  lang: proverbFields.lang.default('eng'),
  tags: proverbFields.tags.default([]),
  favorite: proverbFields.favorite.default(false),
});

export const createProverbSchema = proverbSchema;
export const updateProverbSchema = z
  .object(proverbFields)
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required',
  });

export const proverbListQuerySchema = z.object({
  userId: objectIdSchema.optional(),
  author: z.string().trim().optional(),
  category: z.string().trim().optional(),
  lang: z.string().trim().optional(),
  tag: z.string().trim().optional(),
  q: z.string().trim().optional(),
  favorite: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sort: z.string().trim().default('-createdAt'),
});

export const proverbSearchQuerySchema = z.object({
  q: z.string().trim().min(1),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const randomProverbQuerySchema = z.object({
  category: z.string().trim().optional(),
  lang: z.enum(['eng', 'swe', 'fin']).optional(),
});

export type Proverb = z.infer<typeof proverbSchema> & { createdAt?: string; updatedAt?: string };
export type CreateProverb = z.infer<typeof createProverbSchema>;
export type UpdateProverb = z.infer<typeof updateProverbSchema>;
export type Pagination = { total: number; page: number; pages: number };
export type FilterOptions = {
  authors: string[];
  categories: string[];
  languages: string[];
  tags: string[];
};
export type ApiSuccess<T> = {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
  message?: string;
};
export type ApiError = {
  success: false;
  error: { code: string; message: string; requestId: string; details?: unknown };
};
