#!/bin/bash

# WanderLog AI - Start Servers Script
# This script starts both the backend and frontend servers

echo "🚀 Starting WanderLog AI servers..."

# Check if we're in the right directory
if [ ! -f "backend/main.py" ]; then
    echo "❌ Error: backend/main.py not found. Please run this script from the project root."
    exit 1
fi

# Function to cleanup background processes on exit
cleanup() {
    echo "🛑 Shutting down servers..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
    fi
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start backend server (Google Cloud Functions Framework)
echo "🔧 Starting backend server on port 8080..."
cd backend
functions-framework --target=wanderlog_ai --port=8080 --source=main.py &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 2

# Check if backend started successfully
if ! curl -s http://localhost:8080 > /dev/null; then
    echo "❌ Backend server failed to start"
    exit 1
fi

echo "✅ Backend server started successfully"

# Start frontend server (Python HTTP server)
echo "🌐 Starting frontend server on port 8000..."
cd frontend
python3 -m http.server 8000 &
FRONTEND_PID=$!
cd ..

# Wait a moment for frontend to start
sleep 2

# Check if frontend started successfully
if ! curl -s http://localhost:8000 > /dev/null; then
    echo "❌ Frontend server failed to start"
    exit 1
fi

echo "✅ Frontend server started successfully"

echo ""
echo "🎉 WanderLog AI is now running!"
echo "📱 Frontend: http://localhost:8000"
echo "🔧 Backend:  http://localhost:8080"
echo ""
echo "Press Ctrl+C to stop both servers"

# Keep script running
wait 