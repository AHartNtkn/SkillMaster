// Setup file for Vitest tests
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import MarkdownIt from 'markdown-it';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Mock fetch for file loading in tests
global.fetch = async (path) => {
    // Remove leading slash and convert to file path
    const filePath = join(projectRoot, path.startsWith('/') ? path.slice(1) : path);
    
    try {
        const content = readFileSync(filePath, 'utf-8');
        return {
            ok: true,
            json: async () => JSON.parse(content),
            text: async () => content
        };
    } catch (error) {
        return {
            ok: false,
            statusText: error.message
        };
    }
};

// Provide markdown-it constructor for views that expect window.markdownit
global.window = global.window || {};
global.window.markdownit = MarkdownIt;
