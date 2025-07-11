import os
import functions_framework
import json
from google.cloud import storage
import requests
from datetime import datetime
from flask import make_response, send_from_directory
import uuid
import sqlite3
import hashlib
import secrets
from datetime import datetime, timedelta
from dotenv import load_dotenv

# === 🗺️ MAP INTEGRATION ===
from utils.map_integration import *

# Resolve SVG path relative to project root
svg_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "assets", "maps", "world-map.svg")

# Initialize map integration (do this once at startup)
map_integration = MapIntegration()
map_integration.initialize_map(svg_path)

# === Load environment variables from .env if present ===
load_dotenv()

# === ✅ CONFIG (from environment) ===
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
TRAVEL_DATA_BUCKET = os.environ.get("TRAVEL_DATA_BUCKET")
STORIES_BUCKET = os.environ.get("STORIES_BUCKET")
DB_PATH = os.environ.get("DB_PATH", "wanderlog_users.db")

# Gemini API URL (constructed from key)
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key={GEMINI_API_KEY}"

# Check required variables
missing_vars = []
if not GEMINI_API_KEY:
    missing_vars.append("GEMINI_API_KEY")
if not TRAVEL_DATA_BUCKET:
    missing_vars.append("TRAVEL_DATA_BUCKET")
if not STORIES_BUCKET:
    missing_vars.append("STORIES_BUCKET")
if missing_vars:
    raise RuntimeError(f"Missing required environment variables: {', '.join(missing_vars)}. Please set them in your .env file or environment.")

# Remove old hardcoded config assignments below this point

# Storage buckets for WanderLog AI
# TRAVEL_DATA_BUCKET = "wanderlog-ai-data"
# STORIES_BUCKET = "wanderlog-ai-stories"

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
LOCAL_STORAGE_DIR = "backend/data/stories"
if not os.path.exists(LOCAL_STORAGE_DIR):
    os.makedirs(LOCAL_STORAGE_DIR)

# === 🔐 USER DATABASE SETUP ===
DB_PATH = "wanderlog_users.db"

def init_database():
    """Initialize SQLite database with user tables"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            name TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP
        )
    ''')
    
    # User sessions table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER REFERENCES users(id),
            session_token TEXT UNIQUE NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # User preferences table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_preferences (
            user_id INTEGER PRIMARY KEY REFERENCES users(id),
            default_story_length TEXT DEFAULT 'detailed',
            default_story_style TEXT DEFAULT 'original',
            public_profile BOOLEAN DEFAULT FALSE
        )
    ''')
    
    conn.commit()
    conn.close()
    print("✅ User database initialized")

# Initialize database on startup
init_database()

# === 🔐 AUTHENTICATION HELPER FUNCTIONS ===
def hash_password(password):
    """Hash a password with salt"""
    salt = secrets.token_hex(16)
    pwd_hash = hashlib.sha256((password + salt).encode()).hexdigest()
    return f"{salt}:{pwd_hash}"

def verify_password(password, stored_hash):
    """Verify a password against stored hash"""
    try:
        salt, pwd_hash = stored_hash.split(':')
        return hashlib.sha256((password + salt).encode()).hexdigest() == pwd_hash
    except:
        return False

def generate_session_token():
    """Generate a secure session token"""
    return secrets.token_urlsafe(32)

def create_user(email, password, name):
    """Create a new user account"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Check if user already exists
        cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
        if cursor.fetchone():
            conn.close()
            return {"success": False, "error": "Email already registered"}
        
        # Create user
        password_hash = hash_password(password)
        cursor.execute("""
            INSERT INTO users (email, password_hash, name) 
            VALUES (?, ?, ?)
        """, (email, password_hash, name))
        
        user_id = cursor.lastrowid
        
        # Create default preferences
        cursor.execute("""
            INSERT INTO user_preferences (user_id) VALUES (?)
        """, (user_id,))
        
        conn.commit()
        conn.close()
        
        return {
            "success": True, 
            "user_id": user_id,
            "message": "Account created successfully"
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

def authenticate_user(email, password):
    """Authenticate user and create session"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Get user
        cursor.execute("""
            SELECT id, password_hash, name FROM users WHERE email = ?
        """, (email,))
        user = cursor.fetchone()
        
        if not user or not verify_password(password, user[1]):
            conn.close()
            return {"success": False, "error": "Invalid email or password"}
        
        user_id, _, name = user
        
        # Create session
        session_token = generate_session_token()
        expires_at = datetime.now() + timedelta(days=30)  # 30 day session
        
        cursor.execute("""
            INSERT INTO user_sessions (user_id, session_token, expires_at)
            VALUES (?, ?, ?)
        """, (user_id, session_token, expires_at))
        
        # Update last login
        cursor.execute("""
            UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?
        """, (user_id,))
        
        conn.commit()
        conn.close()
        
        return {
            "success": True,
            "session_token": session_token,
            "user": {
                "id": user_id,
                "email": email,
                "name": name
            }
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

def validate_session(session_token):
    """Validate session token and return user info"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT s.user_id, u.email, u.name 
            FROM user_sessions s 
            JOIN users u ON s.user_id = u.id 
            WHERE s.session_token = ? AND s.expires_at > CURRENT_TIMESTAMP
        """, (session_token,))
        
        result = cursor.fetchone()
        conn.close()
        
        if result:
            return {
                "valid": True,
                "user": {
                    "id": result[0],
                    "email": result[1],
                    "name": result[2]
                }
            }
        else:
            return {"valid": False}
    except Exception as e:
        return {"valid": False, "error": str(e)}

def logout_user(session_token):
    """Logout user by removing session"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("DELETE FROM user_sessions WHERE session_token = ?", (session_token,))
        conn.commit()
        conn.close()
        return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}

