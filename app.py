from flask import Flask, send_from_directory, request, jsonify
import os
import requests
from flask_cors import CORS
import json
import sys

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Backend API URL
BACKEND_URL = 'http://localhost:8080'

@app.route('/')
def index():
    """Serve the modular WanderLog AI application"""
    return send_from_directory('.', 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    """Serve static files (HTML, CSS, JS, SVG)"""
    # Define allowed file types
    allowed_extensions = {'.html', '.css', '.js', '.svg', '.png', '.jpg', '.jpeg', '.gif', '.ico'}
    
    # Check if file has allowed extension
    file_ext = os.path.splitext(filename)[1].lower()
    if file_ext not in allowed_extensions:
        return jsonify({'error': 'File type not allowed'}), 403
    
    # Serve the file
    return send_from_directory('.', filename)

@app.route('/api/<path:endpoint>', methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])
def proxy_api(endpoint):
    """Proxy API requests to the backend"""
    try:
        # Forward the request to the backend
        backend_url = f"{BACKEND_URL}/{endpoint}"
        
        # Get request data
        data = request.get_data()
        headers = dict(request.headers)
        
        # Remove host header to avoid conflicts
        headers.pop('Host', None)
        
        # Make request to backend
        response = requests.request(
            method=request.method,
            url=backend_url,
            data=data,
            headers=headers,
            params=request.args,
            timeout=30
        )
        
        # Return backend response
        return response.content, response.status_code, response.headers.items()
        
    except requests.exceptions.RequestException as e:
        return jsonify({'error': f'Backend connection failed: {str(e)}'}), 503

@app.route('/stories', methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])
def proxy_stories():
    """Proxy stories endpoint to backend"""
    try:
        # For GET requests, forward directly to backend /stories
        if request.method == 'GET':
            backend_url = f"{BACKEND_URL}/stories"
            
            # Get request headers
            headers = dict(request.headers)
            headers.pop('Host', None)
            
            # Make GET request to backend
            response = requests.get(
                url=backend_url,
                headers=headers,
                params=request.args,
                timeout=30
            )
            
            # Return backend response
            return response.content, response.status_code, response.headers.items()
        
        # For POST requests, add action field if not present
        elif request.method == 'POST':
            backend_url = f"{BACKEND_URL}/"
            
            # Get request data
            data = request.get_data()
            headers = dict(request.headers)
            headers.pop('Host', None)
            
            # Try to parse JSON and add action if needed
            try:
                json_data = request.get_json()
                if json_data and 'action' not in json_data:
                    json_data['action'] = 'get_stories'
                    data = json.dumps(json_data).encode('utf-8')
                    headers['Content-Type'] = 'application/json'
            except:
                # If not JSON, create a new request with action
                json_data = {'action': 'get_stories'}
                data = json.dumps(json_data).encode('utf-8')
                headers['Content-Type'] = 'application/json'
            
            # Make POST request to backend
            response = requests.post(
                url=backend_url,
                data=data,
                headers=headers,
                timeout=30
            )
            
            # Return backend response
            return response.content, response.status_code, response.headers.items()
        
        # For other methods, use the general proxy
        else:
            return proxy_api('')
            
    except requests.exceptions.RequestException as e:
        return jsonify({'error': f'Backend connection failed: {str(e)}'}), 503

@app.route('/health', methods=['GET', 'OPTIONS'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'message': 'Frontend server is running'})

if __name__ == '__main__':
    # Get port from command line argument, default to 8000
    port = 8000
    if len(sys.argv) > 1 and sys.argv[1] == '--port':
        try:
            port = int(sys.argv[2])
        except (IndexError, ValueError):
            print("Invalid port number, using default port 8000")
    
    print(f"🌐 Static file server running on http://localhost:{port}")
    print("📁 Serving static files (HTML, CSS, JS, SVG)")
    print("🔗 Backend API is running on http://localhost:8080")
    app.run(host='0.0.0.0', port=port, debug=True) 