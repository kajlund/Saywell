import { LitElement, css, html, nothing } from 'lit';
import type { CreateProverb, FilterOptions, Pagination, Proverb } from '@proverbs/contracts';
import { api } from '../services/api-client.js';

type Draft = Pick<
  CreateProverb,
  'title' | 'author' | 'content' | 'description' | 'lang' | 'category'
> & { tags: string };
const emptyDraft = (): Draft => ({
  title: '',
  author: '',
  content: '',
  description: '',
  lang: 'eng',
  category: '',
  tags: '',
});
const emptyFilters = (): FilterOptions => ({
  authors: [],
  categories: [],
  languages: [],
  tags: [],
});

export class ProverbsApp extends LitElement {
  static properties = {
    editing: { state: true },
    proverbs: { state: true },
    featured: { state: true },
    selected: { state: true },
    draft: { state: true },
    loading: { state: true },
    error: { state: true },
    query: { state: true },
    author: { state: true },
    category: { state: true },
    lang: { state: true },
    tag: { state: true },
    pagination: { state: true },
    filterOptions: { state: true },
    favoriteTotal: { state: true },
    showFavorites: { state: true },
    openMenu: { state: true },
    detailItem: { state: true },
  };
  declare editing: boolean;
  declare proverbs: Proverb[];
  declare featured: Proverb | null;
  declare selected: Proverb | null;
  declare draft: Draft;
  declare loading: boolean;
  declare error: string;
  declare query: string;
  declare author: string;
  declare category: string;
  declare lang: string;
  declare tag: string;
  declare pagination: Pagination;
  declare filterOptions: FilterOptions;
  declare favoriteTotal: number;
  declare showFavorites: boolean;
  declare openMenu: string | null;
  declare detailItem: Proverb | null;

  constructor() {
    super();
    this.editing = false;
    this.proverbs = [];
    this.featured = null;
    this.selected = null;
    this.draft = emptyDraft();
    this.loading = false;
    this.error = '';
    this.query = '';
    this.author = '';
    this.category = '';
    this.lang = '';
    this.tag = '';
    this.pagination = { total: 0, page: 1, pages: 1 };
    this.filterOptions = emptyFilters();
    this.favoriteTotal = 0;
    this.showFavorites = false;
    this.openMenu = null;
    this.detailItem = null;
  }
  connectedCallback() {
    super.connectedCallback();
    void Promise.all([
      this.load(),
      this.loadFavoriteTotal(),
      this.loadFilters(),
      this.loadRandom(),
    ]);
  }

  private itemKey(item: Proverb) {
    return item._id ?? `${item.author}:${item.content}`;
  }
  private async loadFavoriteTotal() {
    const params = new URLSearchParams({ favorite: 'true', page: '1', limit: '1' });
    try {
      this.favoriteTotal = (await api.list(params)).pagination.total;
    } catch {
      /* main request reports connectivity errors */
    }
  }
  private async toggleFavorite(item: Proverb) {
    if (!item._id) return;
    const favorite = !item.favorite;
    this.proverbs = this.proverbs.map((value) => (value === item ? { ...value, favorite } : value));
    this.favoriteTotal = Math.max(0, this.favoriteTotal + (favorite ? 1 : -1));
    try {
      await api.update(item._id, { favorite });
      if (this.showFavorites && !favorite) await this.load(1);
    } catch (error) {
      this.proverbs = this.proverbs.map((value) =>
        value._id === item._id ? { ...value, favorite: !favorite } : value,
      );
      this.favoriteTotal = Math.max(0, this.favoriteTotal + (favorite ? -1 : 1));
      this.fail(error);
    }
  }
  private showView(favorites: boolean) {
    this.showFavorites = favorites;
    this.openMenu = null;
    void this.load(1);
  }
  private async copyItem(item: Proverb) {
    await navigator.clipboard.writeText(`“${item.content}” — ${item.author}`);
    this.openMenu = null;
  }