# === 🔐 AUTHENTICATION ENDPOINT HANDLERS ===
def handle_register(request_json):
    """Handle user registration"""
    email = request_json.get("email", "").strip().lower()
    password = request_json.get("password", "")
    name = request_json.get("name", "").strip()
    
    # Basic validation
    if not email or "@" not in email:
        response = make_response(json.dumps({"success": False, "error": "Valid email required"}), 400)
        response.headers['Content-Type'] = 'application/json'
        return response
    
    if len(password) < 6:
        response = make_response(json.dumps({"success": False, "error": "Password must be at least 6 characters"}), 400)
        response.headers['Content-Type'] = 'application/json'
        return response
        
    if not name:
        response = make_response(json.dumps({"success": False, "error": "Name is required"}), 400)
        response.headers['Content-Type'] = 'application/json'
        return response
    
    # Create user
    result = create_user(email, password, name)
    
    if result["success"]:
        response = make_response(json.dumps(result), 201)
    else:
        status_code = 409 if "already registered" in result["error"] else 400
        response = make_response(json.dumps(result), status_code)
    
    response.headers['Content-Type'] = 'application/json'
    return response

def handle_login(request_json):
    """Handle user login"""
    email = request_json.get("email", "").strip().lower()
    password = request_json.get("password", "")
    
    if not email or not password:
        response = make_response(json.dumps({"success": False, "error": "Email and password required"}), 400)
        response.headers['Content-Type'] = 'application/json'
        return response
    
    # Authenticate user
    result = authenticate_user(email, password)
    
    if result["success"]:
        response = make_response(json.dumps(result), 200)
    else:
        response = make_response(json.dumps(result), 401)
    
    response.headers['Content-Type'] = 'application/json'
    return response

def handle_logout(request_json):
    """Handle user logout"""
    session_token = request_json.get("session_token", "")
    
    if not session_token:
        response = make_response(json.dumps({"success": False, "error": "Session token required"}), 400)
        response.headers['Content-Type'] = 'application/json'
        return response
    
    result = logout_user(session_token)
    response = make_response(json.dumps(result), 200)
    response.headers['Content-Type'] = 'application/json'
    return response

def handle_validate_session(request_json):
    """Handle session validation"""
    session_token = request_json.get("session_token", "")
    
    if not session_token:
        response = make_response(json.dumps({"valid": False, "error": "Session token required"}), 400)
        response.headers['Content-Type'] = 'application/json'
        return response
    
    result = validate_session(session_token)
    response = make_response(json.dumps(result), 200)
    response.headers['Content-Type'] = 'application/json'
    return response

