import unittest
import json
import tempfile
import os
import sys
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

if __name__ == '__main__':
    # Create test suite
    test_suite = unittest.TestSuite()
    
    # Add test cases
    test_suite.addTest(unittest.makeSuite(TestWanderLogAI))
    test_suite.addTest(unittest.makeSuite(TestStorageOperations))
    
    # Run tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(test_suite)
    
    # Exit with appropriate code
    sys.exit(not result.wasSuccessful()) 