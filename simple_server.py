#!/usr/bin/env python3
"""
Simple HTTP server for WanderLog AI static files
"""

import http.server
import socketserver
import os
import sys
from urllib.parse import urlparse

class WanderLogHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Parse the URL
        parsed_url = urlparse(self.path)
        path = parsed_url.path
        
        # Default to index.html for root
        if path == '/':
            path = '/index.html'
        
        # Remove leading slash
        if path.startswith('/'):
            path = path[1:]
        
        # Security: prevent directory traversal
        if '..' in path or path.startswith('/'):
            self.send_error(403, "Forbidden")
            return
        
        # Check if file exists
        if not os.path.exists(path):
            # Try serving index.html for 404s (SPA routing)
            if os.path.exists('index.html'):
                path = 'index.html'
            else:
                self.send_error(404, "File not found")
                return
        
        # Set appropriate content type
        content_type = self.get_content_type(path)
        self.send_response(200)
        self.send_header('Content-type', content_type)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        
        # Serve the file
        try:
            with open(path, 'rb') as f:
                self.wfile.write(f.read())
        except Exception as e:
            print(f"Error serving {path}: {e}")
            self.send_error(500, "Internal server error")
    
    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def get_content_type(self, path):
        """Determine content type based on file extension"""
        ext = os.path.splitext(path)[1].lower()
        content_types = {
            '.html': 'text/html',
            '.css': 'text/css',
            '.js': 'application/javascript',
            '.svg': 'image/svg+xml',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.ico': 'image/x-icon',
            '.json': 'application/json'
        }
        return content_types.get(ext, 'text/plain')

def main():
    PORT = 8000
    
    # Change to the directory containing this script
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    try:
        with socketserver.TCPServer(("", PORT), WanderLogHandler) as httpd:
            print("🌐 WanderLog AI Static Server")
            print("=" * 40)
            print(f"📁 Serving files from: {os.getcwd()}")
            print(f"🌍 Server running on: http://localhost:{PORT}")
            print(f"🔗 Backend API: http://localhost:8080")
            print("=" * 40)
            print("Press Ctrl+C to stop the server")
            print()
            
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except OSError as e:
        if e.errno == 48:  # Address already in use
            print(f"❌ Port {PORT} is already in use!")
            print("💡 Try stopping other servers or use a different port")
        else:
            print(f"❌ Server error: {e}")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

if __name__ == "__main__":
    main() 