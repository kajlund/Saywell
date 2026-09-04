import mongoose, { type FilterQuery } from 'mongoose';
import { DomainError } from '../errors/domain-error.js';
import { ProverbModel, type ProverbDocument } from '../models/proverb-model.js';
import type { CreateProverb, Pagination, UpdateProverb } from '@proverbs/contracts';

export class ProverbService {
  async createProverb(input: CreateProverb) {
    const proverb = await ProverbModel.create(input);
    return proverb.toObject();
  }

  async getProverbs(query: Record<string, any> = {}) {
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.max(1, Number(query.limit ?? 10));
    const skip = (page - 1) * limit;

    const filters: FilterQuery<ProverbDocument> = {};
    if (query.userId) filters.userId = query.userId;
    if (query.author) filters.author = query.author;
    if (query.category) filters.category = query.category;
    if (query.lang) filters.lang = query.lang;
    if (query.tag) filters.tags = query.tag;
    if (query.favorite !== undefined) filters.favorite = query.favorite;

    if (query.q && String(query.q).trim()) {
      const search = new RegExp(escapeRegex(String(query.q).trim()), 'i');
      filters.$or = [
        { title: search },
        { author: search },
        { content: search },
        { description: search },
        { category: search },
        { tags: search },
      ];
    }

    const total = await ProverbModel.countDocuments(filters);
    const proverbs = await ProverbModel.find(filters)
      .sort(query.sort ?? '-createdAt')
      .skip(skip)
      .limit(limit)
      .lean();

    return {
      proverbs,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit) || 1,
      } satisfies Pagination,
    };
  }

  async searchProverbs(query: { q: string; page?: number; limit?: number }) {
    const q = String(query.q).trim();
    if (!q) throw new DomainError('INVALID_QUERY', 'Search query is required', 400);

    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.max(1, Number(query.limit ?? 10));
    const skip = (page - 1) * limit;

    const search = new RegExp(escapeRegex(q), 'i');
    const filters = {
      $or: [
        { title: search },
        { author: search },
        { content: search },
        { description: search },
        { category: search },
      ],
    };

    const total = await ProverbModel.countDocuments(filters);
    const proverbs = await ProverbModel.find(filters)
      .sort('-createdAt')
      .skip(skip)
      .limit(limit)
      .lean();

    return {
      query: q,
      proverbs,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit) || 1,
      } satisfies Pagination,
    };
  }

  async getRandomProverb(filters: Record<string, any> = {}) {
    const query: FilterQuery<ProverbDocument> = {};
    if (filters.category) query.category = filters.category;
    if (filters.lang) query.lang = filters.lang;

    const total = await ProverbModel.countDocuments(query);
    if (total === 0) {
      throw new DomainError('NOT_FOUND', 'No proverb found matching the provided filters', 404);
    }

    const randomIndex = Math.floor(Math.random() * total);
    const proverb = await ProverbModel.findOne(query).skip(randomIndex).lean();
    if (!proverb) {
      throw new DomainError('NOT_FOUND', 'No proverb found matching the provided filters', 404);
    }
    return proverb;
  }

  async getProverbById(id: string) {
    validateObjectId(id);
    const proverb = await ProverbModel.findById(id).lean();
    if (!proverb) {
      throw new DomainError('NOT_FOUND', 'Proverb not found', 404);
    }
    return proverb;
  }

  async updateProverb(id: string, patch: UpdateProverb) {
    validateObjectId(id);
    const proverb = await ProverbModel.findByIdAndUpdate(id, patch, {
      new: true,
      runValidators: true,
    }).lean();
    if (!proverb) throw new DomainError('NOT_FOUND', 'Proverb not found', 404);
    return proverb;
  }

  async deleteProverb(id: string): Promise<void> {
    validateObjectId(id);
    const proverb = await ProverbModel.findByIdAndDelete(id);
    if (!proverb) throw new DomainError('NOT_FOUND', 'Proverb not found', 404);
  }

  async getFilterOptions() {
    const [authors, categories, languages, tags] = await Promise.all([
      ProverbModel.distinct('author'),
      ProverbModel.distinct('category'),
      ProverbModel.distinct('lang'),
      ProverbModel.distinct('tags'),
    ]);

    return {
      authors: [...new Set((authors as string[]).filter(Boolean))].sort(),
      categories: [...new Set((categories as string[]).filter(Boolean))].sort(),
      languages: [...new Set((languages as string[]).filter(Boolean))].sort(),
      tags: [...new Set((tags as string[]).filter(Boolean))].sort(),
    };
  }
}

function validateObjectId(id: string): void {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new DomainError('INVALID_ID', 'Invalid ID format', 400);
  }
}

export const proverbService = new ProverbService();

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
