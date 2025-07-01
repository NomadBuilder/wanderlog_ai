import os
import functions_framework
import json
from google.cloud import storage
import requests
from datetime import datetime
from flask import make_response, send_from_directory
import uuid

# === 🗺️ MAP INTEGRATION ===
from map_integration import MapIntegration

# Initialize map integration (do this once at startup)
map_integration = MapIntegration()
map_integration.initialize_map()

# === ✅ CONFIG ===
GEMINI_API_KEY = "AIzaSyCuAnb43KSc4knN6QUzD8fVtYQfn5W1bmQ"
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key={GEMINI_API_KEY}"

# Storage buckets for WanderLog AI
TRAVEL_DATA_BUCKET = "wanderlog-ai-data"
STORIES_BUCKET = "wanderlog-ai-stories"

# Initialize storage client with fallback
storage_client = None
use_cloud_storage = False

try:
    storage_client = storage.Client()
    # Test if we can actually access the bucket
    bucket = storage_client.bucket(STORIES_BUCKET)
    # This will raise an exception if bucket doesn't exist
    bucket.reload()  # This forces a check if bucket exists
    use_cloud_storage = True
    print("✅ Using Google Cloud Storage")
except Exception as e:
    print(f"⚠️ Cloud storage not available or bucket doesn't exist: {e}")
    print("📁 Using local file storage instead")
    storage_client = None
    use_cloud_storage = False

# Local storage directory
LOCAL_STORAGE_DIR = "local_stories"
if not os.path.exists(LOCAL_STORAGE_DIR):
    os.makedirs(LOCAL_STORAGE_DIR)

# Helper to add CORS headers to all responses
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS, GET'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    return response

# Static file serving route
@functions_framework.http
def serve_static(request):
    """Serve static files like world-map.svg and wanderlog_ai.html"""
    if request.method == 'OPTIONS':
        response = make_response('', 204)
        return add_cors_headers(response)
    
    # Get the filename from the URL path
    filename = request.path.lstrip('/')
    
    # Security: only serve files in the current directory
    if not filename or '..' in filename or filename.startswith('/'):
        response = make_response('File not found', 404)
        return add_cors_headers(response)
    
    # Check if file exists
    if not os.path.exists(filename):
        response = make_response('File not found', 404)
        return add_cors_headers(response)
    
    # Serve the file
    try:
        response = send_from_directory('.', filename)
        return add_cors_headers(response)
    except Exception as e:
        print(f"Error serving {filename}: {e}")
        response = make_response('Error serving file', 500)
        return add_cors_headers(response)

