import { CourseManager } from './services/CourseManager.js';
import { TaskSelector } from './services/TaskSelector.js';
import { HomeView } from './views/HomeView.js';
import { LearningView } from './views/LearningView.js';
import { ProgressView } from './views/ProgressView.js';
import { LibraryView } from './views/LibraryView.js';
import { SettingsView } from './views/SettingsView.js';
import { MixedQuizView } from './views/MixedQuizView.js';

/**
 * Main Application Class
 * Coordinates all views and services
 */
class SkillMasterApp {
    constructor() {
        this.courseManager = new CourseManager();
        this.taskSelector = null;
        this.views = {};
        this.currentView = null;
        this.currentViewName = 'home';
    }

    async initialize() {
        try {
            // Show loading
            this.showLoading();
            
            // Initialize course manager
            await this.courseManager.initialize();
            
            // Create task selector
            this.taskSelector = new TaskSelector(this.courseManager);
            
            // Create views
            this.views = {
                home: new HomeView(this.courseManager, this.taskSelector),
                learning: new LearningView(this.courseManager),
                progress: new ProgressView(this.courseManager),
                library: new LibraryView(this.courseManager),
                settings: new SettingsView(this.courseManager),
                mixedQuiz: new MixedQuizView(this.courseManager, this.taskSelector)
            };
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Apply saved theme
            const theme = this.courseManager.prefs.ui_theme || 'default';
            if (theme === 'dark') {
                document.documentElement.setAttribute('data-theme', 'dark');
            }
            
            // Show home screen
            this.showHome();
            
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showError('Failed to initialize application. Please refresh the page.');
        }
    }

    setupEventListeners() {
        // Tab bar navigation
        document.querySelectorAll('.tab-item').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.currentTarget.getAttribute('data-tab');
                this.navigateToTab(tabName);
            });
        });
        
        // Make views accessible globally for onclick handlers
        window.app = this;
    }

    navigateToTab(tabName) {
        // Update active tab
        document.querySelectorAll('.tab-item').forEach(tab => {
            if (tab.getAttribute('data-tab') === tabName) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
        
        // Show corresponding view
        switch (tabName) {
            case 'home':
                this.showHome();
                break;
            case 'progress':
                this.showProgress();
                break;
            case 'library':
                this.showLibrary();
                break;
            case 'settings':
                this.showSettings();
                break;
        }
    }

    showView(viewName) {
        // Clean up previous view
        if (this.currentView && this.currentView.destroy) {
            this.currentView.destroy();
        }
        
        this.currentViewName = viewName;
        this.currentView = this.views[viewName];
        
        if (!this.currentView) {
            console.error(`View ${viewName} not found`);
            return;
        }
        
        // Render view
        const content = this.currentView.render();
        document.getElementById('main-content').innerHTML = content;
        
        // Attach event listeners if view has them
        if (this.currentView.attachEventListeners) {
            this.currentView.attachEventListeners();
        }
        
        // Show/hide tab bar for learning views
        const tabBar = document.getElementById('tab-bar');
        if (viewName === 'learning' || viewName === 'mixedQuiz') {
            tabBar.style.display = 'none';
        } else {
            tabBar.style.display = '';
        }
    }

    showHome() {
        this.showView('home');
    }

    showProgress() {
        this.showView('progress');
    }

    showLibrary() {
        this.showView('library');
    }

    showSettings() {
        this.showView('settings');
    }

    showLoading() {
        document.getElementById('main-content').innerHTML = `
            <div class="screen" style="display: flex; align-items: center; justify-content: center; min-height: 80vh;">
                <div class="spinner"></div>
            </div>
        `;
    }

    showError(message) {
        document.getElementById('main-content').innerHTML = `
            <div class="screen">
                <div class="task-card">
                    <h3>Error</h3>
                    <p class="text-error">${message}</p>
                </div>
            </div>
        `;
    }

    // Learning flow methods
    async startSkill(skillId) {
        this.showView('learning');
        await this.views.learning.startSkill(skillId);
    }

    async startMixedQuiz() {
        this.showView('mixedQuiz');
        await this.views.mixedQuiz.startMixedQuiz();
    }

    confirmExit() {
        if (confirm('Are you sure you want to exit this learning session? Your progress will be saved.')) {
            this.showHome();
        }
    }

    confirmExitQuiz() {
        if (confirm('Are you sure you want to exit the quiz? Your progress will be lost.')) {
            this.showHome();
        }
    }

    // Library methods
    exploreCourse(courseId) {
        const content = this.views.library.renderCourseDetails(courseId);
        document.getElementById('main-content').innerHTML = content;
    }

    // Settings methods
    toggleDarkMode() {
        this.views.settings.toggleDarkMode();
    }

    exportProgress() {
        this.views.settings.exportProgress();
    }

    importProgress() {
        this.views.settings.importProgress();
    }

    confirmReset() {
        this.views.settings.confirmReset();
    }

    // Expose view properties for direct access
    get learningView() {
        return this.views.learning;
    }

    get mixedQuizView() {
        return this.views.mixedQuiz;
    }
}

// Export for testing
export { SkillMasterApp };

// Initialize app when DOM is ready
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        const app = new SkillMasterApp();
        app.initialize();
    });
}

// Handle errors
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});