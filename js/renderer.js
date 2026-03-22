import { Parser } from './parser.js';

/**
 * Renderer
 * Owns all DOM-writing operations: the home page about section,
 * the post grid, and the single-post view. It reads from the store
 * but never modifies it.
 */
export class Renderer {

  /**
   * @param {import('./store.js').PostStore} store
   */
  constructor(store) {
    this.store = store;
  }

  // ── About / Site Meta ────────────────────────────────────────────

  /**
   * Populates all static site-identity elements from posts.json site config.
   *
   * @param {Object} site - The `site` block from posts.json
   */
  renderSiteMeta(site) {
    const name = site.author || site.title;

    document.title = name;
    this._setText('site-name',          name);
    this._setText('back-btn-name',      name);
    this._setText('footer-name',        site.author || '');
    this._setText('footer-name-post',   site.author || '');
    this._setText('about-name',         name);

    if (site.role)  this._setText('about-label', site.role);
    if (site.photo) this._setPhoto(site.photo, name);
    if (site.bio)   this._setBio(site.bio);

    if (site.social?.email) {
      const href = `mailto:${site.social.email}`;
      this._setAttr('footer-email',      'href', href);
      this._setAttr('footer-email-post', 'href', href);
    }

    const extraLinks = [
      site.social?.linkedin && { id: 'footer-linkedin',      href: site.social.linkedin, label: 'LinkedIn' },
      site.social?.github   && { id: 'footer-github',        href: site.social.github,   label: 'GitHub'   },
      site.social?.linkedin && { id: 'footer-linkedin-post', href: site.social.linkedin, label: 'LinkedIn' },
      site.social?.github   && { id: 'footer-github-post',   href: site.social.github,   label: 'GitHub'   },
    ].filter(Boolean);

    extraLinks.forEach(({ id, href }) => this._setAttr(id, 'href', href));

    // CV / Resume buttons
    const docsEl = document.getElementById('about-docs');
    if (docsEl) {
      const links = [];
      if (site.cv)     links.push({ label: 'View CV',     href: site.cv });
      if (site.resume) links.push({ label: 'View Resumé', href: site.resume });
      if (links.length) {
        docsEl.innerHTML = links.map(l =>
          `<a class="about-doc-btn" href="${l.href}" target="_blank" rel="noopener">${l.label}
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <path d="M1 10L10 1M10 1H3M10 1V8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
            </svg>
          </a>`
        ).join('');
        docsEl.style.display = '';
      }
    }
  }

  _setText(id, text)          { const el = document.getElementById(id); if (el) el.textContent = text; }
  _setAttr(id, attr, val)     { const el = document.getElementById(id); if (el) el[attr] = val; }

  _setPhoto(src, alt) {
    const el = document.getElementById('about-photo-el');
    if (!el) return;
    el.outerHTML = `<img id="about-photo-el" class="about-photo" src="${src}" alt="${alt}" />`;
  }

  _setBio(bio) {
    const el = document.getElementById('about-bio');
    if (!el) return;
    el.innerHTML = bio.split('\n\n').map(p => `<p>${p.trim()}</p>`).join('');
  }

  // ── Post Grid ────────────────────────────────────────────────────

