import jsyaml from '../../node_modules/js-yaml/dist/js-yaml.mjs';

/**
 * Storage Service
 * Handles all file I/O operations for the application
 */
export class StorageService {
    constructor() {
        this.cache = new Map();
    }

    /**
     * Load a JSON file
     * @param {string} path - Path to the JSON file
     * @returns {Promise<any>} Parsed JSON data
     */
    async loadJSON(path) {
        try {
            const response = await fetch(path);
            if (!response.ok) {
                throw new Error(`Failed to load ${path}: ${response.statusText}`);
            }
            const data = await response.json();
            this.cache.set(path, data);
            return data;
        } catch (error) {
            console.error(`Error loading JSON from ${path}:`, error);
            throw error;
        }
    }

    /**
     * Load a YAML file
     * @param {string} path - Path to the YAML file
     * @returns {Promise<any>} Parsed YAML data
     */
    async loadYAML(path) {
        try {
            const response = await fetch(path);
            if (!response.ok) {
                throw new Error(`Failed to load ${path}: ${response.statusText}`);
            }
            const text = await response.text();
            const data = jsyaml.load(text);
            this.cache.set(path, data);
            return data;
        } catch (error) {
            console.error(`Error loading YAML from ${path}:`, error);
            throw error;
        }
    }

    /**
     * Load a Markdown file
     * @param {string} path - Path to the Markdown file
     * @returns {Promise<string>} Markdown content
     */
    async loadMarkdown(path) {
        try {
            const response = await fetch(path);
            if (!response.ok) {
                throw new Error(`Failed to load ${path}: ${response.statusText}`);
            }
            const text = await response.text();
            this.cache.set(path, text);
            return text;
        } catch (error) {
            console.error(`Error loading Markdown from ${path}:`, error);
            throw error;
        }
    }

    /**
     * Save data to localStorage with atomic write simulation
     * @param {string} key - Storage key
     * @param {any} data - Data to save
     */
    saveToLocal(key, data) {
        try {
            // Simulate atomic write by writing to temp key first
            const tempKey = `${key}_temp`;
            const jsonData = JSON.stringify(data, null, 2);
            
            localStorage.setItem(tempKey, jsonData);
            localStorage.setItem(key, jsonData);
            localStorage.removeItem(tempKey);
            
            return true;
        } catch (error) {
            console.error(`Error saving to localStorage:`, error);
            return false;
        }
    }

    /**
     * Load data from localStorage
     * @param {string} key - Storage key
     * @returns {any} Parsed data or null
     */
    loadFromLocal(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error(`Error loading from localStorage:`, error);
            return null;
        }
    }

    /**
     * Initialize save directory structure in localStorage
     */
    initializeSaveData() {
        const defaults = {
            'mastery': {
                format: 'Mastery-v2',
                ass: {},
                topics: {}
            },
            'attempt_window': {
                format: 'Attempts-v1',
                ass: {},
                topics: {}
            },
            'xp': {
                format: 'XP-v1',
                log: []
            },
            'progress': {
                format: 'Progress-v1',
                log: []
            },
            'prefs': {
                format: 'Prefs-v1',
                xp_since_mixed_quiz: 0,
                last_as: null,
                ui_theme: 'default'
            }
        };

        for (const [key, defaultData] of Object.entries(defaults)) {
            if (!this.loadFromLocal(key)) {
                this.saveToLocal(key, defaultData);
            }
        }
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * Export all save data as a single JSON object
     * @returns {Object} All save data
     */
    exportSaveData() {
        return {
            mastery: this.loadFromLocal('mastery'),
            attempt_window: this.loadFromLocal('attempt_window'),
            xp: this.loadFromLocal('xp'),
            progress: this.loadFromLocal('progress'),
            prefs: this.loadFromLocal('prefs'),
            exportDate: new Date().toISOString()
        };
    }

    /**
     * Import save data from JSON object
     * @param {Object} data - Save data to import
     * @returns {boolean} Success status
     */
    importSaveData(data) {
        try {
            if (data.mastery) this.saveToLocal('mastery', data.mastery);
            if (data.attempt_window) this.saveToLocal('attempt_window', data.attempt_window);
            if (data.xp) this.saveToLocal('xp', data.xp);
            if (data.progress) this.saveToLocal('progress', data.progress);
            if (data.prefs) this.saveToLocal('prefs', data.prefs);
            return true;
        } catch (error) {
            console.error('Error importing save data:', error);
            return false;
        }
    }

    /**
     * Reset all save data
     */
    resetSaveData() {
        localStorage.removeItem('mastery');
        localStorage.removeItem('attempt_window');
        localStorage.removeItem('xp');
        localStorage.removeItem('progress');
        localStorage.removeItem('prefs');
        this.initializeSaveData();
    }
}