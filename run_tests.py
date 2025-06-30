#!/usr/bin/env python3
"""
WanderLog AI Test Runner
"""

import unittest
import sys
import os

def main():
    """Run all tests"""
    print("🧪 Running WanderLog AI Tests...")
    
    # Add current directory to path
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    
    # Import test modules
    try:
        from test_wanderlog import TestWanderLogAI, TestStorageOperations
    except ImportError as e:
        print(f"❌ Error importing tests: {e}")
        print("Make sure test_wanderlog.py exists in the current directory")
        sys.exit(1)
    
    # Create test suite
    test_suite = unittest.TestSuite()
    test_suite.addTest(unittest.makeSuite(TestWanderLogAI))
    test_suite.addTest(unittest.makeSuite(TestStorageOperations))
    
    # Run tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(test_suite)
    
    # Exit with appropriate code
    if result.wasSuccessful():
        print("\n🎉 All tests passed!")
        sys.exit(0)
    else:
        print(f"\n❌ {len(result.failures)} failures, {len(result.errors)} errors")
        sys.exit(1)

if __name__ == '__main__':
    main() 