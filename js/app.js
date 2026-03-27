import { PostStore }  from './store.js';
import { Renderer }   from './renderer.js';
import { Controls }   from './controls.js';

/**
 * App
 * Top-level orchestrator for index.html (home page only).
 * Clicking a post card navigates to post.html?slug=<slug>,
 * which is a fully separate page. The browser's back button
 * returns here naturally.
 */
class App {

  constructor() {
    this.store    = new PostStore();
    this.renderer = new Renderer(this.store);
    this.controls = new Controls(this.store, {
      onFilterChange: (tab, tag) => this._onFilterChange(tab, tag),
    });

    this.POSTS_PER_PAGE = 9;
    this._currentPage = 1;
  }

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

  /**
   * Navigates to post.html?slug=<slug>.
   * Real page navigation — browser back button returns to index.html.
   */
  showPost(slug) {
    window.location.href = `post.html?slug=${encodeURIComponent(slug)}`;
  }

  _onFilterChange(tab, tag) {
    this._currentPage = 1;
    this.renderer.renderGrid(
      this.store.sorted, tab, tag,
      this._currentPage, this.POSTS_PER_PAGE,
      page => this._onPageChange(page),
    );
  }

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

const app = new App();
window.app = app;
app.init();
