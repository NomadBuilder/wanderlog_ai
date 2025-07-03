// Main Application - Coordinates all modules
class WanderLogApp {
    constructor() {
        this.api = null;
        this.ui = null;
        this.map = null;
        this.init();
    }

    async init() {
        try {
            // Initialize modules in order
            await this.initializeModules();
            this.setupGlobalAccess();
            this.showWelcomeMessage();
            
        } catch (error) {
            console.error('Failed to initialize WanderLog AI:', error);
            this.showError('Failed to initialize application');
        }
    }

    async initializeModules() {
        // Initialize API first
        this.api = new WanderLogAPI();
        
        // Initialize UI
        this.ui = new WanderLogUI();
        
        // Initialize Map (if map container exists)
        const mapContainer = document.getElementById('worldMap');
        if (mapContainer) {
            this.map = new WanderLogMap();
        }
        
        // Wait for all modules to be ready
        await this.waitForModules();
    }

    async waitForModules() {
        // Wait for DOM to be fully loaded
        if (document.readyState !== 'complete') {
            await new Promise(resolve => {
                window.addEventListener('load', resolve);
            });
        }
        
        // Give modules time to initialize
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    setupGlobalAccess() {
        // Make modules globally accessible for debugging and external use
        window.wanderLogApp = this;
        window.wanderLogAPI = this.api;
        window.wanderLogUI = this.ui;
        window.wanderLogMap = this.map;
        
        // Expose core functions globally for HTML onclick handlers
        const ui = this.ui;
        const api = this.api;
        
        // Page navigation functions
        window.showPage = function(pageName) {
            if (ui && ui.showPage) {
                ui.showPage(pageName);
            } else {
                console.error('[GLOBAL] ❌ UI not initialized or showPage method not found');
            }
        };
        
        // Step navigation functions
        window.nextStep = function() {
            if (ui && ui.nextStep) {
                ui.nextStep();
            } else {
                console.error('[GLOBAL] ❌ UI not initialized or nextStep method not found');
            }
        };
        
        window.previousStep = function() {
            if (ui && ui.previousStep) {
                ui.previousStep();
            } else {
                console.error('[GLOBAL] ❌ UI not initialized or previousStep method not found');
            }
        };
        
        window.goToStep = function(stepNumber) {
            if (ui && ui.goToStep) {
                ui.goToStep(stepNumber);
            } else {
                console.error('[GLOBAL] ❌ UI not initialized or goToStep method not found');
            }
        };
        
        // City functions
        window.suggestCities = function() {
            if (ui && ui.suggestCities) {
                ui.suggestCities();
            } else {
                console.error('[GLOBAL] ❌ UI not initialized or suggestCities method not found');
            }
        };
        
        window.addManualCity = function() {
            if (ui && ui.addManualCity) {
                ui.addManualCity();
            } else {
                console.error('[GLOBAL] ❌ UI not initialized or addManualCity method not found');
            }
        };
        
        // Memory and story functions
        window.autoFillMemoryPrompts = function() {
            if (ui && ui.autoFillMemoryPrompts) {
                ui.autoFillMemoryPrompts();
            } else {
                console.error('[GLOBAL] ❌ UI not initialized or autoFillMemoryPrompts method not found');
            }
        };
        
        window.generateMemoryPrompts = function() {
            if (ui && ui.generateMemoryPrompts) {
                ui.generateMemoryPrompts();
            } else {
                console.error('[GLOBAL] ❌ UI not initialized or generateMemoryPrompts method not found');
            }
        };
        
        window.generateNarrative = function() {
            if (ui && ui.generateNarrative) {
                ui.generateNarrative();
            } else {
                console.error('[GLOBAL] ❌ UI not initialized or generateNarrative method not found');
            }
        };
        
        window.changeStyle = function(style, btn) {
            if (ui && ui.changeStyle) {
                ui.changeStyle(style, btn);
            } else {
                console.error('[GLOBAL] ❌ UI not initialized or changeStyle method not found');
            }
        };
        
        // Story options functions
        window.selectStoryLength = function(length) {
            if (ui && ui.selectStoryLength) {
                ui.selectStoryLength(length);
            } else {
                console.error('[GLOBAL] ❌ UI not initialized or selectStoryLength method not found');
            }
        };
        
        window.selectLayout = function(layout) {
            if (ui && ui.selectLayout) {
                ui.selectLayout(layout);
            } else {
                console.error('[GLOBAL] ❌ UI not initialized or selectLayout method not found');
            }
        };
        
        // Save and finish functions
        window.saveStory = function() {
            if (ui && ui.saveStory) {
                ui.saveStory();
            } else {
                console.error('[GLOBAL] ❌ UI not initialized or saveStory method not found');
            }
        };
        
        window.finishStory = function() {
            if (ui && ui.finishStory) {
                ui.finishStory();
            } else {
                console.error('[GLOBAL] ❌ UI not initialized or finishStory method not found');
            }
        };
        
        // Modal functions
        window.showExportOptions = function() {
            if (ui && ui.showExportOptions) {
                ui.showExportOptions();
            } else {
                console.error('[GLOBAL] ❌ UI not initialized or showExportOptions method not found');
            }
        };
        
        window.closeExportModal = function() {
            if (ui && ui.closeExportModal) {
                ui.closeExportModal();
            } else {
                console.error('[GLOBAL] ❌ UI not initialized or closeExportModal method not found');
            }
        };
        
        window.showShareModal = function() {
            if (ui && ui.showShareModal) {
                ui.showShareModal();
            } else {
                console.error('[GLOBAL] ❌ UI not initialized or showShareModal method not found');
            }
        };
        
        window.closeShareModal = function() {
            if (ui && ui.closeShareModal) {
                ui.closeShareModal();
            } else {
                console.error('[GLOBAL] ❌ UI not initialized or closeShareModal method not found');
            }
        };
        
        window.closeStoryModal = function() {
            if (ui && ui.closeStoryModal) {
                ui.closeStoryModal();
            } else {
                console.error('[GLOBAL] ❌ UI not initialized or closeStoryModal method not found');
            }
        };
        
        // Export functions
        window.exportAsPDF = function() {
            if (ui && ui.exportAsPDF) {
                ui.exportAsPDF();
            } else {
                console.error('[GLOBAL] ❌ UI not initialized or exportAsPDF method not found');
            }
        };
        
        window.exportAsText = function() {
            if (ui && ui.exportAsText) {
                ui.exportAsText();
            } else {
                console.error('[GLOBAL] ❌ UI not initialized or exportAsText method not found');
            }
        };
        
        window.exportAsDigitalAlbum = function() {
            if (ui && ui.exportAsDigitalAlbum) {
                ui.exportAsDigitalAlbum();
            } else {
                console.error('[GLOBAL] ❌ UI not initialized or exportAsDigitalAlbum method not found');
            }
        };
        
        window.exportAsSocialMedia = function() {
            if (ui && ui.exportAsSocialMedia) {
                ui.exportAsSocialMedia();
            } else {
                console.error('[GLOBAL] ❌ UI not initialized or exportAsSocialMedia method not found');
            }
        };
        
        // Share functions
        window.shareViaEmail = function() {
            if (ui && ui.shareViaEmail) {
                ui.shareViaEmail();
            } else {
                console.error('[GLOBAL] ❌ UI not initialized or shareViaEmail method not found');
            }
        };
        
        window.shareViaWhatsApp = function() {
            if (ui && ui.shareViaWhatsApp) {
                ui.shareViaWhatsApp();
            } else {
                console.error('[GLOBAL] ❌ UI not initialized or shareViaWhatsApp method not found');
            }
        };
        
        window.shareViaTwitter = function() {
            if (ui && ui.shareViaTwitter) {
                ui.shareViaTwitter();
            } else {
                console.error('[GLOBAL] ❌ UI not initialized or shareViaTwitter method not found');
            }
        };
        
        window.shareViaFacebook = function() {
            if (ui && ui.shareViaFacebook) {
                ui.shareViaFacebook();
            } else {
                console.error('[GLOBAL] ❌ UI not initialized or shareViaFacebook method not found');
            }
        };
        
        window.copyShareLink = function() {
            if (ui && ui.copyShareLink) {
                ui.copyShareLink();
            } else {
                console.error('[GLOBAL] ❌ UI not initialized or copyShareLink method not found');
            }
        };
        
        // Profile functions
        window.shareProfile = function() {
            if (ui && ui.shareProfile) {
                ui.shareProfile();
            } else {
                console.error('[GLOBAL] ❌ UI not initialized or shareProfile method not found');
            }
        };
        
        window.exportStories = function() {
            if (ui && ui.exportStories) {
                ui.exportStories();
            } else {
                console.error('[GLOBAL] ❌ UI not initialized or exportStories method not found');
            }
        };
        
        // Map zoom functions
        const map = this.map;
        
        window.zoomIn = function() {
            if (map && map.zoomIn) {
                map.zoomIn();
            } else {
                console.error('[GLOBAL] ❌ Map not initialized or zoomIn method not found');
            }
        };
        
        window.zoomOut = function() {
            if (map && map.zoomOut) {
                map.zoomOut();
            } else {
                console.error('[GLOBAL] ❌ Map not initialized or zoomOut method not found');
            }
        };
        
        window.resetZoom = function() {
            if (map && map.resetZoom) {
                map.resetZoom();
            } else {
                console.error('[GLOBAL] ❌ Map not initialized or resetZoom method not found');
            }
        };
        
    }

    showWelcomeMessage() {
        // Show welcome message on first visit
        const hasVisited = localStorage.getItem('wanderlog_visited');
        if (!hasVisited) {
            if (this.ui && this.ui.showSuccess) {
            this.ui.showSuccess('Welcome to WanderLog AI! 🗺️✨');
            }
            localStorage.setItem('wanderlog_visited', 'true');
        }
    }

    showError(message) {
        if (this.ui && this.ui.showError) {
            this.ui.showError(message);
        } else {
            console.error(message);
        }
    }

    // Public methods for external use
    getStats() {
        const stats = {
            stories: this.ui ? this.ui.stories.length : 0,
            currentStep: this.ui ? this.ui.currentStep : 1
        };
        
        if (this.map) {
            stats.map = this.map.getCountryStats();
        }
        
        return stats;
    }

    async refreshData() {
        if (this.ui) {
            await this.ui.loadSavedStories();
        }
        
        if (this.map) {
            await this.map.loadVisitedCountries();
        }
    }

    // Utility methods
    isOnline() {
        return navigator.onLine;
    }

    getVersion() {
        return '1.0.0';
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    
    try {
        // Create global app instance
        window.wanderLogApp = new WanderLogApp();
    } catch (error) {
        console.error('[APP] ❌ Failed to initialize WanderLog application:', error);
        
        // Show error banner
        const errorBanner = document.getElementById('uiErrorBanner');
        if (errorBanner) {
            errorBanner.textContent = 'Failed to initialize application: ' + error.message;
            errorBanner.style.display = 'block';
        }
    }
});

// Backup initialization in case DOMContentLoaded has already fired
if (document.readyState === 'loading') {
    // Document is still loading
        } else {
    // Document has already loaded
    setTimeout(() => {
        if (!window.wanderLogApp) {
            window.wanderLogApp = new WanderLogApp();
        }
    }, 100);
}

// Handle offline/online events
window.addEventListener('online', () => {
    if (window.wanderLogApp) {
        window.wanderLogApp.ui.showSuccess('Connection restored! 🌐');
    }
});

window.addEventListener('offline', () => {
    if (window.wanderLogApp) {
        window.wanderLogApp.ui.showError('You are offline. Some features may not work.');
    }
}); 