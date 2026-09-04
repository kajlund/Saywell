import { describe, expect, it } from 'vitest';
import { createProverbSchema, proverbListQuerySchema, updateProverbSchema } from '../src/index.js';

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
});
