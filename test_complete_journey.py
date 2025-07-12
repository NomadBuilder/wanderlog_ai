#!/usr/bin/env python3
"""
Comprehensive End-to-End Test for WanderLog AI
Tests the complete user journey from Step 1 to final story creation
"""

import requests
import json
import time
from datetime import datetime

# Configuration
API_BASE_URL = "https://us-central1-ai-test-394019.cloudfunctions.net/wanderlog_ai"

def test_api_call(action, data=None):
    """Test an API call and return the response"""
    payload = {"action": action}
    if data:
        payload.update(data)
    
    try:
        response = requests.post(API_BASE_URL, json=payload, timeout=30)
        response.raise_for_status()
        result = response.json()
        print(f"✅ {action}: SUCCESS")
        return result
    except Exception as e:
        print(f"❌ {action}: FAILED - {str(e)}")
        return None

def test_complete_journey():
    """Test the complete user journey"""
    print("🚀 STARTING COMPREHENSIVE END-TO-END TEST")
    print("=" * 60)
    
    # Step 1: Health Check
    print("\n📋 STEP 1: Health Check")
    print("-" * 30)
    health_result = test_api_call("health_check")
    if not health_result:
        print("❌ Health check failed - stopping test")
        return False
    
    # Step 2: Get Stories (Initial Load)
    print("\n📋 STEP 2: Load Existing Stories")
    print("-" * 30)
    stories_result = test_api_call("get_stories")
    if not stories_result:
        print("❌ Failed to load stories")
        return False
    
    # Step 3: Country Selection & City Suggestions
    print("\n📋 STEP 3: Country Selection & City Suggestions")
    print("-" * 30)
    test_countries = ["France", "Japan", "Italy"]
    
    for country in test_countries:
        print(f"\n🌍 Testing country: {country}")
        cities_result = test_api_call("suggest_cities", {"country": country})
        if not cities_result or not cities_result.get("success"):
            print(f"❌ Failed to get cities for {country}")
            continue
        
        cities = cities_result.get("cities", [])
        print(f"✅ Found {len(cities)} cities for {country}")
        
        # Test memory prompts for first city
        if cities:
            first_city = cities[0]
            print(f"🏙️ Testing memory prompts for: {first_city}")
            prompts_result = test_api_call("generate_memory_prompts", {
                "city": first_city,
                "country": country
            })
            
            if prompts_result and prompts_result.get("success"):
                prompts = prompts_result.get("prompts", [])
                print(f"✅ Generated {len(prompts)} memory prompts")
                
                # Test narrative generation
                print(f"📝 Testing narrative generation for {country}")
                narrative_result = test_api_call("generate_narrative", {
                    "memories": prompts[:3],  # Use first 3 prompts
                    "cities": [first_city],
                    "country": country,
                    "style": "personal",
                    "length": "detailed",
                    "layout": "classic"
                })
                
                if narrative_result and narrative_result.get("success"):
                    print("✅ Narrative generated successfully")
                    
                    # Test style regeneration
                    print("🎨 Testing style regeneration")
                    style_result = test_api_call("regenerate_style", {
                        "narrative": narrative_result.get("narrative", ""),
                        "style": "adventure",
                        "length": "detailed",
                        "layout": "classic"
                    })
                    
                    if style_result and style_result.get("success"):
                        print("✅ Style regeneration successful")
                        
                        # Test story saving
                        print("💾 Testing story saving")
                        save_result = test_api_call("save_story", {
                            "title": f"Test Story - {country}",
                            "country": country,
                            "cities": [first_city],
                            "narrative": style_result.get("narrative", ""),
                            "style": "adventure",
                            "visit_date": "2024-07-12",
                            "photos": []
                        })
                        
                        if save_result and save_result.get("success"):
                            print("✅ Story saved successfully")
                        else:
                            print("❌ Failed to save story")
                    else:
                        print("❌ Style regeneration failed")
                else:
                    print("❌ Narrative generation failed")
            else:
                print("❌ Memory prompts generation failed")
    
    # Step 4: Map Functionality
    print("\n📋 STEP 4: Map Functionality")
    print("-" * 30)
    
    # Test map statistics
    print("🗺️ Testing map statistics")
    stats_result = test_api_call("get_map_statistics")
    if stats_result and stats_result.get("success"):
        print("✅ Map statistics retrieved")
    else:
        print("❌ Failed to get map statistics")
    
    # Test highlighted map
    print("🎯 Testing highlighted map")
    highlight_result = test_api_call("get_highlighted_map", {
        "countries": ["France", "Japan", "Italy"]
    })
    if highlight_result and highlight_result.get("success"):
        print("✅ Highlighted map generated")
    else:
        print("❌ Failed to generate highlighted map")
    
    # Test country details
    print("📊 Testing country details")
    details_result = test_api_call("get_country_details", {
        "country": "France"
    })
    if details_result and details_result.get("success"):
        print("✅ Country details retrieved")
    else:
        print("❌ Failed to get country details")
    
    # Step 5: Final Stories Check
    print("\n📋 STEP 5: Final Stories Check")
    print("-" * 30)
    final_stories = test_api_call("get_stories")
    if final_stories and final_stories.get("success"):
        stories = final_stories.get("stories", [])
        print(f"✅ Final stories count: {len(stories)}")
    else:
        print("❌ Failed to get final stories")
    
    # Step 6: Export Functionality
    print("\n📋 STEP 6: Export Functionality")
    print("-" * 30)
    export_result = test_api_call("export_map_data", {
        "format": "json"
    })
    if export_result and export_result.get("success"):
        print("✅ Map data export successful")
    else:
        print("❌ Failed to export map data")
    
    print("\n" + "=" * 60)
    print("🎉 COMPREHENSIVE END-TO-END TEST COMPLETED!")
    print("=" * 60)
    return True

if __name__ == "__main__":
    start_time = time.time()
    success = test_complete_journey()
    end_time = time.time()
    
    print(f"\n⏱️ Total test time: {end_time - start_time:.2f} seconds")
    print(f"📊 Test result: {'PASSED' if success else 'FAILED'}") 