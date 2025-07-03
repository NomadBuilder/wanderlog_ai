// Map Module - Handles interactive world map functionality
class WanderLogMap {
    constructor() {
        this.mapContainer = null;
        this.countries = new Map();
        this.visitedCountries = new Set();
        this.selectedCountry = null;
        this.currentHoveredCountry = null;
        this.hoverTimeout = null;
        
        // Zoom and pan properties
        this.currentZoom = 1;
        this.minZoom = 0.5;
        this.maxZoom = 8;
        this.zoomStep = 0.2;
        this.panOffset = { x: 0, y: 0 };
        this.isPanning = false;
        this.lastPanPoint = { x: 0, y: 0 };
        this.lastPinchDistance = null;
        this.originalViewBox = null;
        this.isZooming = false; // Flag to prevent zoom conflicts
        this.animationFrame = null; // Store animation frame ID
        this.lastZoomTime = 0; // Throttle zoom events
        this.zoomThrottle = 16; // ~60fps throttling
        
        // Mouse interaction state
        this.mouseDownPoint = null;
        this.isDragging = false;
        this.dragThreshold = 5; // pixels before considering it a drag
        
        // Country panel properties
        this.stickyPanel = null; // Reference to sticky country panel
        this.isPanelSticky = false; // Track if panel is in sticky mode
        this.hoverPanelTimeout = null; // Timeout for hover panel hiding
        
        this.init();
    }

    init() {
        this.mapContainer = document.getElementById('worldMap');
        if (!this.mapContainer) {
            console.error('[Map] Map container #worldMap not found');
            return;
        }

        this.loadMap();
        this.setupEventListeners();
        this.setupZoomAndPan();
    }