@functions_framework.http
def wanderlog_ai(request):
    # ✅ CORS preflight
    if request.method == 'OPTIONS':
        response = make_response('', 204)
        return add_cors_headers(response)

    # Special case: GET request to /stories (for modular frontend compatibility)
    if request.method == 'GET':
        # Accept both /stories and /stories/ (trailing slash)
        if request.path.rstrip('/') == '/stories':
            try:
                # For GET requests, we don't need to parse JSON
                # Just return all stories
                stories = []
                if use_cloud_storage and storage_client:
                    try:
                        bucket = storage_client.bucket(STORIES_BUCKET)
                        blobs = bucket.list_blobs(prefix='stories/')
                        for blob in blobs:
                            if blob.name.endswith('.json'):
                                content = blob.download_as_text()
                                story_data = json.loads(content)
                                stories.append(story_data)
                    except Exception as e:
                        print(f"Error retrieving stories: {e}")
                else:
                    # Local storage
                    try:
                        for filename in os.listdir(LOCAL_STORAGE_DIR):
                            if filename.endswith('.json'):
                                filepath = os.path.join(LOCAL_STORAGE_DIR, filename)
                                with open(filepath, 'r') as f:
                                    story_data = json.load(f)
                                    stories.append(story_data)
                    except Exception as e:
                        print(f"Error reading local stories: {e}")
                response_data = {
                    "stories": stories,
                    "count": len(stories),
                    "success": True
                }
                response = make_response(json.dumps(response_data), 200, {'Content-Type': 'application/json'})
                return add_cors_headers(response)
            except Exception as e:
                print(f"Error handling GET /stories: {str(e)}")
                response = make_response(json.dumps({"stories": [], "count": 0, "error": str(e)}), 500)
                return add_cors_headers(response)
        elif request.path == '/' or request.path == '':
            # Handle root path GET requests (browser navigation)
            response = make_response(json.dumps({"message": "WanderLog AI API", "status": "running"}), 200)
            return add_cors_headers(response)
        else:
            # Defensive: absolutely never try to parse JSON for any GET endpoint
            response = make_response(json.dumps({"error": "Not found"}), 404)
            return add_cors_headers(response)

    # Defensive: absolutely never try to parse JSON for any non-POST request
    if request.method != 'POST':
        response = make_response(json.dumps({"error": "POST method required for API actions"}), 405)
        return add_cors_headers(response)

    # Handle POST requests with JSON body
    try:
        request_json = request.get_json()
        if not request_json:
            response = make_response(json.dumps({"error": "Invalid JSON body"}), 400)
            return add_cors_headers(response)
        action = request_json.get("action", "")
        if action == "suggest_cities":
            return add_cors_headers(suggest_cities(request_json))
        elif action == "generate_memory_prompts":
            return add_cors_headers(generate_memory_prompts(request_json))
        elif action == "generate_narrative":
            return add_cors_headers(generate_narrative(request_json))
        elif action == "regenerate_style":
            return add_cors_headers(regenerate_style(request_json))
        elif action == "save_story":
            return add_cors_headers(save_story(request_json))
        elif action == "get_stories":
            return add_cors_headers(get_stories(request_json))
        # === 🗺️ MAP ENDPOINTS ===
        elif action == "get_highlighted_map":
            return add_cors_headers(get_highlighted_map(request_json))
        elif action == "get_map_statistics":
            return add_cors_headers(get_map_statistics(request_json))
        elif action == "export_map_data":
            return add_cors_headers(export_map_data(request_json))
        elif action == "get_country_details":
            return add_cors_headers(get_country_details(request_json))
        elif action == "get_visited_countries":
            # Get stories from storage
            stories_response = get_stories({})
            stories_data = json.loads(stories_response.get_data(as_text=True))
            stories = stories_data.get("stories", [])
            visited_countries = map_integration.get_visited_countries(stories)
            response = make_response(json.dumps({"visited_countries": visited_countries}))
            response.headers['Content-Type'] = 'application/json'
            return add_cors_headers(response)
        else:
            response = make_response(json.dumps({"error": "Invalid action"}), 400)
            return add_cors_headers(response)
    except Exception as e:
        print(f"🔥 EXCEPTION: {str(e)}")
        response = make_response(json.dumps({"error": str(e)}), 500)
        return add_cors_headers(response)

def suggest_cities(request_json):
    """Generate city suggestions for a given country"""
    country = request_json.get("country", "")
    
    prompt = f"""
You are a travel guide expert.  
Given the country name: **{country}**, list 10 cities or regions that most travelers typically visit there — include a mix of famous, hidden gems, and cultural highlights.  
For each city, include a bullet list of 5 iconic activities or sights visitors often do.  
Keep it simple, clear, and diverse.

Format your response as a JSON array with this structure:
[
  {{
    "city": "City Name",
    "activities": [
      "Activity 1",
      "Activity 2", 
      "Activity 3",
      "Activity 4",
      "Activity 5"
    ]
  }}
]

Example for Thailand:
[
  {{
    "city": "Bangkok",
    "activities": [
      "Grand Palace",
      "Street food tour",
      "Chatuchak Market", 
      "Boat ride on Chao Phraya",
      "Nightlife at Khao San Road"
    ]
  }}
]
"""

    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [{"text": prompt}]
            }
        ]
    }
    
    response = requests.post(GEMINI_URL, json=payload)
    response.raise_for_status()
    raw_output = response.json()["candidates"][0]["content"]["parts"][0]["text"]
    
    # Clean and parse JSON
    cleaned = raw_output.strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned.split("```json")[1]
    if cleaned.endswith("```"):
        cleaned = cleaned.rsplit("```", 1)[0]
    
    try:
        cities_data = json.loads(cleaned)
        response = make_response(json.dumps({"cities": cities_data}))
        return response
    except json.JSONDecodeError:
        # Fallback: return structured data even if JSON parsing fails
        response = make_response(json.dumps({"cities": [], "raw_output": cleaned}))
        return response

