import { describe, expect, it } from 'vitest';
import {
  createProverbSchema,
  proverbListQuerySchema,
  takeoutExportSchema,
  updateProverbSchema,
} from '../src/index.js';


const valid = {
  userId: '665544332211009988776655',
  title: 'A sound title',
  author: 'Traditional',
  content: 'A proverb long enough to preserve.',
  category: 'wisdom',
};

describe('proverb contracts', () => {
  it('applies defaults to new proverbs', () => {
    expect(createProverbSchema.parse(valid)).toMatchObject({
      description: '',
      lang: 'eng',
      tags: [],
      favorite: false,
    });
  });

  it('rejects empty updates', () => {
    expect(updateProverbSchema.safeParse({}).success).toBe(false);
  });

  it('coerces and limits pagination', () => {
    expect(proverbListQuerySchema.parse({ page: '2', limit: '25' })).toMatchObject({
      page: 2,
      limit: 25,
    });
    expect(proverbListQuerySchema.safeParse({ limit: '101' }).success).toBe(false);
  });

  it('parses the persisted favorite filter', () => {
    expect(proverbListQuerySchema.parse({ favorite: 'true' }).favorite).toBe(true);
    expect(proverbListQuerySchema.parse({ favorite: 'false' }).favorite).toBe(false);
  });

  it('validates a takeout export payload', () => {
    const takeoutPayload = {
      version: 1,
      appName: 'Saywell',
      exportedAt: new Date().toISOString(),
      stats: {
        totalSayings: 1,
        favoriteCount: 1,
        authorsCount: 1,
        categoriesCount: 1,
        tagsCount: 1,
      },
      data: {
        proverbs: [
          {
            _id: '665544332211009988776655',
            userId: '665544332211009988776655',
            title: 'A sound title',
            author: 'Traditional',
            content: 'A proverb long enough to preserve.',
            description: '',
            lang: 'eng',
            category: 'wisdom',
            tags: ['wisdom'],
            favorite: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      },
    };
    expect(takeoutExportSchema.parse(takeoutPayload)).toMatchObject({
      version: 1,
      appName: 'Saywell',
      stats: { totalSayings: 1 },
    });
  });
});

