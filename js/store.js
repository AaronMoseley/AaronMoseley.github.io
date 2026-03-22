import { Parser } from './parser.js';

/**
 * PostStore
 * Responsible for loading, caching, and sorting post data.
 * Keeps the raw posts.json manifest and the parsed per-post content
 * in a single place so nothing else needs to fetch files directly.
 */
export class PostStore {

  constructor() {
    /** @type {Object|null} Full parsed posts.json */
    this.siteData = null;

    /** @type {Object.<string, {meta: Object, content: string, cover: string}>} */
    this.posts = {};

    /** @type {Array} Posts sorted by date descending */
    this.sorted = [];
  }

  /**
   * Loads posts.json and then fetches + parses every post markdown file.
   * Populates this.siteData, this.posts, and this.sorted.
   *
   * @returns {Promise<void>}
   * @throws {Error} if posts.json cannot be fetched
   */
  async load() {
    const res = await fetch('posts.json');
    if (!res.ok) throw new Error('Failed to load posts.json');
    this.siteData = await res.json();

    await Promise.all(this.siteData.posts.map(entry => this._loadPost(entry)));

    const toSortKey = dateStr => {
      if (!dateStr) return '';
      const [mm, dd, yyyy] = dateStr.split('-');
      return `${yyyy}-${mm}-${dd}`;
    };

    this.sorted = [...this.siteData.posts].sort((a, b) => {
      const da = toSortKey(this.posts[a.slug]?.meta?.date || '');
      const db = toSortKey(this.posts[b.slug]?.meta?.date || '');
      return db.localeCompare(da);
    });
  }

  /**
   * Fetches and parses a single post's markdown file if not already cached.
   *
   * @param {{ slug: string, file: string, cover: string }} entry
   * @returns {Promise<void>}
   */
  async _loadPost(entry) {
    if (this.posts[entry.slug]) return;
    try {
      const res = await fetch(entry.file);
      if (!res.ok) throw new Error();
      const raw = await res.text();
      const { meta, content } = Parser.parseFrontmatter(raw);
      this.posts[entry.slug] = { meta, content, cover: entry.cover };
    } catch {
      this.posts[entry.slug] = {
        meta: { title: entry.slug },
        content: '',
        cover: entry.cover,
      };
    }
  }

  /**
   * Returns the cached data for a given slug, loading it first if needed.
   *
   * @param {string} slug
   * @returns {Promise<{meta: Object, content: string, cover: string}>}
   */
  async getPost(slug) {
    if (!this.posts[slug]) {
      const entry = this.siteData?.posts.find(p => p.slug === slug);
      if (entry) await this._loadPost(entry);
    }
    return this.posts[slug] || null;
  }

  /**
   * Returns all unique tab labels present across all posts.
   *
   * @returns {string[]} Sorted tab names
   */
  getTabs() {
    const tabs = new Set();
    this.siteData?.posts.forEach(entry => {
      const tab = (entry.tab || '').trim();
      if (tab) tabs.add(tab);
    });
    return [...tabs].sort();
  }

  /**
   * Returns all unique tags found in posts belonging to the given tab.
   * If tab is empty string, returns tags across all posts.
   *
   * @param {string} tab
   * @returns {string[]} Sorted tag names
   */
  getTagsForTab(tab) {
    const relevant = tab
      ? this.sorted.filter(e => (e.tab || '').trim().toLowerCase() === tab.toLowerCase())
      : this.sorted;

    const tags = new Set();
    relevant.forEach(entry => {
      Parser.parseTags(this.posts[entry.slug]?.meta?.tags || '')
        .forEach(t => tags.add(t));
    });
    return [...tags].sort();
  }

}
