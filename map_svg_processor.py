#!/usr/bin/env python3
"""
🗺️ Map SVG Processor Module
Handles SVG map manipulation and country highlighting
"""

import re
import json
from typing import Dict, List, Optional, Tuple
from map_country_mapping import CountryMapper

class SVGMapProcessor:
    """Processes SVG world map and highlights visited countries"""
    
    def __init__(self):
        self.country_mapper = CountryMapper()
        self.svg_content = None
        self.country_elements = {}
        
    def load_svg(self, svg_path: str = "world-map.svg") -> bool:
        """Load SVG file content"""
        try:
            with open(svg_path, 'r', encoding='utf-8') as file:
                self.svg_content = file.read()
            self._extract_country_elements()
            return True
        except FileNotFoundError:
            print(f"❌ SVG file not found: {svg_path}")
            return False
        except Exception as e:
            print(f"❌ Error loading SVG: {e}")
            return False
    
    def _extract_country_elements(self):
        """Extract country elements from SVG"""
        if not self.svg_content:
            return
        
        # Find all path elements that might represent countries
        # Look for elements with id attributes or specific classes
        country_patterns = [
            r'<path[^>]*id="([^"]*)"[^>]*>',  # Paths with IDs
            r'<path[^>]*class="([^"]*)"[^>]*>',  # Paths with classes
            r'<g[^>]*id="([^"]*)"[^>]*>',  # Groups with IDs
        ]
        
        for pattern in country_patterns:
            matches = re.findall(pattern, self.svg_content, re.IGNORECASE)
            for match in matches:
                # Try to map the element ID/class to a country
                iso_code = self._map_element_to_country(match)
                if iso_code:
                    self.country_elements[iso_code] = match
    
    def _map_element_to_country(self, element_id: str) -> Optional[str]:
        """Map SVG element ID to country ISO code"""
        # Common SVG element ID patterns
        element_mappings = {
            # North America
            'us': 'US', 'usa': 'US', 'united-states': 'US', 'unitedstates': 'US',
            'ca': 'CA', 'canada': 'CA',
            'mx': 'MX', 'mexico': 'MX',
            
            # Europe
            'gb': 'GB', 'uk': 'GB', 'united-kingdom': 'GB', 'england': 'GB',
            'fr': 'FR', 'france': 'FR',
            'de': 'DE', 'germany': 'DE', 'deutschland': 'DE',
            'it': 'IT', 'italy': 'IT', 'italia': 'IT',
            'es': 'ES', 'spain': 'ES', 'espana': 'ES',
            'pt': 'PT', 'portugal': 'PT',
            'nl': 'NL', 'netherlands': 'NL', 'holland': 'NL',
            'be': 'BE', 'belgium': 'BE',
            'ch': 'CH', 'switzerland': 'CH', 'swiss': 'CH',
            'at': 'AT', 'austria': 'AT', 'osterreich': 'AT',
            'pl': 'PL', 'poland': 'PL',
            'cz': 'CZ', 'czech-republic': 'CZ', 'czechia': 'CZ',
            'sk': 'SK', 'slovakia': 'SK',
            'hu': 'HU', 'hungary': 'HU',
            'ro': 'RO', 'romania': 'RO',
            'bg': 'BG', 'bulgaria': 'BG',
            'gr': 'GR', 'greece': 'GR',
            'tr': 'TR', 'turkey': 'TR', 'turkiye': 'TR',
            'ru': 'RU', 'russia': 'RU', 'russian-federation': 'RU',
            'ua': 'UA', 'ukraine': 'UA',
            'by': 'BY', 'belarus': 'BY',
            'lt': 'LT', 'lithuania': 'LT',
            'lv': 'LV', 'latvia': 'LV',
            'ee': 'EE', 'estonia': 'EE',
            'fi': 'FI', 'finland': 'FI',
            'se': 'SE', 'sweden': 'SE',
            'no': 'NO', 'norway': 'NO',
            'dk': 'DK', 'denmark': 'DK',
            'is': 'IS', 'iceland': 'IS',
            'ie': 'IE', 'ireland': 'IE',
            
            # Asia
            'cn': 'CN', 'china': 'CN', 'mainland-china': 'CN',
            'jp': 'JP', 'japan': 'JP', 'nihon': 'JP',
            'kr': 'KR', 'south-korea': 'KR', 'korea': 'KR',
            'kp': 'KP', 'north-korea': 'KP',
            'in': 'IN', 'india': 'IN',
            'pk': 'PK', 'pakistan': 'PK',
            'bd': 'BD', 'bangladesh': 'BD',
            'lk': 'LK', 'sri-lanka': 'LK',
            'np': 'NP', 'nepal': 'NP',
            'bt': 'BT', 'bhutan': 'BT',
            'mm': 'MM', 'myanmar': 'MM', 'burma': 'MM',
            'th': 'TH', 'thailand': 'TH',
            'vn': 'VN', 'vietnam': 'VN',
            'kh': 'KH', 'cambodia': 'KH',
            'la': 'LA', 'laos': 'LA',
            'my': 'MY', 'malaysia': 'MY',
            'sg': 'SG', 'singapore': 'SG',
            'id': 'ID', 'indonesia': 'ID',
            'ph': 'PH', 'philippines': 'PH',
            'tw': 'TW', 'taiwan': 'TW',
            'hk': 'HK', 'hong-kong': 'HK',
            'mo': 'MO', 'macau': 'MO',
            'mn': 'MN', 'mongolia': 'MN',
            'kz': 'KZ', 'kazakhstan': 'KZ',
            'uz': 'UZ', 'uzbekistan': 'UZ',
            'kg': 'KG', 'kyrgyzstan': 'KG',
            'tj': 'TJ', 'tajikistan': 'TJ',
            'tm': 'TM', 'turkmenistan': 'TM',
            'af': 'AF', 'afghanistan': 'AF',
            'ir': 'IR', 'iran': 'IR', 'persia': 'IR',
            'iq': 'IQ', 'iraq': 'IQ',
            'sy': 'SY', 'syria': 'SY',
            'lb': 'LB', 'lebanon': 'LB',
            'jo': 'JO', 'jordan': 'JO',
            'il': 'IL', 'israel': 'IL',
            'ps': 'PS', 'palestine': 'PS',
            'sa': 'SA', 'saudi-arabia': 'SA',
            'ye': 'YE', 'yemen': 'YE',
            'om': 'OM', 'oman': 'OM',
            'ae': 'AE', 'uae': 'AE', 'united-arab-emirates': 'AE',
            'qa': 'QA', 'qatar': 'QA',
            'kw': 'KW', 'kuwait': 'KW',
            'bh': 'BH', 'bahrain': 'BH',
            
            # Africa
            'za': 'ZA', 'south-africa': 'ZA',
            'eg': 'EG', 'egypt': 'EG',
            'ma': 'MA', 'morocco': 'MA',
            'dz': 'DZ', 'algeria': 'DZ',
            'tn': 'TN', 'tunisia': 'TN',
            'ly': 'LY', 'libya': 'LY',
            'sd': 'SD', 'sudan': 'SD',
            'et': 'ET', 'ethiopia': 'ET',
            'ke': 'KE', 'kenya': 'KE',
            'tz': 'TZ', 'tanzania': 'TZ',
            'ug': 'UG', 'uganda': 'UG',
            'ng': 'NG', 'nigeria': 'NG',
            'gh': 'GH', 'ghana': 'GH',
            'sn': 'SN', 'senegal': 'SN',
            'ml': 'ML', 'mali': 'ML',
            'ne': 'NE', 'niger': 'NE',
            'td': 'TD', 'chad': 'TD',
            'cm': 'CM', 'cameroon': 'CM',
            'ga': 'GA', 'gabon': 'GA',
            'cg': 'CG', 'congo': 'CG',
            'cd': 'CD', 'drc': 'CD', 'democratic-republic-congo': 'CD',
            'ao': 'AO', 'angola': 'AO',
            'zm': 'ZM', 'zambia': 'ZM',
            'zw': 'ZW', 'zimbabwe': 'ZW',
            'bw': 'BW', 'botswana': 'BW',
            'na': 'NA', 'namibia': 'NA',
            'mz': 'MZ', 'mozambique': 'MZ',
            'mg': 'MG', 'madagascar': 'MG',
            'mu': 'MU', 'mauritius': 'MU',
            'sc': 'SC', 'seychelles': 'SC',
            
            # Oceania
            'au': 'AU', 'australia': 'AU',
            'nz': 'NZ', 'new-zealand': 'NZ',
            'fj': 'FJ', 'fiji': 'FJ',
            'pg': 'PG', 'papua-new-guinea': 'PG',
            'sb': 'SB', 'solomon-islands': 'SB',
            'vu': 'VU', 'vanuatu': 'VU',
            'nc': 'NC', 'new-caledonia': 'NC',
            'pf': 'PF', 'french-polynesia': 'PF',
            
            # South America
            'br': 'BR', 'brazil': 'BR',
            'ar': 'AR', 'argentina': 'AR',
            'cl': 'CL', 'chile': 'CL',
            'pe': 'PE', 'peru': 'PE',
            'co': 'CO', 'colombia': 'CO',
            've': 'VE', 'venezuela': 'VE',
            'ec': 'EC', 'ecuador': 'EC',
            'bo': 'BO', 'bolivia': 'BO',
            'py': 'PY', 'paraguay': 'PY',
            'uy': 'UY', 'uruguay': 'UY',
            'gy': 'GY', 'guyana': 'GY',
            'sr': 'SR', 'suriname': 'SR',
            'gf': 'GF', 'french-guiana': 'GF',
            'fk': 'FK', 'falkland-islands': 'FK',
        }
        
        # Normalize element ID for matching
        normalized_id = element_id.lower().replace('_', '-').replace(' ', '-')
        
        # Direct match
        if normalized_id in element_mappings:
            return element_mappings[normalized_id]
        
        # Partial match
        for key, value in element_mappings.items():
            if key in normalized_id or normalized_id in key:
                return value
        
        return None
    
    def highlight_countries(self, visited_countries: List[str]) -> str:
        """Highlight visited countries on the SVG map"""
        if not self.svg_content:
            print("❌ No SVG content loaded")
            return ""
        
        # Create a copy of the SVG content
        highlighted_svg = self.svg_content
        
        # Define highlight styles
        highlight_style = """
        <style>
        .visited-country {
            fill: #4CAF50 !important;
            stroke: #2E7D32 !important;
            stroke-width: 2 !important;
            opacity: 0.8 !important;
        }
        .visited-country:hover {
            fill: #66BB6A !important;
            opacity: 1 !important;
        }
        </style>
        """
        
        # Add highlight styles to SVG
        if '<style>' not in highlighted_svg:
            # Insert styles after the opening svg tag
            svg_start = highlighted_svg.find('<svg')
            if svg_start != -1:
                svg_end = highlighted_svg.find('>', svg_start) + 1
                highlighted_svg = highlighted_svg[:svg_end] + highlight_style + highlighted_svg[svg_end:]
        
        # Apply highlighting to visited countries
        for country_iso in visited_countries:
            if country_iso in self.country_elements:
                element_id = self.country_elements[country_iso]
                # Add class to the element
                pattern = f'id="{element_id}"'
                replacement = f'id="{element_id}" class="visited-country"'
                highlighted_svg = highlighted_svg.replace(pattern, replacement)
        
        return highlighted_svg
    
    def get_map_data(self, stories: List[Dict]) -> Dict:
        """Generate map data from stories"""
        visited_countries = self.country_mapper.get_visited_countries_from_stories(stories)
        
        return {
            'visited_countries': visited_countries,
            'total_countries': len(visited_countries),
            'world_countries': len(self.country_elements),
            'completion_percentage': round((len(visited_countries) / len(self.country_elements)) * 100, 1) if self.country_elements else 0
        }
    
    def test_svg_processing(self):
        """Test SVG processing functionality"""
        print("🧪 Testing SVG Map Processing:")
        print("=" * 50)
        
        # Test loading SVG
        if self.load_svg():
            print(f"✅ SVG loaded successfully")
            print(f"📊 Found {len(self.country_elements)} country elements")
        else:
            print("❌ Failed to load SVG")
            return
        
        # Test with sample stories
        sample_stories = [
            {'country': 'United States', 'title': 'Trip to NYC'},
            {'country': 'France', 'title': 'Paris Adventure'},
            {'country': 'Japan', 'title': 'Tokyo Experience'},
            {'country': 'Australia', 'title': 'Sydney Visit'}
        ]
        
        map_data = self.get_map_data(sample_stories)
        print(f"🗺️ Map Data: {map_data}")
        
        # Test highlighting
        highlighted_svg = self.highlight_countries(map_data['visited_countries'])
        if highlighted_svg:
            print(f"✅ Country highlighting successful")
            print(f"🎨 Highlighted {len(map_data['visited_countries'])} countries")
        else:
            print("❌ Country highlighting failed")
        
        print("=" * 50)

def main():
    """Main function for testing"""
    processor = SVGMapProcessor()
    processor.test_svg_processing()

if __name__ == "__main__":
    main() 