/**
 * SettingsView
 * Handles app settings and data management
 */
export class SettingsView {
    constructor(courseManager) {
        this.courseManager = courseManager;
    }

    render() {
        const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
        
        return `
            <div class="screen">
                <h2>Settings</h2>
                
                <div class="settings-section">
                    <h3 class="settings-title">Appearance</h3>
                    <div class="setting-item">
                        <span class="setting-label">Dark Mode</span>
                        <div class="toggle ${isDarkMode ? 'active' : ''}" onclick="app.toggleDarkMode()">
                            <div class="toggle-handle"></div>
                        </div>
                    </div>
                </div>
                
                <div class="settings-section">
                    <h3 class="settings-title">Data Management</h3>
                    
                    <button class="btn btn-secondary btn-full" onclick="app.exportProgress()">
                        Export Progress
                    </button>
                    
                    <button class="btn btn-secondary btn-full" onclick="app.importProgress()">
                        Import Progress
                    </button>
                    
                    <button class="btn btn-secondary btn-full" onclick="app.confirmReset()">
                        Reset Course Progress
                    </button>
                </div>
                
                <div class="settings-section">
                    <h3 class="settings-title">About</h3>
                    <div class="setting-item">
                        <span class="setting-label">SkillMaster</span>
                        <span class="text-secondary">v1.0.0</span>
                    </div>
                </div>
            </div>
        `;
    }

    toggleDarkMode() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        
        // Update preference
        this.courseManager.prefs.ui_theme = newTheme;
        this.courseManager.saveState();
        
        // Re-render to update toggle state
        document.getElementById('main-content').innerHTML = this.render();
    }

    async exportProgress() {
        const data = this.courseManager.exportData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `skillmaster-progress-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast('Progress exported successfully');
    }

    async importProgress() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            try {
                const text = await file.text();
                const data = JSON.parse(text);
                
                if (this.courseManager.importData(data)) {
                    this.showToast('Progress imported successfully');
                    // Refresh the current view
                    document.getElementById('main-content').innerHTML = this.render();
                } else {
                    this.showToast('Failed to import progress');
                }
            } catch (error) {
                console.error('Import error:', error);
                this.showToast('Invalid file format');
            }
        };
        
        input.click();
    }

    confirmReset() {
        const confirmed = confirm('Are you sure you want to reset all course progress? This cannot be undone.');
        if (confirmed) {
            this.courseManager.resetProgress();
            this.showToast('Progress reset successfully');
            // Refresh the current view
            document.getElementById('main-content').innerHTML = this.render();
        }
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
}