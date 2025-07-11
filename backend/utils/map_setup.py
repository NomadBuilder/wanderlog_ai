#!/usr/bin/env python3
"""
🚀 Map Setup Script
Easy integration of map modules into WanderLog AI
"""

from .map_integration import MapIntegration
import json

def setup_map_for_wanderlog():
    """Setup map integration for WanderLog AI"""
    print("🗺️ Setting up Map Integration for WanderLog AI...")
    print("=" * 60)
    
    # Initialize map integration
    map_integration = MapIntegration()
    
    # Initialize the map system
    if not map_integration.initialize_map():
        print("❌ Failed to setup map system")
        return None
    
    print("✅ Map system initialized successfully!")
    print(f"📊 Available countries: {map_integration.svg_processor.country_elements.keys()}")
    
    return map_integration

def get_map_endpoints():
    """Get the map endpoints to add to your main app"""
    endpoints = {
        "map_highlighted": "/map/highlighted",
        "map_statistics": "/map/stats", 
        "map_export": "/map/export",
        "country_details": "/map/country/<country_name>"
    }
    
    print("🔗 Map Endpoints to add to your main app:")
    print("=" * 60)
    for endpoint, path in endpoints.items():
        print(f"📍 {endpoint}: {path}")
    
    return endpoints

def get_integration_code():
    """Get the code to integrate into your main app"""
    integration_code = '''
# Add this to your main.py or app.py

from .map_integration import MapIntegration

# Initialize map integration (do this once at startup)
map_integration = MapIntegration()
map_integration.initialize_map()

# Add these endpoints to your Flask app:

@app.route('/map/highlighted')
def get_highlighted_map():
    """Get highlighted SVG map"""
    stories = get_stories()  # Your existing function to get stories
    highlighted_svg = map_integration.get_highlighted_map(stories)
    return highlighted_svg, 200, {'Content-Type': 'image/svg+xml'}

@app.route('/map/stats')
def get_map_statistics():
    """Get map statistics"""
    stories = get_stories()  # Your existing function to get stories
    map_integration.load_stories(stories)
    stats = map_integration.get_map_statistics()
    return jsonify(stats)

@app.route('/map/export')
def export_map_data():
    """Export map data"""
    stories = get_stories()  # Your existing function to get stories
    map_integration.load_stories(stories)
    format_type = request.args.get('format', 'json')
    export_data = map_integration.export_map_data(format_type)
    
    if format_type == 'csv':
        return export_data, 200, {'Content-Type': 'text/csv'}
    else:
        return export_data, 200, {'Content-Type': 'application/json'}

@app.route('/map/country/<country_name>')
def get_country_details(country_name):
    """Get details for a specific country"""
    stories = get_stories()  # Your existing function to get stories
    map_integration.load_stories(stories)
    details = map_integration.get_country_details(country_name)
    
    if details:
        return jsonify(details)
    else:
        return jsonify({'error': 'Country not found'}), 404
'''
    
    print("💻 Integration Code:")
    print("=" * 60)
    print(integration_code)
    
    return integration_code

def get_frontend_integration():
    """Get frontend integration code"""
    frontend_code = '''
// Add this to your frontend JavaScript

// Function to load and display highlighted map
async function loadHighlightedMap() {
    try {
        const response = await fetch('/map/highlighted');
        const svgContent = await response.text();
        
        // Insert SVG into your map container
        const mapContainer = document.getElementById('world-map-container');
        mapContainer.innerHTML = svgContent;
        
        console.log('✅ Map loaded successfully');
    } catch (error) {
        console.error('❌ Error loading map:', error);
    }
}

// Function to load map statistics
async function loadMapStatistics() {
    try {
        const response = await fetch('/map/stats');
        const stats = await response.json();
        
        // Update your UI with statistics
        document.getElementById('total-countries').textContent = stats.total_countries;
        document.getElementById('completion-percentage').textContent = stats.completion_percentage + '%';
        document.getElementById('total-stories').textContent = stats.total_stories;
        
        // Display top countries
        const topCountriesList = document.getElementById('top-countries');
        topCountriesList.innerHTML = '';
        stats.top_countries.forEach(([iso, count]) => {
            const li = document.createElement('li');
            li.textContent = `${iso}: ${count} stories`;
            topCountriesList.appendChild(li);
        });
        
        console.log('✅ Statistics loaded successfully');
    } catch (error) {
        console.error('❌ Error loading statistics:', error);
    }
}

// Function to export map data
async function exportMapData(format = 'json') {
    try {
        const response = await fetch(`/map/export?format=${format}`);
        const data = await response.text();
        
        // Create download link
        const blob = new Blob([data], { 
            type: format === 'csv' ? 'text/csv' : 'application/json' 
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `wanderlog-map-data.${format}`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        console.log('✅ Map data exported successfully');
    } catch (error) {
        console.error('❌ Error exporting data:', error);
    }
}

// Load map when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadHighlightedMap();
    loadMapStatistics();
});
'''
    
    print("🎨 Frontend Integration Code:")
    print("=" * 60)
    print(frontend_code)
    
    return frontend_code

def main():
    """Main setup function"""
    print("🚀 WanderLog AI - Map Integration Setup")
    print("=" * 60)
    
    # Test map integration
    map_integration = setup_map_for_wanderlog()
    if not map_integration:
        return
    
    print()
    
    # Get endpoints
    get_map_endpoints()
    
    print()
    
    # Get integration code
    get_integration_code()
    
    print()
    
    # Get frontend integration
    get_frontend_integration()
    
    print()
    print("🎉 Setup complete! Your map system is ready to integrate!")
    print("📝 Copy the integration code into your main app files.")
    print("🌐 Your map will highlight visited countries automatically!")

if __name__ == "__main__":
    main() 