#!/usr/bin/env python3
"""
🌍 Map Country Mapping Module
Handles conversion between country names and ISO codes for SVG map highlighting
"""

import json
import re
from typing import Dict, List, Optional

class CountryMapper:
    """Maps country names to ISO codes and handles variations"""
    
    def __init__(self):
        self.country_to_iso = {
            # Major countries with common variations
            "united states": "US", "usa": "US", "america": "US", "united states of america": "US",
            "canada": "CA",
            "mexico": "MX",
            "brazil": "BR",
            "argentina": "AR",
            "chile": "CL",
            "peru": "PE",
            "colombia": "CO",
            "venezuela": "VE",
            "ecuador": "EC",
            "bolivia": "BO",
            "paraguay": "PY",
            "uruguay": "UY",
            "guyana": "GY",
            "suriname": "SR",
            "french guiana": "GF",
            "falkland islands": "FK",
            
            # Europe
            "united kingdom": "GB", "uk": "GB", "england": "GB", "britain": "GB", "great britain": "GB",
            "france": "FR",
            "germany": "DE", "deutschland": "DE",
            "italy": "IT", "italia": "IT",
            "spain": "ES", "espana": "ES",
            "portugal": "PT",
            "netherlands": "NL", "holland": "NL",
            "belgium": "BE",
            "switzerland": "CH", "swiss": "CH",
            "austria": "AT", "osterreich": "AT",
            "poland": "PL",
            "czech republic": "CZ", "czechia": "CZ",
            "slovakia": "SK",
            "hungary": "HU",
            "romania": "RO",
            "bulgaria": "BG",
            "greece": "GR",
            "turkey": "TR", "turkiye": "TR",
            "russia": "RU", "russian federation": "RU",
            "ukraine": "UA",
            "belarus": "BY",
            "lithuania": "LT",
            "latvia": "LV",
            "estonia": "EE",
            "finland": "FI",
            "sweden": "SE",
            "norway": "NO",
            "denmark": "DK",
            "iceland": "IS",
            "ireland": "IE",
            "scotland": "GB",
            "wales": "GB",
            "northern ireland": "GB",
            
            # Asia
            "china": "CN", "mainland china": "CN",
            "japan": "JP", "nihon": "JP",
            "south korea": "KR", "korea": "KR", "republic of korea": "KR",
            "north korea": "KP", "democratic people's republic of korea": "KP",
            "india": "IN",
            "pakistan": "PK",
            "bangladesh": "BD",
            "sri lanka": "LK",
            "nepal": "NP",
            "bhutan": "BT",
            "myanmar": "MM", "burma": "MM",
            "thailand": "TH",
            "vietnam": "VN",
            "cambodia": "KH",
            "laos": "LA",
            "malaysia": "MY",
            "singapore": "SG",
            "indonesia": "ID",
            "philippines": "PH",
            "taiwan": "TW",
            "hong kong": "HK",
            "macau": "MO",
            "mongolia": "MN",
            "kazakhstan": "KZ",
            "uzbekistan": "UZ",
            "kyrgyzstan": "KG",
            "tajikistan": "TJ",
            "turkmenistan": "TM",
            "afghanistan": "AF",
            "iran": "IR", "persia": "IR",
            "iraq": "IQ",
            "syria": "SY",
            "lebanon": "LB",
            "jordan": "JO",
            "israel": "IL",
            "palestine": "PS",
            "saudi arabia": "SA",
            "yemen": "YE",
            "oman": "OM",
            "uae": "AE", "united arab emirates": "AE",
            "qatar": "QA",
            "kuwait": "KW",
            "bahrain": "BH",
            
            # Africa
            "south africa": "ZA",
            "egypt": "EG",
            "morocco": "MA",
            "algeria": "DZ",
            "tunisia": "TN",
            "libya": "LY",
            "sudan": "SD",
            "ethiopia": "ET",
            "kenya": "KE",
            "tanzania": "TZ",
            "uganda": "UG",
            "nigeria": "NG",
            "ghana": "GH",
            "senegal": "SN",
            "mali": "ML",
            "niger": "NE",
            "chad": "TD",
            "cameroon": "CM",
            "gabon": "GA",
            "congo": "CG",
            "democratic republic of congo": "CD", "drc": "CD",
            "angola": "AO",
            "zambia": "ZM",
            "zimbabwe": "ZW",
            "botswana": "BW",
            "namibia": "NA",
            "mozambique": "MZ",
            "madagascar": "MG",
            "mauritius": "MU",
            "seychelles": "SC",
            
            # Oceania
            "australia": "AU",
            "new zealand": "NZ",
            "fiji": "FJ",
            "papua new guinea": "PG",
            "solomon islands": "SB",
            "vanuatu": "VU",
            "new caledonia": "NC",
            "french polynesia": "PF",
            
            # Caribbean
            "cuba": "CU",
            "jamaica": "JM",
            "haiti": "HT",
            "dominican republic": "DO",
            "puerto rico": "PR",
            "bahamas": "BS",
            "barbados": "BB",
            "trinidad and tobago": "TT",
            "grenada": "GD",
            "st lucia": "LC",
            "st vincent and the grenadines": "VC",
            "antigua and barbuda": "AG",
            "st kitts and nevis": "KN",
            "dominica": "DM",
            
            # Central America
            "guatemala": "GT",
            "belize": "BZ",
            "honduras": "HN",
            "el salvador": "SV",
            "nicaragua": "NI",
            "costa rica": "CR",
            "panama": "PA",
            
            # Additional variations
            "united states of america": "US",
            "united states of america": "US",
            "united states of america": "US",
            "united states of america": "US",
            "united states of america": "US",
            "united states of america": "US",
            "united states of america": "US",
            "united states of america": "US",
            "united states of america": "US",
            "united states of america": "US",
        }
        
        # Create reverse mapping for lookup
        self.iso_to_country = {v: k for k, v in self.country_to_iso.items()}
    
    def normalize_country_name(self, country_name: str) -> str:
        """Normalize country name for consistent matching"""
        if not country_name:
            return ""
        
        # Convert to lowercase and remove extra spaces
        normalized = re.sub(r'\s+', ' ', country_name.lower().strip())
        
        # Remove common prefixes/suffixes
        normalized = re.sub(r'^(the\s+|country\s+of\s+)', '', normalized)
        normalized = re.sub(r'\s+(country|republic|kingdom|empire|federation)$', '', normalized)
        
        return normalized
    
    def get_iso_code(self, country_name: str) -> Optional[str]:
        """Get ISO code for a country name"""
        if not country_name:
            return None
        
        normalized = self.normalize_country_name(country_name)
        
        # Direct match
        if normalized in self.country_to_iso:
            return self.country_to_iso[normalized]
        
        # Partial match (for cases like "United States" vs "United States of America")
        for key, value in self.country_to_iso.items():
            if normalized in key or key in normalized:
                return value
        
        return None
    
    def get_country_name(self, iso_code: str) -> Optional[str]:
        """Get country name from ISO code"""
        if not iso_code:
            return None
        
        return self.iso_to_country.get(iso_code.upper())
    
    def get_visited_countries_from_stories(self, stories: List[Dict]) -> List[str]:
        """Extract visited countries from story data"""
        visited_countries = set()
        
        for story in stories:
            if 'country' in story:
                country = story['country']
                iso_code = self.get_iso_code(country)
                if iso_code:
                    visited_countries.add(iso_code)
        
        return list(visited_countries)
    
    def get_country_centroid(self, country_name: str):
        """Stub for backward compatibility. Returns None. Implement if centroid data is available."""
        return None
    
    def test_mapping(self):
        """Test the country mapping functionality"""
        test_cases = [
            "United States",
            "USA",
            "America",
            "United Kingdom",
            "UK",
            "England",
            "France",
            "Germany",
            "Italy",
            "Spain",
            "Japan",
            "China",
            "India",
            "Australia",
            "Canada",
            "Mexico",
            "Brazil",
            "Argentina",
            "South Africa",
            "Egypt"
        ]
        
        print("🧪 Testing Country Mapping:")
        print("=" * 50)
        
        for country in test_cases:
            iso_code = self.get_iso_code(country)
            if iso_code:
                print(f"✅ {country:20} → {iso_code}")
            else:
                print(f"❌ {country:20} → NOT FOUND")
        
        print("=" * 50)

def main():
    """Main function for testing"""
    mapper = CountryMapper()
    mapper.test_mapping()

if __name__ == "__main__":
    main() 