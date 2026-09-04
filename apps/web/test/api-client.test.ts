import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from '../src/services/api-client.js';

afterEach(() => vi.unstubAllGlobals());

describe('API client', () => {
  it('returns list data and pagination metadata', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            success: true,
            data: [],
            meta: { pagination: { total: 0, page: 2, pages: 3 } },
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      ),
    );

    await expect(api.list(new URLSearchParams({ page: '2' }))).resolves.toMatchObject({
      data: [],
      pagination: { page: 2, pages: 3 },
    });
  });

  it('surfaces structured API errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Request validation failed' },
          }),
          { status: 400, headers: { 'content-type': 'application/json' } },
        ),
      ),
    );

    await expect(api.filters()).rejects.toThrow('Request validation failed');
  });
});
