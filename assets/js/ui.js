/**
 * UI Module
 * Handles all UI rendering and updates
 */

class UI {
  constructor() {
    this.elements = {
      // Upload section
      fileInput: document.getElementById('savefile'),
      slotOptionsContainer: document.getElementById('slot-options-container'),
      slotSelector: document.getElementById('slot-selector'),
      btnCalculate: document.getElementById('btn-calculate'),

      // Options
      optionDLC: document.getElementById('option-dlc-items'),

      // Loading
      loadingIndicator: document.getElementById('loading-indicator'),

      // Results
      resultsSection: document.getElementById('results-section'),
      characterName: document.getElementById('character-name'),
      totalProgress: document.getElementById('total-progress'),
      itemsOwned: document.getElementById('items-owned'),
      itemsTotal: document.getElementById('items-total'),
      regionsContainer: document.getElementById('regions-container'),

      // Filters
      filterStatus: document.querySelectorAll('input[name="filter-status"]'),
      filterCategory: document.getElementById('filter-category'),
      filterAcquisition: document.getElementById('filter-acquisition'),
      searchInput: document.getElementById('search-items')
    };
  }

  /**
   * Show/hide loading indicator
   */
  setLoading(isLoading, message = 'Analyzing save file...') {
    if (isLoading) {
      this.elements.loadingIndicator.classList.remove('hidden');
      this.elements.loadingIndicator.querySelector('p').textContent = message;
    } else {
      this.elements.loadingIndicator.classList.add('hidden');
    }
  }

  /**
   * Show error message
   */
  showError(message) {
    alert(`Error: ${message}`);
    console.error(message);
  }

  /**
   * Populate slot selector dropdown
   */
  populateSlotSelector(slotNames) {
    this.elements.slotSelector.innerHTML = '<option value="" disabled selected>Choose a character slot...</option>';

    slotNames.forEach((name, index) => {
      const option = document.createElement('option');
      option.value = index;

      if (name === '') {
        option.textContent = `Slot ${index + 1} (Empty)`;
        option.disabled = true;
      } else {
        option.textContent = `${name} (Slot ${index + 1})`;
      }

      this.elements.slotSelector.appendChild(option);
    });

    this.elements.slotOptionsContainer.classList.remove('hidden');
  }

  /**
   * Update global statistics dashboard
   */
  updateGlobalStats(stats, characterName) {
    this.elements.characterName.textContent = characterName;
    this.elements.totalProgress.textContent = `${stats.percentage}%`;
    this.elements.itemsOwned.textContent = stats.owned;
    this.elements.itemsTotal.textContent = stats.total;
  }

  /**
   * Render regional accordion
   */
  renderRegions(groupedItems, regionalStats) {
    this.elements.regionsContainer.innerHTML = '';

    for (const [region, subregions] of Object.entries(groupedItems)) {
      const regionStats = regionalStats[region] || { owned: 0, total: 0, percentage: 0 };
      const regionElement = this.createRegionAccordion(region, subregions, regionStats);
      this.elements.regionsContainer.appendChild(regionElement);
    }

    // Show results section
    this.elements.resultsSection.classList.remove('hidden');
  }

  /**
   * Create region accordion element
   */
  createRegionAccordion(region, subregions, stats) {
    const regionDiv = document.createElement('div');
    regionDiv.className = 'region';

    // Region Header
    const header = document.createElement('div');
    header.className = 'region-header';
    header.innerHTML = `
            <div class="region-title">
                <span class="arrow"></span>
                ${region}
            </div>
            <div class="region-stats">
                <span class="counter">(${stats.owned}/${stats.total})</span>
                <span class="region-percentage">${stats.percentage}%</span>
            </div>
        `;

    // Region Content
    const content = document.createElement('div');
    content.className = 'region-content';

    // Render subregions
    for (const [subregion, items] of Object.entries(subregions)) {
      const subregionDiv = document.createElement('div');
      subregionDiv.className = 'subregion';

      // Subregion header
      const subHeader = document.createElement('div');
      subHeader.className = 'subregion-header';
      subHeader.innerHTML = `
                <div class="subregion-title">${subregion}</div>
                <div class="counter">(${items.filter(i => i.owned).length}/${items.length})</div>
            `;

      // Subregion content
      const subContent = document.createElement('div');
      subContent.className = 'subregion-content';

      const itemsGrid = document.createElement('div');
      itemsGrid.className = 'items-grid';

      items.forEach(item => {
        itemsGrid.appendChild(this.createItemCard(item));
      });

      subContent.appendChild(itemsGrid);

      // Toggle subregion
      subHeader.addEventListener('click', () => {
        subContent.classList.toggle('active');
      });

      subregionDiv.appendChild(subHeader);
      subregionDiv.appendChild(subContent);
      content.appendChild(subregionDiv);
    }

    // Toggle region
    header.addEventListener('click', () => {
      header.classList.toggle('active');
      content.classList.toggle('active');
    });

    regionDiv.appendChild(header);
    regionDiv.appendChild(content);

    return regionDiv;
  }

