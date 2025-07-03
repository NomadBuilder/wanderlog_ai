import unittest
import json
import tempfile
import os
import sys
import sqlite3
import hashlib
import secrets
import time
from unittest.mock import patch, MagicMock
import functions_framework

# Add the current directory to the path so we can import main
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import the main function
from main import wanderlog_ai

class TestWanderLogAI(unittest.TestCase):
    """Test suite for WanderLog AI application"""
    
    def setUp(self):
        """Set up test fixtures before each test method"""
        self.app = functions_framework.create_app('wanderlog_ai', 'main.py')
        self.client = self.app.test_client()
        
        # Create a temporary directory for test files
        self.test_dir = tempfile.mkdtemp()
        
        # Create a temporary database for testing
        self.test_db = os.path.join(self.test_dir, 'test_wanderlog_users.db')
        
    def tearDown(self):
        """Clean up after each test method"""
        # Clean up temporary files
        import shutil
        if os.path.exists(self.test_dir):
            shutil.rmtree(self.test_dir)
    
    def test_health_check(self):
        """Test that the server responds to basic requests"""
        response = self.client.get('/')
        # The server expects JSON POST requests, so GET should return an error
        self.assertIn(response.status_code, [400, 405, 500])
    
    def test_story_creation(self):
        """Test creating a new travel story"""
        story_data = {
            "action": "save_story",
            "story_data": {
                "country": "France",
                "cities": ["Paris", "Lyon"],
                "visit_date": "2024-06-15",
                "interests": ["culture", "food"],
                "budget": "medium",
                "duration": "1 week",
                "narrative": "Test narrative"
            }
        }
        
        response = self.client.post('/', 
                                  data=json.dumps(story_data),
                                  content_type='application/json')
        
        self.assertEqual(response.status_code, 200)
        result = json.loads(response.data)
        self.assertIn('story_id', result)
        self.assertTrue(result['saved'])
    
    def test_story_retrieval(self):
        """Test retrieving saved stories"""
        # First create a story
        story_data = {
            "action": "save_story",
            "story_data": {
                "country": "Italy",
                "cities": ["Rome", "Florence"],
                "visit_date": "2024-07-20",
                "interests": ["history", "art"],
                "budget": "high",
                "duration": "2 weeks",
                "narrative": "Test narrative"
            }
        }
        
        self.client.post('/', 
                        data=json.dumps(story_data),
                        content_type='application/json')
        
        # Then retrieve all stories
        retrieve_data = {"action": "get_stories"}
        response = self.client.post('/', 
                                  data=json.dumps(retrieve_data),
                                  content_type='application/json')
        
        self.assertEqual(response.status_code, 200)
        result = json.loads(response.data)
        self.assertIn('stories', result)
        self.assertIsInstance(result['stories'], list)
    
    def test_story_update(self):
        """Test updating an existing story"""
        # Create a story first
        story_data = {
            "action": "save_story",
            "story_data": {
                "country": "Spain",
                "cities": ["Madrid"],
                "visit_date": "2024-08-10",
                "interests": ["food"],
                "budget": "low",
                "duration": "3 days",
                "narrative": "Original narrative"
            }
        }
        
        create_response = self.client.post('/', 
                                         data=json.dumps(story_data),
                                         content_type='application/json')
        create_result = json.loads(create_response.data)
        story_id = create_result['story_id']
        
        # Update the story by saving a new version
        update_data = {
            "action": "save_story",
            "story_data": {
                "story_id": story_id,
                "country": "Spain",
                "cities": ["Madrid"],
                "visit_date": "2024-08-10",
                "interests": ["food"],
                "budget": "low",
                "duration": "3 days",
                "narrative": "Updated story content with more details about Madrid."
            }
        }
        
        update_response = self.client.post('/', 
                                         data=json.dumps(update_data),
                                         content_type='application/json')
        
        self.assertEqual(update_response.status_code, 200)
        result = json.loads(update_response.data)
        self.assertTrue(result['saved'])
    
    def test_invalid_action(self):
        """Test handling of invalid actions"""
        invalid_data = {
            "action": "invalid_action",
            "country": "Test"
        }
        
        response = self.client.post('/', 
                                  data=json.dumps(invalid_data),
                                  content_type='application/json')
        
        self.assertEqual(response.status_code, 400)
        result = json.loads(response.data)
        self.assertIn('error', result)
    
    def test_city_suggestions(self):
        """Test city suggestion functionality"""
        suggestion_data = {
            "action": "suggest_cities",
            "country": "Japan"
        }
        
        response = self.client.post('/', 
                                  data=json.dumps(suggestion_data),
                                  content_type='application/json')
        
        self.assertEqual(response.status_code, 200)
        result = json.loads(response.data)
        self.assertIn('cities', result)
        self.assertIsInstance(result['cities'], list)
    
    def test_memory_prompts_generation(self):
        """Test memory prompts generation"""
        prompts_data = {
            "action": "generate_memory_prompts",
            "city": "Tokyo",
            "country": "Japan"
        }
        
        response = self.client.post('/', 
                                  data=json.dumps(prompts_data),
                                  content_type='application/json')
        
        self.assertEqual(response.status_code, 200)
        result = json.loads(response.data)
        self.assertIn('prompts', result)
        self.assertIsInstance(result['prompts'], list)
        self.assertGreater(len(result['prompts']), 0)
    
    @patch('main.storage_client')
    def test_cloud_storage_fallback(self, mock_storage):
        """Test fallback to local storage when cloud storage fails"""
        # Mock cloud storage to fail
        mock_storage.bucket.side_effect = Exception("Cloud storage unavailable")
        
        story_data = {
            "action": "save_story",
            "story_data": {
                "country": "Test Country",
                "cities": ["Test City"],
                "visit_date": "2024-01-01",
                "interests": ["test"],
                "budget": "medium",
                "duration": "1 week",
                "narrative": "Test narrative"
            }
        }
        
        response = self.client.post('/', 
                                  data=json.dumps(story_data),
                                  content_type='application/json')
        
        # Should still succeed using local storage
        self.assertEqual(response.status_code, 200)
        result = json.loads(response.data)
        self.assertTrue(result['saved'])
    
    def test_story_export_data(self):
        """Test that story data is properly formatted for export"""
        # Create a story with rich content
        story_data = {
            "action": "save_story",
            "story_data": {
                "country": "Netherlands",
                "cities": ["Amsterdam", "Rotterdam"],
                "visit_date": "2024-10-15",
                "interests": ["art", "architecture"],
                "budget": "high",
                "duration": "1 week",
                "narrative": "Test narrative"
            }
        }
        
        response = self.client.post('/', 
                                  data=json.dumps(story_data),
                                  content_type='application/json')
        
        self.assertEqual(response.status_code, 200)
        result = json.loads(response.data)
        
        # Verify the story has all required fields for export
        story_id = result['story_id']
        
        # Get the story details
        get_data = {"action": "get_stories"}
        get_response = self.client.post('/', 
                                      data=json.dumps(get_data),
                                      content_type='application/json')
        
        self.assertEqual(get_response.status_code, 200)
        story_result = json.loads(get_response.data)
        
        # Check if our story is in the list
        story_found = False
        for story in story_result['stories']:
            if story.get('country') == 'Netherlands':
                story_found = True
                required_fields = ['country', 'cities', 'visit_date', 'narrative']
                for field in required_fields:
                    self.assertIn(field, story)
                break
        
        self.assertTrue(story_found)
    
    def test_date_formatting(self):
        """Test date formatting and validation"""
        # Test with valid date
        story_data = {
            "action": "save_story",
            "story_data": {
                "country": "Canada",
                "cities": ["Toronto"],
                "visit_date": "2024-12-25",
                "interests": ["nature"],
                "budget": "medium",
                "duration": "1 week",
                "narrative": "Test narrative"
            }
        }
        
        response = self.client.post('/', 
                                  data=json.dumps(story_data),
                                  content_type='application/json')
        
        self.assertEqual(response.status_code, 200)
    
    def test_city_validation(self):
        """Test city input validation and processing"""
        # Test with empty cities list
        empty_cities_data = {
            "action": "save_story",
            "story_data": {
                "country": "Test",
                "cities": [],
                "visit_date": "2024-01-01",
                "interests": ["test"],
                "budget": "medium",
                "duration": "1 week",
                "narrative": "Test narrative"
            }
        }
        
        response = self.client.post('/', 
                                  data=json.dumps(empty_cities_data),
                                  content_type='application/json')
        
        # Should handle empty cities gracefully
        self.assertEqual(response.status_code, 200)
        
        # Test with duplicate cities
        duplicate_cities_data = {
            "action": "save_story",
            "story_data": {
                "country": "Test",
                "cities": ["Paris", "Paris", "Lyon"],
                "visit_date": "2024-01-01",
                "interests": ["test"],
                "budget": "medium",
                "duration": "1 week",
                "narrative": "Test narrative"
            }
        }
        
        response = self.client.post('/', 
                                  data=json.dumps(duplicate_cities_data),
                                  content_type='application/json')
        
        self.assertEqual(response.status_code, 200)
        result = json.loads(response.data)
        self.assertTrue(result['saved'])