  /**
   * Renders the filtered post grid into #posts-grid, with pagination.
   *
   * @param {Array}  allPosts     - this.store.sorted
   * @param {string} activeTab    - current tab filter ('' = all)
   * @param {string} activeTag    - current tag filter ('' = all)
   * @param {number} page         - current page (1-indexed)
   * @param {number} perPage      - posts per page
   * @param {Function} onPageChange - called with new page number when user navigates
   */
  renderGrid(allPosts, activeTab, activeTag, page = 1, perPage = 6, onPageChange = null) {
    const grid = document.getElementById('posts-grid');

    let filtered = allPosts;

    if (activeTab) {
      filtered = filtered.filter(entry =>
        (entry.tab || '').trim().toLowerCase() === activeTab.toLowerCase()
      );
    }

    if (activeTag) {
      filtered = filtered.filter(entry => {
        const tags = Parser.parseTags(this.store.posts[entry.slug]?.meta?.tags || '');
        return tags.map(t => t.toLowerCase()).includes(activeTag.toLowerCase());
      });
    }

    if (filtered.length === 0) {
      grid.innerHTML = `<p class="no-results">No posts found.</p>`;
      this._removePagination();
      return;
    }

    const totalPages = Math.ceil(filtered.length / perPage);
    const safePage   = Math.max(1, Math.min(page, totalPages));
    const start      = (safePage - 1) * perPage;
    const pageItems  = filtered.slice(start, start + perPage);

    grid.innerHTML = pageItems.map(entry => this._cardHTML(entry)).join('');

    if (totalPages > 1 && onPageChange) {
      this._renderPagination(safePage, totalPages, filtered.length, onPageChange);
    } else {
      this._removePagination();
    }
  }

  /**
   * Renders the pagination bar below the grid.
   */
  _renderPagination(page, totalPages, totalCount, onPageChange) {
    let bar = document.getElementById('pagination-bar');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'pagination-bar';
      const section = document.querySelector('.posts-section');
      section.appendChild(bar);
    }

    const pages = this._pageNumbers(page, totalPages);

    const btnHTML = (label, target, disabled = false, active = false) => {
      const cls = ['page-btn',
        active   ? 'active'   : '',
        disabled ? 'disabled' : '',
      ].filter(Boolean).join(' ');
      return `<button class="${cls}" data-page="${target}" ${disabled ? 'disabled' : ''}>${label}</button>`;
    };

    const dotsHTML = `<span class="page-dots">…</span>`;

    let pagesHTML = '';
    for (let i = 0; i < pages.length; i++) {
      const p = pages[i];
      if (p === '...') {
        pagesHTML += dotsHTML;
      } else {
        pagesHTML += btnHTML(p, p, false, p === page);
      }
    }

    bar.innerHTML = `
      <div class="pagination-inner">
        <span class="pagination-count">${totalCount} post${totalCount !== 1 ? 's' : ''}</span>
        <div class="pagination-controls">
          ${btnHTML(`<svg width="12" height="10" viewBox="0 0 12 10" fill="none"><path d="M5 1L1 5M1 5L5 9M1 5H11" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>`, page - 1, page === 1)}
          ${pagesHTML}
          ${btnHTML(`<svg width="12" height="10" viewBox="0 0 12 10" fill="none"><path d="M7 1L11 5M11 5L7 9M11 5H1" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>`, page + 1, page === totalPages)}
        </div>
      </div>
    `;

