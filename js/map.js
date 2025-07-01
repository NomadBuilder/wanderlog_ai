// Map Module - Handles interactive world map functionality
class WanderLogMap {
    constructor() {
        this.mapContainer = null;
        this.countries = new Map();
        this.visitedCountries = new Set();
        this.selectedCountry = null;
        this.init();
    }

    init() {
        this.mapContainer = document.getElementById('worldMap');
        if (!this.mapContainer) return;

        this.loadMap();
        this.setupEventListeners();
    }

    async loadMap() {
        try {
            const response = await fetch('/world-map.svg');
            const svgText = await response.text();
            this.mapContainer.innerHTML = svgText;
            
            // Initialize country data
            this.initializeCountries();
            
            // Load visited countries from stories
            this.loadVisitedCountries();
            
        } catch (error) {
            console.error('Failed to load world map:', error);
            this.mapContainer.innerHTML = '<p class="text-center">Failed to load world map</p>';
        }
    }

    initializeCountries() {
        const countryElements = this.mapContainer.querySelectorAll('path[id]');
        
        countryElements.forEach(element => {
            const countryId = element.id;
            const countryName = this.getCountryName(countryId);
            
            if (countryName) {
                element.classList.add('country');
                element.setAttribute('data-country', countryName);
                element.setAttribute('title', countryName);
                
                this.countries.set(countryName, {
                    element: element,
                    id: countryId,
                    visited: false
                });
            }
        });
    }

    getCountryName(countryId) {
        // Map SVG IDs to readable country names
        const countryMapping = {
            'us': 'United States',
            'ca': 'Canada',
            'mx': 'Mexico',
            'br': 'Brazil',
            'ar': 'Argentina',
            'cl': 'Chile',
            'pe': 'Peru',
            'co': 'Colombia',
            've': 'Venezuela',
            'ec': 'Ecuador',
            'bo': 'Bolivia',
            'py': 'Paraguay',
            'uy': 'Uruguay',
            'gy': 'Guyana',
            'sr': 'Suriname',
            'gf': 'French Guiana',
            'fr': 'France',
            'de': 'Germany',
            'it': 'Italy',
            'es': 'Spain',
            'pt': 'Portugal',
            'gb': 'United Kingdom',
            'ie': 'Ireland',
            'nl': 'Netherlands',
            'be': 'Belgium',
            'ch': 'Switzerland',
            'at': 'Austria',
            'pl': 'Poland',
            'cz': 'Czech Republic',
            'sk': 'Slovakia',
            'hu': 'Hungary',
            'ro': 'Romania',
            'bg': 'Bulgaria',
            'hr': 'Croatia',
            'si': 'Slovenia',
            'rs': 'Serbia',
            'ba': 'Bosnia and Herzegovina',
            'me': 'Montenegro',
            'mk': 'North Macedonia',
            'al': 'Albania',
            'gr': 'Greece',
            'tr': 'Turkey',
            'ru': 'Russia',
            'ua': 'Ukraine',
            'by': 'Belarus',
            'lt': 'Lithuania',
            'lv': 'Latvia',
            'ee': 'Estonia',
            'fi': 'Finland',
            'se': 'Sweden',
            'no': 'Norway',
            'dk': 'Denmark',
            'is': 'Iceland',
            'cn': 'China',
            'jp': 'Japan',
            'kr': 'South Korea',
            'in': 'India',
            'pk': 'Pakistan',
            'bd': 'Bangladesh',
            'np': 'Nepal',
            'bt': 'Bhutan',
            'lk': 'Sri Lanka',
            'mv': 'Maldives',
            'th': 'Thailand',
            'vn': 'Vietnam',
            'la': 'Laos',
            'kh': 'Cambodia',
            'mm': 'Myanmar',
            'my': 'Malaysia',
            'sg': 'Singapore',
            'id': 'Indonesia',
            'ph': 'Philippines',
            'au': 'Australia',
            'nz': 'New Zealand',
            'pg': 'Papua New Guinea',
            'fj': 'Fiji',
            'sa': 'Saudi Arabia',
            'ae': 'United Arab Emirates',
            'qa': 'Qatar',
            'kw': 'Kuwait',
            'bh': 'Bahrain',
            'om': 'Oman',
            'ye': 'Yemen',
            'jo': 'Jordan',
            'lb': 'Lebanon',
            'sy': 'Syria',
            'iq': 'Iraq',
            'ir': 'Iran',
            'af': 'Afghanistan',
            'kz': 'Kazakhstan',
            'uz': 'Uzbekistan',
            'tm': 'Turkmenistan',
            'tj': 'Tajikistan',
            'kg': 'Kyrgyzstan',
            'mn': 'Mongolia',
            'za': 'South Africa',
            'eg': 'Egypt',
            'ly': 'Libya',
            'tn': 'Tunisia',
            'dz': 'Algeria',
            'ma': 'Morocco',
            'ng': 'Nigeria',
            'gh': 'Ghana',
            'ci': 'Ivory Coast',
            'sn': 'Senegal',
            'ml': 'Mali',
            'ne': 'Niger',
            'td': 'Chad',
            'sd': 'Sudan',
            'et': 'Ethiopia',
            'so': 'Somalia',
            'ke': 'Kenya',
            'tz': 'Tanzania',
            'ug': 'Uganda',
            'rw': 'Rwanda',
            'bi': 'Burundi',
            'cd': 'Democratic Republic of the Congo',
            'cg': 'Republic of the Congo',
            'ga': 'Gabon',
            'cm': 'Cameroon',
            'cf': 'Central African Republic',
            'gq': 'Equatorial Guinea',
            'ao': 'Angola',
            'zm': 'Zambia',
            'zw': 'Zimbabwe',
            'bw': 'Botswana',
            'na': 'Namibia',
            'sz': 'Eswatini',
            'ls': 'Lesotho',
            'mg': 'Madagascar',
            'mu': 'Mauritius',
            'sc': 'Seychelles',
            'km': 'Comoros'
        };
        
        return countryMapping[countryId.toLowerCase()] || countryId;
    }

