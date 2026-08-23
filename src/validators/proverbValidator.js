import mongoose from 'mongoose';
import vine from '@vinejs/vine';

const objectIdRule = vine.createRule((value, _, field) => {
  if (!mongoose.isValidObjectId(value)) {
    field.report(
      `The value of field ${field} is not a valid MongoDB ObjectId`,
      'objectId',
      field
    )
  }
});


/**
 * Schema for creating a new Proverb
 */
export const createProverbValidator = vine.create({
  userId: vine.string().trim().use(objectIdRule()),
  title: vine.string().trim().minLength(3),
  author: vine.string().trim().minLength(3),
  content: vine.string().trim().minLength(10),
  description: vine.string().trim().optional(),
  lang: vine.enum(['eng', 'swe', 'fin']).optional(),
  category: vine.string().trim().minLength(3),
  tags: vine.array(vine.string().trim()).optional(),
});

/**
 * Schema for updating an existing Proverb
 */
export const updateProverbValidator = vine.create({
  userId: vine.string().trim().use(objectIdRule()),
  title: vine.string().trim().minLength(3),
  author: vine.string().trim().minLength(3),
  content: vine.string().trim().minLength(10),
  description: vine.string().trim().optional(),
  lang: vine.enum(['eng', 'swe', 'fin']).optional(),
  category: vine.string().trim().minLength(3),
  tags: vine.array(vine.string().trim()).optional(),
});

/**
 * Schema for querying proverbs list
 */
export const getProverbsQueryValidator = vine.create({
  userId: vine.string().trim().use(objectIdRule()).optional(),
  author: vine.string().trim().optional(),
  category: vine.string().trim().optional(),
  lang: vine.string().trim().optional(),
  tag: vine.string().trim().optional(),
  q: vine.string().trim().optional(),
  page: vine.number().min(1).optional(),
  limit: vine.number().min(1).max(100).optional(),
  sort: vine.string().trim().optional(),
});

/**
 * Schema for keyword search query
 */
export const searchProverbsQueryValidator = vine.create({
  q: vine.string().trim().minLength(1),
  page: vine.number().min(1).optional(),
  limit: vine.number().min(1).max(100).optional(),
});

/**
 * Schema for random proverb query
 */
export const randomProverbQueryValidator = vine.create({
  category: vine.string().trim().optional(),
  lang: vine.string().trim().optional(),
});


