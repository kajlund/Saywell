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
  }
  connectedCallback() {
    super.connectedCallback();
    void Promise.all([this.load(), this.loadFilters(), this.loadRandom()]);
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
      await Promise.all([this.load(), this.loadFilters()]);
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
    return html`<header>
        <button
          class="brand"
          @click=${() => {
            this.editing = false;
            void this.load();
          }}
        >
          Proverbs</button
        ><span>Words worth keeping</span>
      </header>
      <main>
        ${this.error ? html`<aside role="alert">${this.error}</aside>` : nothing}
        ${this.editing ? this.form() : this.list()}
      </main>`;
  }
  private list() {
    return html`<section class="hero">
        <div>
          <small>PROVERB OF THE MOMENT</small>${
            this.featured
              ? html`<blockquote>“${this.featured.content}”</blockquote>
                  <p>— ${this.featured.author}</p>`
              : html`<blockquote>No proverb available yet.</blockquote>`
          }
        </div>
        <button @click=${() => void this.loadRandom()}>Another one</button>
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
          <h1>Collected proverbs</h1>
        </div>
        <button @click=${() => this.edit()}>Add proverb</button>
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
  `;
}
customElements.define('proverbs-app', ProverbsApp);