def generate_memory_prompts(request_json):
    """Generate personalized memory prompts for a city"""
    city = request_json.get("city", "")
    country = request_json.get("country", "")
    
    prompt = f"""
Act as an experienced travel interviewer.  
For the city: **{city}, {country}**, write 5 specific, vivid questions that help a traveler remember what they did there.  
Use casual, friendly language. Cover food, activities, people, surprises.  
Do not repeat generic questions — make them feel personal.

Format your response as a JSON array of questions:
[
  "Question 1?",
  "Question 2?",
  "Question 3?",
  "Question 4?", 
  "Question 5?"
]

Example for Kyoto, Japan:
[
  "Did you visit any temples or gardens that really stuck with you?",
  "What local dish did you try — maybe ramen, matcha sweets, or something unexpected?",
  "Did you walk through Gion? Spot any geishas?",
  "Any hidden alley or shop you stumbled into by accident?",
  "Did you catch any seasonal festival or special event?"
]
"""

    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [{"text": prompt}]
            }
        ]
    }
    
    response = requests.post(GEMINI_URL, json=payload)
    response.raise_for_status()
    raw_output = response.json()["candidates"][0]["content"]["parts"][0]["text"]
    
    # Clean and parse JSON
    cleaned = raw_output.strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned.split("```json")[1]
    if cleaned.endswith("```"):
        cleaned = cleaned.rsplit("```", 1)[0]
    
    try:
        prompts = json.loads(cleaned)
        response = make_response(json.dumps({"prompts": prompts}))
        return response
    except json.JSONDecodeError:
        # Fallback: extract questions from text
        questions = [line.strip() for line in cleaned.split('\n') if line.strip().endswith('?')]
        response = make_response(json.dumps({"prompts": questions[:5]}))
        return response

def generate_narrative(request_json):
    """Convert user answers into a natural travel story with proper formatting"""
    city = request_json.get("city", "")
    country = request_json.get("country", "")
    user_answers = request_json.get("user_answers", [])
    cities = request_json.get("cities", [city]) if request_json.get("cities") else [city]
    visit_date = request_json.get("visit_date", "")
    
    # Combine answers into a single text
    answers_text = "\n".join([f"- {answer}" for answer in user_answers if answer.strip()])
    
    # Format date information
    date_context = ""
    if visit_date:
        try:
            month, year = visit_date.split('/')
            month_names = {
                '01': 'January', '02': 'February', '03': 'March', '04': 'April',
                '05': 'May', '06': 'June', '07': 'July', '08': 'August',
                '09': 'September', '10': 'October', '11': 'November', '12': 'December'
            }
            month_name = month_names.get(month, month)
            date_context = f"**When:** {month_name} {year}\n"
        except:
            date_context = f"**When:** {visit_date}\n"
    
    # Create a more comprehensive prompt for multiple cities with better formatting instructions
    if len(cities) > 1:
        cities_text = ", ".join(cities[:-1]) + f" and {cities[-1]}" if len(cities) > 1 else cities[0]
        prompt = f"""
You are a travel writer helping a traveler write a vivid story about their multi-city experience.  
Combine these memories into a single, engaging first-person narrative that flows naturally between cities.  
Keep the tone warm and descriptive but not too formal.  
Mention all the cities and the country naturally throughout the story.  
If details are missing, do not invent big facts — just keep it realistic and concise.

**IMPORTANT FORMATTING INSTRUCTIONS:**
- Use double line breaks to separate paragraphs
- Use bullet points (-) for lists of activities, foods, or highlights
- Use **bold** for emphasis on key moments or feelings
- Use *italic* for atmospheric descriptions
- Use quotes around memorable phrases or local sayings
- Include section headers like "The Journey", "Arrival", "Exploring", "Highlights", "Memories", "Reflections"
- Make the story visually appealing with proper spacing and structure

**Cities:** {cities_text}, {country}  
{date_context}**Trip Notes:** {answers_text}

Write a compelling 4-5 paragraph story that captures the essence of their multi-city adventure, 
flowing naturally from one city to the next while maintaining a cohesive narrative.
Include the time period naturally in the story if provided.
Structure the story with clear sections and use formatting to make it visually appealing and easy to read.
"""
    else:
        prompt = f"""
You are a travel writer helping a traveler write a vivid short story about their experience.  
Combine these short answers into a single, friendly first-person narrative.  
Keep the tone warm and descriptive but not too formal.  
Mention the city and country naturally.  
If details are missing, do not invent big facts — just keep it realistic and concise.

**IMPORTANT FORMATTING INSTRUCTIONS:**
- Use double line breaks to separate paragraphs
- Use bullet points (-) for lists of activities, foods, or highlights
- Use **bold** for emphasis on key moments or feelings
- Use *italic* for atmospheric descriptions
- Use quotes around memorable phrases or local sayings
- Include section headers like "Arrival", "Exploring", "Highlights", "Memories", "Reflections"
- Make the story visually appealing with proper spacing and structure

**City:** {city}, {country}  
{date_context}**Trip Notes:** {answers_text}

Write a compelling 3-4 paragraph story that captures the essence of their experience.
Include the time period naturally in the story if provided.
Structure the story with clear sections and use formatting to make it visually appealing and easy to read.
"""

    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [{"text": prompt}]
            }
        ]
    }
    
    response = requests.post(GEMINI_URL, json=payload)
    response.raise_for_status()
    narrative = response.json()["candidates"][0]["content"]["parts"][0]["text"]
    
    response = make_response(json.dumps({"narrative": narrative}))
    return response

