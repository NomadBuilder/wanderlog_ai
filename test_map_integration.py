#!/usr/bin/env python3
"""
🧪 Test Map Integration
Tests the map integration with the main WanderLog app
"""

import requests
import json

def test_map_endpoints():
    """Test all map endpoints using the correct POST format"""
    base_url = "http://127.0.0.1:8080"
    
    print("🧪 Testing Map Integration with WanderLog AI")
    print("=" * 60)
    
    # Test 1: Get map statistics
    print("📊 Testing map statistics...")
    try:
        response = requests.post(base_url, json={
            "action": "get_map_statistics"
        })
        if response.status_code == 200:
            stats = response.json()
            print(f"✅ Map statistics: {stats}")
        else:
            print(f"❌ Failed to get map statistics: {response.status_code}")
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"❌ Error testing map statistics: {e}")
    
    # Test 2: Get highlighted map
    print("\n🗺️ Testing highlighted map...")
    try:
        response = requests.post(base_url, json={
            "action": "get_highlighted_map"
        })
        if response.status_code == 200:
            print(f"✅ Highlighted map retrieved successfully!")
            print(f"Content length: {len(response.text)} characters")
            if response.text.startswith('<svg'):
                print("✅ Valid SVG content received")
            else:
                print("⚠️ Response is not SVG format")
        else:
            print(f"❌ Failed to get highlighted map: {response.status_code}")
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"❌ Error testing highlighted map: {e}")
    
    # Test 3: Get visited countries
    print("\n🌍 Testing visited countries...")
    try:
        response = requests.post(base_url, json={
            "action": "get_visited_countries"
        })
        if response.status_code == 200:
            countries = response.json()
            print(f"✅ Visited countries: {countries}")
        else:
            print(f"❌ Failed to get visited countries: {response.status_code}")
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"❌ Error testing visited countries: {e}")
    
    # Test 4: Get country details
    print("\n🏛️ Testing country details...")
    try:
        response = requests.post(base_url, json={
            "action": "get_country_details",
            "country_name": "France"
        })
        if response.status_code == 200:
            details = response.json()
            print(f"✅ Country details: {details}")
        else:
            print(f"❌ Failed to get country details: {response.status_code}")
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"❌ Error testing country details: {e}")
    
    # Test 5: Export map data
    print("\n📤 Testing map export...")
    try:
        response = requests.post(base_url, json={
            "action": "export_map_data"
        })
        if response.status_code == 200:
            export_data = response.json()
            print(f"✅ Map export successful!")
            print(f"Export contains: {len(export_data.get('countries', []))} countries")
        else:
            print(f"❌ Failed to export map data: {response.status_code}")
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"❌ Error testing map export: {e}")
    
    print("\n" + "=" * 60)
    print("🎉 Map Integration Test Complete!")

def test_with_sample_story():
    """Test map with a sample story"""
    base_url = "http://127.0.0.1:8080"
    
    print("📝 Testing map with sample story...")
    print("=" * 60)
    
    # First, save a sample story
    sample_story = {
        "title": "Test Trip to France",
        "country": "France",
        "city": "Paris",
        "narrative": "Amazing time in Paris!",
        "timestamp": "2025-06-29T12:00:00Z"
    }
    
    try:
        response = requests.post(base_url, json={
            "action": "save_story",
            "story_data": sample_story
        })
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Sample story saved: {result}")
            
            # Now test map with the story
            print("\n🗺️ Testing map with saved story...")
            
            # Get statistics
            stats_response = requests.post(base_url, json={
                "action": "get_map_statistics"
            })
            
            if stats_response.status_code == 200:
                stats = stats_response.json()
                print(f"✅ Updated statistics: {stats}")
            else:
                print(f"❌ Failed to get updated statistics: {stats_response.status_code}")
                
        else:
            print(f"❌ Failed to save sample story: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error testing with sample story: {e}")

if __name__ == "__main__":
    test_map_endpoints()
    print("\n" + "=" * 60)
    test_with_sample_story() 