    bar.querySelectorAll('.page-btn:not(.disabled)').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = parseInt(btn.dataset.page, 10);
        if (!isNaN(target)) onPageChange(target);
      });
    });
  }

  /**
   * Builds a compact page-number sequence with ellipsis.
   */
  _pageNumbers(current, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages = [];
    pages.push(1);
    if (current > 3) pages.push('...');
    for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) {
      pages.push(p);
    }
    if (current < total - 2) pages.push('...');
    pages.push(total);
    return pages;
  }

  _removePagination() {
    document.getElementById('pagination-bar')?.remove();
  }

  /**
   * Builds the HTML string for a single post card.
   *
   * @param {Object} entry - Entry from posts.json
   * @returns {string}
   */
  _cardHTML(entry) {
    const { meta, cover } = this.store.posts[entry.slug];
    const formatted = Parser.formatDate(meta.date);
    const tags      = Parser.parseTags(meta.tags || '');

    const imgHtml = cover
      ? `<img src="${cover}" alt="${meta.title || ''}" loading="lazy" />`
      : `<div class="card-img-placeholder">
           <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
             <rect x="6" y="10" width="36" height="28" rx="2" stroke="#bbb" stroke-width="1.5"/>
             <circle cx="24" cy="24" r="6" stroke="#bbb" stroke-width="1.5"/>
             <path d="M6 16h6l3-4h18l3 4h6" stroke="#bbb" stroke-width="1.5"/>
           </svg>
         </div>`;

    const tagsHtml = tags.slice(0, 3).map(t => `<span class="tag">${t}</span>`).join('');

    return `
      <article class="post-card" onclick="app.showPost('${entry.slug}')">
        <div class="card-img">${imgHtml}</div>
        <div class="card-meta">
          <span class="card-date">${formatted}</span>
          ${meta.location ? `<span class="card-location">${meta.location}</span>` : ''}
        </div>
        <h2 class="card-title">${meta.title || entry.slug}</h2>
        <p class="card-excerpt">${meta.excerpt || ''}</p>
        ${tagsHtml ? `<div class="card-tags">${tagsHtml}</div>` : ''}
      </article>
    `;
  }

  // ── Single Post ──────────────────────────────────────────────────

  /**
   * Populates the post page DOM with content from the given slug.
   *
   * @param {string} slug
   * @param {string} siteAuthor - Used for the document title
   */
  async renderPost(slug, siteAuthor) {
    const post = await this.store.getPost(slug);
    if (!post) return false;

    const { meta, content, cover } = post;
    const formatted = Parser.formatDate(meta.date);

    this._setText('post-date',         formatted);
    this._setText('post-location',     meta.location || '');
    this._setText('post-title',        meta.title || slug);
    this._setText('post-excerpt-lead', meta.excerpt || '');

    const coverEl = document.getElementById('post-cover');
    if (cover) {
      coverEl.innerHTML = `<img src="${cover}" alt="${meta.title || ''}" loading="lazy" />`;
      coverEl.style.display = '';
    } else {
      coverEl.style.display = 'none';
    }

    document.getElementById('post-body').innerHTML = Parser.parseMarkdown(content);

    const tags = Parser.parseTags(meta.tags || '');
    document.getElementById('post-footer-tags').innerHTML =
      tags.map(t => `<span class="tag">${t}</span>`).join('');

    document.title = `${meta.title || slug} — ${siteAuthor}`;

    // Post links — injected at the end of the article body
    const bodyEl    = document.getElementById('post-body');
    const postEntry = this.store.siteData?.posts.find(p => p.slug === slug);
    const postLinks = postEntry?.links || [];

    // Remove any previously injected links block
    bodyEl.querySelector('.post-links-inline')?.remove();

    if (postLinks.length) {
      const linksHtml = postLinks.map(l =>
        `<a class="post-link-item" href="${l.url}" target="_blank" rel="noopener">
          <span class="post-link-label">${l.label}</span>
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <path d="M1 10L10 1M10 1H3M10 1V8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
          </svg>
        </a>`
      ).join('');
      const block = document.createElement('div');
      block.className = 'post-links-inline';
      block.innerHTML = linksHtml;
      bodyEl.appendChild(block);
    }

    const relatedSection = document.getElementById('related-posts');
    const relatedGrid    = document.getElementById('related-posts-grid');
    const entry = this.store.siteData?.posts.find(p => p.slug === slug);
    const relatedSlugs = entry?.related || [];

    if (relatedSlugs.length && relatedSection && relatedGrid) {
      const relatedEntries = relatedSlugs
        .map(s => this.store.siteData.posts.find(p => p.slug === s))
        .filter(Boolean)
        .filter(e => this.store.posts[e.slug]);

      if (relatedEntries.length) {
        relatedGrid.innerHTML = relatedEntries.map(e => this._cardHTML(e)).join('');
        relatedSection.style.display = '';
      } else {
        relatedSection.style.display = 'none';
      }
    } else if (relatedSection) {
      relatedSection.style.display = 'none';
    }

    return true;
  }

}