    async loadMap() {
        try {
            const response = await fetch('/assets/maps/world-map.svg');
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
        // Handle both single path countries and grouped countries
        const pathCountries = this.mapContainer.querySelectorAll('path[id]');
        const groupCountries = this.mapContainer.querySelectorAll('g[id]');
        
        // Initialize single path countries
        pathCountries.forEach(element => {
            const countryId = element.id;
            const countryName = this.getCountryName(countryId);
            
            if (countryName) {
                element.classList.add('country');
                element.setAttribute('data-country', countryName);
                
                // Force white fill and black stroke for all countries initially
                element.style.fill = 'white';
                element.style.stroke = '#000000';
                element.style.strokeWidth = '0.5';
                element.style.cursor = 'pointer';
                element.style.transition = 'all 0.3s ease';
                
                this.countries.set(countryName, {
                    element: element,
                    id: countryId,
                    visited: false,
                    type: 'path'
                });
            }
        });
        
        // Initialize grouped countries (like Canada, USA, etc.)
        groupCountries.forEach(groupElement => {
            const countryId = groupElement.id;
            const countryName = this.getCountryName(countryId);
            
            if (countryName) {
                groupElement.classList.add('country');
                groupElement.setAttribute('data-country', countryName);
                
                // Apply styling to all child paths within the group
                const childPaths = groupElement.querySelectorAll('path');
                childPaths.forEach(path => {
                    path.style.fill = 'white';
                    path.style.stroke = '#000000';
                    path.style.strokeWidth = '0.5';
                    path.style.transition = 'all 0.3s ease';
                    path.style.cursor = 'pointer';
                });
                
                this.countries.set(countryName, {
                    element: groupElement,
                    id: countryId,
                    visited: false,
                    type: 'group',
                    childPaths: childPaths
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
            'km': 'Comoros',
            // Central America and Caribbean
            'ni': 'Nicaragua',
            'cr': 'Costa Rica',
            'pa': 'Panama',
            'hn': 'Honduras',
            'sv': 'El Salvador',
            'gt': 'Guatemala',
            'bz': 'Belize',
            'cu': 'Cuba',
            'jm': 'Jamaica',
            'ht': 'Haiti',
            'do': 'Dominican Republic',
            'bs': 'Bahamas',
            'bb': 'Barbados',
            'tt': 'Trinidad and Tobago',
            'gd': 'Grenada',
            'lc': 'Saint Lucia',
            'vc': 'Saint Vincent and the Grenadines',
            'ag': 'Antigua and Barbuda',
            'kn': 'Saint Kitts and Nevis',
            'dm': 'Dominica',
            // Africa (additional)
            'dj': 'Djibouti',
            'er': 'Eritrea',
            'gm': 'Gambia',
            'gn': 'Guinea',
            'gw': 'Guinea-Bissau',
            'lr': 'Liberia',
            'sl': 'Sierra Leone',
            'bf': 'Burkina Faso',
            'cv': 'Cape Verde',
            'st': 'São Tomé and Príncipe',
            // Additional countries
            'ad': 'Andorra',
            'mc': 'Monaco',
            'sm': 'San Marino',
            'va': 'Vatican City',
            'li': 'Liechtenstein',
            'lu': 'Luxembourg',
            'mt': 'Malta',
            'cy': 'Cyprus',
            'md': 'Moldova',
            'ge': 'Georgia',
            'am': 'Armenia',
            'az': 'Azerbaijan',
            // Pacific Islands
            'pw': 'Palau',
            'fm': 'Micronesia',
            'mh': 'Marshall Islands',
            'ki': 'Kiribati',
            'nr': 'Nauru',
            'tv': 'Tuvalu',
            'to': 'Tonga',
            'ws': 'Samoa',
            'vu': 'Vanuatu',
            'sb': 'Solomon Islands',
            'fk': 'Falkland Islands',
            'gl': 'Greenland'
        };
        
        return countryMapping[countryId.toLowerCase()] || countryId;
    }

    setupEventListeners() {
        // Remove old click handler - now handled in mouse up/down system
        
        this.mapContainer.addEventListener('mouseover', (e) => {
            const countryElement = this.findCountryElement(e.target);
            if (countryElement) {
                this.handleCountryMouseOver(countryElement, e);
            }
        });

        this.mapContainer.addEventListener('mouseout', (e) => {
            const countryElement = this.findCountryElement(e.target);
            if (countryElement) {
                this.handleCountryMouseOut(countryElement, e);
            }
        });
    }
    
    handleCountryMouseOver(countryElement, event) {
        const countryName = countryElement.getAttribute('data-country');
        
        // Clear any pending timeouts
        if (this.hoverTimeout) {
            clearTimeout(this.hoverTimeout);
            this.hoverTimeout = null;
        }
        if (this.hoverPanelTimeout) {
            clearTimeout(this.hoverPanelTimeout);
            this.hoverPanelTimeout = null;
        }
        
        // If this is already the hovered country, do nothing
        if (this.currentHoveredCountry === countryName) {
            return;
        }
        
        // Set new hovered country
        this.currentHoveredCountry = countryName;
        
        // Show tooltip and apply hover effects
        this.showTooltip(countryElement, event);
        this.handleCountryHover(countryElement, true);
    }
    
    handleCountryMouseOut(countryElement, event) {
        const countryName = countryElement.getAttribute('data-country');
        
        // Only proceed if this was the currently hovered country
        if (this.currentHoveredCountry !== countryName) {
            return;
        }
        
        // If panel is sticky, don't hide on mouse out
        if (this.isPanelSticky) {
            return;
        }
        
        // Check if the mouse is moving to a related element (child path in same country)
        const relatedTarget = event.relatedTarget;
        if (relatedTarget) {
            const relatedCountryElement = this.findCountryElement(relatedTarget);
            if (relatedCountryElement && 
                relatedCountryElement.getAttribute('data-country') === countryName) {
                // Mouse moved to another part of the same country, don't hide
                return;
            }
            
            // Check if mouse is moving to the country panel
            const tooltip = document.querySelector('.country-panel');
            if (tooltip && (tooltip.contains(relatedTarget) || relatedTarget === tooltip)) {
                // Mouse moved to the panel, don't hide
                return;
            }
        }
        
        // Use a longer delay to give users time to move to the panel
        this.hoverPanelTimeout = setTimeout(() => {
            if (this.currentHoveredCountry === countryName && !this.isPanelSticky) {
                this.currentHoveredCountry = null;
                this.hideTooltip();
                this.handleCountryHover(countryElement, false);
            }
            this.hoverPanelTimeout = null;
        }, 300); // 300ms delay for better UX
    }
    
    findCountryElement(target) {
        // Check if target itself is a country
        if (target.classList.contains('country')) {
            return target;
        }
        
        // Check if target is a path within a country group
        if (target.tagName === 'path') {
            const parentGroup = target.closest('g[id]');
            if (parentGroup && parentGroup.classList.contains('country')) {
                return parentGroup;
            }
        }
        
        return null;
    }
    
    handleCountryHover(element, isHovering) {
        const countryName = element.getAttribute('data-country');
        const countryData = this.countries.get(countryName);
        const isVisited = element.classList.contains('visited');
        
        if (!countryData) return;
        
        if (isHovering) {
            if (isVisited) {
                // Apply darker purple hover to visited countries
                if (countryData.type === 'group') {
                    countryData.childPaths.forEach(path => {
                        path.style.fill = '#5a3a7a';
                    });
                } else {
                    element.style.fill = '#5a3a7a';
                }
            } else {
                element.style.fill = '#f3f4f6'; // Light gray on hover
            }
            element.style.transform = 'scale(1.02)';
        } else {
            if (isVisited) {
                // Restore purple color for visited countries
                if (countryData.type === 'group') {
                    countryData.childPaths.forEach(path => {
                        path.style.fill = '#764ba2';
                    });
                } else {
                    element.style.fill = '#764ba2';
                }
            } else {
                // Restore white color for not visited countries  
                if (countryData.type === 'group') {
                    countryData.childPaths.forEach(path => {
                        path.style.fill = 'white';
                    });
                } else {
                    element.style.fill = 'white';
                }
            }
            element.style.transform = 'scale(1)';
        }
    }

    selectCountry(element) {
        const countryName = element.getAttribute('data-country');
        const isVisited = this.visitedCountries.has(countryName);
        
        // If this country is already selected and panel is sticky, don't do anything
        if (this.selectedCountry === element && this.isPanelSticky) {
            return;
        }
        
        // Remove previous selection
        if (this.selectedCountry) {
            this.selectedCountry.classList.remove('selected');
            this.handleCountryHover(this.selectedCountry, false);
        }

        // Add new selection
        element.classList.add('selected');
        this.selectedCountry = element;
        
        // Make the current hover panel sticky
        this.isPanelSticky = true;
        this.currentHoveredCountry = countryName;
        
        // Clear any existing hover timeouts to prevent hiding
        if (this.hoverTimeout) {
            clearTimeout(this.hoverTimeout);
            this.hoverTimeout = null;
        }
        if (this.hoverPanelTimeout) {
            clearTimeout(this.hoverPanelTimeout);
            this.hoverPanelTimeout = null;
        }
        
        // If there's no tooltip currently showing, show it
        const existingTooltip = document.querySelector('.map-tooltip');
        if (!existingTooltip) {
            // Create a fake event with position near the country element
            const rect = element.getBoundingClientRect();
            const fakeEvent = {
                pageX: rect.right + 15,
                pageY: rect.top
            };
            this.showTooltip(element, fakeEvent);
        }
        
        // Make the existing tooltip sticky by adding a class
        const tooltips = document.querySelectorAll('.map-tooltip');
        tooltips.forEach(tooltip => {
            tooltip.classList.add('sticky-tooltip');
        });
        
        // Apply hover effect to make it visually clear which country is selected
        this.handleCountryHover(element, true);
        
        // Setup click outside to close
        this.setupPanelClickOutside();
    }

    viewCountryStories(countryName) {
        // Hide the sticky panel first
        this.hideStickyPanel();
        
        // Use the UI module's viewCountryStories function if available
        if (window.wanderLogApp && window.wanderLogApp.ui && window.wanderLogApp.ui.viewCountryStories) {
            window.wanderLogApp.ui.viewCountryStories(countryName);
        } else {
            // Fallback - show simple alert
            alert(`View stories for ${countryName} - UI module not available`);
        }
    }

    addToCountry(countryName) {
        // Hide the sticky panel first
        this.hideStickyPanel();
        
        // Use the UI module's addToCountry function if available
        if (window.wanderLogApp && window.wanderLogApp.ui && window.wanderLogApp.ui.addToCountry) {
            window.wanderLogApp.ui.addToCountry(countryName);
        } else {
            // Fallback - redirect to create page with country pre-filled
            window.location.href = `/?country=${encodeURIComponent(countryName)}`;
        }
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
        // Get stories from the UI module if available
        if (window.wanderLogApp && window.wanderLogApp.ui && window.wanderLogApp.ui.stories) {
            return window.wanderLogApp.ui.stories.filter(story => 
                story.country && story.country.toLowerCase().includes(countryName.toLowerCase())
            );
        }
        return [];
    }

    getCitiesForCountry(countryName) {
        const stories = this.getStoriesForCountry(countryName);
        const cities = new Set();
        
        stories.forEach(story => {
            // Add cities from story.cities array
            if (Array.isArray(story.cities)) {
                story.cities.forEach(city => cities.add(city));
            }
            // Add city from story.city field
            if (story.city && typeof story.city === 'string') {
                cities.add(story.city);
            }
        });
        
        return Array.from(cities);
    }

    createStoryForCountry(countryName) {
        // Hide the sticky panel first
        this.hideStickyPanel();
        
        // Navigate to create page with country pre-filled
        if (window.wanderLogApp && window.wanderLogApp.ui) {
            window.wanderLogApp.ui.showPage('create');
            // Pre-fill country input
            const countryInput = document.getElementById('countryInput');
            if (countryInput) {
                countryInput.value = countryName;
                // Trigger any autocomplete updates
                countryInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
        } else {
            // Fallback - simple redirect
            window.location.href = `/?country=${encodeURIComponent(countryName)}`;
        }
    }

    async loadVisitedCountries() {
        try {
            // Load stories and extract visited countries
            const response = await fetch('/stories');
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
            // No direct style or fill assignments; rely on CSS
        } else {
            console.warn(`[Map] Could not find SVG element for country: ${countryName}`);
        }
    }

    showTooltip(element, event) {
        const countryName = element.getAttribute('data-country');
        const isVisited = this.visitedCountries.has(countryName);
        
        // Remove any existing tooltips first
        const existingTooltips = document.querySelectorAll('.map-tooltip');
        existingTooltips.forEach(t => t.remove());
        
        const tooltip = document.createElement('div');
        tooltip.className = 'map-tooltip';
        
        if (isVisited) {
            // Get stories and cities for this country
            const countryStories = this.getStoriesForCountry(countryName);
            const cities = this.getCitiesForCountry(countryName);
            
            tooltip.innerHTML = `
                <div class="tooltip-header">
                    <strong>${countryName}</strong>
                    <span class="visited-badge">✓ Visited</span>
                </div>
                ${cities.length > 0 ? `
                    <div class="tooltip-cities">
                        <strong>Cities:</strong> ${cities.slice(0, 3).join(', ')}${cities.length > 3 ? `... +${cities.length - 3} more` : ''}
                    </div>
                ` : ''}
                ${countryStories.length > 0 ? `
                    <div class="tooltip-stories">
                        <strong>${countryStories.length} ${countryStories.length === 1 ? 'story' : 'stories'}</strong>
                        <div class="tooltip-action">Click to view stories and add more →</div>
                    </div>
                ` : ''}
            `;
        } else {
            tooltip.innerHTML = `
                <div class="tooltip-header">
                    <strong>${countryName}</strong>
                    <span class="not-visited-badge">○ Not visited</span>
                </div>
                <div class="tooltip-action">Click to create your first story →</div>
            `;
        }
        
        // Position the tooltip near mouse but keep it on screen
        const x = Math.min(event.pageX + 15, window.innerWidth - 270);
        const y = Math.max(event.pageY - 10, 10);
        
        tooltip.style.cssText = `
            position: absolute;
            background: rgba(0,0,0,0.9);
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            font-size: 13px;
            pointer-events: none;
            z-index: 1000;
            max-width: 250px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            left: ${x}px;
            top: ${y}px;
            line-height: 1.4;
            opacity: 0;
            transform: translateY(10px);
            transition: all 0.2s ease;
        `;
        
        document.body.appendChild(tooltip);
        
        // Animate in
        requestAnimationFrame(() => {
            tooltip.style.opacity = '1';
            tooltip.style.transform = 'translateY(0)';
        });
        
        // Auto-remove after delay (unless made sticky)
        setTimeout(() => {
            if (tooltip.parentNode && !tooltip.classList.contains('sticky-tooltip')) {
                tooltip.remove();
            }
        }, 10000);
    }

    hideTooltip() {
        // Only hide non-sticky tooltips
        const tooltips = document.querySelectorAll('.map-tooltip:not(.sticky-tooltip)');
        tooltips.forEach(tooltip => tooltip.remove());
    }
    


    showStickyCountryPanel(element, countryName, isVisited) {
        // Remove any existing panels
        this.hideStickyPanel();
        
        const panel = document.createElement('div');
        panel.className = 'country-panel sticky-panel';
        
        if (isVisited) {
            // Get stories and cities for this country
            const countryStories = this.getStoriesForCountry(countryName);
            const cities = this.getCitiesForCountry(countryName);
            
            panel.innerHTML = `
                <div class="panel-header">
                    <strong>${countryName}</strong>
                    <span class="visited-badge">✓ Visited</span>
                    <button class="panel-close" onclick="window.wanderLogMap.hideStickyPanel()">&times;</button>
                </div>
                ${cities.length > 0 ? `
                    <div class="panel-cities">
                        <strong>Cities visited:</strong><br>
                        ${cities.join(', ')}
                    </div>
                ` : ''}
                ${countryStories.length > 0 ? `
                    <div class="panel-stories">
                        <strong>${countryStories.length} ${countryStories.length === 1 ? 'story' : 'stories'} saved</strong>
                        <div class="panel-actions">
                            <button class="btn btn-primary btn-small" onclick="window.wanderLogMap.viewCountryStories('${countryName}')">
                                <i class="fas fa-eye"></i> View Stories
                            </button>
                            <button class="btn btn-secondary btn-small" onclick="window.wanderLogMap.addToCountry('${countryName}')">
                                <i class="fas fa-plus"></i> Add More
                            </button>
                        </div>
                    </div>
                ` : `
                    <div class="panel-stories">
                        <p>No stories yet for this country.</p>
                        <div class="panel-actions">
                            <button class="btn btn-secondary btn-small" onclick="window.wanderLogMap.addToCountry('${countryName}')">
                                <i class="fas fa-plus"></i> Add Story
                            </button>
                        </div>
                    </div>
                `}
            `;
        } else {
            panel.innerHTML = `
                <div class="panel-header">
                    <strong>${countryName}</strong>
                    <span class="not-visited-badge">○ Not visited</span>
                    <button class="panel-close" onclick="window.wanderLogMap.hideStickyPanel()">&times;</button>
                </div>
                <div class="panel-description">
                    <p>You haven't been to ${countryName} yet. Start planning your adventure!</p>
                    <div class="panel-actions">
                        <button class="btn btn-primary btn-small" onclick="window.wanderLogMap.createStoryForCountry('${countryName}')">
                            <i class="fas fa-plus"></i> Create Story
                        </button>
                    </div>
                </div>
            `;
        }
        
        // Position the panel in a fixed location
        panel.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            color: #333;
            padding: 20px;
            border-radius: 12px;
            font-size: 14px;
            pointer-events: auto;
            z-index: 1001;
            max-width: 300px;
            min-width: 250px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.2);
            border: 1px solid #e0e0e0;
            line-height: 1.5;
            opacity: 0;
            transform: translateX(20px);
            transition: all 0.3s ease;
        `;
        
        document.body.appendChild(panel);
        this.stickyPanel = panel;
        
        // Animate in
        requestAnimationFrame(() => {
            panel.style.opacity = '1';
            panel.style.transform = 'translateX(0)';
        });
        
        // Setup click outside to close
        setTimeout(() => {
            this.setupPanelClickOutside();
        }, 100);
    }

    hideStickyTooltips() {
        // Remove selected styling from country
        if (this.selectedCountry) {
            this.selectedCountry.classList.remove('selected');
            this.selectedCountry = null;
        }
        
        // Remove click outside listener
        if (this.clickOutsideHandler) {
            document.removeEventListener('click', this.clickOutsideHandler);
            this.clickOutsideHandler = null;
        }
    }

    hideStickyPanel() {
        if (this.stickyPanel) {
            this.stickyPanel.style.opacity = '0';
            this.stickyPanel.style.transform = 'translateY(10px)';
            
            setTimeout(() => {
                if (this.stickyPanel && this.stickyPanel.parentNode) {
                    this.stickyPanel.parentNode.removeChild(this.stickyPanel);
                }
                this.stickyPanel = null;
            }, 200);
        }
        
        // Reset sticky state
        this.isPanelSticky = false;
        this.currentHoveredCountry = null;
        
        // Remove selection highlight and reset country appearance
        if (this.selectedCountry) {
            this.selectedCountry.classList.remove('selected');
            this.handleCountryHover(this.selectedCountry, false);
            this.selectedCountry = null;
        }
        
        // Remove click outside listener
        if (this.clickOutsideHandler) {
            document.removeEventListener('click', this.clickOutsideHandler);
            this.clickOutsideHandler = null;
        }
        
        // Clear any pending timeouts
        if (this.hoverTimeout) {
            clearTimeout(this.hoverTimeout);
            this.hoverTimeout = null;
        }
        if (this.hoverPanelTimeout) {
            clearTimeout(this.hoverPanelTimeout);
            this.hoverPanelTimeout = null;
        }
    }

    setupPanelClickOutside() {
        // Remove any existing click outside handler first
        if (this.clickOutsideHandler) {
            document.removeEventListener('click', this.clickOutsideHandler);
        }
        
        this.clickOutsideHandler = (event) => {
            // Don't close if clicking inside the sticky country panel
            const panel = document.querySelector('.country-panel.sticky-panel');
            if (panel && panel.contains(event.target)) {
                return;
            }
            // Find sticky tooltips
            const stickyTooltips = document.querySelectorAll('.map-tooltip.sticky-tooltip');
            // Don't close if clicking on any sticky tooltip
            const clickedOnTooltip = Array.from(stickyTooltips).some(tooltip => 
                tooltip.contains(event.target)
            );
            if (clickedOnTooltip) {
                return;
            }
            // Don't close if clicking on a country - instead, let the country handle its own selection
            const countryElement = this.findCountryElement(event.target);
            if (countryElement) {
                // If clicking on a different country, hide sticky tooltips and let the new one show
                const clickedCountryName = countryElement.getAttribute('data-country');
                const currentCountryName = this.selectedCountry ? this.selectedCountry.getAttribute('data-country') : null;
                if (clickedCountryName !== currentCountryName) {
                    // This will be handled by the selectCountry method
                    return;
                } else {
                    // Clicking the same country - keep tooltip open
                    return;
                }
            }
            // Don't close if clicking on zoom controls or other map UI
            if (event.target.closest('.map-controls') || 
                event.target.closest('.zoom-controls') ||
                event.target.closest('.map-instructions')) {
                return;
            }
            // Close sticky tooltips for any other clicks
            this.hideStickyTooltips();
        };
        // Use setTimeout to add the listener after the current event cycle
        // This prevents the click that opened the tooltip from immediately closing it
        setTimeout(() => {
            document.addEventListener('click', this.clickOutsideHandler);
        }, 100);
    }

    // Clear all visited countries for testing
    clearAllVisited() {
        this.visitedCountries.clear();
        this.countries.forEach((data, countryName) => {
            data.element.classList.remove('visited');
            data.visited = false;
            
            if (data.type === 'group') {
                // Reset all child paths to white
                data.childPaths.forEach(path => {
                    path.style.fill = 'white';
                });
            } else {
                // Reset single path to white
                data.element.style.fill = 'white';
            }
        });
    }
    
    // Test function to mark a few countries as visited
    testVisitedCountries() {
        const testCountries = ['France', 'Japan', 'United States'];
        testCountries.forEach(country => {
            this.visitedCountries.add(country);
            this.markCountryAsVisited(country);
        });
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

    // Zoom and Pan Functionality
    setupZoomAndPan() {
        const svg = this.mapContainer.querySelector('svg');
        if (!svg) {
            // Retry after a delay to allow SVG to load
            setTimeout(() => this.setupZoomAndPan(), 1000);
            return;
        }
        
        // Set initial viewBox if not present
        if (!svg.getAttribute('viewBox')) {
            const bbox = svg.getBBox();
            svg.setAttribute('viewBox', `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`);
            this.originalViewBox = {
                x: bbox.x,
                y: bbox.y,
                width: bbox.width,
                height: bbox.height
            };
        } else {
            const viewBox = svg.getAttribute('viewBox').split(' ').map(Number);
            this.originalViewBox = {
                x: viewBox[0],
                y: viewBox[1],
                width: viewBox[2],
                height: viewBox[3]
            };
        }

        // Add wheel zoom
        this.mapContainer.addEventListener('wheel', (e) => this.handleWheel(e));
        
        // Add mouse drag for panning
        this.mapContainer.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.mapContainer.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.mapContainer.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.mapContainer.addEventListener('mouseleave', (e) => this.handleMouseUp(e));
        
        // Add touch support for mobile
        this.mapContainer.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.mapContainer.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        this.mapContainer.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        
        // Prevent context menu on right click
        this.mapContainer.addEventListener('contextmenu', (e) => e.preventDefault());
        
        this.updateZoomIndicator();
    }

    handleWheel(e) {
        e.preventDefault();
        
        // Throttle wheel events to prevent rapid firing
        const now = Date.now();
        if (now - this.lastZoomTime < this.zoomThrottle) {
            return;
        }
        this.lastZoomTime = now;
        
        const rect = this.mapContainer.getBoundingClientRect();
        
        // Zoom towards mouse position
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const delta = e.deltaY > 0 ? -this.zoomStep : this.zoomStep;
        this.smoothZoomAt(mouseX, mouseY, delta);
    }

    handleMouseDown(e) {
        // Handle left mouse button for both clicking and dragging
        if (e.button === 0) {
            this.mouseDownPoint = { x: e.clientX, y: e.clientY };
            this.isDragging = false;
            this.lastPanPoint = { x: e.clientX, y: e.clientY };
            
            // Prevent text selection during potential drag
            e.preventDefault();
        }
    }

    handleMouseMove(e) {
        if (!this.mouseDownPoint) return;
        
        // Calculate distance moved since mousedown
        const deltaX = e.clientX - this.mouseDownPoint.x;
        const deltaY = e.clientY - this.mouseDownPoint.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // If we've moved beyond threshold, start panning
        if (distance > this.dragThreshold && !this.isDragging) {
            this.isDragging = true;
            this.isPanning = true;
            this.mapContainer.style.cursor = 'grabbing';
            this.disableCountryTransitions();
        }
        
        // If we're panning, continue the pan
        if (this.isPanning) {
            e.preventDefault();
            const panDeltaX = e.clientX - this.lastPanPoint.x;
            const panDeltaY = e.clientY - this.lastPanPoint.y;
            
            this.pan(panDeltaX, panDeltaY);
            this.lastPanPoint = { x: e.clientX, y: e.clientY };
        }
    }

    handleMouseUp(e) {
        if (this.mouseDownPoint) {
            if (this.isPanning) {
                // We were dragging - stop panning
                this.isPanning = false;
                this.mapContainer.style.cursor = '';
                this.enableCountryTransitions();
            } else if (!this.isDragging) {
                // We clicked without dragging - allow country selection
                // Find the country element and select it
                const countryElement = this.findCountryElement(e.target);
                if (countryElement) {
                    this.selectCountry(countryElement);
                }
            }
            
            // Reset mouse state
            this.mouseDownPoint = null;
            this.isDragging = false;
        }
    }

    handleTouchStart(e) {
        if (e.touches.length === 1) {
            this.isPanning = true;
            this.lastPanPoint = { 
                x: e.touches[0].clientX, 
                y: e.touches[0].clientY 
            };
        } else if (e.touches.length === 2) {
            // Pinch zoom setup
            this.isPanning = false;
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            this.lastPinchDistance = Math.sqrt(
                Math.pow(touch2.clientX - touch1.clientX, 2) + 
                Math.pow(touch2.clientY - touch1.clientY, 2)
            );
        }
    }

    handleTouchMove(e) {
        e.preventDefault();
        
        if (e.touches.length === 1 && this.isPanning) {
            const deltaX = e.touches[0].clientX - this.lastPanPoint.x;
            const deltaY = e.touches[0].clientY - this.lastPanPoint.y;
            
            this.pan(deltaX, deltaY);
            this.lastPanPoint = { 
                x: e.touches[0].clientX, 
                y: e.touches[0].clientY 
            };
        } else if (e.touches.length === 2) {
            // Pinch zoom
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            const distance = Math.sqrt(
                Math.pow(touch2.clientX - touch1.clientX, 2) + 
                Math.pow(touch2.clientY - touch1.clientY, 2)
            );
            
            if (this.lastPinchDistance) {
                const scale = distance / this.lastPinchDistance;
                const centerX = (touch1.clientX + touch2.clientX) / 2;
                const centerY = (touch1.clientY + touch2.clientY) / 2;
                
                const rect = this.mapContainer.getBoundingClientRect();
                const relativeX = centerX - rect.left;
                const relativeY = centerY - rect.top;
                
                const delta = (scale - 1) * 0.5; // Scale down the zoom sensitivity
                this.smoothZoomAt(relativeX, relativeY, delta);
            }
            
            this.lastPinchDistance = distance;
        }
    }

    handleTouchEnd(e) {
        this.isPanning = false;
        this.lastPinchDistance = null;
        
        // Reset mouse state for touch compatibility
        this.mouseDownPoint = null;
        this.isDragging = false;
    }

    zoomAt(x, y, delta) {
        const svg = this.mapContainer.querySelector('svg');
        if (!svg) return;
        
        const newZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.currentZoom + delta));
        if (newZoom === this.currentZoom) return;
        
        const rect = this.mapContainer.getBoundingClientRect();
        const viewBox = svg.getAttribute('viewBox').split(' ').map(Number);
        
        // Calculate zoom point in SVG coordinates
        const svgX = viewBox[0] + (x / rect.width) * viewBox[2];
        const svgY = viewBox[1] + (y / rect.height) * viewBox[3];
        
        // Calculate new viewBox dimensions
        const scale = this.currentZoom / newZoom;
        const newWidth = this.originalViewBox.width / newZoom;
        const newHeight = this.originalViewBox.height / newZoom;
        
        // Calculate new viewBox position to keep zoom point centered
        const newX = svgX - (x / rect.width) * newWidth;
        const newY = svgY - (y / rect.height) * newHeight;
        
        this.currentZoom = newZoom;
        this.updateViewBox(newX, newY, newWidth, newHeight);
        this.updateZoomIndicator();
    }

    smoothZoomAt(x, y, delta) {
        // Prevent multiple simultaneous zoom operations
        if (this.isZooming) return;
        
        this.isZooming = true;
        this.disableCountryTransitions();
        
        // Cancel any pending animation frame
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        
        // Use requestAnimationFrame for smooth updates
        this.animationFrame = requestAnimationFrame(() => {
            this.zoomAt(x, y, delta);
            
            // Re-enable transitions after a small delay
            setTimeout(() => {
                this.enableCountryTransitions();
                this.isZooming = false;
            }, 50);
        });
    }

    disableCountryTransitions() {
        const svg = this.mapContainer.querySelector('svg');
        if (svg) {
            svg.classList.add('zooming');
        }
    }

    enableCountryTransitions() {
        const svg = this.mapContainer.querySelector('svg');
        if (svg) {
            svg.classList.remove('zooming');
        }
    }

    pan(deltaX, deltaY) {
        const svg = this.mapContainer.querySelector('svg');
        if (!svg) return;
        
        // Disable transitions during panning
        this.disableCountryTransitions();
        
        const rect = this.mapContainer.getBoundingClientRect();
        const viewBox = svg.getAttribute('viewBox').split(' ').map(Number);
        
        // Convert pixel delta to SVG coordinates
        const svgDeltaX = -(deltaX / rect.width) * viewBox[2];
        const svgDeltaY = -(deltaY / rect.height) * viewBox[3];
        
        this.updateViewBox(
            viewBox[0] + svgDeltaX,
            viewBox[1] + svgDeltaY,
            viewBox[2],
            viewBox[3]
        );
    }

    updateViewBox(x, y, width, height) {
        const svg = this.mapContainer.querySelector('svg');
        if (!svg) return;
        
        // Constrain the view to reasonable bounds
        const maxX = this.originalViewBox.x + this.originalViewBox.width - width;
        const maxY = this.originalViewBox.y + this.originalViewBox.height - height;
        
        x = Math.max(this.originalViewBox.x - width * 0.5, Math.min(maxX + width * 0.5, x));
        y = Math.max(this.originalViewBox.y - height * 0.5, Math.min(maxY + height * 0.5, y));
        
        svg.setAttribute('viewBox', `${x} ${y} ${width} ${height}`);
    }

    updateZoomIndicator() {
        const indicator = document.getElementById('zoomLevel');
        if (indicator) {
            indicator.textContent = `${Math.round(this.currentZoom * 100)}%`;
        }
        
        // Update button states
        const zoomInBtn = document.querySelector('.zoom-in');
        const zoomOutBtn = document.querySelector('.zoom-out');
        
        if (zoomInBtn) {
            zoomInBtn.disabled = this.currentZoom >= this.maxZoom;
        }
        if (zoomOutBtn) {
            zoomOutBtn.disabled = this.currentZoom <= this.minZoom;
        }
    }

    // Public zoom methods for buttons
    zoomIn() {
        const rect = this.mapContainer.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        this.smoothZoomAt(centerX, centerY, this.zoomStep);
    }

    zoomOut() {
        const rect = this.mapContainer.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        this.smoothZoomAt(centerX, centerY, -this.zoomStep);
    }

    resetZoom() {
        const svg = this.mapContainer.querySelector('svg');
        if (!svg || !this.originalViewBox) return;
        
        this.currentZoom = 1;
        svg.setAttribute('viewBox', 
            `${this.originalViewBox.x} ${this.originalViewBox.y} ${this.originalViewBox.width} ${this.originalViewBox.height}`
        );
        this.updateZoomIndicator();
    }
}

// Export for use in other modules
window.WanderLogMap = WanderLogMap; 