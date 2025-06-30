import os
from flask import Flask, send_from_directory, make_response

app = Flask(__name__)

@app.route('/<path:filename>')
def serve_static(filename):
    """Serve static files like world-map.svg and wanderlog_ai.html"""
    if '..' in filename or filename.startswith('/'):
        response = make_response('File not found', 404)
        return response
    if not os.path.exists(filename):
        response = make_response('File not found', 404)
        return response
    try:
        response = send_from_directory('.', filename)
        return response
    except Exception as e:
        print(f"Error serving {filename}: {e}")
        response = make_response('Error serving file', 500)
        return response

if __name__ == "__main__":
    print("🌐 Static file server running on http://localhost:8000")
    print("📁 Serving static files (HTML, CSS, JS, SVG)")
    print("🔗 Backend API is running on http://localhost:8080")
    app.run(debug=True, port=8000) 