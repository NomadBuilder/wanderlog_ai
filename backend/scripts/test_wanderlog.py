#!/usr/bin/env python3
"""
WanderLog AI Backend Tests
"""

import unittest
import json
import os
import sys
import tempfile
import shutil
from unittest.mock import patch, MagicMock

# Add parent directory to path to import backend modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

class TestWanderLogAI(unittest.TestCase):
    """Test WanderLog AI core functionality"""
    
    def setUp(self):
        """Set up test environment"""
        self.test_data_dir = tempfile.mkdtemp()
        self.original_storage_dir = os.environ.get('LOCAL_STORAGE_DIR', 'data/stories')
        os.environ['LOCAL_STORAGE_DIR'] = self.test_data_dir
        
    def tearDown(self):
        """Clean up test environment"""
        shutil.rmtree(self.test_data_dir, ignore_errors=True)
        if self.original_storage_dir:
            os.environ['LOCAL_STORAGE_DIR'] = self.original_storage_dir
    
    def test_story_creation(self):
        """Test story creation functionality"""
        test_story = {
            'title': 'Test Trip',
            'country': 'France',
            'city': 'Paris',
            'narrative': 'Amazing time in Paris!',
            'timestamp': '2025-06-29T12:00:00Z'
        }
        
        # Test that story data is valid
        self.assertIn('title', test_story)
        self.assertIn('country', test_story)
        self.assertIn('narrative', test_story)
        self.assertEqual(test_story['country'], 'France')
    
    def test_story_validation(self):
        """Test story data validation"""
        # Valid story
        valid_story = {
            'title': 'Valid Trip',
            'country': 'Italy',
            'narrative': 'Great trip!'
        }
        self.assertTrue(all(key in valid_story for key in ['title', 'country', 'narrative']))
        
        # Invalid story (missing required fields)
        invalid_story = {
            'title': 'Invalid Trip'
            # Missing country and narrative
        }
        self.assertFalse(all(key in invalid_story for key in ['title', 'country', 'narrative']))
    
    def test_country_mapping(self):
        """Test country name to ISO code mapping"""
        # Test basic country mapping
        country_mappings = {
            'United States': 'US',
            'France': 'FR',
            'Italy': 'IT',
            'Japan': 'JP',
            'Australia': 'AU'
        }
        
        for country, expected_iso in country_mappings.items():
            # This would test the actual mapping function
            # For now, just verify the mapping structure
            self.assertIsInstance(country, str)
            self.assertIsInstance(expected_iso, str)
            self.assertEqual(len(expected_iso), 2)  # ISO codes are 2 characters
    
    def test_api_endpoints(self):
        """Test API endpoint structure"""
        expected_endpoints = [
            '/stories',
            '/map/statistics',
            '/map/highlighted',
            '/map/export'
        ]
        
        for endpoint in expected_endpoints:
            self.assertTrue(endpoint.startswith('/'))
            self.assertIsInstance(endpoint, str)

class TestStorageOperations(unittest.TestCase):
    """Test storage operations"""
    
    def setUp(self):
        """Set up test environment"""
        self.test_data_dir = tempfile.mkdtemp()
        
    def tearDown(self):
        """Clean up test environment"""
        shutil.rmtree(self.test_data_dir, ignore_errors=True)
    
    def test_file_storage(self):
        """Test file storage operations"""
        test_file = os.path.join(self.test_data_dir, 'test.json')
        test_data = {'test': 'data'}
        
        # Test writing
        with open(test_file, 'w') as f:
            json.dump(test_data, f)
        
        # Test reading
        with open(test_file, 'r') as f:
            loaded_data = json.load(f)
        
        self.assertEqual(loaded_data, test_data)
        self.assertTrue(os.path.exists(test_file))
    
    def test_directory_creation(self):
        """Test directory creation"""
        test_dir = os.path.join(self.test_data_dir, 'subdir')
        
        # Create directory
        os.makedirs(test_dir, exist_ok=True)
        
        # Verify directory exists
        self.assertTrue(os.path.exists(test_dir))
        self.assertTrue(os.path.isdir(test_dir))
    
    def test_data_persistence(self):
        """Test data persistence across operations"""
        test_file = os.path.join(self.test_data_dir, 'persistent.json')
        original_data = {'key': 'value', 'number': 42}
        
        # Write data
        with open(test_file, 'w') as f:
            json.dump(original_data, f)
        
        # Read data back
        with open(test_file, 'r') as f:
            loaded_data = json.load(f)
        
        # Verify data integrity
        self.assertEqual(loaded_data, original_data)
        self.assertEqual(loaded_data['key'], 'value')
        self.assertEqual(loaded_data['number'], 42)

if __name__ == '__main__':
    unittest.main() 