    setupEventListeners() {
        this.mapContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('country')) {
                this.selectCountry(e.target);
            }
        });

        this.mapContainer.addEventListener('mouseover', (e) => {
            if (e.target.classList.contains('country')) {
                this.showTooltip(e.target, e);
            }
        });

        this.mapContainer.addEventListener('mouseout', (e) => {
            if (e.target.classList.contains('country')) {
                this.hideTooltip();
            }
        });
    }

    selectCountry(element) {
        // Remove previous selection
        if (this.selectedCountry) {
            this.selectedCountry.classList.remove('selected');
        }

        // Add new selection
        element.classList.add('selected');
        this.selectedCountry = element;

        const countryName = element.getAttribute('data-country');
        this.showCountryDetails(countryName);
    }

    showCountryDetails(countryName) {
        const detailsContainer = document.getElementById('countryDetails');
        if (!detailsContainer) return;

        const countryData = this.countries.get(countryName);
        const isVisited = this.visitedCountries.has(countryName);

        detailsContainer.innerHTML = `
            <div class="country-details fade-in">
                <h3>${countryName}</h3>
                <p class="country-status ${isVisited ? 'visited' : 'not-visited'}">
                    <i class="fas fa-${isVisited ? 'check-circle' : 'circle'}"></i>
                    ${isVisited ? 'Visited' : 'Not visited yet'}
                </p>
                ${isVisited ? this.getVisitedCountryContent(countryName) : this.getNotVisitedContent(countryName)}
            </div>
        `;
    }

    getVisitedCountryContent(countryName) {
        // Get stories for this country
        const countryStories = this.getStoriesForCountry(countryName);
        
        return `
            <div class="country-stories">
                <h4>Your Stories from ${countryName}</h4>
                ${countryStories.map(story => `
                    <div class="story-preview">
                        <h5>${story.title}</h5>
                        <p>${story.content.substring(0, 150)}...</p>
                        <small>${new Date(story.timestamp).toLocaleDateString()}</small>
                    </div>
                `).join('')}
            </div>
        `;
    }

    getNotVisitedContent(countryName) {
        return `
            <div class="country-actions">
                <p>Ready to explore ${countryName}?</p>
                <button class="btn btn-primary" onclick="wanderLogMap.createStoryForCountry('${countryName}')">
                    <i class="fas fa-plus"></i> Create Story
                </button>
            </div>
        `;
    }

    getStoriesForCountry(countryName) {
        // This would integrate with the main stories data
        // For now, return empty array
        return [];
    }

    createStoryForCountry(countryName) {
        // Navigate to story creation with country pre-filled
        if (window.wanderLogUI) {
            window.wanderLogUI.showStep(1);
            const promptInput = document.getElementById('prompt');
            if (promptInput) {
                promptInput.value = `Tell me about traveling to ${countryName}`;
            }
        }
    }

    async loadVisitedCountries() {
        try {
            // Load stories and extract visited countries
            const response = await fetch('http://localhost:8080/stories');
            const data = await response.json();
            
            if (data.stories) {
                data.stories.forEach(story => {
                    // Extract countries from story content
                    const countries = this.extractCountriesFromStory(story);
                    if (countries && countries.length > 0) {
                        countries.forEach(country => {
                            this.visitedCountries.add(country);
                            this.markCountryAsVisited(country);
                        });
                    }
                });
            }
        } catch (error) {
            console.error('Failed to load visited countries:', error);
        }
    }

    extractCountriesFromStory(story) {
        // Defensive: skip if country is missing or not a string
        if (!story || typeof story.country !== 'string' || !story.country.trim()) return [];
        const country = story.country.toLowerCase();
        const countries = [];
        this.countries.forEach((data, countryName) => {
            if (countryName.toLowerCase().includes(country)) {
                countries.push(countryName);
            }
        });
        return countries;
    }

    markCountryAsVisited(countryName) {
        const countryData = this.countries.get(countryName);
        if (countryData) {
            countryData.element.classList.add('visited');
            countryData.visited = true;
        }
    }

    showTooltip(element, event) {
        const countryName = element.getAttribute('data-country');
        const isVisited = this.visitedCountries.has(countryName);
        
        const tooltip = document.createElement('div');
        tooltip.className = 'map-tooltip';
        tooltip.innerHTML = `
            <strong>${countryName}</strong><br>
            <span class="${isVisited ? 'visited' : 'not-visited'}">
                ${isVisited ? '✓ Visited' : '○ Not visited'}
            </span>
        `;
        
        tooltip.style.cssText = `
            position: absolute;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 14px;
            pointer-events: none;
            z-index: 1000;
            left: ${event.pageX + 10}px;
            top: ${event.pageY - 10}px;
        `;
        
        document.body.appendChild(tooltip);
        
        // Remove tooltip after delay
        setTimeout(() => {
            if (tooltip.parentNode) {
                tooltip.remove();
            }
        }, 3000);
    }

    hideTooltip() {
        const tooltips = document.querySelectorAll('.map-tooltip');
        tooltips.forEach(tooltip => tooltip.remove());
    }

    // Public methods for external use
    getVisitedCountries() {
        return Array.from(this.visitedCountries);
    }

    getCountryStats() {
        const total = this.countries.size;
        const visited = this.visitedCountries.size;
        const percentage = Math.round((visited / total) * 100);
        
        return {
            total,
            visited,
            percentage,
            remaining: total - visited
        };
    }
}

// Export for use in other modules
window.WanderLogMap = WanderLogMap; 