def handle_get_profile(request_json):
    """Handle get user profile"""
    session_token = request_json.get("session_token", "")
    
    if not session_token:
        response = make_response(json.dumps({"success": False, "error": "Session token required"}), 400)
        response.headers['Content-Type'] = 'application/json'
        return response
    
    # Validate session
    session_result = validate_session(session_token)
    if not session_result.get("valid"):
        response = make_response(json.dumps({"success": False, "error": "Invalid session"}), 401)
        response.headers['Content-Type'] = 'application/json'
        return response
    
    user = session_result["user"]
    
    # Get user preferences
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("""
            SELECT default_story_length, default_story_style, public_profile 
            FROM user_preferences WHERE user_id = ?
        """, (user["id"],))
        prefs = cursor.fetchone()
        conn.close()
        
        if prefs:
            user["preferences"] = {
                "default_story_length": prefs[0],
                "default_story_style": prefs[1], 
                "public_profile": bool(prefs[2])
            }
        else:
            user["preferences"] = {
                "default_story_length": "detailed",
                "default_story_style": "original",
                "public_profile": False
            }
        
        response = make_response(json.dumps({"success": True, "user": user}), 200)
    except Exception as e:
        response = make_response(json.dumps({"success": False, "error": str(e)}), 500)
    
    response.headers['Content-Type'] = 'application/json'
    return response

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
                # Filter out stories with missing/empty/undefined country
                filtered_stories = [s for s in stories if s.get('country') and str(s.get('country')).strip().lower() not in ('', 'undefined', 'none', 'null')]
                response_data = {
                    "stories": filtered_stories,
                    "count": len(filtered_stories),
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
        # === 🔐 AUTHENTICATION ENDPOINTS ===
        elif action == "register":
            return add_cors_headers(handle_register(request_json))
        elif action == "login":
            return add_cors_headers(handle_login(request_json))
        elif action == "logout":
            return add_cors_headers(handle_logout(request_json))
        elif action == "validate_session":
            return add_cors_headers(handle_validate_session(request_json))
        elif action == "get_profile":
            return add_cors_headers(handle_get_profile(request_json))
        # === 🗺️ MAP ENDPOINTS ===
        elif action == "get_highlighted_map":
            return add_cors_headers(get_highlighted_map(request_json))
        elif action == "get_map_statistics":
            return add_cors_headers(get_map_statistics(request_json))
        elif action == "export_map_data":
            return add_cors_headers(export_map_data(request_json))
        elif action == "get_country_details":
            return add_cors_headers(get_country_details(request_json))
        elif action == "delete_stories_by_country":
            return add_cors_headers(delete_stories_by_country(request_json))
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

        # Filter out stories with missing/empty/undefined country
        filtered_stories = [s for s in stories if s.get('country') and str(s.get('country')).strip().lower() not in ('', 'undefined', 'none', 'null')]
        response = make_response(json.dumps({
            "stories": filtered_stories,
            "count": len(filtered_stories)
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

def delete_stories_by_country(request_json):
    """Delete all stories for a specific country"""
    try:
        country_name = request_json.get("country_name", "")
        if not country_name:
            response = make_response(json.dumps({"error": "Country name required"}), 400)
            return response
        
        deleted_count = 0
        
        if use_cloud_storage and storage_client:
            # Delete from Google Cloud Storage
            bucket = storage_client.bucket(STORIES_BUCKET)
            blobs = bucket.list_blobs(prefix="stories/")
            
            for blob in blobs:
                if blob.name.endswith('.json'):
                    content = blob.download_as_text()
                    story_data = json.loads(content)
                    if story_data.get('country') == country_name:
                        blob.delete()
                        deleted_count += 1
        else:
            # Delete from local storage
            if os.path.exists(LOCAL_STORAGE_DIR):
                for filename in os.listdir(LOCAL_STORAGE_DIR):
                    if filename.endswith('.json'):
                        filepath = os.path.join(LOCAL_STORAGE_DIR, filename)
                        with open(filepath, 'r') as f:
                            story_data = json.load(f)
                            if story_data.get('country') == country_name:
                                os.remove(filepath)
                                deleted_count += 1
        
        response = make_response(json.dumps({
            "deleted_count": deleted_count,
            "country": country_name,
            "message": f"Deleted {deleted_count} stories for {country_name}"
        }))
        return response
        
    except Exception as e:
        print(f"Error deleting stories: {str(e)}")
        response = make_response(json.dumps({"error": str(e)}), 500)
        return response 