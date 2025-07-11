// API Module - Handles all backend communication
class WanderLogAPI {
    constructor() {
        // Use relative URL for production (Vercel) or localhost for development
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        this.baseURL = isLocalhost ? 'http://localhost:8080/wanderlog_ai' : '/api/wanderlog_ai';
    }

    async makeRequest(data, method = 'POST') {
        try {
            const options = {
                method,
                headers: {
                    'Content-Type': 'application/json',
                }
            };

            if (data && method !== 'GET') {
                options.body = JSON.stringify(data);
            }

            const response = await fetch(this.baseURL, options);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Suggest cities for a country
    async suggestCities(country) {
        const data = {
            action: 'suggest_cities',
            country: country
        };
        return await this.makeRequest(data);
    }

    // Generate memory prompts for selected cities
    async generateMemoryPrompts(city, country) {
        const data = {
            action: 'generate_memory_prompts',
            city: city,
            country: country
        };
        return await this.makeRequest(data);
    }

    // Generate narrative from memories
    async generateNarrative(memories, cities, country, style = 'Original', length = 'Detailed', layout = 'Classic') {
        const data = {
            action: 'generate_narrative',
            memories: memories,
            cities: cities,
            country: country,
            style: style,
            length: length,
            layout: layout
        };
        return await this.makeRequest(data);
    }

    // Regenerate narrative with different style
    async regenerateStyle(narrative, newStyle, length = 'Detailed', layout = 'Classic') {
        const data = {
            action: 'regenerate_style',
            narrative: narrative,
            style: newStyle,
            length: length,
            layout: layout
        };
        return await this.makeRequest(data);
    }

    // Save a story
    async saveStory(storyData) {
        const data = {
            action: 'save_story',
            ...storyData
        };
        return await this.makeRequest(data);
    }

    // Get all saved stories
    async getStories() {
        const data = {
            action: 'get_stories'
        };
        return await this.makeRequest(data);
    }

    // Map-related APIs
    async getHighlightedMap(countries) {
        const data = {
            action: 'get_highlighted_map',
            countries: countries
        };
        return await this.makeRequest(data);
    }

    async getMapStatistics() {
        const data = {
            action: 'get_map_statistics'
        };
        return await this.makeRequest(data);
    }

    async exportMapData(format = 'json') {
        const data = {
            action: 'export_map_data',
            format: format
        };
        return await this.makeRequest(data);
    }

    async getCountryDetails(country) {
        const data = {
            action: 'get_country_details',
            country: country
        };
        return await this.makeRequest(data);
    }

    async getVisitedCountries() {
        const data = {
            action: 'get_visited_countries'
        };
        return await this.makeRequest(data);
    }

    // Legacy methods for backward compatibility
    async generateStory(prompt, style = 'travelogue') {
        const data = {
            action: 'generate_narrative',
            memories: [{ prompt: prompt }],
            style: style
        };
        return await this.makeRequest(data);
    }

    async loadStories() {
        return await this.getStories();
    }
}

// Add caching layer to API calls
const API_CACHE = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function getCachedData(key) {
    const cached = API_CACHE.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
    }
    return null;
}

function setCachedData(key, data) {
    API_CACHE.set(key, {
        data: data,
        timestamp: Date.now()
    });
}

async function fetchStories() {
    const cacheKey = 'stories';
    const cached = getCachedData(cacheKey);
    if (cached) {
        return cached;
    }
    
    try {
        const api = new WanderLogAPI();
        const data = await api.getStories();
        setCachedData(cacheKey, data);
        return data;
    } catch (error) {
        console.error('Error fetching stories:', error);
        return [];
    }
}

// Export for use in other modules
window.WanderLogAPI = WanderLogAPI; 