import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../src/services/api-client.js';
import { ProverbsApp } from '../src/components/proverbs-app.js';

describe('ProverbsApp pagination preservation', () => {
  let element: ProverbsApp;

  beforeEach(() => {
    vi.stubGlobal('confirm', () => true);
    vi.spyOn(api, 'list').mockResolvedValue({
      data: [
        {
          _id: 'test-1',
          title: 'Title 1',
          author: 'Author 1',
          content: 'Content 1 is long enough',
          description: '',
          category: 'Wisdom',
          lang: 'eng',
          tags: ['tag1'],
          userId: 'user-1',
          favorite: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      pagination: { total: 25, page: 2, pages: 3 },
    });
    vi.spyOn(api, 'filters').mockResolvedValue({
      authors: [],
      categories: [],
      languages: [],
      tags: [],
    });
    vi.spyOn(api, 'random').mockResolvedValue(null);
    vi.spyOn(api, 'update').mockResolvedValue({} as any);

    element = new ProverbsApp();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('remembers starting page when opening edit form and reloads that page upon saving', async () => {
    await (element as any).load(2);
    expect(element.pagination.page).toBe(2);

    const testItem = element.proverbs[0];
    (element as any).edit(testItem);
    expect(element.editing).toBe(true);

    const fakeEvent = { preventDefault: vi.fn() } as unknown as SubmitEvent;
    await (element as any).save(fakeEvent);

    expect(element.editing).toBe(false);
    expect(api.update).toHaveBeenCalledWith('test-1', expect.anything());
    const lastCallParams = vi.mocked(api.list).mock.calls.at(-1)?.[0];
    expect(lastCallParams?.get('page')).toBe('2');
    expect(element.pagination.page).toBe(2);
  });

  it('closes form without resetting page when cancel/close is called', async () => {
    await (element as any).load(3);
    element.pagination = { total: 30, page: 3, pages: 3 };

    (element as any).edit(element.proverbs[0]);
    expect(element.editing).toBe(true);

    (element as any).closeForm();
    expect(element.editing).toBe(false);
    expect(element.selected).toBeNull();
    expect(element.pagination.page).toBe(3);
  });
});
