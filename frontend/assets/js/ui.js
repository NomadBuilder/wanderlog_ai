console.log("WANDERLOG UI.JS VERSION 20250712-unique-test");
// UI Module - Handles user interface and page navigation
class WanderLogUI {
    constructor() {
        if (WanderLogUI._instance) {
            console.error('[UI] WanderLogUI singleton violation! Returning existing instance.');
            console.trace();
            return WanderLogUI._instance;
        }
        console.log('[UI] WanderLogUI constructor called');
        console.trace();
        WanderLogUI._instance = this;
        
        // Determine API base URL
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        this.API_BASE_URL = isLocalhost
            ? 'http://localhost:8080/api'
            : 'https://us-central1-ai-test-394019.cloudfunctions.net/wanderlog_ai';
        
        this.currentPage = 'create';
        this.stories = [];
        this.filteredStories = [];
        this.currentStep = 1;
        this.userAnswers = [];
        this.selectedCities = [];
        this.manualCities = [];
        this.memoryPrompts = {};
        this.narrativeStyle = 'personal';
        this.uploadedPhotos = []; // Store base64 data URLs for up to 3 photos
        this.selectedStoryLength = 'detailed';
        this.generatedNarrative = '';
        this.currentStyle = 'original';
        this.aiSuggestedCities = [];
        this.currentCityData = {};
        this.profileData = {
            name: 'Traveler',
            bio: 'Sharing my travel adventures around the world',
            isPublic: false
        };
        
        // Authentication state
        this.currentUser = null;
        this.sessionToken = localStorage.getItem('wanderlog_session_token');
        
        // Flag to prevent re-initialization
        this.isInitialized = false;
        this.countryAutocompleteInitialized = false;
        
        this.countries = [
            'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan',
            'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi',
            'Cabo Verde', 'Cambodia', 'Cameroon', 'Canada', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic',
            'Democratic Republic of the Congo', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic',
            'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia',
            'Fiji', 'Finland', 'France',
            'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana',
            'Haiti', 'Honduras', 'Hungary',
            'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy', 'Ivory Coast',
            'Jamaica', 'Japan', 'Jordan',
            'Kazakhstan', 'Kenya', 'Kiribati', 'Kuwait', 'Kyrgyzstan',
            'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg',
            'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar',
            'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway',
            'Oman',
            'Pakistan', 'Palau', 'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal',
            'Qatar',
            'Romania', 'Russia', 'Rwanda',
            'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria',
            'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu',
            'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan',
            'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam',
            'Yemen',
            'Zambia', 'Zimbabwe'
        ];
        this.citySuggestionsCache = {}; // Cache for city suggestions by country
        this.citySuggestionsPromise = null; // Track in-flight fetch
        this.lastPrefetchedCountry = '';
        this.init();
    }

    async init() {
        console.log('[UI] WanderLogUI.init() called');
        console.trace();
        // Check if we're in a browser environment
        if (typeof window === 'undefined') {
            console.error('[UI] ❌ Not in browser environment');
            return;
        }
        
        // Prevent re-initialization
        if (this.isInitialized) {
            console.log('[UI] Already initialized, skipping...');
            return;
        }
        
        try {
            this.setupEventListeners();
            
            // Don't load stories during initialization - only load when viewing stories page
            // this.loadSavedStories();
            
            this.handleURLParams();
            this.initCountryAutocomplete();
            this.initializeDateDropdowns();
            this.restoreFromURL();
            
            // Check for existing authentication session
            await this.checkExistingSession();
            
            this.initializePhotoUpload();
            this.initStoryOptions();
            this.checkCriticalElements();
            
            // Mark as initialized BEFORE showing current step to avoid conflicts
            this.isInitialized = true;
            
            // Show the correct page after restoring state
            this.showPage(this.currentPage);
            
            // Final check - hide error banner if it's showing
            const errorBanner = document.getElementById('uiErrorBanner');
            if (errorBanner && errorBanner.style.display !== 'none') {
                errorBanner.style.display = 'none';
            }
            
        } catch (error) {
            console.error('[UI] ❌ Error during initialization:', error);
            this.showErrorBanner('UI initialization failed: ' + error.message);
        }
    }

    checkCriticalElements() {
        const criticalElements = [
            'countryInput',
            'countryDropdown',
            'citiesContainer',
            'memoryPromptsContainer'
        ];
        
        const missingElements = [];
        
        criticalElements.forEach(elementId => {
            const element = document.getElementById(elementId);
            if (!element) {
                console.log(`[UI] ❌ Missing element: ${elementId}`);
                missingElements.push(elementId);
            }
        });
        
        if (missingElements.length > 0) {
            console.log(`[UI] ❌ Missing critical elements: ${missingElements.join(', ')}`);
            this.showErrorBanner(`Missing critical elements: ${missingElements.join(', ')}`);
            return false;
        }
        
        return true;
    }

    checkGlobalFunctions() {
        const requiredFunctions = ['showPage', 'nextStep', 'suggestCities', 'generateMemoryPrompts'];
        const missingFunctions = [];
        
        requiredFunctions.forEach(funcName => {
            if (typeof window[funcName] !== 'function') {
                missingFunctions.push(funcName);
                console.error(`[UI] ❌ Missing global function: ${funcName}`);
            }
        });
        
        if (missingFunctions.length > 0) {
            const errorMsg = `Missing global functions: ${missingFunctions.join(', ')}`;
            console.error('[UI] ❌', errorMsg);
            this.showErrorBanner(errorMsg);
        }
    }

    showErrorBanner(message) {
        console.error('[UI] 🚨 Showing error banner:', message);
        const banner = document.getElementById('uiErrorBanner');
        if (banner) {
            banner.textContent = 'UI Error: ' + message;
            banner.style.display = 'block';
        } else {
            console.error('[UI] ❌ Error banner element not found');
        }
    }

    setupEventListeners() {
        // Create story form
        const createForm = document.getElementById('createForm');
        if (createForm) {
            createForm.addEventListener('submit', (e) => {
                console.log('[DEBUG] Form submit event triggered!');
                e.preventDefault();
                // Removed call to missing handleCreateStory
            });
        } else {
            console.warn('[UI] #createForm not found');
        }

        // Story search
        const searchInput = document.getElementById('storySearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleStorySearch(e));
        } else {
            console.warn('[UI] #storySearchInput not found');
        }

        // Country input for URL updates
        const countryInput = document.getElementById('countryInput');
        if (countryInput) {
            countryInput.addEventListener('input', () => this.updateURL());
        } else {
            console.warn('[UI] #countryInput not found');
        }

        // Handle browser back/forward
        window.addEventListener('popstate', (e) => this.handlePopState(e));

        // Synchronize between original and step-specific elements
        this.syncElements();
    }

    syncElements() {
        // No longer needed - we use only the visible elements
        console.log('[UI] syncElements() - no longer needed, using only visible elements');
    }

    // Multi-step form navigation
    nextStep() {
        const t0 = performance.now();
        if (!this.currentUser && this.currentStep >= 1) {
            this.showAuthModal();
            return;
        }
        if (this.currentStep < 4) {
            if (this.currentStep === 2) {
                this.combineAllCities();
            }
            this.currentStep++;
            this.updateStepIndicator();
            this.showCurrentStep();
        }
        const t1 = performance.now();
        console.log(`[PERF] nextStep (step ${this.currentStep}) took ${(t1 - t0).toFixed(1)}ms`);
    }

    previousStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateStepIndicator();
            this.showCurrentStep();
        }
    }

    goToStep(stepNumber) {
        if (!this.currentUser && stepNumber > 1) {
            this.showAuthModal();
            return;
        }
        // Validate step number
        if (stepNumber < 1 || stepNumber > 4) return;
        
        // Check if we can navigate to this step based on current progress
        if (stepNumber > this.currentStep) {
            // Only allow navigation to next step if current step is complete
            if (this.currentStep === 1 && !document.getElementById('countryInput').value.trim()) {
                this.showMessage('Please select a country first.');
                return;
            }
            if (this.currentStep === 2 && this.selectedCities.length === 0) {
                this.showMessage('Please select at least one city first.');
                return;
            }
            if (this.currentStep === 3 && this.userAnswers.length === 0) {
                this.showMessage('Please answer at least one question or write a memory first.');
                return;
            }
            if (this.currentStep === 4 && !this.generatedNarrative) {
                this.showMessage('Please generate your story first.');
                return;
            }
        } else {
            this.showMessage('Please complete the current step before proceeding.');
            return;
        }
        
        this.currentStep = stepNumber;
        this.updateStepIndicator();
        this.showCurrentStep();
    }

    updateStepIndicator() {
        for (let i = 1; i <= 4; i++) {
            const step = document.getElementById(`step${i}`);
            if (step) {
                if (i < this.currentStep) {
                    step.className = 'step completed';
                } else if (i === this.currentStep) {
                    step.className = 'step active';
                } else {
                    step.className = 'step pending';
                }
            }
        }
    }

    updateStepProgress(step, status) {
        const stepElement = document.querySelector(`.step[data-step="${step}"]`);
        if (!stepElement) return;
        
        // Remove existing status classes
        stepElement.classList.remove('loading', 'completed', 'error');
        
        // Add new status class
        if (status) {
            stepElement.classList.add(status);
        }
    }

    showCurrentStep() {
        const t0 = performance.now();
        // Only update DOM for current step
        for (let i = 1; i <= 4; i++) {
            const stepContent = document.getElementById(`step${i}Content`);
            if (stepContent) {
                if (i === this.currentStep) {
                    stepContent.classList.add('active');
                    stepContent.style.display = '';
                } else {
                    stepContent.classList.remove('active');
                    stepContent.style.display = 'none';
                }
            }
        }
        // Ensure photo upload handlers are attached when step 1 is shown
        if (this.currentStep === 1) {
            this.initializePhotoUpload();
        }
        // Only auto-load cities for step 2 if needed
        if (this.currentStep === 2) {
            const countryInput = document.getElementById('countryInput');
            const citiesContainer = document.getElementById('citiesContainer');
            if (countryInput && countryInput.value && (citiesContainer && citiesContainer.children.length === 0)) {
                const country = countryInput.value.trim();
                // Use cache if available
                if (this.citySuggestionsCache[country]) {
                    const aiCities = this.citySuggestionsCache[country].cities || [];
                    this.aiSuggestedCities = aiCities.map(city => ({ city: city.city, activities: city.activities || [] }));
                    // Filter out AI cities that are already in manual cities
                    const filteredAiCities = aiCities.filter(aiCity => {
                        return !this.manualCities.some(manualCity => this.citiesAreSame(aiCity.city, manualCity));
                    });
                    const allCities = [
                        ...this.manualCities.map(city => ({ city, activities: [] })),
                        ...filteredAiCities
                    ];
                    this.currentCityData = { cities: aiCities };
                    this.displayCities(allCities);
                    this.showMessage(`Found ${allCities.length} cities for ${country}!`, 'success');
                    this.updateStepProgress(1, 'completed');
                } else if (this.citySuggestionsPromise) {
                    // If fetch is in-flight, wait for it
                    this.showLoading('Loading city suggestions...');
                    this.citySuggestionsPromise.then(() => {
                        this.showCurrentStep();
                    });
                } else {
                    // Fallback: fetch now
                    this.suggestCities(true);
                }
            }
        }
        // Auto-generate memory prompts for step 3
        if (this.currentStep === 3) {
            this.generateMemoryPrompts();
        }
        // Step 4: update story display
        if (this.currentStep === 4 && this.generatedNarrative) {
            this.displayFormattedStory(this.generatedNarrative);
            this.updateStoryDetails();
            const storyContainer = document.getElementById('storyContainer');
            if (storyContainer) {
                storyContainer.style.display = 'block';
            }
        }
        const t1 = performance.now();
        console.log(`[PERF] showCurrentStep (step ${this.currentStep}) took ${(t1 - t0).toFixed(1)}ms`);
    }

    // Page navigation
    showPage(pageName) {
        if (!this.currentUser && pageName !== 'create') {
            this.showAuthModal();
            return;
        }
        console.log(`[UI] showPage('${pageName}') called`);
        
        // Set current page
        this.currentPage = pageName;
        
        // Hide all pages
        const pages = ['create', 'stories', 'map', 'profile'];
        pages.forEach(page => {
            const pageElement = document.getElementById(`${page}Page`);
            if (pageElement) {
                pageElement.classList.remove('active');
            } else {
                console.warn(`[UI] Page element #${page}Page not found`);
            }
        });
        
        // Show the requested page
        const targetPage = document.getElementById(`${pageName}Page`);
        if (targetPage) {
            targetPage.classList.add('active');
            console.log(`[UI] Showing page: #${pageName}Page`);
        } else {
            this.showErrorBanner(`Page not found: #${pageName}Page`);
            return;
        }
        
        // Update navigation buttons
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeButton = document.querySelector(`[onclick="showPage('${pageName}')"]`);
        if (activeButton) {
            activeButton.classList.add('active');
        }
        
        // Update URL
        this.updateURL();
        
        // Load data for specific pages
        if (pageName === 'stories') {
            this.loadSavedStories();
            this.initSearch();
        } else if (pageName === 'map') {
            this.loadSavedStories(); // <-- Add this line
            this.loadMapData();
        } else if (pageName === 'profile') {
            this.loadProfileData();
        }
    }

    async loadMapData() {
        // Load map data if map module is available
        if (window.wanderLogMap) {
            await window.wanderLogMap.loadVisitedCountries();
            this.updateDashboardCounters();
        }
    }

    async loadProfileData() {
        // Load profile statistics
        const visitedCount = this.stories.length;
        const totalWords = this.stories.reduce((total, story) => {
            return total + (story.narrative ? story.narrative.split(' ').length : 0);
        }, 0);
        
        const visitedCountElement = document.getElementById('visitedCount');
        const totalWordsElement = document.getElementById('totalWords');
        
        if (visitedCountElement) {
            visitedCountElement.textContent = visitedCount;
        }
        if (totalWordsElement) {
            totalWordsElement.textContent = totalWords;
        }
    }

    // Country Autocomplete
    initCountryAutocomplete() {
        // Skip if already initialized
        if (this.countryAutocompleteInitialized) {
            console.log('[UI] Skipping initCountryAutocomplete - already initialized');
            return;
        }
        
        const input = document.getElementById('countryInput');
        const dropdown = document.getElementById('countryDropdown');
        if (!input || !dropdown) {
            console.error('[UI] Country input or dropdown not found');
            return;
        }
        
        console.log('[UI] Setting up country autocomplete with', this.countries.length, 'countries');
        let selectedIndex = -1;

        input.addEventListener('input', (e) => {
            const value = e.target.value.toLowerCase();
            console.log('[UI] Country input changed:', value);
            
            const filteredCountries = this.countries.filter(country => 
                country.toLowerCase().includes(value)
            );
            
            console.log('[UI] Filtered countries:', filteredCountries.length);

            if (value.length > 0 && filteredCountries.length > 0) {
                this.showDropdown(filteredCountries);
            } else {
                this.hideDropdown();
            }
            selectedIndex = -1;
        });

        input.addEventListener('keydown', (e) => {
            const items = dropdown.querySelectorAll('.autocomplete-item');
            
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
                this.updateSelection(items, selectedIndex);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                selectedIndex = Math.max(selectedIndex - 1, -1);
                this.updateSelection(items, selectedIndex);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (selectedIndex >= 0 && items[selectedIndex]) {
                    this.selectCountry(items[selectedIndex].textContent);
                }
            } else if (e.key === 'Escape') {
                this.hideDropdown();
            }
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!input.contains(e.target) && !dropdown.contains(e.target)) {
                this.hideDropdown();
            }
        });

        input.addEventListener('blur', () => {
            setTimeout(() => this.prefetchCitySuggestions(), 200); // Delay to allow dropdown click
        });
        
        // Mark as initialized only after successful setup
        this.countryAutocompleteInitialized = true;
    }

    showDropdown(countries) {
        const dropdown = document.getElementById('countryDropdown');
        if (!dropdown) return;
        dropdown.innerHTML = countries.map(country => 
            `<div class="autocomplete-item" onclick="window.wanderLogApp.ui.selectCountry('${country}')">${country}</div>`
        ).join('');
        dropdown.classList.add('show');
    }

    hideDropdown() {
        const dropdown = document.getElementById('countryDropdown');
        if (dropdown) {
            dropdown.classList.remove('show');
        }
    }

    updateSelection(items, selectedIndex) {
        items.forEach((item, index) => {
            if (index === selectedIndex) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });
    }

    selectCountry(country) {
        const input = document.getElementById('countryInput');
        if (input) {
            input.value = country;
        }
        this.hideDropdown();
        this.updateURL();
        this.prefetchCitySuggestions();
    }

    // City Suggestions
    async suggestCities(autoLoad = false) {
        console.log('[UI] suggestCities called with autoLoad:', autoLoad);
        const country = document.getElementById('countryInput').value.trim();
        if (!country) {
            this.showMessage('Please enter a country name.');
            return;
        }
        
        console.log('[UI] Finding cities for country:', country);
        
        // Show loading with specific message and progress indicator
        this.showLoading('Finding cities and activities for ' + country + '...');
        this.updateStepProgress(1, 'loading');
        
        try {
            const response = await fetch(this.API_BASE_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'suggest_cities',
                    country: country
                })
            });
            const data = await response.json();
            
            let aiCities = [];
            if (response.ok && data.cities) {
                aiCities = data.cities;
                
                // Store AI-suggested cities separately
                this.aiSuggestedCities = aiCities.map(city => ({ city: city.city, activities: city.activities || [] }));
            } else {
                this.showMessage(data.error || 'Failed to get city suggestions.');
            }
            
            // Filter out AI cities that are already in manual cities (accent-insensitive)
            const filteredAiCities = aiCities.filter(aiCity => {
                return !this.manualCities.some(manualCity => this.citiesAreSame(aiCity.city, manualCity));
            });
            
            // Combine manual and filtered AI cities
            const allCities = [
                ...this.manualCities.map(city => ({ city, activities: [] })),
                ...filteredAiCities
            ];
            
            // Store the city data for later use
            this.currentCityData = { cities: aiCities };
            
            console.log('[UI] 🎯 About to call displayCities with allCities:', allCities);
            this.displayCities(allCities);
            console.log('[UI] ✅ displayCities call completed');
            
            // Show success message
            this.showMessage(`Found ${allCities.length} cities for ${country}!`, 'success');
            this.updateStepProgress(1, 'completed');
            
            // Only auto-advance if this is NOT an auto-load (i.e., user clicked the button)
            if (!autoLoad) {
                // Small delay to show the success message, then move to next step
                setTimeout(() => {
                    this.nextStep();
                }, 1000);
            } else {
                console.log('[UI] ✅ Auto-load complete - staying on step 2');
            }
            
        } catch (error) {
            this.showMessage('Network error. Please try again.');
            console.error('Error:', error);
            this.updateStepProgress(1, 'error');
        } finally {
            this.hideLoading();
        }
    }

    displayCities(cities) {
        console.log(`[UI] 🏙️ displayCities called with ${cities.length} cities:`, cities);
        
        const container = document.getElementById('citiesContainer');
        if (!container) {
            console.error('[UI] ❌ citiesContainer element not found!');
            return;
        }
        
        console.log('[UI] ✅ citiesContainer found:', container);
        console.log('[UI] Container current innerHTML before clear:', container.innerHTML);
        
        container.innerHTML = '';
        console.log('[UI] ✅ Container cleared');

        cities.forEach((city, index) => {
            console.log(`[UI] Creating card for city ${index + 1}:`, city.city);
            
            const cityCard = document.createElement('div');
            cityCard.className = 'city-card';
            cityCard.onclick = () => this.toggleCitySelection(city);
            
            const cardHTML = `
                <div class="city-name">${city.city}</div>
                <ul class="city-activities">
                    ${city.activities.map(activity => `<li>${activity}</li>`).join('')}
                </ul>
            `;
            
            cityCard.innerHTML = cardHTML;
            console.log(`[UI] Created card HTML for ${city.city}:`, cardHTML);
            
            container.appendChild(cityCard);
            console.log(`[UI] ✅ Appended card ${index + 1} to container`);
        });
        
        console.log('[UI] ✅ All cities displayed. Final container children count:', container.children.length);
        console.log('[UI] Final container innerHTML:', container.innerHTML);
        
        // Force a visual verification
        const cityCards = container.querySelectorAll('.city-card');
        console.log('[UI] City cards in DOM:', cityCards.length);
        cityCards.forEach((card, i) => {
            console.log(`[UI] Card ${i + 1} visible:`, card.offsetWidth > 0 && card.offsetHeight > 0);
        });
    }

    toggleCitySelection(city) {
        const cityCard = event.currentTarget;
        const isSelected = cityCard.classList.contains('selected');
        
        if (isSelected) {
            cityCard.classList.remove('selected');
            this.selectedCities = this.selectedCities.filter(c => c.city !== city.city);
        } else {
            cityCard.classList.add('selected');
            this.selectedCities.push(city);
        }
        // Enable/disable the correct Next button for step 2
        const nextBtn = document.getElementById('nextStepBtnStep2');
        if (nextBtn) {
            nextBtn.disabled = this.selectedCities.length === 0;
        }
    }

    combineAllCities() {
        // This function combines manual cities with actually selected cities from step 2
        // It's called when moving from step 2 to step 3
        console.log('[UI] 🔄 Combining cities - Before:', {
            manualCities: this.manualCities,
            selectedCities: this.selectedCities.length,
            selectedCitiesNames: this.selectedCities.map(c => c.city)
        });
        
        // Add manual cities that aren't already selected
        const manualCitiesToAdd = this.manualCities
            .filter(manualCity => !this.selectedCities.some(selected => this.citiesAreSame(selected.city, manualCity)))
            .map(city => ({ city, activities: [] }));
        
        // Combine manual + selected cities
        this.selectedCities = [
            ...this.selectedCities, // Keep the cities user actually selected in step 2
            ...manualCitiesToAdd    // Add any manual cities not already selected
        ];
        
        console.log('[UI] ✅ Combined cities - After:', {
            totalSelected: this.selectedCities.length,
            selectedCitiesNames: this.selectedCities.map(c => c.city)
        });
    }

    // Memory Prompts Generation
    async generateMemoryPrompts() {
        const t0 = performance.now();
        if (this.selectedCities.length === 0) {
            return;
        }
        this.showLoading('Generating memory prompts for your selected cities...');
        this.updateStepProgress(3, 'loading');
        try {
            const container = document.getElementById('memoryPromptsContainer');
            if (!container) return;
            container.innerHTML = '';
            for (let i = 0; i < this.selectedCities.length; i++) {
                const city = this.selectedCities[i];
                try {
                    const api = new WanderLogAPI();
                    const tApi0 = performance.now();
                    const data = await api.generateMemoryPrompts(city.city, document.getElementById('countryInput').value);
                    const tApi1 = performance.now();
                    console.log(`[PERF] API generateMemoryPrompts for city '${city.city}' took ${(tApi1 - tApi0).toFixed(1)}ms`);
                    if (data.prompts) {
                        this.displayCityPrompts(city, data.prompts, i);
                    } else {
                        this.showMessage(data.error || `Failed to generate prompts for ${city.city}.`);
                    }
                } catch (fetchError) {
                    this.showMessage(`Failed to generate prompts for ${city.city}. Please try again.`);
                    console.error('Error:', fetchError);
                }
            }
            this.updateStepProgress(3, 'completed');
        } catch (error) {
            this.showMessage('Network error. Please try again.');
            console.error('Error:', error);
            this.updateStepProgress(3, 'error');
        } finally {
            this.hideLoading();
        }
        const t1 = performance.now();
        console.log(`[PERF] generateMemoryPrompts (all cities) took ${(t1 - t0).toFixed(1)}ms`);
    }

    displayCityPrompts(city, prompts, cityIndex) {
        const container = document.getElementById('memoryPromptsContainer');
        if (!container) return;
        
        // Enhanced safety check for city data
        let cityName;
        let activities = [];
        
        if (typeof city === 'string') {
            // If city is just a string
            cityName = city;
        } else if (city && typeof city === 'object') {
            // If city is an object, try to extract name
            cityName = city.city || city.name || 'Unknown City';
            activities = city.activities || [];
        } else {
            cityName = 'Unknown City';
        }
        
        console.log('[UI] 🏙️ displayCityPrompts for:', { 
            cityName, 
            activities, 
            city: city,
            cityType: typeof city,
            cityKeys: city && typeof city === 'object' ? Object.keys(city) : 'not object'
        });
        
        const citySection = document.createElement('div');
        citySection.className = 'city-section';
        
        const cityHeader = document.createElement('div');
        cityHeader.className = 'city-section-header';
        cityHeader.innerHTML = `
            <div>
                <div class="city-section-title">${cityName}</div>
                <div class="city-section-subtitle">${activities.length > 0 ? activities.slice(0, 3).join(', ') : 'Your memories here'}</div>
            </div>
        `;
        
        citySection.appendChild(cityHeader);

        prompts.forEach((prompt, promptIndex) => {
            const promptDiv = document.createElement('div');
            promptDiv.className = 'prompt-item';
            const uniqueId = `city${cityIndex}_prompt${promptIndex}`;
            
            promptDiv.innerHTML = `
                <div class="prompt-header">
                    <div class="prompt-question">${prompt}</div>
                    <button class="refresh-btn" onclick="window.wanderLogApp.ui.refreshPrompt('${cityName}', ${promptIndex}, '${uniqueId}')" title="Generate new question">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                </div>
                <textarea class="prompt-input" id="${uniqueId}" placeholder="Share your memory here..."></textarea>
            `;
            citySection.appendChild(promptDiv);
        });

        container.appendChild(citySection);
    }

    async refreshPrompt(cityName, promptIndex, elementId) {
        const refreshBtn = event.target.closest('.refresh-btn');
        const originalContent = refreshBtn.innerHTML;
        refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        refreshBtn.disabled = true;

        try {
            const api = new WanderLogAPI();
            const data = await api.generateMemoryPrompts(cityName, document.getElementById('countryInput').value);
            
            if (data.prompts && data.prompts[promptIndex]) {
                const newPrompt = data.prompts[promptIndex];
                const promptQuestion = refreshBtn.parentElement.querySelector('.prompt-question');
                promptQuestion.textContent = newPrompt;
            } else {
                this.showMessage('Failed to generate new question.');
            }
        } catch (error) {
            this.showMessage('Network error. Please try again.');
            console.error('Error:', error);
        } finally {
            refreshBtn.innerHTML = originalContent;
            refreshBtn.disabled = false;
        }
    }

    // Narrative Generation
    async generateNarrative() {
        const t0 = performance.now();
        // Collect user answers from all cities
        this.userAnswers = [];
        const freeform = document.getElementById('freeformMemory');
        if (freeform && freeform.value.trim()) {
            this.userAnswers.push(freeform.value.trim());
        }
        
        // Collect answers from all prompt inputs
        const answerInputs = document.querySelectorAll('.prompt-input');
        answerInputs.forEach(input => {
            if (input.value.trim()) {
                this.userAnswers.push(input.value.trim());
            }
        });
        
        if (this.userAnswers.length === 0) {
            this.showMessage('Please answer at least one question or write a freeform memory to generate your story.');
            return;
        }
        
        this.showLoading('Creating your travel narrative...');
        this.updateStepProgress(4, 'loading');
        
        try {
            // Create a combined narrative for all cities
            const cityNames = this.selectedCities.map(city => city.city).join(', ');
            
            // Get date information
            const countryMonth = document.getElementById('countryMonth');
            const countryYear = document.getElementById('countryYear');
            const visitDate = (countryMonth && countryYear && countryMonth.value && countryYear.value) ? 
                `${countryMonth.value}/${countryYear.value}` : null;
            
            const tApi0 = performance.now();
            const response = await fetch(this.API_BASE_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'generate_narrative',
                    city: cityNames,
                    country: document.getElementById('countryInput').value,
                    user_answers: this.userAnswers,
                    cities: this.selectedCities.map(city => city.city), // Pass all city names
                    story_length: this.selectedStoryLength, // Add story length parameter
                    story_style: this.selectedStoryStyle || 'original', // Add story style parameter
                    visit_date: visitDate // Add visit date information
                })
            });
            const tApi1 = performance.now();
            console.log(`[PERF] API generateNarrative took ${(tApi1 - tApi0).toFixed(1)}ms`);
            const data = await response.json();
            if (response.ok && data.narrative) {
                this.generatedNarrative = data.narrative;
                
                // Display formatted story in editable container
                this.displayFormattedStory(data.narrative);
                
                // Show story container
                const storyContainer = document.getElementById('storyContainer');
                if (storyContainer) {
                    storyContainer.style.display = 'block';
                }
                
                // Update story details
                this.updateStoryDetails();
                
                this.updateStepProgress(4, 'completed');
            } else {
                this.showMessage(data.error || 'Failed to generate narrative.');
                this.updateStepProgress(4, 'error');
            }
        } catch (error) {
            this.showMessage('Network error. Please try again.');
            console.error('Error:', error);
            this.updateStepProgress(4, 'error');
        } finally {
            this.hideLoading();
        }
        const t1 = performance.now();
        console.log(`[PERF] generateNarrative took ${(t1 - t0).toFixed(1)}ms`);
    }

    // Display formatted story with proper HTML rendering
    displayFormattedStory(narrative) {
        const editableStory = document.getElementById('editableStory');
        if (!editableStory) return;
        if (window.marked) {
            editableStory.innerHTML = window.marked.parse(narrative);
        } else {
            editableStory.textContent = narrative;
        }
        console.log('[UI] 📝 Displayed formatted story (marked.js):', narrative);
    }
    
    // Update story details (fix country name)
    updateStoryDetails() {
        const storyCountry = document.getElementById('storyCountry');
        const storyCities = document.getElementById('storyCities');
        const countryInput = document.getElementById('countryInput');
        if (storyCountry && countryInput) {
            // Use the full value, not a substring
            storyCountry.textContent = countryInput.value;
        }
        if (storyCities && this.selectedCities.length > 0) {
            const cityNames = this.selectedCities.map(city => city.city).join(', ');
            storyCities.textContent = cityNames;
        }
    }

    // Story Style Changes
    async changeStyle(style, btn) {
        if (style === 'original') {
            // Display user responses formatted, no AI
            this.displayFormattedUserResponses();
            this.currentStyle = 'original';
            this.updateStyleButtons(btn);
            // Do NOT navigate away or reset the UI
            return;
        }

        this.showLoading();

        try {
            const response = await fetch(this.API_BASE_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'change_style',
                    narrative: this.generatedNarrative,
                    style: style
                })
            });
            const data = await response.json();
            if (response.ok && data.narrative) {
                // Display the styled story
                this.displayFormattedStory(data.narrative);
                this.currentStyle = style;
                this.updateStyleButtons(btn);
            } else {
                this.showMessage(data.error || 'Failed to change style.');
            }
        } catch (error) {
            this.showMessage('Network error. Please try again.');
            console.error('Error:', error);
        } finally {
            this.hideLoading();
        }
    }

    updateStyleButtons(activeBtn) {
        // Remove active class from all style buttons
        document.querySelectorAll('.style-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Add active class to clicked button
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
    }

    // Utility functions
    citiesAreSame(city1, city2) {
        return this.normalizeCityName(city1) === this.normalizeCityName(city2);
    }

    normalizeCityName(cityName) {
        return cityName
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remove diacritics/accents
            .trim();
    }

    // Manual City Addition
    addManualCity() {
        const input = document.getElementById('manualCityInput');
        console.log('[DEBUG] manualCityInput:', input);
        if (!input) {
            console.error('[UI] manualCityInput not found in DOM when trying to add a city!');
            this.showMessage('City input box not found. Please reload the page.', 'error');
            return;
        }
        const city = input.value.trim();
        if (!city) {
            this.showMessage('Please enter a city name.');
            return;
        }
        
        // Check if city already exists
        if (this.manualCities.includes(city) || this.selectedCities.some(c => c.city === city)) {
            this.showMessage('This city is already added.');
            return;
        }
        
        this.manualCities.push(city);
        input.value = '';
        
        // Refresh city display
        this.displayCities([
            ...this.manualCities.map(city => ({ city, activities: [] })),
            ...this.aiSuggestedCities
        ]);
        
        this.showMessage(`Added ${city}!`, 'success');
    }

    // Story Options
    selectStoryLength(length) {
        this.selectedStoryLength = length;
        // Only update active class for length buttons
        const lengthButtons = document.querySelectorAll('.option-group:nth-child(1) .option-btn');
        lengthButtons.forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');
    }
    
    selectStoryStyle(style) {
        this.selectedStoryStyle = style;
        // Only update active class for style buttons
        const styleButtons = document.querySelectorAll('.option-group:nth-child(2) .option-btn');
        styleButtons.forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');
    }
    
    // Regenerate story with current settings
    async regenerateStory() {
        if (!this.generatedNarrative) {
            this.showMessage('Please generate a story first.');
            return;
        }
        
        // Use the selected style or current style
        const style = this.selectedStoryStyle || this.currentStyle || 'original';
        
        if (style === 'original') {
            this.displayFormattedStory(this.generatedNarrative);
            return;
        }
        
        // Apply style change
        await this.changeStyle(style);
    }

    // Auto-fill Memory Prompts
    autoFillMemoryPrompts() {
        if (this.selectedCities.length === 0) {
            this.showMessage('Please select cities first.');
            return;
        }
        this.generateMemoryPrompts();
    }

    // Demo: Fill all data for testing
    demoFillAllData() {
        console.log('[UI] 🎯 Demo: Filling all memory data...');
        
        // Fill freeform memory with sample content
        const freeformMemory = document.getElementById('freeformMemory');
        if (freeformMemory) {
            freeformMemory.value = `Amazing trip! The food was incredible - especially the street food. The temples were breathtaking and the people were so welcoming. I loved the bustling markets and the peaceful moments by the river. This journey changed my perspective on life and travel. Can't wait to go back!`;
        }
        
        // Sample responses for different types of prompts
        const sampleResponses = [
            "The pad thai from the street vendor near Khao San Road was life-changing! I went back three times.",
            "Visiting Wat Pho temple at sunrise - there was complete silence except for monks chanting in the distance.",
            "Getting lost in Chatuchak Market and discovering the most amazing handmade jewelry stall.",
            "The tuk-tuk driver who became our unofficial tour guide and showed us hidden local spots.",
            "Watching the sunset from a longtail boat on the Chao Phraya River with new friends from the hostel.",
            "Learning to cook authentic green curry from a local grandmother in her kitchen.",
            "The moment I realized I could navigate the BTS Sky Train like a local.",
            "Dancing until dawn at a rooftop bar overlooking the city lights.",
            "The kindness of strangers who helped when I was completely lost and didn't speak Thai.",
            "Eating the spiciest som tam ever and crying happy tears because it was so delicious."
        ];
        
        // Fill all prompt inputs with sample data
        const promptInputs = document.querySelectorAll('.prompt-input');
        promptInputs.forEach((input, index) => {
            if (input) {
                input.value = sampleResponses[index % sampleResponses.length];
            }
        });
        
        this.showMessage(`Demo data filled! Found ${promptInputs.length} prompts to fill.`, 'success');
        console.log(`[UI] ✅ Demo: Filled ${promptInputs.length} prompt inputs with sample data`);
    }

    // Save Story
    async saveStory() {
        if (!this.generatedNarrative) {
            this.showMessage('Please generate a story first.');
            return;
        }
        this.showLoading('Saving your story...');
        try {
            const storyData = {
                country: document.getElementById('countryInput').value,
                cities: this.selectedCities.map(city => city.city),
                city: this.selectedCities[0] ? this.selectedCities[0].city : '',
                narrative: this.generatedNarrative,
                user_answers: this.userAnswers,
                visit_date: this.getVisitDate(),
                story_length: this.selectedStoryLength,
                style: this.currentStyle,
                photos: this.uploadedPhotos.slice(0, 3) // Save up to 3 photos
            };
            const response = await fetch(this.API_BASE_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'save_story',
                    story_data: storyData
                })
            });
            const data = await response.json();
            if (response.ok) {
                this.showMessage('Story saved successfully!', 'success');
                this.loadSavedStories();
            } else {
                this.showMessage(data.error || 'Failed to save story.');
            }
        } catch (error) {
            this.showMessage('Network error. Please try again.');
            console.error('Error:', error);
        } finally {
            this.hideLoading();
        }
    }

    // Finish Story
    async finishStory() {
        // Save the story first
        await this.saveStory();
        this.showMessage('Story creation completed!', 'success');
        this.showPage('stories');
        this.resetForm();
    }

    // Reset Form
    resetForm() {
        this.currentStep = 1;
        this.selectedCities = [];
        this.manualCities = [];
        this.userAnswers = [];
        this.generatedNarrative = '';
        this.selectedStoryLength = 'detailed';
        this.uploadedPhotos = []; // Reset photos
        
        // Reset form elements
        document.getElementById('countryInput').value = '';
        document.getElementById('countryMonth').value = '';
        document.getElementById('countryYear').value = '';
        document.getElementById('manualCityInput').value = '';
        document.getElementById('freeformMemory').value = '';
        document.getElementById('memoryPromptsContainer').innerHTML = '';
        document.getElementById('citiesContainer').innerHTML = '';
        
        // Reset step indicator
        this.updateStepIndicator();
        this.showCurrentStep();
        const photoPreview = document.getElementById('photoPreview');
        if (photoPreview) photoPreview.innerHTML = '';
    }

    // Get Visit Date
    getVisitDate() {
        const month = document.getElementById('countryMonth').value;
        const year = document.getElementById('countryYear').value;
        return month && year ? `${month}/${year}` : null;
    }

    // Initialize Date Dropdowns
    initializeDateDropdowns() {
        // This function can be used to populate date dropdowns dynamically
        // For now, the HTML has static options
    }

    // Global Functions for HTML onclick handlers
    // These need to be exposed globally for the HTML onclick handlers to work
    
    // Step Navigation
    // Duplicate methods removed - using global functions instead

    // Loading Functions
    showLoading(message = 'Loading...') {
        const overlay = document.getElementById('loadingOverlay');
        const messageEl = document.getElementById('loadingMessage');
        
        if (overlay) {
            overlay.style.display = 'flex';
        }
        
        if (messageEl) {
            messageEl.textContent = message;
        }
    }

    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    // Message Functions
    showMessage(message, type = 'error') {
        // Create a temporary message element
        const messageEl = document.createElement('div');
        messageEl.className = `message message-${type}`;
        messageEl.textContent = message;
        
        // Add to page
        document.body.appendChild(messageEl);
        
        // Remove after 3 seconds
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.parentNode.removeChild(messageEl);
            }
        }, 3000);
    }

    // Restore from URL
    restoreFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const step = urlParams.get('step');
        const country = urlParams.get('country');
        const manualCities = urlParams.get('manualCities');
        const selectedCities = urlParams.get('selectedCities');
        
        // Set all URL parameters FIRST, then show the step
        if (country) {
            const countryInput = document.getElementById('countryInput');
            if (countryInput) {
                countryInput.value = country;
                countryInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }
        
        if (manualCities) {
            this.manualCities = manualCities.split(',').filter(city => city.trim());
        }
        
        if (selectedCities) {
            this.selectedCities = selectedCities.split(',')
                .map(city => city.trim())
                .filter(city => city.length > 0)  // Remove empty cities
                .map(city => ({ city, activities: [] }));
            console.log('[UI] 🔗 Restored selectedCities from URL:', this.selectedCities);
        }
        
        // Now show the step AFTER all parameters are set
        if (step) {
            this.currentStep = parseInt(step);
            this.updateStepIndicator();
            this.showCurrentStep();
        } else {
            // If no step parameter, show the first step by default
            this.currentStep = 1;
            this.updateStepIndicator();
            this.showCurrentStep();
        }
    }

    // Update URL with current state
    updateURL() {
        // Get the current URL and ensure we preserve the /wanderlog_ai base path
        const currentPath = window.location.pathname;
        const basePath = currentPath.startsWith('/wanderlog_ai') ? '/wanderlog_ai' : '';
        
        // Create URL relative to the current domain
        const url = new URL(window.location);
        
        if (this.currentPage === 'create') {
            // Clear page parameter and set step-based parameters
            url.searchParams.delete('page');
            url.searchParams.set('step', this.currentStep.toString());
            
            const countryInput = document.getElementById('countryInput');
            if (countryInput && countryInput.value) {
                url.searchParams.set('country', countryInput.value);
            }
            
            if (this.manualCities.length > 0) {
                url.searchParams.set('manualCities', this.manualCities.join(','));
            }
            
            if (this.selectedCities.length > 0) {
                const cityNames = this.selectedCities
                    .map(c => c.city)
                    .filter(city => city && city.trim().length > 0); // Remove empty city names
                if (cityNames.length > 0) {
                    url.searchParams.set('selectedCities', cityNames.join(','));
                }
            }
        } else {
            // Clear step-based parameters and set page parameter
            url.searchParams.delete('step');
            url.searchParams.delete('country');
            url.searchParams.delete('manualCities');
            url.searchParams.delete('selectedCities');
            url.searchParams.set('page', this.currentPage);
        }
        
        // Ensure the pathname includes the base path for subdirectory deployment
        if (basePath && !url.pathname.startsWith(basePath)) {
            url.pathname = basePath + url.pathname;
        }
        
        window.history.pushState({}, '', url);
    }

    // Initialize Story Options
    initStoryOptions() {
        // Set default values
        this.selectedStoryLength = 'detailed';
    }

    // Initialize Public Profile
    initPublicProfile() {
        // Load profile data if on profile page
        if (this.currentPage === 'profile') {
            this.loadProfileData();
        }
    }

    // Initialize Photo Upload
    initializePhotoUpload() {
        // Skip if already initialized
        if (this.isInitialized) {
            console.log('[UI] Skipping initializePhotoUpload - already initialized');
            return;
        }
        console.log('[UI] Initializing photo upload...');
        // Add drag and drop functionality to #photoUploadSection only
        const photoUploadSection = document.getElementById('photoUploadSection');
        if (photoUploadSection) {
            photoUploadSection.addEventListener('dragover', (e) => {
                e.preventDefault();
                photoUploadSection.style.borderColor = '#667eea';
                photoUploadSection.style.background = '#f8fafc';
            });
            photoUploadSection.addEventListener('dragleave', () => {
                photoUploadSection.style.borderColor = '#d1d5db';
                photoUploadSection.style.background = '';
            });
            photoUploadSection.addEventListener('drop', (e) => {
                e.preventDefault();
                photoUploadSection.style.borderColor = '#d1d5db';
                photoUploadSection.style.background = '';
                const files = e.dataTransfer.files;
                this.handlePhotoUpload({ target: { files } });
            });
        }
        // Prevent default dragover/drop on the whole document to stop browser from opening images
        document.body.addEventListener('dragover', (e) => e.preventDefault());
        document.body.addEventListener('drop', (e) => e.preventDefault());
        // Attach file input change event for file picker
        const fileInput = document.getElementById('photoInput');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handlePhotoUpload(e));
        }
        this.updatePhotoPreview();
    }

    // Update photo preview area with delete buttons
    updatePhotoPreview() {
        const photoPreview = document.getElementById('photoPreview');
        console.log('[DEBUG] updatePhotoPreview called. uploadedPhotos:', this.uploadedPhotos);
        if (!photoPreview) {
            console.warn('[DEBUG] photoPreview not found in updatePhotoPreview');
            return;
        }
        photoPreview.innerHTML = '';
        this.uploadedPhotos.forEach((photoData, idx) => {
            const imgWrapper = document.createElement('div');
            imgWrapper.className = 'photo-preview-wrapper';
            imgWrapper.style.position = 'relative';
            imgWrapper.style.display = 'inline-block';
            imgWrapper.style.margin = '0 10px 10px 0';
            imgWrapper.style.verticalAlign = 'top';

            const img = document.createElement('img');
            img.src = photoData;
            img.className = 'photo-preview-img';
            img.style.width = '180px';
            img.style.height = '180px';
            img.style.objectFit = 'cover';
            img.style.borderRadius = '12px';
            img.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';

            // Delete button
            const delBtn = document.createElement('button');
            delBtn.innerHTML = '✖';
            delBtn.title = 'Remove photo';
            delBtn.className = 'photo-delete-btn';
            delBtn.style.position = 'absolute';
            delBtn.style.top = '8px';
            delBtn.style.right = '8px';
            delBtn.style.background = 'rgba(0,0,0,0.6)';
            delBtn.style.color = '#fff';
            delBtn.style.border = 'none';
            delBtn.style.borderRadius = '50%';
            delBtn.style.width = '28px';
            delBtn.style.height = '28px';
            delBtn.style.cursor = 'pointer';
            delBtn.style.fontSize = '18px';
            delBtn.style.display = 'flex';
            delBtn.style.alignItems = 'center';
            delBtn.style.justifyContent = 'center';
            delBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.uploadedPhotos.splice(idx, 1);
                this.updatePhotoPreview();
                // Optionally update any photo count UI here
            });

            imgWrapper.appendChild(img);
            imgWrapper.appendChild(delBtn);
            photoPreview.appendChild(imgWrapper);
        });
    }

    // Handle photo upload
    handlePhotoUpload(event) {
        const files = event.target.files;
        console.log('[DEBUG] handlePhotoUpload called. Files:', files);
        const photoPreview = document.getElementById('photoPreview');
        if (!photoPreview) {
            console.warn('[DEBUG] photoPreview not found');
            return;
        }
        // Limit to 3 photos
        if (this.uploadedPhotos.length + files.length > 3) {
            this.showMessage('You can only add up to 3 photos per story.');
            return;
        }
        Array.from(files).forEach((file) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                console.log('[DEBUG] FileReader loaded:', e.target.result.slice(0, 100));
                if (this.uploadedPhotos.length < 3) {
                    this.uploadedPhotos.push(e.target.result);
                    this.updatePhotoPreview();
                }
            };
            reader.readAsDataURL(file);
        });
    }

    // Handle Enter key press for city input fields  
    handleCityInputKeypress(event, step) {
        if (event.key === 'Enter') {
            event.preventDefault();
            if (step === 'step2') {
                this.addManualCity();
            }
        }
    }

    // Initialize Search
    initSearch() {
        const searchInput = document.getElementById('storySearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.filterStories());
        }
    }

    // Clear Search
    clearSearch() {
        const searchInput = document.getElementById('storySearchInput');
        if (searchInput) {
            searchInput.value = '';
            this.filteredStories = [...this.stories];
            this.displayStories();
        }
    }

    // Load and display saved stories
    async loadSavedStories() {
        this.showLoading('Loading your stories...');
        try {
            const api = new WanderLogAPI();
            const data = await api.getStories();
            if (data.stories) {
                this.stories = data.stories;
                this.filteredStories = [...this.stories];
                this.displayStories();
            } else {
                this.stories = [];
                this.filteredStories = [];
                this.showMessage(data.error || 'Failed to load stories.');
                this.displayEmptyState();
            }
        } catch (error) {
            this.stories = [];
            this.filteredStories = [];
            this.showMessage('Network error. Please try again.');
            console.error('Error loading stories:', error);
            this.displayEmptyState();
        } finally {
            this.hideLoading();
            this.updateDashboardCounters();
        }
    }

    // Display stories in country cards
    displayStories() {
        const container = document.getElementById('storiesContainer');
        const searchTerm = document.getElementById('storySearchInput')?.value.toLowerCase().trim() || '';
        
        if (!this.filteredStories || this.filteredStories.length === 0) {
            if (!this.stories || this.stories.length === 0) {
                this.displayEmptyState();
            } else {
                this.displayNoResults();
            }
            return;
        }

        // Group stories by country
        const storiesByCountry = {};
        this.filteredStories.forEach(story => {
            if (!storiesByCountry[story.country]) {
                storiesByCountry[story.country] = [];
            }
            storiesByCountry[story.country].push(story);
        });

        // Create country cards
        const cardsHTML = Object.entries(storiesByCountry).map(([country, stories]) => {
            // Collect all unique cities across all stories for this country
            const allCities = new Set();
            stories.forEach(story => {
                if (Array.isArray(story.cities)) {
                    story.cities.forEach(city => allCities.add(city));
                } else if (story.city) {
                    allCities.add(story.city);
                }
            });
            const totalCities = allCities.size;
            console.log(`[DEBUG] Country: ${country}, allCities:`, Array.from(allCities), 'totalCities:', totalCities);
            const totalWords = stories.reduce((sum, story) => sum + (story.narrative ? story.narrative.split(' ').length : 0), 0);
            const flagEmoji = this.getCountryFlag(country);
            
            // Highlight country name if it matches search
            const highlightedCountry = searchTerm ? this.highlightSearchTerm(country, searchTerm) : country;
            
            // Get visit date information
            const visitDates = stories
                .map(story => story.visit_date)
                .filter(date => date)
                .map(date => this.formatVisitDate(date));
            
            const uniqueDates = [...new Set(visitDates)];
            const dateDisplay = uniqueDates.length > 0 ? 
                `<p><i class="fas fa-calendar"></i> ${uniqueDates.join(', ')}</p>` : '';
            
            return `
                <div class="country-card" onclick="viewCountryStories('${country}')">
                    <div class="country-card-header">
                        <div class="country-flag">${flagEmoji}</div>
                        <div class="country-info">
                            <h3>${highlightedCountry}</h3>
                            <p>${totalCities} ${totalCities === 1 ? 'city' : 'cities'} documented</p>
                            ${dateDisplay}
                        </div>
                    </div>
                    <div class="country-photos">
                        ${stories.map(story =>
                            (story.photos && story.photos.length > 0) ?
                                story.photos.slice(0, 3).map(photo => `<img src="${photo}" style="max-width:80px;max-height:80px;margin:4px;border-radius:6px;box-shadow:0 1px 4px #ccc;" loading="lazy" />`).join('')
                                : ''
                        ).join('')}
                    </div>
                    <div class="country-stats">
                        <div class="stat">
                            <div class="stat-number">${totalCities}</div>
                            <div class="stat-label">Cities</div>
                        </div>
                        <div class="stat">
                            <div class="stat-number">${totalWords}</div>
                            <div class="stat-label">Words</div>
                        </div>
                        <div class="stat">
                            <div class="stat-number">${stories.length}</div>
                            <div class="stat-label">Stories</div>
                        </div>
                    </div>
                    <div class="country-actions">
                        <button class="btn btn-primary btn-small" onclick="event.stopPropagation(); viewCountryStories('${country}')">
                            <i class="fas fa-eye"></i>
                            View Stories
                        </button>
                        <button class="btn btn-secondary btn-small" onclick="event.stopPropagation(); addToCountry('${country}')">
                            <i class="fas fa-plus"></i>
                            Add More
                        </button>
                        <button class="btn btn-share btn-small" onclick="event.stopPropagation(); shareCountryStories('${country}')">
                            <i class="fas fa-share-alt"></i>
                            Share
                        </button>
                        <button class="btn btn-danger btn-small" onclick="event.stopPropagation(); deleteCountryStories('${country}')" title="Delete all stories for ${country}">
                            <i class="fas fa-trash"></i>
                            Delete
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        if (container) {
            container.innerHTML = `
                <div class="stories-grid">
                    ${cardsHTML}
                </div>
            `;
        }
        // After rendering each story card and its images:
        setTimeout(() => {
            document.querySelectorAll('.story-card img, .country-card img').forEach(img => {
                img.style.cursor = 'pointer';
                img.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.openLightbox(img.src);
                });
            });
        }, 0);
    }

    // Display no results state
    displayNoResults() {
        const container = document.getElementById('storiesContainer');
        const searchTerm = document.getElementById('storySearchInput')?.value || '';
        if (container) {
            container.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <h3>No stories found</h3>
                    <p>No stories match "${searchTerm}". Try different keywords or check your spelling.</p>
                    <button class="btn btn-secondary" onclick="clearSearch()">
                        <i class="fas fa-times"></i>
                        Clear Search
                    </button>
                </div>
            `;
        }
    }

    // Display empty state when no stories exist
    displayEmptyState() {
        const container = document.getElementById('storiesContainer');
        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-book-open"></i>
                    <h2>No stories yet</h2>
                    <p>Start documenting your travels by creating your first story!</p>
                    <button class="btn btn-primary" onclick="showPage('create')">
                        <i class="fas fa-plus"></i>
                        Create Your First Story
                    </button>
                </div>
            `;
        }
    }

    // Helper function to highlight search terms
    highlightSearchTerm(text, searchTerm) {
        if (!searchTerm) return text;
        const regex = new RegExp(`(${searchTerm})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    // Get country flag emoji
    getCountryFlag(country) {
        const flagMap = {
            'Test Country': '🏳️',
            'Thailand': '🇹🇭',
            'Japan': '🇯🇵',
            'Italy': '🇮🇹',
            'France': '🇫🇷',
            'Spain': '🇪🇸',
            'Germany': '🇩🇪',
            'United Kingdom': '🇬🇧',
            'United States': '🇺🇸',
            'Canada': '🇨🇦',
            'Australia': '🇦🇺',
            'Netherlands': '🇳🇱',
            'Belgium': '🇧🇪',
            'Switzerland': '🇨🇭',
            'Austria': '🇦🇹',
            'India': '🇮🇳',
            'China': '🇨🇳',
            'South Korea': '🇰🇷',
            'Vietnam': '🇻🇳',
            'Singapore': '🇸🇬',
            'Malaysia': '🇲🇾',
            'Indonesia': '🇮🇩',
            'Philippines': '🇵🇭',
            'Brazil': '🇧🇷',
            'Mexico': '🇲🇽',
            'Argentina': '🇦🇷',
            'Chile': '🇨🇱',
            'Peru': '🇵🇪',
            'Colombia': '🇨🇴',
            'Ecuador': '🇪🇨',
            'Uruguay': '🇺🇾',
            'Paraguay': '🇵🇾',
            'Bolivia': '🇧🇴',
            'Venezuela': '🇻🇪',
            'Guyana': '🇬🇾',
            'Suriname': '🇸🇷',
            'French Guiana': '🇬🇫'
        };
        return flagMap[country] || '🌍';
    }

    // Format visit date for display
    formatVisitDate(dateString) {
        if (!dateString) return '';
        
        try {
            // Handle both "MM/YYYY" and "YYYY-MM-DD" formats
            let month, year;
            if (dateString.includes('/')) {
                // Format: "MM/YYYY"
                [month, year] = dateString.split('/');
            } else if (dateString.includes('-')) {
                // Format: "YYYY-MM-DD" or "YYYY-MM"
                const parts = dateString.split('-');
                if (parts.length >= 2) {
                    year = parts[0];
                    month = parts[1];
                } else {
                    return dateString; // Return as-is if can't parse
                }
            } else {
                return dateString; // Return as-is if can't parse
            }
            
            const monthNames = {
                '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr',
                '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Aug',
                '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec'
            };
            return `${monthNames[month] || month} ${year}`;
        } catch {
            return dateString;
        }
    }

    // View country stories
    viewCountryStories(country) {
        const countryStories = this.stories.filter(story => story.country === country);
        if (countryStories.length === 0) {
            this.showMessage('No stories found for this country.');
            return;
        }
        // Use markdown rendering for narrative
        const renderMarkdown = (narrative) => {
            if (!narrative) return '';
            let formatted = narrative
                .replace(/^## (.+)$/gm, '<h3>$1</h3>')
                .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.+?)\*/g, '<em>$1</em>')
                .split('\n\n')
                .map(paragraph => {
                    if (paragraph.startsWith('<h3>')) return paragraph;
                    return paragraph.trim() ? `<p>${paragraph.trim()}</p>` : '';
                })
                .filter(p => p)
                .join('\n');
            return formatted;
        };
        const storyList = countryStories.map(story => {
            // Show all cities for this story (comma-separated)
            let cityNames = '';
            if (Array.isArray(story.cities) && story.cities.length > 0) {
                cityNames = story.cities.join(', ');
            } else if (story.city) {
                cityNames = story.city;
            } else {
                cityNames = 'Unknown City';
            }
            return `
                <div class="story-item" style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
                    <h4>${cityNames}</h4>
                    <p><strong>Date:</strong> ${this.formatVisitDate(story.visit_date) || 'Not specified'}</p>
                    <div style="max-height: 200px; overflow-y: auto; margin-top: 10px;">
                        ${renderMarkdown(story.narrative) || 'No story content'}
                    </div>
                </div>
            `;
        }).join('');
        
        // Create a simple modal to display stories
        const modal = document.createElement('div');
        modal.className = 'story-modal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
            background: rgba(0,0,0,0.5); display: flex; justify-content: center; 
            align-items: center; z-index: 1000;
        `;
        
        modal.innerHTML = `
            <div style="background: white; max-width: 800px; max-height: 80%; overflow-y: auto; 
                        padding: 30px; border-radius: 12px; margin: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2>${this.getCountryFlag(country)} ${country} Stories</h2>
                    <button onclick="this.closest('.story-modal').remove()" 
                            style="background: none; border: none; font-size: 24px; cursor: pointer;">×</button>
                </div>
                ${storyList}
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    // Add to existing country
    addToCountry(country) {
        // Navigate to create page and pre-fill the country
        this.showPage('create');
        const countryInput = document.getElementById('countryInput');
        if (countryInput) {
            countryInput.value = country;
        }
        this.showMessage(`Ready to add more stories to ${country}!`, 'success');
    }

    // Share country stories
    shareCountryStories(country) {
        const countryStories = this.stories.filter(story => story.country === country);
        if (countryStories.length === 0) {
            this.showMessage('No stories found for this country.');
            return;
        }
        
        // Create a shareable text
        const shareText = `Check out my travel stories from ${country}!\n\n` +
            countryStories.map(story => `${story.city}: ${story.narrative.substring(0, 100)}...`).join('\n\n');
        
        if (navigator.share) {
            navigator.share({
                title: `My ${country} Travel Stories`,
                text: shareText
            });
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(shareText).then(() => {
                this.showMessage('Stories copied to clipboard!', 'success');
            }).catch(() => {
                this.showMessage('Unable to copy to clipboard.');
            });
        }
    }

    // Delete all stories for a country
    async deleteCountryStories(country) {
        const countryStories = this.stories.filter(story => story.country === country);
        if (countryStories.length === 0) {
            this.showMessage('No stories found for this country.');
            return;
        }
        
        // Show confirmation dialog
        const confirmed = confirm(`Are you sure you want to delete all ${countryStories.length} stories for ${country}? This action cannot be undone.`);
        if (!confirmed) {
            return;
        }
        
        this.showLoading('Deleting stories...');
        try {
            const response = await fetch(this.API_BASE_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'delete_stories_by_country',
                    country_name: country
                })
            });
            
            const data = await response.json();
            if (response.ok && data.success) {
                this.showMessage(`Successfully deleted ${data.deleted_count} stories for ${country}`, 'success');
                // Reload stories to update the display
                await this.loadSavedStories();
            } else {
                this.showMessage(data.error || 'Failed to delete stories.');
            }
        } catch (error) {
            console.error('Error deleting stories:', error);
            this.showMessage('Network error. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    // Filter stories
    filterStories() {
        const searchInput = document.getElementById('storySearchInput');
        if (!searchInput || !this.stories) {
            return;
        }
        
        const searchTerm = searchInput.value.toLowerCase().trim();
        
        if (!searchTerm) {
            this.filteredStories = [...this.stories];
        } else {
            this.filteredStories = this.stories.filter(story => {
                return story.country.toLowerCase().includes(searchTerm) ||
                       (story.city && story.city.toLowerCase().includes(searchTerm)) ||
                       (story.narrative && story.narrative.toLowerCase().includes(searchTerm));
            });
        }
        
        this.displayStories();
    }

    // Clear search
    clearSearch() {
        const searchInput = document.getElementById('storySearchInput');
        if (searchInput) {
            searchInput.value = '';
        }
        if (this.stories) {
            this.filteredStories = [...this.stories];
            this.displayStories();
        }
    }

    // Parse URL parameters and update UI state
    handleURLParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const page = urlParams.get('page');
        const step = urlParams.get('step');
        const country = urlParams.get('country');
        const manualCities = urlParams.get('manualCities');
        const selectedCities = urlParams.get('selectedCities');

        // Handle page parameter first
        if (page) {
            this.currentPage = page;
            console.log('[UI] URL page parameter found:', page);
        }

        // Only set to create if step is present and page is NOT present
        if (step && !page) {
            this.currentStep = parseInt(step);
            this.currentPage = 'create';
        } else if (step) {
            this.currentStep = parseInt(step);
        }
        
        if (country) {
            const countryInput = document.getElementById('countryInput');
            if (countryInput) {
                countryInput.value = country;
            }
        }
        if (manualCities) {
            this.manualCities = manualCities.split(',').filter(city => city.trim());
        }
        if (selectedCities) {
            this.selectedCities = selectedCities.split(',').map(city => ({ city: city.trim(), activities: [] }));
        }
    }

    // === 🔐 AUTHENTICATION METHODS ===
    
    async checkExistingSession() {
        if (!this.sessionToken) {
            this.updateAuthUI(false);
            return;
        }
        
        try {
            const response = await fetch(this.API_BASE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'validate_session',
                    session_token: this.sessionToken
                })
            });
            
            const data = await response.json();
            
            if (data.valid && data.user) {
                this.currentUser = data.user;
                this.updateAuthUI(true);
                console.log('[Auth] ✅ Session restored for:', this.currentUser.name);
            } else {
                // Invalid session, clear it
                localStorage.removeItem('wanderlog_session_token');
                this.sessionToken = null;
                this.currentUser = null;
                this.updateAuthUI(false);
                console.log('[Auth] ❌ Invalid session, cleared');
            }
        } catch (error) {
            console.error('[Auth] Error validating session:', error);
            this.updateAuthUI(false);
        }
    }
    
    updateAuthUI(isLoggedIn) {
        const guestMenu = document.getElementById('profileMenuGuest');
        const loggedInMenu = document.getElementById('profileMenuLoggedIn');
        const profileName = document.getElementById('profileMenuName');
        const profileEmail = document.getElementById('profileMenuEmail');
        
        if (isLoggedIn && this.currentUser) {
            // Show logged-in state
            if (guestMenu) guestMenu.style.display = 'none';
            if (loggedInMenu) loggedInMenu.style.display = 'block';
            if (profileName) profileName.textContent = this.currentUser.name;
            if (profileEmail) profileEmail.textContent = this.currentUser.email;
        } else {
            // Show guest state
            if (guestMenu) guestMenu.style.display = 'block';
            if (loggedInMenu) loggedInMenu.style.display = 'none';
        }
    }
    
    async register(email, password, name) {
        try {
            const response = await fetch(this.API_BASE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'register',
                    email: email,
                    password: password,
                    name: name
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Auto-login after successful registration
                return await this.login(email, password);
            } else {
                return { success: false, error: data.error };
            }
        } catch (error) {
            console.error('[Auth] Registration error:', error);
            return { success: false, error: 'Network error. Please try again.' };
        }
    }
    
    async login(email, password) {
        try {
            const response = await fetch(this.API_BASE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'login',
                    email: email,
                    password: password
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.sessionToken = data.session_token;
                this.currentUser = data.user;
                localStorage.setItem('wanderlog_session_token', this.sessionToken);
                this.updateAuthUI(true);
                console.log('[Auth] ✅ Logged in as:', this.currentUser.name);
                return { success: true };
            } else {
                return { success: false, error: data.error };
            }
        } catch (error) {
            console.error('[Auth] Login error:', error);
            return { success: false, error: 'Network error. Please try again.' };
        }
    }
    
    async logout() {
        try {
            if (this.sessionToken) {
                await fetch(this.API_BASE_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'logout',
                        session_token: this.sessionToken
                    })
                });
            }
        } catch (error) {
            console.error('[Auth] Logout error:', error);
        } finally {
            // Clear local state regardless of API call result
            localStorage.removeItem('wanderlog_session_token');
            this.sessionToken = null;
            this.currentUser = null;
            this.updateAuthUI(false);
            console.log('[Auth] ✅ Logged out');
        }
    }

    // Add this function to update dashboard counters
    updateDashboardCounters() {
        // Countries visited: count unique countries in stories
        let countriesVisited = 0;
        if (this.stories) {
            countriesVisited = new Set(this.stories.map(s => s.country).filter(Boolean)).size;
        }
        // Stories created
        const storiesCreated = this.stories ? this.stories.length : 0;
        // Cities explored
        let citiesExplored = 0;
        if (this.stories) {
            const allCities = [];
            this.stories.forEach(story => {
                if (Array.isArray(story.cities)) {
                    allCities.push(...story.cities);
                } else if (story.city) {
                    allCities.push(story.city);
                }
            });
            citiesExplored = new Set(allCities.filter(Boolean)).size;
        }
        // Update DOM with correct IDs
        const countriesElem = document.getElementById('totalCountries');
        const storiesElem = document.getElementById('totalStories');
        const citiesElem = document.getElementById('totalCities');
        if (countriesElem) countriesElem.textContent = countriesVisited;
        if (storiesElem) storiesElem.textContent = storiesCreated;
        if (citiesElem) citiesElem.textContent = citiesExplored;
    }

    // Call this at the end of loadSavedStories and after map.loadVisitedCountries
    // ... existing code ...

    showAuthModal() {
        const modal = document.getElementById('authModal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    // Add a new method to format and display user responses
    displayFormattedUserResponses() {
        // Format user answers as a readable summary
        let html = '<div class="user-answers-summary">';
        this.userAnswers.forEach((answer, idx) => {
            html += `<div class='user-answer'><b>Q${idx+1}:</b> ${answer}</div>`;
        });
        html += '</div>';
        const editableStory = document.getElementById('editableStory');
        if (editableStory) {
            editableStory.innerHTML = html;
            // Ensure the story container is visible
            const storyContainer = document.getElementById('storyContainer');
            if (storyContainer) {
                storyContainer.style.display = 'block';
            }
        }
    }

    // Prefetch city suggestions when country is selected
    prefetchCitySuggestions() {
        const country = document.getElementById('countryInputStep1').value.trim();
        if (!country || country === this.lastPrefetchedCountry) return;
        this.lastPrefetchedCountry = country;
        // If already cached, skip
        if (this.citySuggestionsCache[country]) return;
        // Start fetch and store promise
        this.citySuggestionsPromise = this.fetchCitySuggestions(country).then(data => {
            this.citySuggestionsCache[country] = data;
            this.citySuggestionsPromise = null;
        });
    }

    // Fetch city suggestions (returns Promise)
    async fetchCitySuggestions(country) {
        try {
            const response = await fetch(this.API_BASE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'suggest_cities', country })
            });
            const data = await response.json();
            return data;
        } catch (e) {
            return { cities: [] };
        }
    }

    // Add lightbox modal HTML to the page (once)
    addLightboxModal() {
        if (document.getElementById('storyImageLightbox')) return;
        const modal = document.createElement('div');
        modal.id = 'storyImageLightbox';
        modal.style.display = 'none';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100vw';
        modal.style.height = '100vh';
        modal.style.background = 'rgba(0,0,0,0.85)';
        modal.style.zIndex = '9999';
        modal.style.justifyContent = 'center';
        modal.style.alignItems = 'center';
        modal.style.flexDirection = 'column';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <span id="lightboxCloseBtn" style="position:absolute;top:32px;right:48px;font-size:2.5rem;color:#fff;cursor:pointer;z-index:10001;">✖</span>
            <img id="lightboxImg" src="" style="max-width:90vw;max-height:80vh;border-radius:16px;box-shadow:0 4px 32px rgba(0,0,0,0.3);background:#fff;" />
        `;
        document.body.appendChild(modal);
        // Close on click outside or close button
        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target.id === 'lightboxCloseBtn') {
                this.closeLightbox();
            }
        });
        // Close on Escape
        document.addEventListener('keydown', (e) => {
            if (modal.style.display !== 'none' && e.key === 'Escape') {
                this.closeLightbox();
            }
        });
    }
    openLightbox(imgSrc) {
        this.addLightboxModal();
        const modal = document.getElementById('storyImageLightbox');
        const img = document.getElementById('lightboxImg');
        img.src = imgSrc;
        modal.style.display = 'flex';
    }
    closeLightbox() {
        const modal = document.getElementById('storyImageLightbox');
        if (modal) modal.style.display = 'none';
    }
}

// Global Functions for HTML onclick handlers
// These need to be exposed globally for the HTML onclick handlers to work

// Step Navigation
function nextStep() {
    console.log('[UI] Global nextStep() function called');
    if (window.wanderLogApp && window.wanderLogApp.ui) {
        window.wanderLogApp.ui.nextStep();
    } else {
        console.error('[UI] wanderLogApp or UI not available');
    }
}

function previousStep() {
    if (window.wanderLogApp && window.wanderLogApp.ui) {
        window.wanderLogApp.ui.previousStep();
    }
}

function goToStep(stepNumber) {
    if (window.wanderLogApp && window.wanderLogApp.ui) {
        window.wanderLogApp.ui.goToStep(stepNumber);
    }
}

// City Functions
function suggestCities() {
    if (window.wanderLogApp && window.wanderLogApp.ui) {
        window.wanderLogApp.ui.suggestCities();
    }
}

function addManualCity() {
    if (window.wanderLogApp && window.wanderLogApp.ui) {
        window.wanderLogApp.ui.addManualCity();
    }
}



function handlePhotoUpload(event) {
    if (window.wanderLogApp && window.wanderLogApp.ui) {
        window.wanderLogApp.ui.handlePhotoUpload(event);
    }
}

function handleCityInputKeypress(event, step) {
    if (window.wanderLogApp && window.wanderLogApp.ui) {
        window.wanderLogApp.ui.handleCityInputKeypress(event, step);
    }
}

// Memory Functions
function autoFillMemoryPrompts() {
    if (window.wanderLogApp && window.wanderLogApp.ui) {
        window.wanderLogApp.ui.autoFillMemoryPrompts();
    }
}

function demoFillAllData() {
    if (window.wanderLogApp && window.wanderLogApp.ui) {
        window.wanderLogApp.ui.demoFillAllData();
    }
}

// Narrative Functions
function generateNarrative() {
    if (window.wanderLogApp && window.wanderLogApp.ui) {
        window.wanderLogApp.ui.generateNarrative();
    }
}

function changeStyle(style, btn) {
    if (window.wanderLogApp && window.wanderLogApp.ui) {
        window.wanderLogApp.ui.changeStyle(style, btn);
    }
}

// Story Options
function selectStoryLength(length) {
    if (window.wanderLogApp && window.wanderLogApp.ui) {
        window.wanderLogApp.ui.selectStoryLength(length);
    }
}

function selectStoryStyle(style) {
    if (window.wanderLogApp && window.wanderLogApp.ui) {
        window.wanderLogApp.ui.selectStoryStyle(style);
    }
}

function regenerateStory() {
    if (window.wanderLogApp && window.wanderLogApp.ui) {
        window.wanderLogApp.ui.regenerateStory();
    }
}

// Save and Share Functions
function saveStory() {
    if (window.wanderLogApp && window.wanderLogApp.ui) {
        window.wanderLogApp.ui.saveStory();
    }
}

function finishStory() {
    if (window.wanderLogApp && window.wanderLogApp.ui) {
        window.wanderLogApp.ui.finishStory();
    }
}

// Export Functions
function showExportOptions() {
    const modal = document.getElementById('exportModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeExportModal() {
    const modal = document.getElementById('exportModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function exportAsPDF() {
    if (window.wanderLogApp && window.wanderLogApp.ui) {
        window.wanderLogApp.ui.exportAsPDF();
    }
}

function exportAsText() {
    if (window.wanderLogApp && window.wanderLogApp.ui) {
        window.wanderLogApp.ui.exportAsText();
    }
}

function exportAsDigitalAlbum() {
    if (window.wanderLogApp && window.wanderLogApp.ui) {
        window.wanderLogApp.ui.exportAsDigitalAlbum();
    }
}

function exportAsSocialMedia() {
    if (window.wanderLogApp && window.wanderLogApp.ui) {
        window.wanderLogApp.ui.exportAsSocialMedia();
    }
}

// Share Functions
function showShareModal() {
    const modal = document.getElementById('shareModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeShareModal() {
    const modal = document.getElementById('shareModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function shareViaEmail() {
    if (window.wanderLogApp && window.wanderLogApp.ui) {
        window.wanderLogApp.ui.shareViaEmail();
    }
}

function shareViaWhatsApp() {
    if (window.wanderLogApp && window.wanderLogApp.ui) {
        window.wanderLogApp.ui.shareViaWhatsApp();
    }
}

function shareViaTwitter() {
    if (window.wanderLogApp && window.wanderLogApp.ui) {
        window.wanderLogApp.ui.shareViaTwitter();
    }
}

function shareViaFacebook() {
    if (window.wanderLogApp && window.wanderLogApp.ui) {
        window.wanderLogApp.ui.shareViaFacebook();
    }
}

function copyShareLink() {
    if (window.wanderLogApp && window.wanderLogApp.ui) {
        window.wanderLogApp.ui.copyShareLink();
    }
}

// Missing global functions that are called by HTML
function showPage(pageName) {
    if (window.wanderLogApp && window.wanderLogApp.ui) {
        window.wanderLogApp.ui.showPage(pageName);
    }
}

function shareProfile() {
    if (window.wanderLogApp && window.wanderLogApp.ui) {
        window.wanderLogApp.ui.shareProfile();
    }
}

function exportStories() {
    if (window.wanderLogApp && window.wanderLogApp.ui) {
        window.wanderLogApp.ui.exportStories();
    }
}

function closeStoryModal() {
    if (window.wanderLogApp && window.wanderLogApp.ui) {
        window.wanderLogApp.ui.closeStoryModal();
    }
}

// My Stories page functions
function viewCountryStories(country) {
    if (window.wanderLogApp && window.wanderLogApp.ui) {
        window.wanderLogApp.ui.viewCountryStories(country);
    }
}

function addToCountry(country) {
    if (window.wanderLogApp && window.wanderLogApp.ui) {
        window.wanderLogApp.ui.addToCountry(country);
    }
}

function shareCountryStories(country) {
    if (window.wanderLogApp && window.wanderLogApp.ui) {
        window.wanderLogApp.ui.shareCountryStories(country);
    }
}

function deleteCountryStories(country) {
    if (window.wanderLogApp && window.wanderLogApp.ui) {
        window.wanderLogApp.ui.deleteCountryStories(country);
    }
}

function filterStories() {
    if (window.wanderLogApp && window.wanderLogApp.ui) {
        window.wanderLogApp.ui.filterStories();
    }
}

function clearSearch() {
    if (window.wanderLogApp && window.wanderLogApp.ui) {
        window.wanderLogApp.ui.clearSearch();
    }
}

// === 🔐 AUTHENTICATION GLOBAL FUNCTIONS ===
function toggleProfileMenu() {
    const dropdown = document.getElementById('profileDropdown');
    if (dropdown) {
        dropdown.classList.toggle('show');
    }
}

function showAuthModal(mode) {
    const modal = document.getElementById('authModal');
    const title = document.getElementById('authModalTitle');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (mode === 'login') {
        title.textContent = 'Sign In';
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
    } else {
        title.textContent = 'Sign Up';
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    }
    
    modal.style.display = 'flex';
    
    // Hide profile dropdown
    const dropdown = document.getElementById('profileDropdown');
    if (dropdown) {
        dropdown.classList.remove('show');
    }
}

function closeAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.style.display = 'none';
    }
    
    // Clear form errors
    const loginError = document.getElementById('loginError');
    const registerError = document.getElementById('registerError');
    if (loginError) loginError.style.display = 'none';
    if (registerError) registerError.style.display = 'none';
    
    // Reset form fields
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';
    document.getElementById('registerName').value = '';
    document.getElementById('registerEmail').value = '';
    document.getElementById('registerPassword').value = '';
}

function switchAuthMode(mode) {
    showAuthModal(mode);
}

async function handleLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');
    const btn = document.getElementById('loginBtn');
    const btnText = btn.querySelector('.btn-text');
    const btnSpinner = btn.querySelector('.btn-spinner');
    
    // Hide previous errors
    errorDiv.style.display = 'none';
    
    // Validate inputs
    if (!email || !password) {
        errorDiv.textContent = 'Please fill in all fields';
        errorDiv.style.display = 'block';
        return;
    }
    
    // Show loading state
    btn.disabled = true;
    btnText.style.display = 'none';
    btnSpinner.style.display = 'inline';
    
    try {
        const result = await window.wanderLogApp.ui.login(email, password);
        
        if (result.success) {
            closeAuthModal();
            window.wanderLogApp.ui.showMessage('Welcome back!', 'success');
        } else {
            errorDiv.textContent = result.error;
            errorDiv.style.display = 'block';
        }
    } catch (error) {
        errorDiv.textContent = 'An error occurred. Please try again.';
        errorDiv.style.display = 'block';
    } finally {
        // Reset button state
        btn.disabled = false;
        btnText.style.display = 'inline';
        btnSpinner.style.display = 'none';
    }
}

async function handleRegister() {
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const errorDiv = document.getElementById('registerError');
    const btn = document.getElementById('registerBtn');
    const btnText = btn.querySelector('.btn-text');
    const btnSpinner = btn.querySelector('.btn-spinner');
    
    // Hide previous errors
    errorDiv.style.display = 'none';
    
    // Validate inputs
    if (!name || !email || !password) {
        errorDiv.textContent = 'Please fill in all fields';
        errorDiv.style.display = 'block';
        return;
    }
    
    if (password.length < 6) {
        errorDiv.textContent = 'Password must be at least 6 characters';
        errorDiv.style.display = 'block';
        return;
    }
    
    if (!email.includes('@')) {
        errorDiv.textContent = 'Please enter a valid email address';
        errorDiv.style.display = 'block';
        return;
    }
    
    // Show loading state
    btn.disabled = true;
    btnText.style.display = 'none';
    btnSpinner.style.display = 'inline';
    
    try {
        const result = await window.wanderLogApp.ui.register(email, password, name);
        
        if (result.success) {
            closeAuthModal();
            window.wanderLogApp.ui.showMessage('Account created successfully! Welcome to WanderLog!', 'success');
        } else {
            errorDiv.textContent = result.error;
            errorDiv.style.display = 'block';
        }
    } catch (error) {
        errorDiv.textContent = 'An error occurred. Please try again.';
        errorDiv.style.display = 'block';
    } finally {
        // Reset button state
        btn.disabled = false;
        btnText.style.display = 'inline';
        btnSpinner.style.display = 'none';
    }
}

async function handleLogout() {
    if (window.wanderLogApp && window.wanderLogApp.ui) {
        await window.wanderLogApp.ui.logout();
        window.wanderLogApp.ui.showMessage('You have been signed out.', 'success');
        
        // Hide profile dropdown
        const dropdown = document.getElementById('profileDropdown');
        if (dropdown) {
            dropdown.classList.remove('show');
        }
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    const profileIcon = document.querySelector('.profile-icon');
    const dropdown = document.getElementById('profileDropdown');
    
    if (profileIcon && dropdown && !profileIcon.contains(e.target)) {
        dropdown.classList.remove('show');
    }
});

// Export for use in other modules
window.WanderLogUI = WanderLogUI;

// Compatibility layer for frontend tests
// These functions are expected by test_frontend.html

// Country flag function for tests
function getCountryFlag(country) {
    const flagMap = {
        'France': '🇫🇷',
        'Japan': '🇯🇵',
        'United States': '🇺🇸',
        'Italy': '🇮🇹',
        'Spain': '🇪🇸',
        'Germany': '🇩🇪',
        'United Kingdom': '🇬🇧',
        'Canada': '🇨🇦',
        'Australia': '🇦🇺',
        'Brazil': '🇧🇷',
        'Mexico': '🇲🇽',
        'India': '🇮🇳',
        'China': '🇨🇳',
        'South Korea': '🇰🇷',
        'Thailand': '🇹🇭',
        'Vietnam': '🇻🇳',
        'Singapore': '🇸🇬',
        'Malaysia': '🇲🇾',
        'Indonesia': '🇮🇩',
        'Philippines': '🇵🇭',
        'Netherlands': '🇳🇱',
        'Belgium': '🇧🇪',
        'Switzerland': '🇨🇭',
        'Austria': '🇦🇹',
        'Sweden': '🇸🇪',
        'Norway': '🇳🇴',
        'Denmark': '🇩🇰',
        'Finland': '🇫🇮',
        'Poland': '🇵🇱',
        'Czech Republic': '🇨🇿',
        'Hungary': '🇭🇺',
        'Greece': '🇬🇷',
        'Portugal': '🇵🇹',
        'Ireland': '🇮🇪',
        'New Zealand': '🇳🇿',
        'South Africa': '🇿🇦',
        'Egypt': '🇪🇬',
        'Morocco': '🇲🇦',
        'Turkey': '🇹🇷',
        'Israel': '🇮🇱',
        'UAE': '🇦🇪',
        'Qatar': '🇶🇦',
        'Saudi Arabia': '🇸🇦',
        'Kuwait': '🇰🇼',
        'Bahrain': '🇧🇭',
        'Oman': '🇴🇲',
        'Jordan': '🇯🇴',
        'Lebanon': '🇱🇧',
        'Syria': '🇸🇾',
        'Iraq': '🇮🇶',
        'Iran': '🇮🇷',
        'Afghanistan': '🇦🇫',
        'Pakistan': '🇵🇰',
        'Bangladesh': '🇧🇩',
        'Sri Lanka': '🇱🇰',
        'Nepal': '🇳🇵',
        'Bhutan': '🇧🇹',
        'Myanmar': '🇲🇲',
        'Cambodia': '🇰🇭',
        'Laos': '🇱🇦',
        'Mongolia': '🇲🇳',
        'Kazakhstan': '🇰🇿',
        'Uzbekistan': '🇺🇿',
        'Kyrgyzstan': '🇰🇬',
        'Tajikistan': '🇹🇯',
        'Turkmenistan': '🇹🇲',
        'Azerbaijan': '🇦🇿',
        'Georgia': '🇬🇪',
        'Armenia': '🇦🇲',
        'Ukraine': '🇺🇦',
        'Belarus': '🇧🇾',
        'Moldova': '🇲🇩',
        'Romania': '🇷🇴',
        'Bulgaria': '🇧🇬',
        'Serbia': '🇷🇸',
        'Croatia': '🇭🇷',
        'Slovenia': '🇸🇮',
        'Slovakia': '🇸🇰',
        'Lithuania': '🇱🇹',
        'Latvia': '🇱🇻',
        'Estonia': '🇪🇪',
        'Iceland': '🇮🇸',
        'Luxembourg': '🇱🇺',
        'Malta': '🇲🇹',
        'Cyprus': '🇨🇾',
        'Albania': '🇦🇱',
        'North Macedonia': '🇲🇰',
        'Montenegro': '🇲🇪',
        'Bosnia and Herzegovina': '🇧🇦',
        'Kosovo': '🇽🇰',
        'Vatican City': '🇻🇦',
        'San Marino': '🇸🇲',
        'Monaco': '🇲🇨',
        'Liechtenstein': '🇱🇮',
        'Andorra': '🇦🇩',
        'Colombia': '🇨🇴',
        'Peru': '🇵🇪',
        'Chile': '🇨🇱',
        'Argentina': '🇦🇷',
        'Uruguay': '🇺🇾',
        'Paraguay': '🇵🇾',
        'Bolivia': '🇧🇴',
        'Ecuador': '🇪🇨',
        'Venezuela': '🇻🇪',
        'Guyana': '🇬🇾',
        'Suriname': '🇸🇷',
        'French Guiana': '🇬🇫',
        'Panama': '🇵🇦',
        'Costa Rica': '🇨🇷',
        'Nicaragua': '🇳🇮',
        'Honduras': '🇭🇳',
        'El Salvador': '🇸🇻',
        'Guatemala': '🇬🇹',
        'Belize': '🇧🇿',
        'Cuba': '🇨🇺',
        'Jamaica': '🇯🇲',
        'Haiti': '🇭🇹',
        'Dominican Republic': '🇩🇴',
        'Puerto Rico': '🇵🇷',
        'Bahamas': '🇧🇸',
        'Barbados': '🇧🇧',
        'Trinidad and Tobago': '🇹🇹',
        'Grenada': '🇬🇩',
        'Saint Lucia': '🇱🇨',
        'Saint Vincent and the Grenadines': '🇻🇨',
        'Antigua and Barbuda': '🇦🇬',
        'Saint Kitts and Nevis': '🇰🇳',
        'Dominica': '🇩🇲'
    };
    
    return flagMap[country] || '🌍';
}

// Date formatting function for tests
function formatVisitDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    return `${month} ${year}`;
}

// Text content creation function for tests
function createTextContent(story) {
    const flag = getCountryFlag(story.country);
    const date = formatVisitDate(story.visit_date);
    const cities = Array.isArray(story.cities) ? story.cities.join(', ') : story.city || '';
    
    return `${flag} Travel Story: ${story.country}
Date: ${date}
Cities: ${cities}

${story.narrative}

Generated with WanderLog AI`;
}

// Digital album HTML creation function for tests
function createDigitalAlbumHTML(story) {
    const flag = getCountryFlag(story.country);
    const date = formatVisitDate(story.visit_date);
    const cities = Array.isArray(story.cities) ? story.cities.join(', ') : story.city || '';
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${story.country} - Travel Album</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .album { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .flag { font-size: 48px; margin-bottom: 10px; }
        .title { font-size: 32px; color: #333; margin-bottom: 10px; }
        .date { font-size: 18px; color: #666; margin-bottom: 20px; }
        .cities { font-size: 20px; color: #007bff; margin-bottom: 30px; }
        .narrative { font-size: 16px; line-height: 1.6; color: #444; margin-bottom: 30px; }
        .footer { text-align: center; font-size: 14px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
    </style>
</head>
<body>
    <div class="album">
        <div class="header">
            <div class="flag">${flag}</div>
            <div class="title">${story.country}</div>
            <div class="date">${date}</div>
            <div class="cities">📍 ${cities}</div>
        </div>
        <div class="narrative">${story.narrative}</div>
        <div class="footer">Generated with WanderLog AI</div>
    </div>
</body>
</html>`;
}