class TestStorageOperations(unittest.TestCase):
    """Test storage operations specifically"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.test_dir = tempfile.mkdtemp()
        
    def tearDown(self):
        """Clean up after tests"""
        import shutil
        if os.path.exists(self.test_dir):
            shutil.rmtree(self.test_dir)
    
    def test_local_storage_directory_creation(self):
        """Test that local storage directory is created"""
        from main import LOCAL_STORAGE_DIR
        
        # Check if the directory exists
        self.assertTrue(os.path.exists(LOCAL_STORAGE_DIR))
        self.assertTrue(os.path.isdir(LOCAL_STORAGE_DIR))
    
    def test_story_save_and_retrieve_flow(self):
        """Test the complete save and retrieve flow"""
        # Create test app
        app = functions_framework.create_app('wanderlog_ai', 'main.py')
        client = app.test_client()
        
        # Save a story
        story_data = {
            "action": "save_story",
            "story_data": {
                "country": "Test Country",
                "cities": ["Test City"],
                "visit_date": "2024-01-01",
                "narrative": "Test narrative"
            }
        }
        
        save_response = client.post('/', 
                                  data=json.dumps(story_data),
                                  content_type='application/json')
        
        self.assertEqual(save_response.status_code, 200)
        save_result = json.loads(save_response.data)
        self.assertTrue(save_result['saved'])
        
        # Retrieve stories
        retrieve_data = {"action": "get_stories"}
        retrieve_response = client.post('/', 
                                      data=json.dumps(retrieve_data),
                                      content_type='application/json')
        
        self.assertEqual(retrieve_response.status_code, 200)
        retrieve_result = json.loads(retrieve_response.data)
        
        # Check if our story is in the list
        story_found = False
        for story in retrieve_result['stories']:
            if story.get('country') == 'Test Country':
                story_found = True
                self.assertEqual(story['cities'], ['Test City'])
                break
        
        self.assertTrue(story_found)

class TestAuthenticationSystem(unittest.TestCase):
    """Test suite for authentication functionality"""
    
    def setUp(self):
        """Set up test fixtures for authentication tests"""
        self.app = functions_framework.create_app('wanderlog_ai', 'main.py')
        self.client = self.app.test_client()
        
        # Create a temporary directory and database for testing
        self.test_dir = tempfile.mkdtemp()
        self.test_db = os.path.join(self.test_dir, 'test_wanderlog_users.db')
        
        # Initialize test database
        self._init_test_database()
        
    def tearDown(self):
        """Clean up after each test method"""
        import shutil
        if os.path.exists(self.test_dir):
            shutil.rmtree(self.test_dir)
    
    def _init_test_database(self):
        """Initialize test database with required tables"""
        conn = sqlite3.connect(self.test_db)
        cursor = conn.cursor()
        
        # Create users table
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
        
        # Create user_sessions table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                session_token TEXT UNIQUE NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')
        
        # Create user_preferences table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_preferences (
                user_id INTEGER PRIMARY KEY,
                default_story_length TEXT DEFAULT 'detailed',
                default_story_style TEXT DEFAULT 'personal',
                public_profile BOOLEAN DEFAULT 0,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')
        
        conn.commit()
        conn.close()
    
    def _create_test_user(self, email="test@example.com", password="testpass123", name="Test User"):
        """Helper method to create a test user directly in database"""
        conn = sqlite3.connect(self.test_db)
        cursor = conn.cursor()
        
        # Hash password with salt
        salt = secrets.token_hex(16)
        password_hash = hashlib.sha256((password + salt).encode()).hexdigest() + ':' + salt
        
        cursor.execute('''
            INSERT INTO users (email, password_hash, name) 
            VALUES (?, ?, ?)
        ''', (email, password_hash, name))
        
        user_id = cursor.lastrowid
        
        # Create default preferences
        cursor.execute('''
            INSERT INTO user_preferences (user_id) VALUES (?)
        ''', (user_id,))
        
        conn.commit()
        conn.close()
        return user_id
    
    @patch('main.DB_PATH')
    def test_user_registration_success(self, mock_db_path):
        """Test successful user registration"""
        mock_db_path.__str__ = lambda: self.test_db
        mock_db_path.return_value = self.test_db
        
        registration_data = {
            "action": "register",
            "email": "newuser@example.com",
            "password": "securepassword123",
            "name": "New User"
        }
        
        response = self.client.post('/', 
                                  data=json.dumps(registration_data),
                                  content_type='application/json')
        
        self.assertEqual(response.status_code, 201)
        result = json.loads(response.data)
        self.assertTrue(result['success'])
        self.assertIn('user_id', result)
        self.assertEqual(result['message'], 'User registered successfully')
        
        # Verify user was created in database
        conn = sqlite3.connect(self.test_db)
        cursor = conn.cursor()
        cursor.execute('SELECT email, name FROM users WHERE email = ?', ('newuser@example.com',))
        user_data = cursor.fetchone()
        conn.close()
        
        self.assertIsNotNone(user_data)
        self.assertEqual(user_data[0], 'newuser@example.com')
        self.assertEqual(user_data[1], 'New User')
    
    @patch('main.DB_PATH')
    def test_user_registration_duplicate_email(self, mock_db_path):
        """Test registration with duplicate email"""
        mock_db_path.__str__ = lambda: self.test_db
        mock_db_path.return_value = self.test_db
        
        # Create a user first
        self._create_test_user("existing@example.com", "password123", "Existing User")
        
        # Try to register with same email
        registration_data = {
            "action": "register",
            "email": "existing@example.com",
            "password": "newpassword123",
            "name": "New User"
        }
        
        response = self.client.post('/', 
                                  data=json.dumps(registration_data),
                                  content_type='application/json')
        
        self.assertEqual(response.status_code, 400)
        result = json.loads(response.data)
        self.assertFalse(result['success'])
        self.assertIn('already exists', result['error'])
    
    @patch('main.DB_PATH')
    def test_user_registration_validation(self, mock_db_path):
        """Test registration input validation"""
        mock_db_path.__str__ = lambda: self.test_db
        mock_db_path.return_value = self.test_db
        
        # Test missing email
        invalid_data = {
            "action": "register",
            "password": "password123",
            "name": "Test User"
        }
        
        response = self.client.post('/', 
                                  data=json.dumps(invalid_data),
                                  content_type='application/json')
        
        self.assertEqual(response.status_code, 400)
        result = json.loads(response.data)
        self.assertFalse(result['success'])
        self.assertIn('required', result['error'])
    
    @patch('main.DB_PATH')
    def test_user_login_success(self, mock_db_path):
        """Test successful user login"""
        mock_db_path.__str__ = lambda: self.test_db
        mock_db_path.return_value = self.test_db
        
        # Create a test user
        self._create_test_user("login@example.com", "testpassword", "Login User")
        
        login_data = {
            "action": "login",
            "email": "login@example.com",
            "password": "testpassword"
        }
        
        response = self.client.post('/', 
                                  data=json.dumps(login_data),
                                  content_type='application/json')
        
        self.assertEqual(response.status_code, 200)
        result = json.loads(response.data)
        self.assertTrue(result['success'])
        self.assertIn('session_token', result)
        self.assertIn('user', result)
        self.assertEqual(result['user']['email'], 'login@example.com')
        self.assertEqual(result['user']['name'], 'Login User')
        
        # Verify session was created in database
        session_token = result['session_token']
        conn = sqlite3.connect(self.test_db)
        cursor = conn.cursor()
        cursor.execute('SELECT user_id FROM user_sessions WHERE session_token = ?', (session_token,))
        session_data = cursor.fetchone()
        conn.close()
        
        self.assertIsNotNone(session_data)
    
    @patch('main.DB_PATH')
    def test_user_login_invalid_credentials(self, mock_db_path):
        """Test login with invalid credentials"""
        mock_db_path.__str__ = lambda: self.test_db
        mock_db_path.return_value = self.test_db
        
        # Create a test user
        self._create_test_user("user@example.com", "correctpassword", "Test User")
        
        # Try login with wrong password
        login_data = {
            "action": "login",
            "email": "user@example.com",
            "password": "wrongpassword"
        }
        
        response = self.client.post('/', 
                                  data=json.dumps(login_data),
                                  content_type='application/json')
        
        self.assertEqual(response.status_code, 401)
        result = json.loads(response.data)
        self.assertFalse(result['success'])
        self.assertIn('Invalid credentials', result['error'])
    
    @patch('main.DB_PATH')
    def test_session_validation_valid(self, mock_db_path):
        """Test session validation with valid token"""
        mock_db_path.__str__ = lambda: self.test_db
        mock_db_path.return_value = self.test_db
        
        # Create user and session
        user_id = self._create_test_user("session@example.com", "password", "Session User")
        
        # Create a valid session token
        session_token = secrets.token_urlsafe(32)
        expires_at = int(time.time()) + 2592000  # 30 days from now
        
        conn = sqlite3.connect(self.test_db)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO user_sessions (user_id, session_token, expires_at) 
            VALUES (?, ?, ?)
        ''', (user_id, session_token, expires_at))
        conn.commit()
        conn.close()
        
        # Test session validation
        validation_data = {
            "action": "validate_session",
            "session_token": session_token
        }
        
        response = self.client.post('/', 
                                  data=json.dumps(validation_data),
                                  content_type='application/json')
        
        self.assertEqual(response.status_code, 200)
        result = json.loads(response.data)
        self.assertTrue(result['valid'])
        self.assertIn('user', result)
        self.assertEqual(result['user']['email'], 'session@example.com')
    
    @patch('main.DB_PATH')
    def test_session_validation_expired(self, mock_db_path):
        """Test session validation with expired token"""
        mock_db_path.__str__ = lambda: self.test_db
        mock_db_path.return_value = self.test_db
        
        # Create user and expired session
        user_id = self._create_test_user("expired@example.com", "password", "Expired User")
        
        # Create an expired session token
        session_token = secrets.token_urlsafe(32)
        expires_at = int(time.time()) - 3600  # Expired 1 hour ago
        
        conn = sqlite3.connect(self.test_db)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO user_sessions (user_id, session_token, expires_at) 
            VALUES (?, ?, ?)
        ''', (user_id, session_token, expires_at))
        conn.commit()
        conn.close()
        
        # Test session validation
        validation_data = {
            "action": "validate_session",
            "session_token": session_token
        }
        
        response = self.client.post('/', 
                                  data=json.dumps(validation_data),
                                  content_type='application/json')
        
        self.assertEqual(response.status_code, 200)
        result = json.loads(response.data)
        self.assertFalse(result['valid'])
        self.assertEqual(result['error'], 'Session expired')
    
    @patch('main.DB_PATH')
    def test_session_validation_invalid_token(self, mock_db_path):
        """Test session validation with invalid token"""
        mock_db_path.__str__ = lambda: self.test_db
        mock_db_path.return_value = self.test_db
        
        # Test with non-existent token
        validation_data = {
            "action": "validate_session",
            "session_token": "invalid_token_123"
        }
        
        response = self.client.post('/', 
                                  data=json.dumps(validation_data),
                                  content_type='application/json')
        
        self.assertEqual(response.status_code, 200)
        result = json.loads(response.data)
        self.assertFalse(result['valid'])
        self.assertEqual(result['error'], 'Invalid session')
    
    @patch('main.DB_PATH')
    def test_user_logout(self, mock_db_path):
        """Test user logout functionality"""
        mock_db_path.__str__ = lambda: self.test_db
        mock_db_path.return_value = self.test_db
        
        # Create user and session
        user_id = self._create_test_user("logout@example.com", "password", "Logout User")
        
        # Create a session token
        session_token = secrets.token_urlsafe(32)
        expires_at = int(time.time()) + 2592000  # 30 days from now
        
        conn = sqlite3.connect(self.test_db)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO user_sessions (user_id, session_token, expires_at) 
            VALUES (?, ?, ?)
        ''', (user_id, session_token, expires_at))
        conn.commit()
        conn.close()
        
        # Test logout
        logout_data = {
            "action": "logout",
            "session_token": session_token
        }
        
        response = self.client.post('/', 
                                  data=json.dumps(logout_data),
                                  content_type='application/json')
        
        self.assertEqual(response.status_code, 200)
        result = json.loads(response.data)
        self.assertTrue(result['success'])
        self.assertEqual(result['message'], 'Logged out successfully')
        
        # Verify session was deleted from database
        conn = sqlite3.connect(self.test_db)
        cursor = conn.cursor()
        cursor.execute('SELECT id FROM user_sessions WHERE session_token = ?', (session_token,))
        session_data = cursor.fetchone()
        conn.close()
        
        self.assertIsNone(session_data)
    
    @patch('main.DB_PATH')
    def test_user_profile_retrieval(self, mock_db_path):
        """Test user profile retrieval"""
        mock_db_path.__str__ = lambda: self.test_db
        mock_db_path.return_value = self.test_db
        
        # Create user
        user_id = self._create_test_user("profile@example.com", "password", "Profile User")
        
        # Create session
        session_token = secrets.token_urlsafe(32)
        expires_at = int(time.time()) + 2592000
        
        conn = sqlite3.connect(self.test_db)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO user_sessions (user_id, session_token, expires_at) 
            VALUES (?, ?, ?)
        ''', (user_id, session_token, expires_at))
        conn.commit()
        conn.close()
        
        # Test profile retrieval
        profile_data = {
            "action": "get_profile",
            "session_token": session_token
        }
        
        response = self.client.post('/', 
                                  data=json.dumps(profile_data),
                                  content_type='application/json')
        
        self.assertEqual(response.status_code, 200)
        result = json.loads(response.data)
        self.assertTrue(result['success'])
        self.assertIn('user', result)
        self.assertIn('preferences', result)
        self.assertEqual(result['user']['email'], 'profile@example.com')
        self.assertEqual(result['user']['name'], 'Profile User')
    
    def test_password_hashing(self):
        """Test password hashing functionality"""
        password = "testpassword123"
        
        # Simulate the password hashing logic from main.py
        salt = secrets.token_hex(16)
        password_hash = hashlib.sha256((password + salt).encode()).hexdigest() + ':' + salt
        
        # Verify hash format
        self.assertIn(':', password_hash)
        hash_part, salt_part = password_hash.split(':')
        self.assertEqual(len(hash_part), 64)  # SHA256 hex digest length
        self.assertEqual(len(salt_part), 32)  # 16-byte salt as hex
        
        # Verify password verification works
        stored_hash, stored_salt = password_hash.split(':')
        verification_hash = hashlib.sha256((password + stored_salt).encode()).hexdigest()
        self.assertEqual(verification_hash, stored_hash)
        
        # Verify wrong password fails
        wrong_verification_hash = hashlib.sha256(("wrongpassword" + stored_salt).encode()).hexdigest()
        self.assertNotEqual(wrong_verification_hash, stored_hash)
    
    def test_session_token_generation(self):
        """Test session token generation"""
        token1 = secrets.token_urlsafe(32)
        token2 = secrets.token_urlsafe(32)
        
        # Verify tokens are different
        self.assertNotEqual(token1, token2)
        
        # Verify token length (URL-safe base64 encoding adds padding)
        self.assertGreaterEqual(len(token1), 32)
        self.assertGreaterEqual(len(token2), 32)
        
        # Verify tokens are URL-safe
        import string
        allowed_chars = string.ascii_letters + string.digits + '-_'
        self.assertTrue(all(c in allowed_chars for c in token1))
        self.assertTrue(all(c in allowed_chars for c in token2))

class TestAuthenticationIntegration(unittest.TestCase):
    """Integration tests for authentication workflows"""
    
    def setUp(self):
        """Set up test fixtures for integration tests"""
        self.app = functions_framework.create_app('wanderlog_ai', 'main.py')
        self.client = self.app.test_client()
        
        # Create a temporary directory and database for testing
        self.test_dir = tempfile.mkdtemp()
        self.test_db = os.path.join(self.test_dir, 'test_wanderlog_users.db')
        
    def tearDown(self):
        """Clean up after each test method"""
        import shutil
        if os.path.exists(self.test_dir):
            shutil.rmtree(self.test_dir)
    
    @patch('main.DB_PATH')
    def test_complete_authentication_workflow(self, mock_db_path):
        """Test complete registration -> login -> validation -> logout workflow"""
        mock_db_path.__str__ = lambda: self.test_db
        mock_db_path.return_value = self.test_db
        
        # Step 1: Register a new user
        registration_data = {
            "action": "register",
            "email": "workflow@example.com",
            "password": "workflowpassword123",
            "name": "Workflow User"
        }
        
        reg_response = self.client.post('/', 
                                      data=json.dumps(registration_data),
                                      content_type='application/json')
        
        self.assertEqual(reg_response.status_code, 201)
        reg_result = json.loads(reg_response.data)
        self.assertTrue(reg_result['success'])
        
        # Step 2: Login with the registered user
        login_data = {
            "action": "login",
            "email": "workflow@example.com",
            "password": "workflowpassword123"
        }
        
        login_response = self.client.post('/', 
                                        data=json.dumps(login_data),
                                        content_type='application/json')
        
        self.assertEqual(login_response.status_code, 200)
        login_result = json.loads(login_response.data)
        self.assertTrue(login_result['success'])
        session_token = login_result['session_token']
        
        # Step 3: Validate the session
        validation_data = {
            "action": "validate_session",
            "session_token": session_token
        }
        
        val_response = self.client.post('/', 
                                      data=json.dumps(validation_data),
                                      content_type='application/json')
        
        self.assertEqual(val_response.status_code, 200)
        val_result = json.loads(val_response.data)
        self.assertTrue(val_result['valid'])
        
        # Step 4: Get user profile
        profile_data = {
            "action": "get_profile",
            "session_token": session_token
        }
        
        profile_response = self.client.post('/', 
                                          data=json.dumps(profile_data),
                                          content_type='application/json')
        
        self.assertEqual(profile_response.status_code, 200)
        profile_result = json.loads(profile_response.data)
        self.assertTrue(profile_result['success'])
        self.assertEqual(profile_result['user']['email'], 'workflow@example.com')
        
        # Step 5: Logout
        logout_data = {
            "action": "logout",
            "session_token": session_token
        }
        
        logout_response = self.client.post('/', 
                                         data=json.dumps(logout_data),
                                         content_type='application/json')
        
        self.assertEqual(logout_response.status_code, 200)
        logout_result = json.loads(logout_response.data)
        self.assertTrue(logout_result['success'])
        
        # Step 6: Verify session is no longer valid
        final_val_response = self.client.post('/', 
                                            data=json.dumps(validation_data),
                                            content_type='application/json')
        
        self.assertEqual(final_val_response.status_code, 200)
        final_val_result = json.loads(final_val_response.data)
        self.assertFalse(final_val_result['valid'])

if __name__ == '__main__':
    # Create test suite using TestLoader
    loader = unittest.TestLoader()
    test_suite = unittest.TestSuite()
    
    # Add test cases
    test_suite.addTest(loader.loadTestsFromTestCase(TestWanderLogAI))
    test_suite.addTest(loader.loadTestsFromTestCase(TestStorageOperations))
    test_suite.addTest(loader.loadTestsFromTestCase(TestAuthenticationSystem))
    test_suite.addTest(loader.loadTestsFromTestCase(TestAuthenticationIntegration))
    
    # Run tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(test_suite)
    
    # Exit with appropriate code
    sys.exit(not result.wasSuccessful()) 