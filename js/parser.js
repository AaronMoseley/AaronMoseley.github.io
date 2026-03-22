/**
 * Parser
 * Handles converting raw markdown strings (with optional YAML frontmatter)
 * into structured data and HTML.
 */
export class Parser {

  /**
   * Parses a raw markdown file that may begin with a YAML frontmatter block.
   * Returns the key/value metadata and the remaining markdown body separately.
   *
   * @param {string} raw - Raw file contents
   * @returns {{ meta: Object, content: string }}
   */
  static parseFrontmatter(raw) {
    const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
    if (!match) return { meta: {}, content: raw.trim() };

    const meta = {};
    match[1].split('\n').forEach(line => {
      const colon = line.indexOf(':');
      if (colon === -1) return;
      const key = line.slice(0, colon).trim();
      const val = line.slice(colon + 1).trim();
      meta[key] = val;
    });

    return { meta, content: match[2].trim() };
  }

  /**
   * Converts a markdown string into an HTML string.
   * Supports: fenced code blocks, blockquotes, images, links,
   * headings (h1–h3), bold/italic, inline code, hr, and ul/ol lists.
   *
   * @param {string} md - Markdown source
   * @returns {string} HTML string
   */
  static parseMarkdown(md) {
    let html = md
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Fenced code blocks
    html = html.replace(/```[\w]*\n?([\s\S]*?)```/g, (_, code) =>
      `<pre><code>${code.trim()}</code></pre>`
    );

    // Blockquotes (use placeholder to survive paragraph wrapping)
    html = html.replace(/^&gt; (.+)$/gm, (_, text) =>
      `<BLOCKQUOTE>${text}</BLOCKQUOTE>`
    );

    // Images before links so ![] isn't swallowed
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, src) =>
      `<img src="${src}" alt="${alt}" loading="lazy" />`
    );

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, href) =>
      `<a href="${href}" target="_blank" rel="noopener">${text}</a>`
    );

    // Headings
    html = html.replace(/^### (.+)$/gm, (_, t) => `<h3>${t}</h3>`);
    html = html.replace(/^## (.+)$/gm,  (_, t) => `<h2>${t}</h2>`);
    html = html.replace(/^# (.+)$/gm,   (_, t) => `<h1>${t}</h1>`);

    // Inline styles
    html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.+?)\*\*/g,     '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g,          '<em>$1</em>');
    html = html.replace(/`([^`]+)`/g,          '<code>$1</code>');
    html = html.replace(/^---$/gm,             '<hr>');

    // Unordered lists
    html = html.replace(/((?:^- .+\n?)+)/gm, block => {
      const items = block.trim().split('\n')
        .map(l => `<li>${l.replace(/^- /, '')}</li>`)
        .join('');
      return `<ul>${items}</ul>`;
    });

    // Ordered lists
    html = html.replace(/((?:^\d+\. .+\n?)+)/gm, block => {
      const items = block.trim().split('\n')
        .map(l => `<li>${l.replace(/^\d+\. /, '')}</li>`)
        .join('');
      return `<ol>${items}</ol>`;
    });

    // Wrap remaining text blocks in <p> tags
    html = html.split(/\n{2,}/).map(block => {
      block = block.trim();
      if (!block) return '';
      const isBlock = /^<(h[1-6]|ul|ol|pre|blockquote|hr|img)/i.test(block)
                   || block.startsWith('BLOCKQUOTE');
      return isBlock ? block : `<p>${block.replace(/\n/g, '<br>')}</p>`;
    }).join('\n');

    // Resolve blockquote placeholders
    html = html.replace(/BLOCKQUOTE(.+?)(?=\n|$)/g, (_, content) =>
      `<blockquote><p>${content}</p></blockquote>`
    );
    html = html.replace(/<p>(<blockquote>[\s\S]*?<\/blockquote>)<\/p>/g, '$1');

    return html;
  }

  /**
   * Formats a date string (YYYY-MM-DD) into a human-readable form.
   *
   * @param {string} dateStr
   * @returns {string}
   */
  static formatDate(dateStr) {
    if (!dateStr) return '';
    const [mm, dd, yyyy] = dateStr.split('-');
    const date = new Date(`${yyyy}-${mm}-${dd}T00:00:00`);
    if (isNaN(date)) return dateStr;
    return `${mm}-${dd}-${yyyy}`;
  }

  /**
   * Splits a comma-separated tags string into a trimmed array.
   *
   * @param {string} raw
   * @returns {string[]}
   */
  static parseTags(raw) {
    if (!raw) return [];
    return raw.split(',').map(t => t.trim()).filter(Boolean);
  }

}