// Social media text creation function for tests
function createSocialMediaText(story) {
    const flag = getCountryFlag(story.country);
    const date = formatVisitDate(story.visit_date);
    const cities = Array.isArray(story.cities) ? story.cities.join(', ') : story.city || '';
    
    // Create a shorter version for social media
    const shortNarrative = story.narrative.length > 100 
        ? story.narrative.substring(0, 100) + '...' 
        : story.narrative;
    
    return `${flag} My adventure in ${story.country}
${date}
📍 Cities: ${cities}

${shortNarrative}

✈️ Generated with WanderLog AI
#Travel #${story.country.replace(/\s+/g, '')} #WanderLogAI #TravelMemories`;
}

// File download function for tests
function downloadAsFile(content, filename, contentType = 'text/plain') {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
}

// Modal functions for tests
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
    }
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// Story validation function for tests
function validateStory(story) {
    const requiredFields = ['country', 'narrative'];
    const missingFields = requiredFields.filter(field => !story[field]);
    
    if (missingFields.length > 0) {
        return {
            valid: false,
            errors: missingFields.map(field => `Missing required field: ${field}`)
        };
    }
    
    if (!story.cities && !story.city) {
        return {
            valid: false,
            errors: ['Missing cities information']
        };
    }
    
    if (typeof story.narrative !== 'string' || story.narrative.length < 10) {
        return {
            valid: false,
            errors: ['Narrative must be a string with at least 10 characters']
        };
    }
    
    return { valid: true, errors: [] };
} 