def regenerate_style(request_json):
    """Regenerate story in different tone"""
    original_text = request_json.get("original_text", "")
    style = request_json.get("style", "casual")
    
    style_prompts = {
        "casual": "casual & funny",
        "poetic": "poetic & dreamy", 
        "punchy": "short & punchy"
    }
    
    prompt = f"""
Rewrite this travel story in a {style_prompts.get(style, style)} tone:

**Original Text:** {original_text}

Keep the same core content but change the writing style to match the requested tone.
"""

    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [{"text": prompt}]
            }
        ]
    }
    
    response = requests.post(GEMINI_URL, json=payload)
    response.raise_for_status()
    new_narrative = response.json()["candidates"][0]["content"]["parts"][0]["text"]
    
    response = make_response(json.dumps({"narrative": new_narrative}))
    return response

def save_story(request_json):
    """Save a completed travel story"""
    story_data = request_json.get("story_data", {})
    
    # Generate unique ID for the story
    story_id = str(uuid.uuid4())
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    
    # Try cloud storage first, then fallback to local
    cloud_error = None
    if use_cloud_storage and storage_client:
        try:
            # Save to Google Cloud Storage
            bucket = storage_client.bucket(STORIES_BUCKET)
            blob = bucket.blob(f"stories/{story_id}_{timestamp}.json")
            blob.upload_from_string(json.dumps(story_data), content_type="application/json")
            return make_response(json.dumps({
                "story_id": story_id,
                "saved": True,
                "url": f"https://storage.googleapis.com/{STORIES_BUCKET}/{blob.name}"
            }))
        except Exception as e:
            print(f"Error saving to cloud storage: {str(e)}")
            cloud_error = str(e)
            # Fallback to local storage
    # Try local storage
    try:
        filename = f"{story_id}_{timestamp}.json"
        filepath = os.path.join(LOCAL_STORAGE_DIR, filename)
        with open(filepath, 'w') as f:
            json.dump(story_data, f, indent=2)
        return make_response(json.dumps({
            "story_id": story_id,
            "saved": True,
            "url": f"local://{filepath}",
            "cloud_error": cloud_error if cloud_error else None
        }))
    except Exception as e:
        print(f"Error saving story locally: {str(e)}")
        return make_response(json.dumps({
            "error": f"Failed to save story: {str(e)}",
            "saved": False,
            "cloud_error": cloud_error if cloud_error else None
        }), 500)

