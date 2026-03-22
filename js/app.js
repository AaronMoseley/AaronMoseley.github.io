import { PostStore }  from './store.js';
import { Renderer }   from './renderer.js';
import { Controls }   from './controls.js';

/**
 * App
 * Top-level orchestrator. Wires together the store, renderer, and
 * controls, and exposes the public methods called from inline HTML
 * event handlers (showHome, showPost).
 */
class App {

  constructor() {
    this.store    = new PostStore();
    this.renderer = new Renderer(this.store);
    this.controls = new Controls(this.store, {
      onFilterChange: (tab, tag) => this._onFilterChange(tab, tag),
    });

    /** Number of posts shown per page before pagination kicks in */
    this.POSTS_PER_PAGE = 9;

    /** @type {number} Current page (1-indexed) */
    this._currentPage = 1;
  }

  // ── Lifecycle ────────────────────────────────────────────────────

  /**
   * Entry point. Loads data, renders the home page, and reveals the app.
   */
  async init() {
    try {
      await this.store.load();
      this._renderHome();
    } catch (err) {
      console.error(err);
      document.getElementById('posts-grid').innerHTML =
        `<p style="color:var(--ink-faint);font-size:0.8rem;grid-column:1/-1;">
          Could not load posts. Make sure posts.json is in the same directory.
        </p>`;
    } finally {
      document.getElementById('app').classList.add('loaded');
    }
  }

  /**
   * Populates all home-page content from store data.
   */
  _renderHome() {
    const { site, posts } = this.store.siteData;

    if (!posts || posts.length === 0) {
      document.getElementById('posts-grid').innerHTML =
        '<p style="color:var(--ink-faint);font-size:0.8rem;">No posts yet.</p>';
      return;
    }

    this.renderer.renderSiteMeta(site);
    this.controls.build();
    this._currentPage = 1;
    this.renderer.renderGrid(
      this.store.sorted, '', '',
      this._currentPage, this.POSTS_PER_PAGE,
      page => this._onPageChange(page),
    );
  }

  // ── Routing ──────────────────────────────────────────────────────

  /**
   * Shows the named page and scrolls to the top.
   *
   * @param {'home'|'post'} pageId
   */
  showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${pageId}`).classList.add('active');
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  /** Navigates to the home page. */
  showHome() {
    document.title = this.store.siteData?.site?.author || this.store.siteData?.site?.title || document.title;
    this.showPage('home');
  }

  /**
   * Navigates to the single-post page for the given slug.
   *
   * @param {string} slug
   */
  async showPost(slug) {
    if (!this.store.siteData) return;
    const siteAuthor = this.store.siteData.site.author || this.store.siteData.site.title;
    const ok = await this.renderer.renderPost(slug, siteAuthor);
    if (ok) this.showPage('post');
  }

  // ── Filter Callback ──────────────────────────────────────────────

  /**
   * Re-renders the grid whenever tabs or tags change.
   *
   * @param {string} tab
   * @param {string} tag
   */
  _onFilterChange(tab, tag) {
    this._currentPage = 1;
    this.renderer.renderGrid(
      this.store.sorted, tab, tag,
      this._currentPage, this.POSTS_PER_PAGE,
      page => this._onPageChange(page),
    );
  }

  /**
   * Handles pagination page changes.
   *
   * @param {number} page
   */
  _onPageChange(page) {
    this._currentPage = page;
    this.renderer.renderGrid(
      this.store.sorted,
      this.controls.activeTab,
      this.controls.activeTag,
      this._currentPage, this.POSTS_PER_PAGE,
      p => this._onPageChange(p),
    );
  }

}

// ── Bootstrap ────────────────────────────────────────────────────────────────

const app = new App();

// Expose app globally so inline onclick="app.showHome()" etc. work.
window.app = app;

app.init();
