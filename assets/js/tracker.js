/**
 * Tracker Core Logic
 * Cross-references inventory IDs with location data
 * Implements the integration strategy from STRATEGI.md
 */

class TrackerCore {
    constructor() {
        this.dataLoader = new window.DataLoader();
        this.parser = new window.BinaryParser();
        
        this.inventoryIds = [];
        this.enrichedItems = [];
        this.characterName = '';
        this.isDlc = false;
        
        this.stats = {
            total: 0,
            owned: 0,
            missing: 0,
            percentage: 0,
            categories: {}
        };
    }

    /**
     * Initialize - load all data
     */
    async initialize(options = {}) {
        const { includeDLC = true } = options;
        await this.dataLoader.loadAll({ includeDLC });
        console.log('Tracker initialized');
    }

    /**
     * Process save file and cross-reference with location data
     */
    async processSaveFile(fileData, slotIndex, options = {}) {
        const { includeDLC = true } = options;

        // Step 1: Parse inventory from save file
        console.log('Parsing save file...');
        const parseResult = this.parser.parseInventory(fileData, slotIndex);
        
        if (!parseResult.success) {
            throw new Error(parseResult.error);
        }

        this.inventoryIds = parseResult.ids;
        this.characterName = parseResult.characterName;
        this.isDlc = parseResult.isDlc;

        console.log(`Found ${this.inventoryIds.length} items for character: ${this.characterName}`);
        console.log(`Save file format: ${this.isDlc ? 'DLC' : 'Normal'}`);

        // Step 2: Load location data if not loaded
        if (!this.dataLoader.cache.locationData) {
            await this.initialize({ includeDLC });
        }

        // Step 3: Cross-reference inventory with location data
        console.log('Cross-referencing with location data...');
        this.enrichedItems = this.crossReference(includeDLC);

        // Step 4: Calculate statistics
        this.calculateStats();

        console.log(`Processed ${this.enrichedItems.length} total items`);
        console.log(`Owned: ${this.stats.owned}, Missing: ${this.stats.missing}`);
        console.log(`Completion: ${this.stats.percentage}%`);

        return {
            success: true,
            items: this.enrichedItems,
            stats: this.stats,
            characterName: this.characterName
        };
    }

    /**
     * Cross-reference inventory IDs with location data
     */
    crossReference(includeDLC) {
        const locationData = this.dataLoader.getMergedData(includeDLC);
        const enrichedItems = [];
        const ownedIdSet = new Set(this.inventoryIds);

        // Iterate through all regions and items
        for (const [region, subregions] of Object.entries(locationData)) {
            for (const [subregion, items] of Object.entries(subregions)) {
                for (const [itemId, itemData] of Object.entries(items)) {
                    const isOwned = ownedIdSet.has(itemId);
                    
                    enrichedItems.push({
                        id: itemId,
                        name: itemData.name,
                        owned: isOwned,
                        region: region,
                        subregion: subregion,
                        type: itemData.type || 'unknown',
                        hint: itemData.hint || '',
                        farmable: itemData.multiple || false,
                        wikiUrl: this.generateWikiUrl(itemData.name)
                    });
                }
            }
        }

        return enrichedItems;
    }

    /**
     * Generate Wiki URL from item name
     */
    generateWikiUrl(itemName) {
        const cleanName = itemName.replace(/ \+\d+$/, ""); // Remove +1, +2, etc.
        const urlName = cleanName.replace(/ /g, '+');
        return `https://eldenring.wiki.fextralife.com/${urlName}`;
    }

    /**
     * Calculate statistics
     */
    calculateStats() {
        const total = this.enrichedItems.length;
        const owned = this.enrichedItems.filter(item => item.owned).length;
        const missing = total - owned;
        const percentage = total > 0 ? Math.round((owned / total) * 100) : 0;

        this.stats = {
            total,
            owned,
            missing,
            percentage,
            categories: this.calculateCategoryStats(),
            regions: this.calculateRegionalStats()
        };
    }

