import { Parser } from './parser.js';

export class Renderer {
  constructor(store) {
    this.store = store;
    this._lightboxAlbum = null;
    this._lightboxIndex = 0;
  }

  // ── Site Meta ────────────────────────────────────────────────────

  renderSiteMeta(site) {
    const name = site.author || site.title;
    document.title = name;
    this._setText('about-name',       name);
    this._setText('back-btn-name',    name);
    this._setText('footer-name',      site.author || '');
    this._setText('footer-name-post', site.author || '');

    if (site.role) this._setText('about-label', site.role);

    if (site.social?.email) {
      const href = `mailto:${site.social.email}`;
      this._setAttr('footer-email',      'href', href);
      this._setAttr('footer-email-post', 'href', href);
    }
    if (site.social?.linkedin) {
      this._setAttr('footer-linkedin',      'href', site.social.linkedin);
      this._setAttr('footer-linkedin-post', 'href', site.social.linkedin);
    }
    if (site.social?.github) {
      this._setAttr('footer-github',      'href', site.social.github);
      this._setAttr('footer-github-post', 'href', site.social.github);
    }

    // Social links row in hero
    const socialEl = document.getElementById('about-social');
    if (socialEl) {
      const links = [];
      if (site.social?.email)    links.push({ label: 'Email',    href: `mailto:${site.social.email}` });
      if (site.social?.linkedin) links.push({ label: 'LinkedIn', href: site.social.linkedin, external: true });
      if (site.social?.github)   links.push({ label: 'GitHub',   href: site.social.github,   external: true });

      socialEl.innerHTML = links.map((l, i) => {
        const ext = l.external ? ' target="_blank" rel="noopener"' : '';
        const sep = i < links.length - 1 ? '<span class="about-social-sep">·</span>' : '';
        return `<a class="about-social-link" href="${l.href}"${ext}>${l.label}</a>${sep}`;
      }).join('');
    }

    // CV / Resume buttons
    const docsEl = document.getElementById('about-docs');
    if (docsEl) {
      const links = [];
      if (site.cv)     links.push({ label: 'View CV',     href: site.cv });
      if (site.resume) links.push({ label: 'View Résumé', href: site.resume });
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

  _setText(id, text)      { const el = document.getElementById(id); if (el) el.textContent = text; }
  _setAttr(id, attr, val) { const el = document.getElementById(id); if (el) el[attr] = val; }

  // ── Post Grid ────────────────────────────────────────────────────

  renderGrid(allPosts, activeTab, activeTag, page = 1, perPage = 9, onPageChange = null) {
    const grid = document.getElementById('posts-grid');
    let filtered = allPosts;

    if (activeTab) {
      filtered = filtered.filter(e => (e.tab || '').trim().toLowerCase() === activeTab.toLowerCase());
    }
    if (activeTag) {
      filtered = filtered.filter(e => {
        const tags = Parser.parseTags(this.store.posts[e.slug]?.meta?.tags || '');
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

    grid.innerHTML = pageItems.map(e => this._cardHTML(e)).join('');

    if (totalPages > 1 && onPageChange) this._renderPagination(safePage, totalPages, onPageChange);
    else this._removePagination();
  }

  _renderPagination(page, totalPages, onPageChange) {
    let bar = document.getElementById('pagination-bar');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'pagination-bar';
      document.querySelector('.posts-section').appendChild(bar);
    }
    const pages = this._pageNumbers(page, totalPages);
    const btn = (label, target, disabled = false, active = false) => {
      const cls = ['page-btn', active ? 'active' : '', disabled ? 'disabled' : ''].filter(Boolean).join(' ');
      return `<button class="${cls}" data-page="${target}" ${disabled ? 'disabled' : ''}>${label}</button>`;
    };
    let pagesHTML = '';
    pages.forEach(p => {
      pagesHTML += p === '...' ? `<span class="page-dots">…</span>` : btn(p, p, false, p === page);
    });
    bar.innerHTML = `
      <div class="pagination-inner">
        <div class="pagination-controls">
          ${btn(`<svg width="12" height="10" viewBox="0 0 12 10" fill="none"><path d="M5 1L1 5M1 5L5 9M1 5H11" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>`, page - 1, page === 1)}
          ${pagesHTML}
          ${btn(`<svg width="12" height="10" viewBox="0 0 12 10" fill="none"><path d="M7 1L11 5M11 5L7 9M11 5H1" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>`, page + 1, page === totalPages)}
        </div>
      </div>`;
    bar.querySelectorAll('.page-btn:not(.disabled)').forEach(b => {
      b.addEventListener('click', () => { const t = parseInt(b.dataset.page, 10); if (!isNaN(t)) onPageChange(t); });
    });
  }

  _pageNumbers(current, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages = [1];
    if (current > 3) pages.push('...');
    for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) pages.push(p);
    if (current < total - 2) pages.push('...');
    pages.push(total);
    return pages;
  }

  _removePagination() { document.getElementById('pagination-bar')?.remove(); }

  _cardHTML(entry) {
    const { meta, cover } = this.store.posts[entry.slug];
    const formatted = Parser.formatDate(meta.date);
    const tags = Parser.parseTags(meta.tags || '');
    const imgHtml = cover
      ? `<img src="${cover}" alt="${meta.title || ''}" loading="lazy" />`
      : `<div class="card-img-placeholder"><svg width="40" height="40" viewBox="0 0 48 48" fill="none"><rect x="6" y="10" width="36" height="28" rx="2" stroke="#ccc" stroke-width="1.5"/><circle cx="24" cy="24" r="6" stroke="#ccc" stroke-width="1.5"/></svg></div>`;
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
      </article>`;
  }

  // ── Photo Albums ─────────────────────────────────────────────────

  /**
   * Renders the photo album section into #photo-section-mount.
   * @param {Array} albums - The "photos" array from posts.json
   */
  renderPhotoSection(albums) {
    const mount = document.getElementById('photo-section-mount');
    if (!mount || !albums || albums.length === 0) return;

    // Add a "Photography" anchor link to the hero social row (once)
    const socialEl = document.getElementById('about-social');
    if (socialEl && !document.getElementById('photo-nav-link')) {
      const sep = document.createElement('span');
      sep.className = 'about-social-sep';
      sep.textContent = '·';
      const anchor = document.createElement('a');
      anchor.href = '#photography';
      anchor.id = 'photo-nav-link';
      anchor.className = 'about-social-link';
      anchor.textContent = 'Photography';
      socialEl.appendChild(sep);
      socialEl.appendChild(anchor);
    }

    // Build lightbox DOM once (needs full albums list for navigation)
    if (!document.getElementById('lightbox')) {
      this._buildLightbox(albums);
    }

    this._renderPhotoPage(albums, 1);
  }

  /**
   * Renders a single album per page in the featured-strip style.
   * Albums are shown in JSON order (index 0 = first/most prominent).
   * Prev/Next buttons navigate between albums.
   * @param {Array} albums
   * @param {number} page  - 1-based album index
   */
  _renderPhotoPage(albums, page) {
    const mount = document.getElementById('photo-section-mount');

    const totalAlbums = albums.length;
    const totalPhotos = albums.reduce((sum, a) => sum + (a.images?.length || 0), 0);
    const safePage    = Math.max(1, Math.min(page, totalAlbums));
    const album       = albums[safePage - 1];
    const featuredImg = album?.images?.[0];

    // Featured strip for the current album
    const featuredHTML = featuredImg ? `
      <div class="photo-featured-strip">
        <div class="photo-featured-inner" id="photography" data-album-index="${safePage - 1}">
          <img class="photo-featured-img" src="${featuredImg.file}" alt="${featuredImg.title || ''}" loading="lazy" />
          <div class="photo-featured-overlay">
            ${safePage === 1 ? '<div class="photo-featured-label">Latest Album</div>' : ''}
            <div class="photo-featured-title">${album.album}</div>
            ${album.description ? `<div class="photo-featured-desc">${album.description}</div>` : ''}
            <div class="photo-featured-meta">
              ${album.date     ? `<span class="photo-featured-badge">${album.date}</span>`     : ''}
              ${album.location ? `<span class="photo-featured-badge">${album.location}</span>` : ''}
              <span class="photo-featured-badge">${album.images?.length || 0} photos</span>
              <span class="photo-featured-cta">
                View album
                <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                  <path d="M7 1L11 5M11 5L7 9M11 5H1" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
                </svg>
              </span>
            </div>
          </div>
          ${(album.images?.length || 0) > 1 ? `
          <div class="photo-featured-thumbs">
            ${album.images.slice(1, 4).map(img => `
              <div class="photo-featured-thumb">
                <img src="${img.file}" alt="${img.title || ''}" loading="lazy" />
              </div>`).join('')}
          </div>` : ''}
        </div>
      </div>` : `<div id="photography"></div>`;

    // Film roll navigator — one frame per album
    const _miniGrid = (a) => {
      const thumbs = (a?.images || []).map(img => img.file).filter(Boolean).slice(0, 4);
      const count  = thumbs.length;
      const cls    = count === 1 ? 'single' : count === 2 ? 'two' : '';
      const cells  = Array.from({ length: count === 1 ? 1 : count === 2 ? 2 : 4 }, (_, i) => {
        const src = thumbs[i];
        return src
          ? `<div class="photo-roll-mini-cell"><img src="${src}" alt="" loading="lazy" /></div>`
          : `<div class="photo-roll-mini-cell empty"></div>`;
      }).join('');
      return `<div class="photo-roll-mini-grid${cls ? ' ' + cls : ''}">${cells}</div>`;
    };

    const paginationHTML = totalAlbums > 1 ? `
      <div class="photo-album-nav">
        <button class="photo-album-nav-btn photo-album-nav-prev${safePage === 1 ? ' disabled' : ''}"
                data-page="${safePage - 1}" ${safePage === 1 ? 'disabled' : ''} aria-label="Previous album">
          <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
            <path d="M5 1L1 5M1 5L5 9M1 5H11" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
          </svg>
          Previous
        </button>
        <div class="photo-roll-nav">
          <div class="photo-roll-inner">
            ${albums.map((a, i) => `
              <div class="photo-roll-frame${i + 1 === safePage ? ' active' : ''}" data-page="${i + 1}">
                ${_miniGrid(a)}
                <div class="photo-roll-frame-label">${i + 1}</div>
              </div>`).join('')}
          </div>
        </div>
        <button class="photo-album-nav-btn photo-album-nav-next${safePage === totalAlbums ? ' disabled' : ''}"
                data-page="${safePage + 1}" ${safePage === totalAlbums ? 'disabled' : ''} aria-label="Next album">
          Next
          <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
            <path d="M7 1L11 5M11 5L7 9M11 5H1" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>` : '';

    // Preserve the static section shell on page changes — only replace inner content
    const existingSection = mount.querySelector('.photo-section');
    if (!existingSection) {
      mount.innerHTML = `
        <section class="photo-section">
          <div class="photo-section-header">
            <div class="photo-section-header-text">
              <h2 class="photo-section-title">Photography</h2>
            </div>
            <div class="photo-section-count">${totalAlbums} album${totalAlbums !== 1 ? 's' : ''} · ${totalPhotos} photo${totalPhotos !== 1 ? 's' : ''}</div>
          </div>
          <div id="photo-content"></div>
        </section>`;
    }

    document.getElementById('photo-content').innerHTML = `
      ${featuredHTML}
      ${paginationHTML}`;

    // Wire featured strip click → open lightbox for this album
    const featuredInner = mount.querySelector('.photo-featured-inner');
    if (featuredInner) {
      featuredInner.addEventListener('click', () => this.openLightbox(album, 0));
    }

    // Wire prev/next buttons
    mount.querySelectorAll('.photo-album-nav-btn:not(.disabled)').forEach(btn => {
      btn.addEventListener('click', () => {
        const t = parseInt(btn.dataset.page, 10);
        if (!isNaN(t)) {
          document.getElementById('photography')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          this._renderPhotoPage(albums, t);
        }
      });
    });

    // Wire film roll frame clicks
    mount.querySelectorAll('.photo-roll-frame').forEach(frame => {
      frame.addEventListener('click', () => {
        const t = parseInt(frame.dataset.page, 10);
        if (!isNaN(t) && t !== safePage) {
          document.getElementById('photography')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          this._renderPhotoPage(albums, t);
        }
      });
    });
  }

  // ── Lightbox ─────────────────────────────────────────────────────

  _buildLightbox(albums) {
    const mount = document.getElementById('lightbox-mount');
    if (!mount) return;

    mount.innerHTML = `
      <div class="lightbox" id="lightbox" role="dialog" aria-modal="true">
        <div class="lightbox-image-pane">
          <img class="lightbox-img" id="lightbox-img" src="" alt="" />
          <button class="lightbox-arrow lightbox-arrow-prev" id="lb-prev" aria-label="Previous">
            <svg width="16" height="14" viewBox="0 0 16 14" fill="none"><path d="M7 1L1 7M1 7L7 13M1 7H15" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
          </button>
          <button class="lightbox-arrow lightbox-arrow-next" id="lb-next" aria-label="Next">
            <svg width="16" height="14" viewBox="0 0 16 14" fill="none"><path d="M9 1L15 7M15 7L9 13M15 7H1" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
          </button>
          <div class="lightbox-counter" id="lb-counter"></div>
        </div>
        <div class="lightbox-info">
          <div class="lightbox-info-header">
            <div>
              <div class="lightbox-album-name" id="lb-album-name"></div>
            </div>
            <button class="lightbox-close" id="lb-close" aria-label="Close">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 2L16 16M16 2L2 16" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
            </button>
          </div>
          <div class="lightbox-info-body">
            <div class="lightbox-photo-title" id="lb-title"></div>
            <div class="lightbox-photo-caption" id="lb-caption"></div>
            <div class="lightbox-photo-meta" id="lb-meta"></div>
          </div>
          <div class="lightbox-filmstrip" id="lb-filmstrip"></div>
        </div>
      </div>`;

    // Wire controls
    document.getElementById('lb-close').addEventListener('click', () => this.closeLightbox());
    document.getElementById('lb-prev').addEventListener('click', () => this._lbNavigate(-1));
    document.getElementById('lb-next').addEventListener('click', () => this._lbNavigate(1));

    document.getElementById('lightbox').addEventListener('click', e => {
      if (e.target === e.currentTarget) this.closeLightbox();
    });

    document.addEventListener('keydown', e => {
      const lb = document.getElementById('lightbox');
      if (!lb?.classList.contains('open')) return;
      if (e.key === 'Escape')      this.closeLightbox();
      if (e.key === 'ArrowLeft')   this._lbNavigate(-1);
      if (e.key === 'ArrowRight')  this._lbNavigate(1);
    });
  }

  openLightbox(album, index) {
    this._lightboxAlbum = album;
    this._lightboxIndex = index;
    this._lbRender();
    document.getElementById('lightbox')?.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  closeLightbox() {
    document.getElementById('lightbox')?.classList.remove('open');
    document.body.style.overflow = '';
  }

  _lbNavigate(dir) {
    if (!this._lightboxAlbum) return;
    const len = this._lightboxAlbum.images.length;
    this._lightboxIndex = (this._lightboxIndex + dir + len) % len;
    this._lbRender(true);
  }

  _lbRender(animate = false) {
    const album = this._lightboxAlbum;
    const idx   = this._lightboxIndex;
    if (!album) return;
    const photo = album.images[idx];

    const img = document.getElementById('lightbox-img');
    if (animate) {
      img.classList.add('transitioning');
      setTimeout(() => {
        img.src = photo.file;
        img.alt = photo.title || '';
        img.classList.remove('transitioning');
      }, 180);
    } else {
      img.src = photo.file;
      img.alt = photo.title || '';
    }

    document.getElementById('lb-album-name').textContent = album.album;
    document.getElementById('lb-title').textContent      = photo.title || '';
    document.getElementById('lb-caption').textContent    = photo.caption || '';
    document.getElementById('lb-counter').textContent    = `${idx + 1} / ${album.images.length}`;

    // Meta rows
    const metaEl = document.getElementById('lb-meta');
    const rows = [];
    if (album.date)     rows.push({ label: 'Date',     value: album.date });
    if (album.location) rows.push({ label: 'Location', value: album.location });
    if (photo.camera)   rows.push({ label: 'Camera',   value: photo.camera });
    if (photo.lens)     rows.push({ label: 'Lens',     value: photo.lens });
    if (photo.settings) rows.push({ label: 'Settings', value: photo.settings });
    metaEl.innerHTML = rows.map(r => `
      <div class="lightbox-meta-row">
        <span class="lightbox-meta-label">${r.label}</span>
        <span class="lightbox-meta-value">${r.value}</span>
      </div>`).join('');

    // Filmstrip
    const filmstrip = document.getElementById('lb-filmstrip');
    filmstrip.innerHTML = album.images.map((ph, i) => `
      <div class="filmstrip-thumb${i === idx ? ' active' : ''}" data-index="${i}">
        <img src="${ph.file}" alt="${ph.title || ''}" loading="lazy" />
      </div>`).join('');

    filmstrip.querySelectorAll('.filmstrip-thumb').forEach(thumb => {
      thumb.addEventListener('click', () => {
        this._lightboxIndex = parseInt(thumb.dataset.index, 10);
        this._lbRender(true);
      });
    });

    // Scroll active thumb into view
    const activeThumb = filmstrip.querySelector('.active');
    if (activeThumb) activeThumb.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }

  // ── Single Post ──────────────────────────────────────────────────

  async renderPost(slug, siteAuthor) {
    const post = await this.store.getPost(slug);
    if (!post) return false;

    const { meta, content, cover } = post;
    this._setText('post-date',         Parser.formatDate(meta.date));
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

    const bodyEl    = document.getElementById('post-body');
    const postEntry = this.store.siteData?.posts.find(p => p.slug === slug);
    const postLinks = postEntry?.links || [];
    bodyEl.querySelector('.post-links-inline')?.remove();

    if (postLinks.length) {
      const block = document.createElement('div');
      block.className = 'post-links-inline';
      block.innerHTML = postLinks.map(l =>
        `<a class="post-link-item" href="${l.url}" target="_blank" rel="noopener">
          <span class="post-link-label">${l.label}</span>
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <path d="M1 10L10 1M10 1H3M10 1V8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
          </svg>
        </a>`
      ).join('');
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