def get_stories(request_json):
    """Retrieve all saved travel stories"""
    try:
        stories = []
        
        if use_cloud_storage and storage_client:
            # Get from Google Cloud Storage
            bucket = storage_client.bucket(STORIES_BUCKET)
            blobs = bucket.list_blobs(prefix="stories/")
            
            for blob in blobs:
                if blob.name.endswith('.json'):
                    content = blob.download_as_text()
                    story_data = json.loads(content)
                    stories.append(story_data)
        else:
            # Get from local storage
            if os.path.exists(LOCAL_STORAGE_DIR):
                for filename in os.listdir(LOCAL_STORAGE_DIR):
                    if filename.endswith('.json'):
                        filepath = os.path.join(LOCAL_STORAGE_DIR, filename)
                        with open(filepath, 'r') as f:
                            story_data = json.load(f)
                            stories.append(story_data)
        
        # Sort by timestamp (newest first)
        stories.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
        
        response = make_response(json.dumps({
            "stories": stories,
            "count": len(stories)
        }))
        return response
        
    except Exception as e:
        print(f"Error retrieving stories: {str(e)}")
        response = make_response(json.dumps({
            "stories": [],
            "count": 0,
            "error": str(e)
        }))
        return response 

# === 🗺️ MAP FUNCTIONS ===

def get_highlighted_map(request_json):
    """Get highlighted SVG map for visited countries"""
    try:
        # Get stories from storage
        stories_response = get_stories({})
        stories_data = json.loads(stories_response.get_data(as_text=True))
        stories = stories_data.get("stories", [])
        
        # Get highlighted map
        highlighted_svg = map_integration.get_highlighted_map(stories)
        
        response = make_response(highlighted_svg)
        response.headers['Content-Type'] = 'image/svg+xml'
        return response
        
    except Exception as e:
        print(f"Error getting highlighted map: {str(e)}")
        response = make_response(json.dumps({"error": str(e)}), 500)
        return response

def get_map_statistics(request_json):
    """Get map statistics"""
    try:
        # Get stories from storage
        stories_response = get_stories({})
        stories_data = json.loads(stories_response.get_data(as_text=True))
        stories = stories_data.get("stories", [])
        
        # Load stories into map integration
        map_integration.load_stories(stories)
        stats = map_integration.get_map_statistics()
        
        response = make_response(json.dumps(stats))
        return response
        
    except Exception as e:
        print(f"Error getting map statistics: {str(e)}")
        response = make_response(json.dumps({"error": str(e)}), 500)
        return response

def export_map_data(request_json):
    """Export map data"""
    try:
        # Get stories from storage
        stories_response = get_stories({})
        stories_data = json.loads(stories_response.get_data(as_text=True))
        stories = stories_data.get("stories", [])
        
        # Load stories into map integration
        map_integration.load_stories(stories)
        
        # Get export format
        format_type = request_json.get('format', 'json')
        export_data = map_integration.export_map_data(format_type)
        
        response = make_response(export_data)
        if format_type == 'csv':
            response.headers['Content-Type'] = 'text/csv'
        else:
            response.headers['Content-Type'] = 'application/json'
        return response
        
    except Exception as e:
        print(f"Error exporting map data: {str(e)}")
        response = make_response(json.dumps({"error": str(e)}), 500)
        return response

def get_country_details(request_json):
    """Get details for a specific country"""
    try:
        country_name = request_json.get("country_name", "")
        if not country_name:
            response = make_response(json.dumps({"error": "Country name required"}), 400)
            return response
        
        # Get stories from storage
        stories_response = get_stories({})
        stories_data = json.loads(stories_response.get_data(as_text=True))
        stories = stories_data.get("stories", [])
        
        # Load stories into map integration
        map_integration.load_stories(stories)
        details = map_integration.get_country_details(country_name)
        
        if details:
            response = make_response(json.dumps(details))
            return response
        else:
            response = make_response(json.dumps({"error": "Country not found"}), 404)
            return response
        
    except Exception as e:
        print(f"Error getting country details: {str(e)}")
        response = make_response(json.dumps({"error": str(e)}), 500)
        return response 