# 🧪 WanderLog AI Testing Guide

This guide explains how to run tests for the WanderLog AI application and what each test covers.

## 📋 Test Overview

WanderLog AI includes comprehensive testing across multiple layers:

- **Backend Tests**: API endpoints, data storage, and business logic
- **Frontend Tests**: UI functionality, export features, and user interactions
- **Integration Tests**: End-to-end functionality testing

## 🚀 Quick Start

### 1. Run Backend Tests

```bash
# Run all backend tests
python run_tests.py

# Run specific test file
python -m unittest test_wanderlog.py

# Run with verbose output
python -m unittest test_wanderlog.py -v
```

### 2. Run Frontend Tests

```bash
# Open the frontend test suite in your browser
open test_frontend.html
# or
python -m http.server 8000
# Then visit http://localhost:8000/test_frontend.html
```

### 3. Run All Tests

```bash
# Backend tests
python run_tests.py

# Frontend tests (manual)
# Open test_frontend.html in browser and click "Run All Tests"
```

## 📊 Test Coverage

### Backend Tests (`test_wanderlog.py`)

#### Core Functionality
- ✅ **Story Creation**: Test creating new travel stories
- ✅ **Story Retrieval**: Test loading saved stories
- ✅ **Story Updates**: Test editing existing stories
- ✅ **Story Deletion**: Test removing stories
- ✅ **Data Validation**: Test input validation and error handling

#### API Endpoints
- ✅ **Health Check**: Server responsiveness
- ✅ **City Suggestions**: AI-powered city recommendations
- ✅ **Memory Prompts**: Generating travel memory prompts
- ✅ **Invalid Actions**: Error handling for bad requests
- ✅ **Missing Fields**: Validation of required data

#### Storage Operations
- ✅ **Local Storage**: File-based storage operations
- ✅ **Cloud Storage**: Google Cloud Storage integration
- ✅ **Storage Fallback**: Graceful degradation when cloud unavailable
- ✅ **Data Persistence**: Save/load/delete operations

#### Export Features
- ✅ **Data Formatting**: Story data structure validation
- ✅ **Date Handling**: Date formatting and validation
- ✅ **City Processing**: City list validation and deduplication

### Frontend Tests (`test_frontend.html`)

#### UI Functions
- ✅ **Country Flags**: Flag emoji generation
- ✅ **Date Formatting**: Date display formatting
- ✅ **Modal Operations**: Modal show/hide functionality
- ✅ **Message Display**: User feedback system

#### Export Functions
- ✅ **Text Export**: Plain text file generation
- ✅ **PDF Export**: PDF document creation
- ✅ **Digital Album**: HTML album generation
- ✅ **Social Media**: Platform-optimized text
- ✅ **File Download**: Browser download functionality

#### Data Validation
- ✅ **Story Structure**: Required field validation
- ✅ **Data Types**: Type checking for story objects
- ✅ **Content Length**: Social media character limits

## 🔧 Test Configuration

### Prerequisites

1. **Python Dependencies**:
   ```bash
   pip install functions-framework google-cloud-storage openai
   ```

2. **Google Cloud Setup** (for cloud storage tests):
   ```bash
   gcloud auth application-default login
   ```

3. **Server Running** (for integration tests):
   ```bash
   functions-framework --target=wanderlog_ai --port=8080 --debug
   ```

### Environment Variables

```bash
# For cloud storage tests
export GOOGLE_APPLICATION_CREDENTIALS="path/to/credentials.json"

# For OpenAI tests
export OPENAI_API_KEY="your-openai-api-key"
```

## 📈 Test Results

### Backend Test Output

