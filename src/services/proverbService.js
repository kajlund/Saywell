import mongoose from 'mongoose';

import proverbRepository from '../repositories/proverbRepository.js';
import { NotFoundError, BadRequestError } from '../errors.js';

/**
 * ProverbService executes domain business logic and orchestration.
 */
export class ProverbService {
  constructor(repository = proverbRepository) {
    this.repository = repository;
  }

  /**
   * Helper to validate Mongo ObjectId
   */
  validateObjectId(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError('Invalid ID format');
    }
  }

  /**
   * Create a new proverb
   */
  async createProverb(proverbData) {
    return await this.repository.create(proverbData);
  }

  /**
   * Get paginated and filtered proverbs
   */
  async getProverbs({ userId, author, category, lang, tag, q, page = 1, limit = 10, sort = '-createdAt' }) {
    const query = {};

    if (userId) {
      this.validateObjectId(userId);
      query.userId = userId;
    }

    if (author) {
      query.author = author;
    }

    if (category) {
      query.category = category;
    }

    if (lang) {
      query.lang = lang;
    }

    if (tag) {
      query.tags = tag;
    }

    if (q && q.trim() !== '') {
      const searchRegex = new RegExp(q.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { author: searchRegex },
        { content: searchRegex },
        { description: searchRegex },
        { lang: searchRegex },
        { category: searchRegex },
        { tags: searchRegex },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const total = await this.repository.count(query);
    const proverbs = await this.repository.find(query, { sort, skip, limit: limitNum });

    return {
      proverbs,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum) || 1,
      },
    };
  }

  /**
   * Search proverbs by keyword across fields
   */
  async searchProverbs({ q, page = 1, limit = 10 }) {
    if (!q || q.trim() === '') {
      throw new BadRequestError('Search query parameter (q) is required');
    }

    const searchRegex = new RegExp(q.trim(), 'i');
    const searchQuery = {
      $or: [
        { title: searchRegex },
        { author: searchRegex },
        { description: searchRegex },
        { lang: searchRegex },
        { category: searchRegex },
      ],
    };

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const total = await this.repository.count(searchQuery);
    const proverbs = await this.repository.find(searchQuery, { sort: '-createdAt', skip, limit: limitNum });

    return {
      proverbs,
      query: q,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum) || 1,
      },
    };
  }

  /**
   * Get a random proverb with optional filtering
   */
  async getRandomProverb({ category, lang }) {
    const query = {};

    if (category) {
      query.category = category;
    }

    if (lang) {
      query.lang = lang;
    }

    const proverb = await this.repository.findRandom(query);
    if (!proverb) {
      throw new NotFoundError('No proverb found matching the provided filters');
    }

    return proverb;
  }

  /**
   * Get proverb by ID
   */
  async getProverbById(id) {
    this.validateObjectId(id);
    const proverb = await this.repository.findById(id);
    if (!proverb) {
      throw new NotFoundError('Proverb not found');
    }
    return proverb;
  }

  /**
   * Update proverb by ID
   */
  async updateProverb(id, updateData) {
    this.validateObjectId(id);

    const proverb = await this.repository.update(id, updateData);
    if (!proverb) {
      throw new NotFoundError('Proverb not found');
    }
    return proverb;
  }

  /**
   * Delete proverb by ID
   */
  async deleteProverb(id) {
    this.validateObjectId(id);
    const proverb = await this.repository.delete(id);
    if (!proverb) {
      throw new NotFoundError('Proverb not found');
    }
    return proverb;
  }

  /**
   * Retrieves unique filter options for author, category, language, and tags
   */
  async getFilterOptions() {
    const [authors, categories, languages, tags] = await Promise.all([
      this.repository.distinct('author'),
      this.repository.distinct('category'),
      this.repository.distinct('lang'),
      this.repository.distinct('tags'),
    ]);

    return {
      authors: authors.filter(Boolean).sort(),
      categories: categories.filter(Boolean).sort(),
      languages: languages.filter(Boolean).sort(),
      tags: tags.filter(Boolean).sort(),
    };
  }
}

export default new ProverbService();
