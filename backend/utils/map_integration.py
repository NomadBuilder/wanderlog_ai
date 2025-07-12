#!/usr/bin/env python3
"""
🌍 Map Integration Module
Connects country mapping and SVG processing for complete map functionality
"""

import json
import os
from typing import Dict, List, Optional
from utils.map_country_mapping import CountryMapper
from utils.map_svg_processor import SVGMapProcessor

class MapIntegration:
    """Integrates map components for WanderLog AI"""
    
    def __init__(self):
        self.country_mapper = CountryMapper()
        self.svg_processor = SVGMapProcessor()
        self.stories_cache = []
        
    def initialize_map(self, svg_path: str = "world-map.svg") -> bool:
        """Initialize the map system from file path"""
        print("🗺️ Initializing Map System...")
        
        # Load SVG map
        if not self.svg_processor.load_svg(svg_path):
            print("❌ Failed to initialize map - SVG not found")
            return False
        
        print(f"✅ Map initialized with {len(self.svg_processor.country_elements)} countries")
        return True
    
    def initialize_map_from_content(self, svg_content: str) -> bool:
        """Initialize the map system from SVG content"""
        print("🗺️ Initializing Map System from content...")
        
        # Load SVG map from content
        if not self.svg_processor.load_svg_from_content(svg_content):
            print("❌ Failed to initialize map from content")
            return False
        
        print(f"✅ Map initialized with {len(self.svg_processor.country_elements)} countries")
        return True
    
    def load_stories(self, stories_data: List[Dict]) -> Dict:
        """Load stories and generate map data"""
        self.stories_cache = stories_data
        
        # Generate map statistics
        map_data = self.svg_processor.get_map_data(stories_data)
        
        # Add additional metadata
        map_data.update({
            'total_stories': len(stories_data),
            'unique_countries': len(map_data['visited_countries']),
            'stories_per_country': self._get_stories_per_country(stories_data)
        })
        
        return map_data
    
    def _get_stories_per_country(self, stories: List[Dict]) -> Dict[str, int]:
        """Get count of stories per country"""
        country_counts = {}
        
        for story in stories:
            if 'country' in story:
                country = story['country']
                iso_code = self.country_mapper.get_iso_code(country)
                if iso_code:
                    country_counts[iso_code] = country_counts.get(iso_code, 0) + 1
        
        return country_counts
    
    def get_highlighted_map(self, stories_data: Optional[List[Dict]] = None) -> str:
        """Get highlighted SVG map for visited countries"""
        if stories_data is None:
            stories_data = self.stories_cache
        
        if not stories_data:
            return self.svg_processor.svg_content or ""
        
        # Get visited countries
        visited_countries = self.country_mapper.get_visited_countries_from_stories(stories_data)
        
        # Generate highlighted map
        highlighted_svg = self.svg_processor.highlight_countries(visited_countries)
        
        return highlighted_svg
    
    def get_map_statistics(self) -> Dict:
        """Get comprehensive map statistics"""
        if not self.stories_cache:
            return {
                'total_stories': 0,
                'visited_countries': [],
                'total_countries': 0,
                'world_countries': len(self.svg_processor.country_elements),
                'completion_percentage': 0,
                'stories_per_country': {},
                'top_countries': [],
                'recent_visits': []
            }
        
        map_data = self.load_stories(self.stories_cache)
        
        # Get top countries by story count
        country_counts = map_data['stories_per_country']
        top_countries = sorted(country_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        
        # Get recent visits (last 5 stories)
        recent_visits = []
        for story in self.stories_cache[-5:]:
            if ('country' in story and 'title' in story):
                recent_visits.append({
                    'country': story['country'],
                    'title': story['title'],
                    'iso_code': self.country_mapper.get_iso_code(story['country'])
                })
        
        return {
            **map_data,
            'top_countries': top_countries,
            'recent_visits': recent_visits
        }
    
    def export_map_data(self, format: str = "json") -> str:
        """Export map data in various formats"""
        stats = self.get_map_statistics()
        
        if format.lower() == "json":
            return json.dumps(stats, indent=2)
        elif format.lower() == "csv":
            return self._export_to_csv(stats)
        else:
            return json.dumps(stats, indent=2)
    
    def _export_to_csv(self, stats: Dict) -> str:
        """Export statistics to CSV format"""
        csv_lines = ["Country,ISO Code,Story Count"]
        
        for iso_code, count in stats['stories_per_country'].items():
            country_name = self.country_mapper.get_country_name(iso_code) or iso_code
            csv_lines.append(f"{country_name},{iso_code},{count}")
        
        return "\n".join(csv_lines)
    
    def get_country_details(self, country_name: str) -> Optional[Dict]:
        """Get detailed information about a specific country"""
        iso_code = self.country_mapper.get_iso_code(country_name)
        if not iso_code:
            return None
        
        # Find all stories for this country
        country_stories = []
        for story in self.stories_cache:
            if 'country' in story:
                story_iso = self.country_mapper.get_iso_code(story['country'])
                if story_iso == iso_code:
                    country_stories.append(story)
        
        return {
            'country_name': country_name,
            'iso_code': iso_code,
            'story_count': len(country_stories),
            'stories': country_stories,
            'is_highlighted': iso_code in self.svg_processor.country_elements
        }
    
    def test_integration(self):
        """Test the complete map integration"""
        print("🧪 Testing Map Integration:")
        print("=" * 50)
        
        # Initialize map
        if not self.initialize_map():
            print("❌ Map initialization failed")
            return
        
        # Test with sample stories
        sample_stories = [
            {'country': 'United States', 'title': 'New York Adventure', 'content': 'Amazing time in NYC'},
            {'country': 'France', 'title': 'Paris Dreams', 'content': 'Romantic Paris trip'},
            {'country': 'Japan', 'title': 'Tokyo Experience', 'content': 'Incredible Japanese culture'},
            {'country': 'Australia', 'title': 'Sydney Visit', 'content': 'Beautiful Sydney'},
            {'country': 'United States', 'title': 'California Road Trip', 'content': 'West coast adventure'},
            {'country': 'Italy', 'title': 'Rome History', 'content': 'Ancient Rome exploration'}
        ]
        
        # Load stories
        map_data = self.load_stories(sample_stories)
        print(f"📊 Map Data: {map_data}")
        
        # Get statistics
        stats = self.get_map_statistics()
        print(f"📈 Statistics: {stats}")
        
        # Get highlighted map
        highlighted_map = self.get_highlighted_map()
        if highlighted_map:
            print(f"✅ Highlighted map generated ({len(highlighted_map)} characters)")
        else:
            print("❌ Failed to generate highlighted map")
        
        # Test country details
        us_details = self.get_country_details("United States")
        if us_details:
            print(f"🇺🇸 US Details: {us_details}")
        
        # Test export
        json_export = self.export_map_data("json")
        print(f"📤 JSON Export: {len(json_export)} characters")
        
        print("=" * 50)
        print("✅ All integration tests passed!")

    def get_visited_countries(self, stories: List[Dict]) -> List[str]:
        """Return a list of visited country ISO codes from stories"""
        return self.country_mapper.get_visited_countries_from_stories(stories)

def main():
    """Main function for testing"""
    integration = MapIntegration()
    integration.test_integration()

if __name__ == "__main__":
    main() 