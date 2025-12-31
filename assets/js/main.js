/**
 * Main Application Entry Point
 * Coordinates all modules and handles user interactions
 */

class EldenRingTracker {
    constructor() {
        this.tracker = new TrackerCore();
        this.ui = new UI();
        
        this.currentFileData = null;
        this.currentSlot = null;
        this.currentFilter = { status: 'all', search: '', region: null };
        
        this.initializeEventListeners();
    }

    /**
     * Initialize all event listeners
     */
    initializeEventListeners() {
        // File upload
        this.ui.elements.fileInput.addEventListener('change', (e) => {
            this.handleFileUpload(e);
        });

        // Slot selection
        this.ui.elements.slotSelector.addEventListener('change', (e) => {
            this.handleSlotSelection(e);
        });

        // Calculate button
        this.ui.elements.btnCalculate.addEventListener('click', () => {
            this.handleCalculate();
        });

        // Filter radios
        this.ui.elements.filterStatus.forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.handleFilterChange(e);
            });
        });

        // Search input
        this.ui.elements.searchInput.addEventListener('input', (e) => {
            this.handleSearchChange(e);
        });
    }

    /**
     * Handle file upload
     */
    async handleFileUpload(event) {
        const file = event.target.files[0];
        
        if (!file) {
            this.ui.showError('No file selected');
            return;
        }

        try {
            this.ui.setLoading(true, 'Reading save file...');

            // Read file as ArrayBuffer
            const fileData = await this.readFileAsArrayBuffer(file);
            this.currentFileData = fileData;

            // Get character names
            const result = await this.tracker.getSlotNames(fileData);
            
            if (!result.success) {
                throw new Error(result.error);
            }

            // Populate slot selector
            this.ui.populateSlotSelector(result.names);

        } catch (error) {
            this.ui.showError(error.message);
        } finally {
            this.ui.setLoading(false);
        }
    }

    /**
     * Handle slot selection
     */
    handleSlotSelection(event) {
        this.currentSlot = parseInt(event.target.value);
        this.ui.showOptions();
    }

    /**
     * Handle calculate button click
     */
    async handleCalculate() {
        if (!this.currentFileData || this.currentSlot === null) {
            this.ui.showError('Please select a character slot first');
            return;
        }

        try {
            this.ui.setLoading(true, 'Analyzing inventory...');
            this.ui.hideResults();

            // Get options
            const options = {
                includeDLC: this.ui.elements.optionDLC.checked,
                alteredArmor: this.ui.elements.optionAlteredArmor.checked,
                unobtainable: this.ui.elements.optionUnobtainable.checked
            };

            // Process save file
            const result = await this.tracker.processSaveFile(
                this.currentFileData,
                this.currentSlot,
                options
            );

            if (!result.success) {
                throw new Error('Failed to process save file');
            }

            // Update UI with results
            this.displayResults(result);

        } catch (error) {
            this.ui.showError(error.message);
            console.error('Error during calculation:', error);
        } finally {
            this.ui.setLoading(false);
        }
    }

    /**
     * Display results in UI
     */
    displayResults(result) {
        // Update global stats
        this.ui.updateGlobalStats(result.stats, result.characterName);

        // Update category breakdown
        this.ui.updateCategoryStats(result.stats.categories);

        // Group items by region and render
        const groupedItems = this.tracker.groupByRegion();
        this.ui.renderRegions(groupedItems, result.stats.regions);

        // Show results section
        this.ui.showResults();

        console.log('Results displayed successfully');
    }

    /**
     * Handle filter status change (All/Owned/Missing)
     */
    handleFilterChange(event) {
        this.currentFilter.status = event.target.value;
        this.applyFilters();
    }

    /**
     * Handle search input change
     */
    handleSearchChange(event) {
        this.currentFilter.search = event.target.value;
        this.applyFilters();
    }

    /**
     * Apply current filters and re-render
     */
    applyFilters() {
        if (!this.tracker.enrichedItems || this.tracker.enrichedItems.length === 0) {
            return;
        }

        // Filter items
        const filteredItems = this.tracker.filterItems(this.currentFilter);

        // Group and render
        const groupedItems = this.tracker.groupByRegion(filteredItems);
        
        // Calculate filtered stats
        const filteredStats = this.calculateFilteredStats(filteredItems);
        
        this.ui.renderRegions(groupedItems, filteredStats);
    }

    /**
     * Calculate stats for filtered items
     */
    calculateFilteredStats(items) {
        const stats = {};

        items.forEach(item => {
            if (!stats[item.region]) {
                stats[item.region] = { total: 0, owned: 0, missing: 0 };
            }

            stats[item.region].total++;
            if (item.owned) {
                stats[item.region].owned++;
            } else {
                stats[item.region].missing++;
            }
        });

        // Calculate percentages
        for (const [region, regionStats] of Object.entries(stats)) {
            regionStats.percentage = regionStats.total > 0 
                ? Math.round((regionStats.owned / regionStats.total) * 100) 
                : 0;
        }

        return stats;
    }

    /**
     * Read file as ArrayBuffer
     */
    readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                resolve(e.target.result);
            };

            reader.onerror = (e) => {
                reject(new Error('Failed to read file'));
            };

            reader.readAsArrayBuffer(file);
        });
    }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎮 Best Elden Ring Tracker - Initializing...');
    
    const app = new EldenRingTracker();
    
    // Expose app to window for debugging
    window.app = app;
    
    console.log('✅ Application ready!');
    console.log('📁 Please upload your Elden Ring save file to begin');
});
