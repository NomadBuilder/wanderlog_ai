#!/usr/bin/env python3
"""
WanderLog AI Status Checker
Quick script to check if both servers are running and healthy
"""

import requests
import json
import sys
from datetime import datetime

def check_server(url, name, timeout=5, method="GET", data=None, headers=None):
    """Check if a server is responding"""
    try:
        if method == "POST":
            response = requests.post(url, json=data, headers=headers, timeout=timeout)
        else:
            response = requests.get(url, timeout=timeout)
        
        if response.status_code == 200:
            return True, response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text
        else:
            return False, f"HTTP {response.status_code}"
    except requests.exceptions.ConnectionError:
        return False, "Connection refused"
    except requests.exceptions.Timeout:
        return False, "Timeout"
    except Exception as e:
        return False, str(e)

def main():
    print("🔍 WanderLog AI Status Check")
    print("=" * 40)
    print(f"⏰ Check time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Check frontend server
    print("🌐 Frontend Server (port 8000):")
    frontend_ok, frontend_response = check_server("http://localhost:8000/health", "Frontend")
    if frontend_ok:
        print("   ✅ Running")
        if isinstance(frontend_response, dict):
            print(f"   📊 Status: {frontend_response.get('status', 'unknown')}")
            print(f"   💬 Message: {frontend_response.get('message', 'No message')}")
    else:
        print(f"   ❌ Not responding: {frontend_response}")
    
    print()
    
    # Check backend server
    print("🔧 Backend Server (port 8080):")
    backend_ok, backend_response = check_server(
        "http://localhost:8080/", 
        "Backend", 
        method="POST", 
        data={"action": "get_stories"},
        headers={"Content-Type": "application/json"}
    )
    if backend_ok:
        print("   ✅ Running")
        if isinstance(backend_response, dict):
            count = backend_response.get('count', 0)
            print(f"   📖 Stories count: {count}")
    else:
        print(f"   ❌ Not responding: {backend_response}")
    
    print()
    
    # Check stories endpoint
    print("📚 Stories API:")
    stories_ok, stories_response = check_server("http://localhost:8000/stories", "Stories")
    if stories_ok:
        print("   ✅ Accessible")
        if isinstance(stories_response, dict):
            count = stories_response.get('count', 0)
            print(f"   📖 Stories count: {count}")
    else:
        print(f"   ❌ Not accessible: {stories_response}")
    
    print()
    
    # Overall status
    if frontend_ok and backend_ok:
        print("🎉 All systems operational!")
        print("📱 Access your app at: http://localhost:8000")
        return 0
    else:
        print("⚠️  Some services are not responding")
        print("💡 Try running: ./start_servers.sh")
        return 1

if __name__ == "__main__":
    sys.exit(main()) 