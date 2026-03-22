/**
 * Controls
 * Manages the tab bar and tag filter dropdown.
 * Holds the active filter state and calls back into the App
 * whenever either filter changes.
 */
export class Controls {

  /**
   * @param {import('./store.js').PostStore} store
   * @param {{ onFilterChange: Function }} callbacks
   */
  constructor(store, callbacks) {
    this.store = store;
    this.onFilterChange = callbacks.onFilterChange;

    /** @type {string} Active tab label, or '' for All */
    this.activeTab = '';

    /** @type {string} Active tag value, or '' for All */
    this.activeTag = '';
  }

  // ── Build ────────────────────────────────────────────────────────

  /**
   * Builds the tab bar and populates the initial tag dropdown.
   * Should be called once after the store has loaded.
   */
  build() {
    this._buildTabBar();
    this._populateTagFilter();
  }

  /**
   * Creates an "All" button plus one button per unique tab.
   */
  _buildTabBar() {
    const bar = document.getElementById('tab-bar');
    bar.innerHTML = '';

    const makeBtn = (label, tab) => {
      const btn = document.createElement('button');
      btn.className  = 'tab-btn' + (tab === this.activeTab ? ' active' : '');
      btn.dataset.tab = tab;
      btn.textContent = label;
      btn.addEventListener('click', () => this._onTabClick(tab));
      return btn;
    };

    bar.appendChild(makeBtn('All', ''));
    this.store.getTabs().forEach(tab => bar.appendChild(makeBtn(tab, tab)));
  }

  /**
   * Rebuilds the tag dropdown to only show tags present in the current tab.
   * Resets the dropdown value to '' (All tags).
   */
  _populateTagFilter() {
    const select = document.getElementById('tag-filter');
    while (select.options.length > 1) select.remove(1);
    select.value = '';

    this.store.getTagsForTab(this.activeTab).forEach(tag => {
      const opt = document.createElement('option');
      opt.value = tag;
      opt.textContent = tag;
      select.appendChild(opt);
    });
  }

  // ── Event Handlers ───────────────────────────────────────────────

  /**
   * Handles a tab button click: updates active state, resets the tag
   * filter, repopulates the dropdown, and notifies the app.
   *
   * @param {string} tab
   */
  _onTabClick(tab) {
    this.activeTab = tab;
    this.activeTag = '';

    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });

    this._populateTagFilter();
    this.onFilterChange(this.activeTab, this.activeTag);
  }

  /**
   * Called by the tag <select> onchange handler.
   * Updates the active tag and notifies the app.
   *
   * @param {string} tag
   */
  onTagChange(tag) {
    this.activeTag = tag;
    this.onFilterChange(this.activeTab, this.activeTag);
  }

}
