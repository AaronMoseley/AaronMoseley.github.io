import { PostStore } from './store.js';
import { Renderer }  from './renderer.js';
import { Parser }    from './parser.js';

/**
 * PostPage
 * Drives post.html. Reads the `slug` query parameter from the URL,
 * loads the matching post via PostStore, and renders it.
 * The browser's own back button returns to wherever the user came from.
 */
class PostPage {

  constructor() {
    this.store    = new PostStore();
    this.renderer = new Renderer(this.store);
  }

  async init() {
    const slug = new URLSearchParams(window.location.search).get('slug');

    try {
      await this.store.load();
    } catch (err) {
      console.error(err);
      document.getElementById('post-body').innerHTML =
        `<p style="color:var(--ink-faint);">Could not load post data.</p>`;
      document.getElementById('app').classList.add('loaded');
      return;
    }

    const site       = this.store.siteData.site;
    const siteAuthor = site.author || site.title;

    // Populate footer / back-button label with site author name
    const setText = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
    setText('back-btn-name',    siteAuthor);
    setText('footer-name-post', siteAuthor);

    if (site.social?.email) {
      const href = `mailto:${site.social.email}`;
      const el = document.getElementById('footer-email-post');
      if (el) el.href = href;
    }
    if (site.social?.linkedin) {
      const el = document.getElementById('footer-linkedin-post');
      if (el) el.href = site.social.linkedin;
    }
    if (site.social?.github) {
      const el = document.getElementById('footer-github-post');
      if (el) el.href = site.social.github;
    }

    if (!slug) {
      document.title = siteAuthor;
      document.getElementById('post-title').textContent = 'Post not found';
      document.getElementById('post-body').innerHTML =
        `<p>No slug was provided in the URL. <a href="index.html">Go home</a>.</p>`;
      document.getElementById('app').classList.add('loaded');
      return;
    }

    const ok = await this.renderer.renderPost(slug, siteAuthor);

    if (!ok) {
      document.title = siteAuthor;
      document.getElementById('post-title').textContent = 'Post not found';
      document.getElementById('post-body').innerHTML =
        `<p>The post "<strong>${slug}</strong>" could not be found. <a href="index.html">Go home</a>.</p>`;
    }

    // Wire up related-post cards to navigate to post.html?slug=...
    // (cards rendered by renderer use onclick="app.showPost(...)" which won't
    //  exist here, so we replace them with direct links after render)
    document.querySelectorAll('.related-posts-grid .post-card').forEach(card => {
      const onclickAttr = card.getAttribute('onclick') || '';
      const match = onclickAttr.match(/showPost\('([^']+)'\)/);
      if (match) {
        card.removeAttribute('onclick');
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => {
          window.location.href = `post.html?slug=${encodeURIComponent(match[1])}`;
        });
      }
    });

    document.getElementById('app').classList.add('loaded');
  }
}

const page = new PostPage();
page.init();