    /**
     * Calculate category breakdown
     */
    calculateCategoryStats() {
        const categories = {};

        this.enrichedItems.forEach(item => {
            const category = this.determineCategory(item.id);
            
            if (!categories[category]) {
                categories[category] = { total: 0, owned: 0, missing: 0 };
            }

            categories[category].total++;
            if (item.owned) {
                categories[category].owned++;
            } else {
                categories[category].missing++;
            }
        });

        // Calculate percentages
        for (const [category, stats] of Object.entries(categories)) {
            stats.percentage = stats.total > 0 
                ? Math.round((stats.owned / stats.total) * 100) 
                : 0;
        }

        return categories;
    }

    /**
     * Calculate regional statistics
     */
    calculateRegionalStats() {
        const regions = {};

        this.enrichedItems.forEach(item => {
            if (!regions[item.region]) {
                regions[item.region] = { total: 0, owned: 0, missing: 0 };
            }

            regions[item.region].total++;
            if (item.owned) {
                regions[item.region].owned++;
            } else {
                regions[item.region].missing++;
            }
        });

        // Calculate percentages
        for (const [region, stats] of Object.entries(regions)) {
            stats.percentage = stats.total > 0 
                ? Math.round((stats.owned / stats.total) * 100) 
                : 0;
        }

        return regions;
    }

    /**
     * Determine item category from ID
     */
    determineCategory(itemId) {
        const id = parseInt(itemId, 16);

        // ID ranges for different categories
        if (id >= 0x00F42400 && id <= 0x017D7840) return 'Weapons';
        if (id >= 0x10000000 && id <= 0x14000000) return 'Armor';
        if (id >= 0x20000000 && id <= 0x24000000) return 'Talismans';
        if (id >= 0x40000000 && id <= 0x48000000) return 'Magic';
        if (id >= 0x80000000 && id <= 0x88000000) return 'Ashes of War';
        if (id >= 0x90000000 && id <= 0x98000000) return 'Spirit Ashes';
        if (id >= 0x400007F0 && id <= 0x40000850) return 'Bell Bearings';
        if (id >= 0x40002400 && id <= 0x40002500) return 'Cookbooks';
        if (id >= 0x40000BC0 && id <= 0x40000BF0) return 'Crystal Tears';
        if (id >= 0x40000000 && id <= 0x40001000) return 'Key Items';

        return 'Other';
    }

    /**
     * Filter items by criteria
     */
    filterItems(criteria) {
        let filtered = [...this.enrichedItems];

        // Filter by ownership status
        if (criteria.status === 'owned') {
            filtered = filtered.filter(item => item.owned);
        } else if (criteria.status === 'missing') {
            filtered = filtered.filter(item => !item.owned);
        }

        // Filter by region
        if (criteria.region) {
            filtered = filtered.filter(item => item.region === criteria.region);
        }

        // Filter by category
        if (criteria.category) {
            filtered = filtered.filter(item => 
                this.determineCategory(item.id) === criteria.category
            );
        }

        // Search by name
        if (criteria.search) {
            const searchLower = criteria.search.toLowerCase();
            filtered = filtered.filter(item => 
                item.name.toLowerCase().includes(searchLower)
            );
        }

        return filtered;
    }

    /**
     * Group items by region
     */
    groupByRegion(items = null) {
        const itemsToGroup = items || this.enrichedItems;
        const grouped = {};

        itemsToGroup.forEach(item => {
            if (!grouped[item.region]) {
                grouped[item.region] = {};
            }
            if (!grouped[item.region][item.subregion]) {
                grouped[item.region][item.subregion] = [];
            }
            grouped[item.region][item.subregion].push(item);
        });

        return grouped;
    }

    /**
     * Get character slot names from save file
     */
    async getSlotNames(fileData) {
        const result = this.parser.getSlotNames(fileData);
        return result;
    }
}

// Export for use in other modules
window.TrackerCore = TrackerCore;