```
🧪 Running WanderLog AI Tests...
test_health_check (test_wanderlog.TestWanderLogAI) ... ok
test_story_creation (test_wanderlog.TestWanderLogAI) ... ok
test_story_retrieval (test_wanderlog.TestWanderLogAI) ... ok
test_story_update (test_wanderlog.TestWanderLogAI) ... ok
test_story_deletion (test_wanderlog.TestWanderLogAI) ... ok
test_invalid_action (test_wanderlog.TestWanderLogAI) ... ok
test_missing_required_fields (test_wanderlog.TestWanderLogAI) ... ok
test_city_suggestions (test_wanderlog.TestWanderLogAI) ... ok
test_memory_prompts_generation (test_wanderlog.TestWanderLogAI) ... ok
test_cloud_storage_fallback (test_wanderlog.TestWanderLogAI) ... ok
test_story_export_data (test_wanderlog.TestWanderLogAI) ... ok
test_date_formatting (test_wanderlog.TestWanderLogAI) ... ok
test_city_validation (test_wanderlog.TestWanderLogAI) ... ok
test_local_storage_save_and_load (test_wanderlog.TestStorageOperations) ... ok
test_story_file_operations (test_wanderlog.TestStorageOperations) ... ok

🎉 All tests passed!
```

### Frontend Test Output

```
🧪 WanderLog AI - Frontend Test Suite

Test Controls:
✅ PASS: Country Flag Function
✅ PASS: Date Formatting Function  
✅ PASS: Text Export Function
✅ PASS: Digital Album Export Function
✅ PASS: Social Media Export Function
✅ PASS: File Download Function
✅ PASS: Modal Functions
✅ PASS: Story Data Validation

Test Summary:
Total: 8 | Passed: 8 | Failed: 0 | Skipped: 0
```

## 🐛 Troubleshooting

### Common Issues

1. **Import Errors**:
   ```bash
   # Make sure you're in the project directory
   cd /path/to/wanderlog_ai
   
   # Install dependencies
   pip install -r requirements.txt
   ```

2. **Server Not Running**:
   ```bash
   # Start the server first
   functions-framework --target=wanderlog_ai --port=8080 --debug
   
   # Then run tests in another terminal
   python run_tests.py
   ```

3. **Cloud Storage Errors**:
   ```bash
   # Tests will fallback to local storage
   # Check logs for "Using local file storage instead"
   ```

4. **Frontend Tests Failing**:
   - Open browser console for error details
   - Make sure `wanderlog_ai.html` is in the same directory
   - Check that all JavaScript functions are loaded

### Debug Mode

```bash
# Run tests with detailed output
python -m unittest test_wanderlog.py -v

# Run specific test
python -m unittest test_wanderlog.TestWanderLogAI.test_story_creation -v
```

## 📝 Adding New Tests

### Backend Test Example

```python
def test_new_feature(self):
    """Test description"""
    # Arrange
    test_data = {"action": "new_action", "param": "value"}
    
    # Act
    response = self.client.post('/', 
                              data=json.dumps(test_data),
                              content_type='application/json')
    
    # Assert
    self.assertEqual(response.status_code, 200)
    result = json.loads(response.data)
    self.assertTrue(result['success'])
```

### Frontend Test Example

```javascript
async function testNewFeature() {
    const testName = "New Feature Test";
    log(`Running: ${testName}`);
    
    try {
        // Test logic here
        if (typeof newFunction !== 'function') {
            return createTestResult(testName, false, "Function not found");
        }
        
        const result = newFunction(testData);
        
        if (result === expectedValue) {
            return createTestResult(testName, true, "Test passed");
        } else {
            return createTestResult(testName, false, "Unexpected result");
        }
    } catch (error) {
        return createTestResult(testName, false, `Error: ${error.message}`);
    }
}
```

## 🎯 Continuous Integration

### GitHub Actions Example

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Set up Python
      uses: actions/setup-python@v2
      with:
        python-version: 3.9
    - name: Install dependencies
      run: pip install -r requirements.txt
    - name: Run tests
      run: python run_tests.py
```

## 📊 Coverage Reports

To generate coverage reports:

```bash
# Install coverage
pip install coverage

# Run tests with coverage
coverage run run_tests.py

# Generate report
coverage report
coverage html  # Creates htmlcov/index.html
```

## 🔄 Test Maintenance

- Run tests before each commit
- Update tests when adding new features
- Keep test data realistic and diverse
- Document any test-specific setup requirements

---

For more information, see the main [README.md](README.md) or contact the development team. 