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
            
            console.log('🚀 WanderLog AI initialized successfully!');
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
            console.log('[GLOBAL] showPage called with:', pageName);
            if (ui && ui.showPage) {
                ui.showPage(pageName);
            } else {
                console.error('[GLOBAL] ❌ UI not initialized or showPage method not found');
            }
        };
        
        // Step navigation functions
        window.nextStep = function() {
            console.log('[GLOBAL] nextStep called');
            if (ui && ui.nextStep) {
                ui.nextStep();
            } else {
                console.error('[GLOBAL] ❌ UI not initialized or nextStep method not found');
            }
        };
        
        window.previousStep = function() {
            console.log('[GLOBAL] previousStep called');
            if (ui && ui.previousStep) {
                ui.previousStep();
            } else {
                console.error('[GLOBAL] ❌ UI not initialized or previousStep method not found');
            }
        };
        
        window.goToStep = function(stepNumber) {
            console.log('[GLOBAL] goToStep called with:', stepNumber);
            if (ui && ui.goToStep) {
                ui.goToStep(stepNumber);
            } else {
                console.error('[GLOBAL] ❌ UI not initialized or goToStep method not found');
            }
        };
        
        // City functions
        window.suggestCities = function() {
            console.log('[GLOBAL] suggestCities called');
            if (ui && ui.suggestCities) {
                ui.suggestCities();
            } else {
                console.error('[GLOBAL] ❌ UI not initialized or suggestCities method not found');
            }
        };
        
        window.addManualCity = function() {
            console.log('[GLOBAL] addManualCity called');
            if (ui && ui.addManualCity) {
                ui.addManualCity();
            } else {
                console.error('[GLOBAL] ❌ UI not initialized or addManualCity method not found');
            }
        };
        
        // Memory and story functions
        window.autoFillMemoryPrompts = function() {
            console.log('[GLOBAL] autoFillMemoryPrompts called');
            if (ui && ui.autoFillMemoryPrompts) {
                ui.autoFillMemoryPrompts();
            } else {
                console.error('[GLOBAL] ❌ UI not initialized or autoFillMemoryPrompts method not found');
            }
        };
        
        window.generateMemoryPrompts = function() {
            console.log('[GLOBAL] generateMemoryPrompts called');
            if (ui && ui.generateMemoryPrompts) {
                ui.generateMemoryPrompts();
            } else {
                console.error('[GLOBAL] ❌ UI not initialized or generateMemoryPrompts method not found');
            }
        };
        
        window.generateNarrative = function() {
            console.log('[GLOBAL] generateNarrative called');
            if (ui && ui.generateNarrative) {
                ui.generateNarrative();
            } else {
                console.error('[GLOBAL] ❌ UI not initialized or generateNarrative method not found');
            }
        };
        
        window.changeStyle = function(style, btn) {
            console.log('[GLOBAL] changeStyle called with:', style);
            if (ui && ui.changeStyle) {
                ui.changeStyle(style, btn);
            } else {
                console.error('[GLOBAL] ❌ UI not initialized or changeStyle method not found');
            }
        };
        
        // Story options functions
        window.selectStoryLength = function(length) {
            console.log('[GLOBAL] selectStoryLength called with:', length);
            if (ui && ui.selectStoryLength) {
                ui.selectStoryLength(length);
            } else {
                console.error('[GLOBAL] ❌ UI not initialized or selectStoryLength method not found');
            }
        };
        
        window.selectLayout = function(layout) {
            console.log('[GLOBAL] selectLayout called with:', layout);
            if (ui && ui.selectLayout) {
                ui.selectLayout(layout);
            } else {
                console.error('[GLOBAL] ❌ UI not initialized or selectLayout method not found');
            }
        };
        
        // Save and finish functions
        window.saveStory = function() {
            console.log('[GLOBAL] saveStory called');
            if (ui && ui.saveStory) {
                ui.saveStory();
            } else {
                console.error('[GLOBAL] ❌ UI not initialized or saveStory method not found');
            }
        };
        
        window.finishStory = function() {
            console.log('[GLOBAL] finishStory called');
            if (ui && ui.finishStory) {
                ui.finishStory();
            } else {
                console.error('[GLOBAL] ❌ UI not initialized or finishStory method not found');
            }
        };
        
        // Modal functions
        window.showExportOptions = function() {
            console.log('[GLOBAL] showExportOptions called');
            if (ui && ui.showExportOptions) {
                ui.showExportOptions();
            } else {
                console.error('[GLOBAL] ❌ UI not initialized or showExportOptions method not found');
            }
        };
        
        window.closeExportModal = function() {
            console.log('[GLOBAL] closeExportModal called');
            if (ui && ui.closeExportModal) {
                ui.closeExportModal();
            } else {
                console.error('[GLOBAL] ❌ UI not initialized or closeExportModal method not found');
            }
        };
        
        window.showShareModal = function() {
            console.log('[GLOBAL] showShareModal called');
            if (ui && ui.showShareModal) {
                ui.showShareModal();
            } else {
                console.error('[GLOBAL] ❌ UI not initialized or showShareModal method not found');
            }
        };
        
        window.closeShareModal = function() {
            console.log('[GLOBAL] closeShareModal called');
            if (ui && ui.closeShareModal) {
                ui.closeShareModal();
            } else {
                console.error('[GLOBAL] ❌ UI not initialized or closeShareModal method not found');
            }
        };
        
        window.closeStoryModal = function() {
            console.log('[GLOBAL] closeStoryModal called');
            if (ui && ui.closeStoryModal) {
                ui.closeStoryModal();
            } else {
                console.error('[GLOBAL] ❌ UI not initialized or closeStoryModal method not found');
            }
        };
        
        // Export functions
        window.exportAsPDF = function() {
            console.log('[GLOBAL] exportAsPDF called');
            if (ui && ui.exportAsPDF) {
                ui.exportAsPDF();
            } else {
                console.error('[GLOBAL] ❌ UI not initialized or exportAsPDF method not found');
            }
        };
        
        window.exportAsText = function() {
            console.log('[GLOBAL] exportAsText called');
            if (ui && ui.exportAsText) {
                ui.exportAsText();
            } else {
                console.error('[GLOBAL] ❌ UI not initialized or exportAsText method not found');
            }
        };
        
        window.exportAsDigitalAlbum = function() {
            console.log('[GLOBAL] exportAsDigitalAlbum called');
            if (ui && ui.exportAsDigitalAlbum) {
                ui.exportAsDigitalAlbum();
            } else {
                console.error('[GLOBAL] ❌ UI not initialized or exportAsDigitalAlbum method not found');
            }
        };
        
        window.exportAsSocialMedia = function() {
            console.log('[GLOBAL] exportAsSocialMedia called');
            if (ui && ui.exportAsSocialMedia) {
                ui.exportAsSocialMedia();
            } else {
                console.error('[GLOBAL] ❌ UI not initialized or exportAsSocialMedia method not found');
            }
        };
        
        // Share functions
        window.shareViaEmail = function() {
            console.log('[GLOBAL] shareViaEmail called');
            if (ui && ui.shareViaEmail) {
                ui.shareViaEmail();
            } else {
                console.error('[GLOBAL] ❌ UI not initialized or shareViaEmail method not found');
            }
        };
        
        window.shareViaWhatsApp = function() {
            console.log('[GLOBAL] shareViaWhatsApp called');
            if (ui && ui.shareViaWhatsApp) {
                ui.shareViaWhatsApp();
            } else {
                console.error('[GLOBAL] ❌ UI not initialized or shareViaWhatsApp method not found');
            }
        };
        
        window.shareViaTwitter = function() {
            console.log('[GLOBAL] shareViaTwitter called');
            if (ui && ui.shareViaTwitter) {
                ui.shareViaTwitter();
            } else {
                console.error('[GLOBAL] ❌ UI not initialized or shareViaTwitter method not found');
            }
        };
        
        window.shareViaFacebook = function() {
            console.log('[GLOBAL] shareViaFacebook called');
            if (ui && ui.shareViaFacebook) {
                ui.shareViaFacebook();
            } else {
                console.error('[GLOBAL] ❌ UI not initialized or shareViaFacebook method not found');
            }
        };
        
        window.copyShareLink = function() {
            console.log('[GLOBAL] copyShareLink called');
            if (ui && ui.copyShareLink) {
                ui.copyShareLink();
            } else {
                console.error('[GLOBAL] ❌ UI not initialized or copyShareLink method not found');
            }
        };
        
        // Profile functions
        window.shareProfile = function() {
            console.log('[GLOBAL] shareProfile called');
            if (ui && ui.shareProfile) {
                ui.shareProfile();
            } else {
                console.error('[GLOBAL] ❌ UI not initialized or shareProfile method not found');
            }
        };
        
        window.exportStories = function() {
            console.log('[GLOBAL] exportStories called');
            if (ui && ui.exportStories) {
                ui.exportStories();
            } else {
                console.error('[GLOBAL] ❌ UI not initialized or exportStories method not found');
            }
        };
        
        console.log('[APP] ✅ All global functions exposed');
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
    console.log('[APP] 🚀 DOM loaded, initializing WanderLog application...');
    
    try {
        // Create global app instance
        window.wanderLogApp = new WanderLogApp();
        console.log('[APP] ✅ WanderLog application initialized successfully!');
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
            console.log('[APP] 🔄 Backup initialization triggered');
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