  /**
   * Create item card
   */
  createItemCard(item) {
    const card = document.createElement('div');
    card.className = `item-card ${item.owned ? 'owned' : 'missing'}`;

    // Icons
    const typeIcon = this.getTypeIcon(item.type);
    const farmableIcon = item.farmable ? '<span class="farmable-icon" title="Farmable">♾️</span>' : '';

    // Normalize item name for image matching
    const normalizedName = this.normalizeItemName(item.name);

    // Item image path (from items folder)
    const itemImagePath = `assets/img/items/${normalizedName}.webp`;

    // Type icon image path (from hints folder)
    const typeIconPath = `assets/img/hints/${item.type}.png`;

    // Clean hint HTML (strip outer <ul> tags if present)
    let hintHTML = item.hint;
    if (hintHTML.startsWith('<ul>')) {
      hintHTML = hintHTML.substring(4, hintHTML.length - 5); // Remove <ul> and </ul>
    }

    // Remove inline styles and problematic tags
    hintHTML = hintHTML.replace(/style="[^"]*"/gi, ''); // Remove all inline styles
    hintHTML = hintHTML.replace(/<mark>/gi, ''); // Remove <mark> opening tags
    hintHTML = hintHTML.replace(/<\/mark>/gi, ''); // Remove <mark> closing tags

    card.innerHTML = `
            <div class="item-header">
                <span class="item-name">${item.name}</span>
            </div>
            <div class="item-image">
                <img src="${itemImagePath}" alt="${item.name}" onerror="this.onerror=null; ${this.getImageFallback(item.name)}">
            </div>
            <div class="item-type-icons">
                <img src="${typeIconPath}" alt="${item.type}" class="type-icon" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2224%22 height=%2224%22><text y=%2218%22 font-size=%2220%22>${typeIcon}</text></svg>'">
                ${farmableIcon}
            </div>
            <div class="item-hint">
                ${hintHTML}
                <a href="${item.wikiUrl}" target="_blank" class="wiki-link">📖 Wiki →</a>
            </div>
        `;

    return card;
  }

  /**
   * Get image fallback logic
   */
  getImageFallback(itemName) {
    // Bell Bearing fallback
    if (itemName.includes('Bell Bearing')) {
      return "this.src='assets/img/items/Bell Bearing.webp';";
    }

    // Default: hide image
    return "this.style.display='none';";
  }

  /**
   * Normalize item name for image matching
   */
  normalizeItemName(name) {
    let normalized = name;

    // Remove bracketed numbers like [1], [2], etc.
    normalized = normalized.replace(/\s*\[\d+\]/, '');

    // Match "Note...." to "Note"
    if (normalized.startsWith('Note')) {
      normalized = 'Note';
    }

    // Remove colons
    normalized = normalized.replace(/:/g, '');

    return normalized;
  }

  /**
   * Get icon for item type
   */
  getTypeIcon(type) {
    const icons = {
      'boss': '👑',
      'foe': '⚔️',
      'chest': '📦',
      'quest': '📜',
      'merchant': '🛒',
      'invader': '🗡️',
      'scarab': '🐞',
      'unknown': '❓'
    };
    return icons[type] || icons['unknown'];
  }

  /**
   * Show results section
   */
  showResults() {
    this.elements.resultsSection.classList.remove('hidden');
    this.elements.resultsSection.scrollIntoView({ behavior: 'smooth' });
  }

  /**
   * Hide results section
   */
  hideResults() {
    this.elements.resultsSection.classList.add('hidden');
  }
}

// Export for use in other modules
window.UI = UI;
