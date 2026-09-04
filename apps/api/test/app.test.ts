import pino from 'pino';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.ts';

const logger = pino({ enabled: false });

const app = (overrides: Record<string, unknown> = {}) =>
  createApp(service(overrides) as any, logger, undefined, false);

function service(overrides: Record<string, unknown> = {}) {
  return {
    getProverbs: vi.fn().mockResolvedValue({
      proverbs: [],
      pagination: { total: 0, page: 1, pages: 1 },
    }),
    searchProverbs: vi.fn(),
    createProverb: vi.fn(),
    getRandomProverb: vi.fn(),
    getProverbById: vi.fn(),
    updateProverb: vi.fn(),
    deleteProverb: vi.fn(),
    getFilterOptions: vi.fn().mockResolvedValue({
      authors: [],
      categories: [],
      languages: [],
      tags: [],
    }),
    ...overrides,
  } as any;
}

describe('Proverbs API', () => {
  it('reports health', async () => {
    const response = await app().request('/health');
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ status: 'OK' });
  });

  it('lists proverbs with pagination metadata', async () => {
    const response = await app().request('/api/proverbs');
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: true, data: [], meta: { count: 0 } });
  });

  it('passes the favorite filter to the service', async () => {
    const getProverbs = vi.fn().mockResolvedValue({
      proverbs: [],
      pagination: { total: 0, page: 1, pages: 1 },
    });
    const response = await app({ getProverbs }).request('/api/proverbs?favorite=true');
    expect(response.status).toBe(200);
    expect(getProverbs).toHaveBeenCalledWith(expect.objectContaining({ favorite: true }));
  });

  it('rejects invalid create payloads', async () => {
    const response = await app().request('/api/proverbs', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: '' }),
    });
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      success: false,
      error: { code: 'VALIDATION_ERROR' },
    });
  });

  it('rejects malformed ids', async () => {
    const response = await app().request('/api/proverbs/nope');
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: { code: 'INVALID_ID' } });
  });

  it('provides options used by client filters', async () => {
    const response = await app().request('/api/proverbs/filters');
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      success: true,
      data: { authors: [], categories: [], languages: [], tags: [] },
    });
  });

  it('validates random proverb filters', async () => {
    const response = await app().request('/api/random?lang=unknown');
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: { code: 'VALIDATION_ERROR' } });
  });
});
