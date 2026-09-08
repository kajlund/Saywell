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

  it('clears other filters when search input is used', () => {
    element.category = 'Wisdom';
    element.author = 'Seneca';
    element.tag = 'stoic';
    element.lang = 'eng';

    const inputEvent = { target: { value: 'patience' } } as unknown as Event;
    (element as any).handleSearchInput(inputEvent);

    expect(element.query).toBe('patience');
    expect(element.category).toBe('');
    expect(element.author).toBe('');
    expect(element.tag).toBe('');
    expect(element.lang).toBe('');
  });

  it('clears all filters and resets list to view all when clearSearch is called', async () => {
    element.query = 'patience';
    element.category = 'Wisdom';
    element.author = 'Seneca';
    element.tag = 'stoic';
    element.lang = 'eng';
    element.showFavorites = true;

    await (element as any).clearSearch();

    expect(element.query).toBe('');
    expect(element.category).toBe('');
    expect(element.author).toBe('');
    expect(element.tag).toBe('');
    expect(element.lang).toBe('');
    expect(element.showFavorites).toBe(false);

    const lastCallParams = vi.mocked(api.list).mock.calls.at(-1)?.[0];
    expect(lastCallParams?.get('page')).toBe('1');
    expect(lastCallParams?.get('q')).toBeNull();
    expect(lastCallParams?.get('favorite')).toBeNull();
  });

  it('clears search on Escape key and searches on Enter key', async () => {
    element.query = 'truth';
    element.category = 'Nature';

    // Enter key
    const enterEvent = { key: 'Enter', preventDefault: vi.fn() } as unknown as KeyboardEvent;
    (element as any).handleSearchKeydown(enterEvent);

    expect(element.category).toBe('');
    const lastCallParams = vi.mocked(api.list).mock.calls.at(-1)?.[0];
    expect(lastCallParams?.get('q')).toBe('truth');
    expect(lastCallParams?.get('page')).toBe('1');

    // Escape key
    const escEvent = { key: 'Escape', preventDefault: vi.fn() } as unknown as KeyboardEvent;
    (element as any).handleSearchKeydown(escEvent);
    expect(element.query).toBe('');
  });

  it('clears other filters when author or theme is set', () => {
    element.category = 'Wisdom';
    element.tag = 'stoic';
    element.query = 'peace';

    // Setting author should clear category, tag, query
    (element as any).setFilter('author', 'Sam Harris');
    expect(element.author).toBe('Sam Harris');
    expect(element.category).toBe('');
    expect(element.tag).toBe('');
    expect(element.query).toBe('');

    // Setting category/theme should clear author, tag, query
    (element as any).setFilter('category', 'Mindfulness');
    expect(element.category).toBe('Mindfulness');
    expect(element.author).toBe('');
    expect(element.tag).toBe('');
    expect(element.query).toBe('');

    // Setting tag should clear category, author, query
    (element as any).setTag('zen');
    expect(element.tag).toBe('zen');
    expect(element.category).toBe('');
    expect(element.author).toBe('');
    expect(element.query).toBe('');
  });

  it('reflects the current filtering state in listHeading', () => {
    // Unfiltered
    expect((element as any).listHeading).toEqual({
      title: 'All sayings',
      subtitle: 'All sayings in library',
    });

    // Author filtered
    element.author = 'Sam Harris';
    expect((element as any).listHeading).toEqual({
      title: 'Sayings by Sam Harris',
      subtitle: 'Sayings attributed to Sam Harris',
    });
    element.author = '';

    // Theme filtered
    element.category = 'Wisdom';
    expect((element as any).listHeading).toEqual({
      title: 'Sayings on Wisdom',
      subtitle: 'Explored under the Wisdom theme',
    });
    element.category = '';

    // Tag filtered
    element.tag = 'stoic';
    expect((element as any).listHeading).toEqual({
      title: 'Sayings tagged #stoic',
      subtitle: 'Filtered by #stoic',
    });
    element.tag = '';

    // Search query filtered
    element.query = 'tranquility';
    expect((element as any).listHeading).toEqual({
      title: 'Sayings matching “tranquility”',
      subtitle: 'Search results for “tranquility”',
    });
    element.query = '';

    // Favorites unfiltered
    element.showFavorites = true;
    expect((element as any).listHeading).toEqual({
      title: 'Favorites',
      subtitle: 'Saved sayings',
    });

    // Favorites with author
    element.author = 'Marcus Aurelius';
    expect((element as any).listHeading).toEqual({
      title: 'Favorite sayings by Marcus Aurelius',
      subtitle: 'Saved sayings attributed to Marcus Aurelius',
    });
  });
});

