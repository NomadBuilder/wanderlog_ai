#!/usr/bin/env python3
"""
WanderLog AI Demo Script
Tests the core functionality locally before deployment
"""

import json
import requests
from wanderlog_ai import suggest_cities, generate_memory_prompts, generate_narrative, regenerate_style

def test_city_suggestions():
    """Test city suggestions for Thailand"""
    print("🌍 Testing City Suggestions for Thailand...")
    
    request_data = {"country": "Thailand"}
    result = suggest_cities(request_data)
    
    if result.status_code == 200:
        data = json.loads(result.get_data(as_text=True))
        print(f"✅ Found {len(data.get('cities', []))} cities")
        for city in data.get('cities', [])[:3]:  # Show first 3
            print(f"  📍 {city.get('city', 'Unknown')}")
            for activity in city.get('activities', [])[:2]:  # Show first 2 activities
                print(f"    - {activity}")
    else:
        print(f"❌ Error: {result.get_data(as_text=True)}")
    
    print()

def test_memory_prompts():
    """Test memory prompts for Bangkok"""
    print("💭 Testing Memory Prompts for Bangkok...")
    
    request_data = {"city": "Bangkok", "country": "Thailand"}
    result = generate_memory_prompts(request_data)
    
    if result.status_code == 200:
        data = json.loads(result.get_data(as_text=True))
        print(f"✅ Generated {len(data.get('prompts', []))} prompts")
        for i, prompt in enumerate(data.get('prompts', [])[:3], 1):  # Show first 3
            print(f"  {i}. {prompt}")
    else:
        print(f"❌ Error: {result.get_data(as_text=True)}")
    
    print()

def test_narrative_generation():
    """Test narrative generation"""
    print("📖 Testing Narrative Generation...")
    
    sample_answers = [
        "I visited the Grand Palace and was amazed by the golden spires",
        "Tried street food at Chatuchak Market - the pad thai was incredible",
        "Took a boat ride on the Chao Phraya River at sunset"
    ]
    
    request_data = {
        "city": "Bangkok",
        "country": "Thailand", 
        "user_answers": sample_answers
    }
    result = generate_narrative(request_data)
    
    if result.status_code == 200:
        data = json.loads(result.get_data(as_text=True))
        narrative = data.get('narrative', '')
        print("✅ Generated narrative:")
        print(f"  {narrative[:200]}...")  # Show first 200 chars
    else:
        print(f"❌ Error: {result.get_data(as_text=True)}")
    
    print()

def test_style_regeneration():
    """Test style regeneration"""
    print("🎨 Testing Style Regeneration...")
    
    original_text = "I visited Bangkok, Thailand and had an amazing time exploring the city."
    
    request_data = {
        "original_text": original_text,
        "style": "casual"
    }
    result = regenerate_style(request_data)
    
    if result.status_code == 200:
        data = json.loads(result.get_data(as_text=True))
        new_narrative = data.get('narrative', '')
        print("✅ Regenerated in casual style:")
        print(f"  {new_narrative}")
    else:
        print(f"❌ Error: {result.get_data(as_text=True)}")
    
    print()

def main():
    """Run all tests"""
    print("🚀 WanderLog AI Demo")
    print("=" * 50)
    
    try:
        test_city_suggestions()
        test_memory_prompts()
        test_narrative_generation()
        test_style_regeneration()
        
        print("🎉 All tests completed!")
        print("\n📝 Next steps:")
        print("1. Deploy to Google Cloud Functions: ./deploy_wanderlog.sh")
        print("2. Create storage buckets: gsutil mb gs://wanderlog-ai-data gs://wanderlog-ai-stories")
        print("3. Update API_ENDPOINT in wanderlog_ai.html")
        print("4. Open wanderlog_ai.html in your browser")
        
    except Exception as e:
        print(f"❌ Demo failed: {str(e)}")
        print("Make sure you have the required dependencies installed:")
        print("pip install -r wanderlog_requirements.txt")

if __name__ == "__main__":
    main() 