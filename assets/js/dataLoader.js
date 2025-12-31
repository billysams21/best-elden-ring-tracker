/**
 * Data Loader Module
 * Handles loading and caching of JSON data files
 */

class DataLoader {
  constructor() {
    this.cache = {
      locationData: null,  // data.json
      dlcData: null,       // dlcData.json
      collectibles: null   // collectibles.json
    };
    this.loadingPromises = {};
  }

  /**
   * Fetch JSON file with caching
   * Uses XMLHttpRequest to support local file:// protocol
   */
  async fetchJSON(url) {
    if (this.loadingPromises[url]) {
      return this.loadingPromises[url];
    }

    this.loadingPromises[url] = new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      xhr.responseType = 'json';

      xhr.onload = function () {
        if (xhr.status === 200 || xhr.status === 0) { // 0 for local files
          // Handle case where responseType isn't supported
          const data = xhr.response || JSON.parse(xhr.responseText);
          resolve(data);
        } else {
          reject(new Error(`Failed to load ${url}: ${xhr.statusText}`));
        }
      };

      xhr.onerror = function () {
        reject(new Error(`Network error loading ${url}`));
      };

      xhr.send();
    }).catch(error => {
      delete this.loadingPromises[url];
      throw error;
    });

    return this.loadingPromises[url];
  }

  /**
   * Load location data (base game + DLC)
   */
  async loadLocationData(includeDLC = true) {
    if (!this.cache.locationData) {
      console.log('Loading location data...');
      this.cache.locationData = await this.fetchJSON('assets/json/data.json');
    }

    if (includeDLC && !this.cache.dlcData) {
      console.log('Loading DLC data...');
      this.cache.dlcData = await this.fetchJSON('assets/json/dlcData.json');
    }

    return {
      base: this.cache.locationData,
      dlc: includeDLC ? this.cache.dlcData : null
    };
  }

  /**
   * Load collectibles data
   */
  async loadCollectibles() {
    if (!this.cache.collectibles) {
      console.log('Loading collectibles data...');
      this.cache.collectibles = await this.fetchJSON('assets/json/collectibles.json');
    }
    return this.cache.collectibles;
  }

  /**
   * Get merged location data (base + DLC)
   */
  getMergedData(includeDLC = true) {
    if (!this.cache.locationData) {
      throw new Error('Location data not loaded yet');
    }

    if (!includeDLC || !this.cache.dlcData) {
      return this.cache.locationData;
    }

    // Merge base and DLC data
    return { ...this.cache.locationData, ...this.cache.dlcData };
  }

  /**
   * Load all data
   */
  async loadAll(options = {}) {
    const { includeDLC = true, includeCollectibles = true } = options;

    const promises = [this.loadLocationData(includeDLC)];

    if (includeCollectibles) {
      promises.push(this.loadCollectibles());
    }

    await Promise.all(promises);

    console.log('All data loaded successfully');
    return true;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache = {
      locationData: null,
      dlcData: null,
      collectibles: null
    };
    this.loadingPromises = {};
  }
}

// Export for use in other modules
window.DataLoader = DataLoader;