// Global function for memory prompts (must be defined before UI checks)
function generateMemoryPrompts() {
    if (window.wanderLogApp && (window.wanderLogApp.ui && window.wanderLogApp.ui.generateMemoryPrompts)) {
        window.wanderLogApp.ui.generateMemoryPrompts();
    } else {
        console.warn('[UI] generateMemoryPrompts not available');
    }
}
window.generateMemoryPrompts = generateMemoryPrompts;

// Add performance optimizations
let debounceTimer = null;
let lastSearchTerm = '';

function debounce(func, wait) {
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(debounceTimer);
            func(...args);
        };
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(later, wait);
    };
}

// Optimize search functionality
const debouncedFilterStories = debounce(function(searchTerm) {
    if (searchTerm === lastSearchTerm) return;
    lastSearchTerm = searchTerm;
    
    const stories = this.stories || [];
    this.filteredStories = stories.filter(story => {
        const searchLower = searchTerm.toLowerCase();
        return (
            story.country?.toLowerCase().includes(searchLower) ||
            story.cities?.some(city => city.toLowerCase().includes(searchLower)) ||
            story.narrative?.toLowerCase().includes(searchLower)
        );
    });
    
    this.displayStories();
}, 300);

// Optimize story display
function displayStoriesOptimized() {
    const container = document.getElementById('storiesContainer');
    if (!container) return;
    
    // Use DocumentFragment for better performance
    const fragment = document.createDocumentFragment();
    
    if (!this.filteredStories || this.filteredStories.length === 0) {
        if (!this.stories || this.stories.length === 0) {
            fragment.appendChild(this.createEmptyState());
        } else {
            fragment.appendChild(this.createNoResultsState());
        }
    } else {
        // Group stories efficiently
        const storiesByCountry = {};
        this.filteredStories.forEach(story => {
            if (!storiesByCountry[story.country]) {
                storiesByCountry[story.country] = [];
            }
            storiesByCountry[story.country].push(story);
        });
        
        // Create cards efficiently
        Object.entries(storiesByCountry).forEach(([country, stories]) => {
            const card = this.createCountryCard(country, stories);
            fragment.appendChild(card);
        });
    }
    
    // Single DOM update
    container.innerHTML = '';
    container.appendChild(fragment);
}