  private params(page: number) {
    const result = new URLSearchParams({ page: String(page), limit: '10' });
    for (const [key, value] of Object.entries({
      q: this.query,
      author: this.author,
      category: this.category,
      lang: this.lang,
      tag: this.tag,
    }))
      if (value.trim()) result.set(key, value.trim());
    if (this.showFavorites) result.set('favorite', 'true');
    return result;
  }
  private async load(page = 1) {
    this.loading = true;
    this.error = '';
    try {
      const result = await api.list(this.params(page));
      this.proverbs = result.data;
      this.pagination = result.pagination;
    } catch (error) {
      this.fail(error);
    } finally {
      this.loading = false;
    }
  }
  private async loadFilters() {
    try {
      this.filterOptions = await api.filters();
    } catch {
      /* optional enhancement */
    }
  }
  private async loadRandom() {
    try {
      const p = new URLSearchParams();
      if (this.category) p.set('category', this.category);
      if (this.lang) p.set('lang', this.lang);
      this.featured = await api.random(p);
    } catch {
      this.featured = null;
    }
  }
  private fail(error: unknown) {
    this.error = error instanceof Error ? error.message : String(error);
  }
  private field<K extends keyof Draft>(key: K, value: Draft[K]) {
    this.draft = { ...this.draft, [key]: value };
  }
  private edit(item?: Proverb) {
    this.selected = item ?? null;
    this.error = '';
    this.draft = item
      ? {
          title: item.title,
          author: item.author,
          content: item.content,
          description: item.description,
          lang: item.lang,
          category: item.category,
          tags: item.tags.join(', '),
        }
      : emptyDraft();
    this.editing = true;
  }
  private async save(event: SubmitEvent) {
    event.preventDefault();
    const value: CreateProverb = {
      ...this.draft,
      userId: this.selected?.userId ?? '665544332211009988776655',
      favorite: this.selected?.favorite ?? false,
      tags: this.draft.tags
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean),
    };
    try {
      if (this.selected?._id) await api.update(this.selected._id, value);
      else await api.create(value);
      this.editing = false;
      await Promise.all([this.load(), this.loadFilters(), this.loadRandom()]);
    } catch (error) {
      this.fail(error);
    }
  }
  private async removeItem(item: Proverb) {
    if (!item._id || !window.confirm(`Delete “${item.title}”?`)) return;
    try {
      await api.delete(item._id);
      await Promise.all([this.load(), this.loadFilters(), this.loadFavoriteTotal()]);
    } catch (error) {
      this.fail(error);
    }
  }
  private reset() {
    this.query = '';
    this.author = '';
    this.category = '';
    this.lang = '';
    this.tag = '';
    void this.load();
  }

  render() {
    return this.renderSaywell();
  }

  private renderSaywell() {
    return html`<div class="app-shell">
      <aside class="side-rail">
        <button
          class="saywell-brand"
          @click=${() => {
            this.editing = false;
            void this.load();
          }}
        >
          <img class="well-mark" src="/assets/saywell-mark.png" alt="" /><strong>Saywell</strong
          ><small>A WELL OF ENDURING WORDS</small>
        </button>
        <div class="side-links">
          <button
            class=${this.showFavorites ? '' : 'selected'}
            @click=${() => this.showView(false)}
          >
            <i class="ph ph-book-open"></i>Collection</button
          ><button
            class=${this.showFavorites ? 'selected' : ''}
            @click=${() => this.showView(true)}
          >
            <i class="ph ph-heart"></i>Favorites
            <span class="nav-count">${this.favoriteTotal}</span>
          </button>
          <button @click=${() => this.edit()}><i class="ph ph-plus-circle"></i>Add saying</button>
        </div>
        <blockquote>“Words are little wells of thought.”<span>— John Ruskin</span></blockquote>
      </aside>
      <main class="reading-room">
        ${this.error ? html`<aside role="alert">${this.error}</aside>` : nothing}
        ${this.editing ? this.form() : this.saywellList()}
      </main>
      ${this.editing ? nothing : this.themeRail()}
      ${
        this.detailItem
          ? html`<div class="detail-backdrop" @click=${() => (this.detailItem = null)}>
              <section
                class="detail-dialog"
                role="dialog"
                aria-modal="true"
                @click=${(event: Event) => event.stopPropagation()}
              >
                <button
                  class="dialog-close"
                  aria-label="Close"
                  @click=${() => (this.detailItem = null)}
                >
                  <i class="ph ph-x"></i>
                </button>
                <small>${this.detailItem.category} · ${this.detailItem.lang.toUpperCase()}</small>
                <blockquote>${this.detailItem.content}</blockquote>
                <p>— ${this.detailItem.author}</p>
                ${this.detailItem.description ? html`<div class="detail-description">${this.detailItem.description}</div>` : nothing}
                <div class="detail-tags">
                  ${this.detailItem.tags.map((tag) => html`<span>#${tag}</span>`)}
                </div>
              </section>
            </div>`
          : nothing
      }
    </div>`;
  }

  private saywellList() {
    return html`<header class="collection-bar">
        <h1>${this.showFavorites ? 'Favorites' : 'Collection'}</h1>
        <span>${this.showFavorites ? 'Saved sayings' : 'All sayings'}</span>
        <label class="search-field"
          ><i class="ph ph-magnifying-glass"></i
          ><input
            aria-label="Search"
            placeholder="Search the collection"
            .value=${this.query}
            @input=${this.setText('query')}
            @keydown=${(event: KeyboardEvent) => event.key === 'Enter' && void this.load()}
        /></label>
        <button @click=${() => this.edit()}><i class="ph ph-plus"></i>New saying</button>
      </header>
      <section class="paper-feature">
        <span class="feature-quote">“</span>${
          this.featured
            ? html`<blockquote>${this.featured.content}</blockquote>
                <p>${this.featured.author}</p>`
            : html`<blockquote>The quiet word carries far.</blockquote>
                <p>Finnish Proverb</p>`
        } <button @click=${() => void this.loadRandom()}>Draw another</button>
      </section>
      <form
        class="compact-filters"
        @submit=${(event: SubmitEvent) => {
          event.preventDefault();
          void this.load();
        }}
      >
        <strong>${this.pagination.total} sayings</strong
        >${this.select('category', 'All themes', this.filterOptions.categories)}
        ${this.select('author', 'All authors', this.filterOptions.authors)}<button>
          <i class="ph ph-sliders-horizontal"></i>Filter
        </button>
        <button type="button" class="secondary" @click=${this.reset}>Reset</button>
      </form>
      ${
        this.loading
          ? html`<p class="empty">Loading…</p>`
          : this.proverbs.length
            ? html`<section class="saying-list">
                ${this.proverbs.map(
                  (item) =>
                    html` <article>
                      <span class="row-quote">“</span>
                      <div>
                        <blockquote>${item.content}</blockquote>
                        <p>${item.author}</p>
                      </div>
                      <footer>
                        <button
                          class=${item.favorite ? 'favorite active' : 'favorite'}
                          aria-label=${item.favorite ? 'Remove from favorites' : 'Add to favorites'}
                          title="Favorite"
                          @click=${() => this.toggleFavorite(item)}
                        >
                          <i
                            class=${item.favorite ? 'ph-fill ph-heart' : 'ph ph-heart'}
                          ></i></button
                        ><button aria-label="Edit" title="Edit" @click=${() => this.edit(item)}>
                          <i class="ph ph-pencil-simple"></i>
                        </button>
                        <div class="more-wrap">
                          <button
                            aria-label="More actions"
                            title="More actions"
                            aria-expanded=${this.openMenu === this.itemKey(item)}
                            @click=${() => (this.openMenu = this.openMenu === this.itemKey(item) ? null : this.itemKey(item))}
                          >
                            <i class="ph ph-dots-three"></i>
                          </button>
                          ${
                            this.openMenu === this.itemKey(item)
                              ? html`<div class="more-menu">
                                  <button
                                    @click=${() => {
                                      this.openMenu = null;
                                      this.detailItem = item;
                                    }}
                                  >
                                    <i class="ph ph-eye"></i>View details
                                  </button>
                                  <button @click=${() => void this.copyItem(item)}>
                                    <i class="ph ph-copy"></i>Copy saying
                                  </button>
                                  <button
                                    class="delete"
                                    @click=${() => {
                                      this.openMenu = null;
                                      void this.removeItem(item);
                                    }}
                                  >
                                    <i class="ph ph-trash"></i>Delete
                                  </button>
                                </div>`
                              : nothing
                          }
                        </div>
                      </footer>
                    </article>`,
                )}
              </section>`
            : html`<p class="empty">
                ${this.showFavorites ? 'No favorites yet. Use the heart beside a saying to save it here.' : 'No sayings match these filters.'}
              </p>`
      }
      <nav class="page-nav">
        <button
          ?disabled=${this.pagination.page <= 1}
          @click=${() => void this.load(this.pagination.page - 1)}
        >
          Previous
        </button>
        <span>Page ${this.pagination.page} of ${this.pagination.pages}</span
        ><button
          ?disabled=${this.pagination.page >= this.pagination.pages}
          @click=${() => void this.load(this.pagination.page + 1)}
        >
          Next
        </button>
      </nav>`;
  }

  private themeRail() {
    const themes = [
      'Wisdom',
      'Kindness',
      'Courage',
      'Patience',
      'Nature',
      'Friendship',
      'Humor',
      'Work',
      'Love',
      'Life',
    ];
    const counts = [22, 18, 14, 16, 20, 15, 12, 17, 19, 23];
    const icons = [
      'ph-lightbulb',
      'ph-heart',
      'ph-shield',
      'ph-hourglass',
      'ph-tree',
      'ph-users',
      'ph-smiley',
      'ph-briefcase',
      'ph-heart-straight',
      'ph-sun',
    ];
    return html`<aside class="theme-rail">
      <h2>THEMES</h2>
      ${themes.map(
        (theme, index) =>
          html` <button
            @click=${() => {
              this.category = theme;
              void this.load();
            }}
          >
            <span><i class=${`ph ${icons[index]}`}></i>${theme}</span
            ><small>${counts[index]} ›</small>
          </button>`,
      )}
      <div class="theme-card">
        <strong>Find the right words</strong><span>Browse themes for any moment.</span>
      </div>
    </aside>`;
  }

  private legacyRender() {
    return html`<header>
        <button
          class="brand"
          @click=${() => {
            this.editing = false;
            void this.load();
          }}
        >
          Saywell</button
        ><span>A well of enduring words</span>
      </header>
      <main>
        ${this.error ? html`<aside role="alert">${this.error}</aside>` : nothing}
        ${this.editing ? this.form() : this.list()}
      </main>`;
  }
  private list() {
    return html`<section class="hero">
        <div>
          <small>FEATURED PROVERB</small>${
            this.featured
              ? html`<blockquote>“${this.featured.content}”</blockquote>
                  <p>— ${this.featured.author}</p>`
              : html`<blockquote>No proverb available yet.</blockquote>`
          }
        </div>
        <button @click=${() => void this.loadRandom()}>Draw another</button>
      </section>
      <form
        class="filters"
        @submit=${(e: SubmitEvent) => {
          e.preventDefault();
          void this.load();
        }}
      >
        <input
          aria-label="Search"
          placeholder="Search proverbs…"
          .value=${this.query}
          @input=${this.setText('query')}
        />
        ${this.select('author', 'All authors', this.filterOptions.authors)}${this.select('category', 'All categories', this.filterOptions.categories)}${this.select('lang', 'All languages', this.filterOptions.languages)}${this.select('tag', 'All tags', this.filterOptions.tags)}
        <button>Apply</button
        ><button type="button" class="secondary" @click=${this.reset}>Reset</button>
      </form>
      <div class="heading">
        <div>
          <small>${this.pagination.total} RESULTS</small>
          <h1>Collection</h1>
        </div>
        <button @click=${() => this.edit()}>New saying</button>
      </div>
      ${
        this.loading
          ? html`<p class="empty">Loading…</p>`
          : this.proverbs.length
            ? html`<section class="grid">
                ${this.proverbs.map(
                  (p) =>
                    html`<article>
                      <small>${p.category} · ${p.lang.toUpperCase()}</small>
                      <h2>${p.title}</h2>
                      <blockquote>“${p.content}”</blockquote>
                      <p class="author">— ${p.author}</p>
                      ${p.description ? html`<p>${p.description}</p>` : nothing}
                      <div class="tags">${p.tags.map((t) => html`<span>#${t}</span>`)}</div>
                      <footer>
                        <button class="secondary" @click=${() => this.edit(p)}>Edit</button
                        ><button class="danger" @click=${() => void this.removeItem(p)}>
                          Delete
                        </button>
                      </footer>
                    </article>`,
                )}
              </section>`
            : html`<p class="empty">No proverbs match these filters.</p>`
      }
      <nav>
        <button
          ?disabled=${this.pagination.page <= 1}
          @click=${() => void this.load(this.pagination.page - 1)}
        >
          Previous</button
        ><span>Page ${this.pagination.page} of ${this.pagination.pages}</span
        ><button
          ?disabled=${this.pagination.page >= this.pagination.pages}
          @click=${() => void this.load(this.pagination.page + 1)}
        >
          Next
        </button>
      </nav>`;
  }
  private setText(key: 'query') {
    return (event: Event) => {
      this[key] = (event.target as HTMLInputElement).value;
    };
  }
  private select(key: 'author' | 'category' | 'lang' | 'tag', label: string, options: string[]) {
    return html`<select
      aria-label=${label}
      .value=${this[key]}
      @change=${(e: Event) => {
        this[key] = (e.target as HTMLSelectElement).value;
      }}
    >
      <option value="">${label}</option>
      ${options.map((v) => html`<option value=${v}>${v}</option>`)}
    </select>`;
  }
  private form() {
    return html`<form class="panel" @submit=${this.save}>
      <small>EDITOR</small>
      <h1>${this.selected ? 'Edit proverb' : 'Add a proverb'}</h1>
      ${this.input('title', 'Title', true)}${this.input('author', 'Author', true)}${this.area('content', 'Proverb', true)}${this.area('description', 'Description')}
      <div class="form-grid">
        ${this.input('category', 'Category', true)}<label
          >Language<select
            .value=${this.draft.lang}
            @change=${(e: Event) => this.field('lang', (e.target as HTMLSelectElement).value as Draft['lang'])}
          >
            <option value="eng">English</option>
            <option value="swe">Swedish</option>
            <option value="fin">Finnish</option>
          </select></label
        >
      </div>
      ${this.input('tags', 'Tags (comma-separated)')}
      <footer>
        <button type="button" class="secondary" @click=${() => (this.editing = false)}>
          Cancel</button
        ><button>Save proverb</button>
      </footer>
    </form>`;
  }
  private input(key: 'title' | 'author' | 'category' | 'tags', label: string, required = false) {
    return html`<label
      >${label}<input
        ?required=${required}
        minlength=${required ? 3 : nothing}
        .value=${this.draft[key]}
        @input=${(e: Event) => this.field(key, (e.target as HTMLInputElement).value)}
    /></label>`;
  }
  private area(key: 'content' | 'description', label: string, required = false) {
    return html`<label
      >${label}<textarea
        ?required=${required}
        minlength=${required ? 10 : nothing}
        .value=${this.draft[key]}
        @input=${(e: Event) => this.field(key, (e.target as HTMLTextAreaElement).value)}
      ></textarea>
    </label>`;
  }

  static styles = css`
    * {
      box-sizing: border-box;
    }
    .ph,
    .ph-fill {
      speak: never;
      font-style: normal;
      font-weight: normal;
      font-variant: normal;
      text-transform: none;
      line-height: 1;
      letter-spacing: 0;
      -webkit-font-smoothing: antialiased;
    }
    .ph {
      font-family: 'Phosphor' !important;
    }
    .ph-fill {
      font-family: 'Phosphor-Fill' !important;
    }
    .ph-book-open::before {
      content: '\\e0e6';
    }
    .ph-briefcase::before {
      content: '\\e0ee';
    }
    .ph-copy::before {
      content: '\\e1ca';
    }
    .ph-dots-three::before {
      content: '\\e1fe';
    }
    .ph-eye::before {
      content: '\\e220';
    }
    .ph-heart::before {
      content: '\\e2a8';
    }
    .ph-heart-straight::before {
      content: '\\e2aa';
    }
    .ph-hourglass::before {
      content: '\\e2b2';
    }
    .ph-lightbulb::before {
      content: '\\e2dc';
    }
    .ph-magnifying-glass::before {
      content: '\\e30c';
    }
    .ph-pencil-simple::before {
      content: '\\e3b4';
    }
    .ph-plus::before {
      content: '\\e3d4';
    }
    .ph-plus-circle::before {
      content: '\\e3d6';
    }
    .ph-shield::before {
      content: '\\e40a';
    }
    .ph-sliders-horizontal::before {
      content: '\\e434';
    }
    .ph-smiley::before {
      content: '\\e436';
    }
    .ph-sun::before {
      content: '\\e472';
    }
    .ph-trash::before {
      content: '\\e4a6';
    }
    .ph-tree::before {
      content: '\\e6da';
    }
    .ph-users::before {
      content: '\\e4d6';
    }
    .ph-x::before {
      content: '\\e4f6';
    }
    :host {
      display: block;
      max-width: 1240px;
      margin: auto;
      padding: 28px;
      color: #e2e8f0;
    }
    header {
      display: flex;
      align-items: baseline;
      gap: 18px;
      padding-bottom: 24px;
      border-bottom: 1px solid #334155;
    }
    header span,
    small {
      color: #94a3b8;
      letter-spacing: 0.1em;
    }
    .brand {
      font:
        700 2rem Georgia,
        serif;
      background: none;
      padding: 0;
    }
    .hero {
      margin: 28px 0;
      padding: 30px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: linear-gradient(135deg, #172554, #312e81);
      border: 1px solid #475569;
      border-radius: 18px;
    }
    .hero blockquote {
      font:
        italic 1.65rem/1.4 Georgia,
        serif;
      margin: 14px 0;
    }
    .filters {
      display: grid;
      grid-template-columns: 2fr repeat(4, 1fr) auto auto;
      gap: 9px;
    }
    .heading {
      display: flex;
      justify-content: space-between;
      align-items: end;
      margin: 34px 0 18px;
    }
    .heading h1,
    .panel h1 {
      font:
        700 2.3rem Georgia,
        serif;
      margin: 5px 0;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(285px, 1fr));
      gap: 16px;
    }
    .grid article,
    .panel {
      background: #111c31;
      border: 1px solid #334155;
      border-radius: 14px;
      padding: 24px;
    }
    .grid h2 {
      font:
        700 1.35rem Georgia,
        serif;
    }
    .grid blockquote {
      font:
        italic 1.16rem/1.55 Georgia,
        serif;
      margin: 18px 0;
    }
    .author {
      color: #93c5fd;
    }
    .tags {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }
    .tags span {
      font-size: 0.76rem;
      color: #c4b5fd;
    }
    .grid footer,
    .panel footer {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 22px;
    }
    nav {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 16px;
      margin: 28px;
    }
    .empty {
      text-align: center;
      padding: 55px;
      border: 1px dashed #475569;
      border-radius: 14px;
    }
    .panel {
      max-width: 760px;
      margin: 35px auto;
    }
    .panel label {
      display: grid;
      gap: 7px;
      margin: 17px 0;
      font-weight: 600;
    }
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
    }
    input,
    select,
    textarea {
      width: 100%;
      border: 1px solid #475569;
      border-radius: 8px;
      padding: 11px;
      background: #0f172a;
      color: #e2e8f0;
      font: inherit;
    }
    textarea {
      min-height: 105px;
      resize: vertical;
    }
    button {
      border: 0;
      border-radius: 8px;
      padding: 11px 16px;
      background: #6366f1;
      color: white;
      font-weight: 700;
      cursor: pointer;
    }
    button:disabled {
      opacity: 0.4;
    }
    .secondary {
      background: #334155;
    }
    .danger,
    aside {
      background: #7f1d1d;
    }
    aside {
      padding: 13px 16px;
      margin: 20px 0;
      border-radius: 8px;
    }
    @media (max-width: 900px) {
      .filters {
        grid-template-columns: 1fr 1fr;
      }
      .filters input {
        grid-column: 1/-1;
      }
    }
    @media (max-width: 600px) {
      :host {
        padding: 18px;
      }
      .hero,
      .heading {
        align-items: flex-start;
        flex-direction: column;
        gap: 16px;
      }
      .filters,
      .form-grid {
        grid-template-columns: 1fr;
      }
    }
    :host {
      max-width: 1380px;
      min-height: 100vh;
      padding: 34px 44px 60px;
      color: #172c25;
      background: #fbf8f1;
    }
    header {
      border-color: #ddd8ca;
      padding-bottom: 28px;
    }
    header span,
    small {
      color: #68786d;
    }
    .brand {
      color: #0d392c;
      font:
        700 3rem/1 Georgia,
        serif;
      letter-spacing: -0.05em;
    }
    .hero {
      min-height: 300px;
      padding: 46px 54px;
      color: #f8f4e9;
      background: #113c2f url('/assets/saywell-botanical-book.png') no-repeat 96% 50% / 42% auto;
      border: 0;
      border-radius: 2px;
      box-shadow: 0 16px 38px rgba(29, 47, 39, 0.12);
    }
    .hero > div {
      max-width: 62%;
    }
    .hero small {
      color: #c8d6c9;
    }
    .hero blockquote {
      font:
        400 2.5rem/1.18 Georgia,
        serif;
      max-width: 720px;
    }
    .hero button {
      align-self: flex-end;
      background: #f4efe2;
      color: #173c30;
    }
    .filters {
      margin-top: 28px;
    }
    input,
    select,
    textarea {
      color: #21372f;
      background: #fffdf8;
      border-color: #d9d4c8;
      border-radius: 5px;
    }
    button {
      background: #123e31;
      border-radius: 5px;
      font-weight: 600;
    }
    .secondary {
      background: #ece8de;
      color: #29443a;
    }
    .heading {
      border-bottom: 1px solid #dcd7ca;
      padding-bottom: 14px;
    }
    .heading h1,
    .panel h1 {
      color: #17372c;
      font-weight: 400;
    }
    .grid {
      display: block;
    }
    .grid article {
      display: grid;
      grid-template-columns: 1fr auto;
      padding: 22px 12px;
      background: transparent;
      border: 0;
      border-bottom: 1px solid #dfdbd0;
      border-radius: 0;
    }
    .grid article > small,
    .grid article > h2,
    .grid article > blockquote,
    .grid article > p,
    .grid article > .tags {
      grid-column: 1;
    }
    .grid h2 {
      margin: 6px 0 0;
      font-weight: 400;
    }
    .grid blockquote {
      margin: 12px 0 4px;
      color: #263d35;
    }
    .grid footer {
      grid-column: 2;
      grid-row: 1 / 7;
      align-items: center;
    }
    .grid footer button {
      background: transparent;
      color: #315449;
      border: 1px solid #d8d4c9;
    }
    .grid footer .danger {
      color: #8c453e;
    }
    .tags span {
      color: #6b755f;
    }
    .panel {
      background: #fffdf8;
      border-color: #d9d4c8;
      border-radius: 6px;
    }
    nav button {
      background: #123e31;
    }
    @media (max-width: 760px) {
      :host {
        padding: 22px 18px 44px;
      }
      .brand {
        font-size: 2.35rem;
      }
      .hero {
        min-height: 360px;
        padding: 30px;
        background-position: 100% 96%;
        background-size: 72% auto;
      }
      .hero > div {
        max-width: 100%;
      }
      .hero blockquote {
        font-size: 1.9rem;
      }
      .grid article {
        grid-template-columns: 1fr;
      }
      .grid footer {
        grid-column: 1;
        grid-row: auto;
        justify-content: flex-start;
      }
    }
    :host {
      display: block;
      max-width: none;
      min-height: 100vh;
      margin: 0;
      padding: 0;
      background: #f7f5ef;
      color: #263a35;
    }
    .app-shell {
      display: grid;
      grid-template-columns: 260px minmax(0, 1fr) 280px;
      height: 100vh;
      height: 100dvh;
      overflow: hidden;
    }
    .side-rail {
      display: flex;
      flex-direction: column;
      height: 100vh;
      height: 100dvh;
      padding: 54px 22px 36px;
      overflow: hidden;
      border-right: 1px solid #d9dcd7;
      background: #faf9f5;
    }
    .saywell-brand {
      display: grid;
      justify-items: center;
      padding: 0;
      color: #17382f;
      background: transparent;
    }
    .saywell-brand:hover {
      background: transparent;
    }
    .well-mark {
      width: 112px;
      height: 84px;
      object-fit: contain;
    }
    .saywell-brand strong {
      font:
        400 3.1rem/1 Georgia,
        serif;
      letter-spacing: -0.055em;
    }
    .saywell-brand small {
      margin-top: 14px;
      color: #53625e;
      font-size: 0.66rem;
      letter-spacing: 0.14em;
    }
    .side-links {
      display: grid;
      gap: 8px;
      margin-top: 46px;
    }
    .side-links button {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 20px;
      color: #334842;
      background: transparent;
      text-align: left;
      font-size: 0.95rem;
    }
    .side-links i {
      width: 22px;
      font-size: 1.25rem;
    }
    .nav-count {
      margin-left: auto;
      min-width: 20px;
      color: #63736d;
      font-size: 0.72rem;
      text-align: right;
    }
    .side-links button.selected {
      background: #e4e9e3;
      color: #24473d;
    }
    .side-rail > blockquote {
      margin: auto 18px 0;
      padding-top: 36px;
      border-top: 1px solid #dcded9;
      color: #34473f;
      font:
        italic 1rem/1.5 Georgia,
        serif;
    }
    .side-rail > blockquote span {
      display: block;
      margin-top: 12px;
      font:
        0.76rem Arial,
        sans-serif;
    }
    .reading-room {
      display: flex;
      flex-direction: column;
      min-width: 0;
      min-height: 0;
      height: 100vh;
      height: 100dvh;
      padding: 28px;
      overflow: hidden;
    }
    .collection-bar {
      display: grid;
      grid-template-columns: auto auto 1fr auto;
      gap: 22px;
      align-items: center;
      padding: 0 0 26px;
      border: 0;
      flex: 0 0 auto;
    }
    .collection-bar h1 {
      margin: 0;
      color: #1b3730;
      font:
        400 1.45rem Georgia,
        serif;
    }
    .collection-bar > span {
      color: #596963;
      font-size: 0.8rem;
    }
    .search-field {
      position: relative;
      justify-self: end;
      width: min(100%, 330px);
    }
    .search-field i {
      position: absolute;
      left: 13px;
      top: 50%;
      z-index: 1;
      color: #687973;
      font-size: 1.1rem;
      transform: translateY(-50%);
    }
    .collection-bar input {
      justify-self: end;
      max-width: none;
      height: 42px;
      padding-left: 40px;
    }
    .collection-bar button,
    .compact-filters button {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .paper-feature {
      position: relative;
      display: grid;
      justify-items: center;
      flex: 0 0 auto;
      min-height: 210px;
      padding: 18px 70px 30px;
      overflow: hidden;
      color: #22342f;
      background: #fcfbf7;
      border: 0;
      border-bottom: 1px solid #d7d8d3;
      text-align: center;
    }
    .paper-feature::after {
      content: '';
      position: absolute;
      left: 0;
      right: 0;
      bottom: -8px;
      height: 16px;
      background: #f7f5ef;
      box-shadow: 0 -4px 8px rgba(40, 55, 48, 0.08);
      transform: rotate(-0.4deg);
    }
    .feature-quote {
      color: #a7613f;
      font:
        700 2.35rem/1 Georgia,
        serif;
    }
    .paper-feature blockquote {
      max-width: 700px;
      margin: 2px 0 10px;
      font:
        400 2rem/1.12 Georgia,
        serif;
    }
    .paper-feature p {
      margin: 0;
      color: #3f6a59;
      font:
        0.8rem Georgia,
        serif;
    }
    .paper-feature button {
      margin-top: 10px;
      padding: 7px 12px;
      color: #48645a;
      background: transparent;
      border: 1px solid #cfd5cf;
    }
    .compact-filters {
      display: grid;
      grid-template-columns: 1fr 145px 145px auto auto;
      gap: 9px;
      align-items: center;
      padding: 20px 0 14px;
      border-bottom: 1px solid #d7d9d4;
      flex: 0 0 auto;
    }
    .compact-filters strong {
      font:
        400 0.84rem Arial,
        sans-serif;
    }
    .compact-filters select,
    .compact-filters button {
      padding: 8px 10px;
      font-size: 0.76rem;
    }
    .saying-list article {
      display: grid;
      grid-template-columns: 32px 1fr auto;
      gap: 14px;
      align-items: center;
      min-height: 74px;
      padding: 12px 0;
      border-bottom: 1px solid #d8dad5;
    }
    .saying-list {
      flex: 1 1 auto;
      min-height: 0;
      overflow-y: auto;
      padding-right: 8px;
      scrollbar-color: #aab5af transparent;
      scrollbar-width: thin;
    }
    .row-quote {
      align-self: start;
      color: #356b58;
      font:
        700 2.2rem/1 Georgia,
        serif;
    }
    .saying-list blockquote {
      margin: 0 0 5px;
      color: #2e3d38;
      font:
        400 1.05rem/1.3 Georgia,
        serif;
    }
    .saying-list p {
      margin: 0;
      color: #39705d;
      font-size: 0.73rem;
    }
    .saying-list footer {
      display: flex;
      gap: 5px;
    }
    .saying-list footer button {
      padding: 7px 8px;
      color: #52645e;
      background: transparent;
      border: 0;
      font-size: 0.72rem;
    }
    .saying-list footer i {
      font-size: 1.2rem;
    }
    .saying-list footer .favorite.active {
      color: #a45e4e;
    }
    .more-wrap {
      position: relative;
    }
    .more-menu {
      position: absolute;
      z-index: 5;
      top: 36px;
      right: 0;
      display: grid;
      width: 156px;
      padding: 6px;
      background: #fffefa;
      border: 1px solid #d7d9d3;
      border-radius: 7px;
      box-shadow: 0 12px 32px rgba(34, 52, 45, 0.16);
    }
    .more-menu button {
      display: flex;
      align-items: center;
      gap: 9px;
      width: 100%;
      padding: 9px 10px;
      border-radius: 4px;
      text-align: left;
      white-space: nowrap;
    }
    .more-menu button:hover {
      background: #eef1ec;
    }
    .more-menu .delete {
      color: #98564f;
    }
    .saying-list footer .delete {
      color: #98564f;
    }
    .page-nav {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 14px;
      flex: 0 0 auto;
      margin: 12px 0 0;
      padding-top: 12px;
      border-top: 1px solid #d8dad5;
      font-size: 0.75rem;
    }
    .page-nav button {
      padding: 8px 12px;
    }
    .theme-rail {
      height: 100vh;
      height: 100dvh;
      padding: 112px 30px 34px;
      overflow-y: auto;
      border-left: 1px solid #d9dcd7;
      background: #faf9f5;
    }
    .theme-rail h2 {
      margin: 0 0 24px;
      padding-bottom: 14px;
      border-bottom: 1px solid #d8dad5;
      color: #405b51;
      font:
        700 0.75rem Arial,
        sans-serif;
      letter-spacing: 0.08em;
    }
    .theme-rail > button {
      display: flex;
      justify-content: space-between;
      width: 100%;
      padding: 11px 4px;
      color: #3c4c47;
      background: transparent;
      font-weight: 400;
    }
    .theme-rail > button:hover {
      color: #1c4d3d;
      background: #edf0eb;
    }
    .theme-rail > button small {
      color: #8a9590;
      letter-spacing: 0;
    }
    .theme-rail > button span {
      display: flex;
      align-items: center;
      gap: 11px;
    }
    .theme-rail > button i {
      width: 20px;
      color: #536960;
      font-size: 1.15rem;
    }
    .theme-card {
      display: grid;
      gap: 7px;
      margin-top: 28px;
      padding: 22px;
      background: #f0eee7;
      border: 1px solid #deddd6;
      border-radius: 7px;
    }
    .theme-card strong {
      color: #29483e;
      font:
        400 0.92rem Georgia,
        serif;
    }
    .theme-card span {
      color: #69746f;
      font-size: 0.72rem;
      line-height: 1.5;
    }
    .reading-room .panel {
      max-width: 760px;
      margin: 40px auto;
    }
    .detail-backdrop {
      position: fixed;
      z-index: 20;
      inset: 0;
      display: grid;
      place-items: center;
      padding: 24px;
      background: rgba(22, 36, 31, 0.42);
    }
    .detail-dialog {
      position: relative;
      width: min(540px, 100%);
      padding: 42px;
      background: #fffdf8;
      border: 1px solid #d7d7cf;
      border-radius: 8px;
      box-shadow: 0 24px 70px rgba(17, 31, 25, 0.22);
    }
    .detail-dialog blockquote {
      margin: 18px 0;
      color: #253a32;
      font:
        400 2rem/1.3 Georgia,
        serif;
    }
    .detail-dialog > p {
      color: #39705d;
    }
    .dialog-close {
      position: absolute;
      top: 12px;
      right: 12px;
      padding: 8px;
      color: #52645e;
      background: transparent;
    }
    .detail-description {
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid #deded7;
      color: #596862;
      line-height: 1.6;
    }
    .detail-tags {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-top: 20px;
    }
    .detail-tags span {
      padding: 5px 8px;
      color: #46665a;
      background: #edf0eb;
      border-radius: 4px;
      font-size: 0.74rem;
    }
    @media (max-width: 1050px) {
      .app-shell {
        grid-template-columns: 210px minmax(0, 1fr);
      }
      .theme-rail {
        display: none;
      }
    }
    @media (max-width: 720px) {
      .app-shell {
        display: block;
        height: auto;
        min-height: 100vh;
        overflow: visible;
      }
      .side-rail {
        position: static;
        height: auto;
        padding: 22px 18px;
        border-right: 0;
        border-bottom: 1px solid #d9dcd7;
      }
      .saywell-brand {
        justify-items: start;
      }
      .well-mark,
      .saywell-brand small,
      .side-rail > blockquote {
        display: none;
      }
      .saywell-brand strong {
        font-size: 2.1rem;
      }
      .side-links {
        display: flex;
        margin-top: 18px;
        overflow-x: auto;
      }
      .side-links button {
        flex: 0 0 auto;
        padding: 9px 12px;
      }
      .reading-room {
        display: block;
        height: auto;
        padding: 18px;
        overflow: visible;
      }
      .collection-bar {
        grid-template-columns: 1fr auto;
        gap: 12px;
      }
      .collection-bar > span {
        display: none;
      }
      .search-field {
        grid-column: 1 / -1;
        grid-row: 2;
        width: 100%;
      }
      .paper-feature {
        min-height: 230px;
        padding: 24px 22px 34px;
      }
      .paper-feature blockquote {
        font-size: 2.05rem;
      }
      .compact-filters {
        grid-template-columns: 1fr 1fr;
      }
      .compact-filters strong {
        grid-column: 1 / -1;
      }
      .saying-list article {
        grid-template-columns: 25px 1fr;
      }
      .saying-list {
        overflow: visible;
        padding-right: 0;
      }
      .saying-list footer {
        grid-column: 2;
      }
    }
  `;
}
customElements.define('proverbs-app', ProverbsApp);
