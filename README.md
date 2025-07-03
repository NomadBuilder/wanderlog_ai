# WanderLog AI

A beautiful travel journal app that lets you create stories about your adventures and visualize them on an interactive world map.

## 🏗️ Project Structure

```
wanderlog_ai/
├── backend/                    # Backend Python code
│   ├── main.py                # Main Flask/Cloud Functions app
│   ├── requirements.txt       # Python dependencies
│   ├── config/               # Configuration files
│   ├── utils/                # Utility modules
│   ├── data/                 # Data storage
│   └── scripts/              # Utility scripts
├── frontend/                  # Frontend web assets
│   ├── index.html            # Main HTML file
│   └── assets/               # Static assets (CSS, JS, images, maps)
├── docs/                     # Documentation
├── scripts/                  # Build/deployment scripts
└── backups/                  # Backup files
```

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Start the servers:**
   ```bash
   ./scripts/start_servers.sh
   ```

3. **Open your browser:**
   - Frontend: http://localhost:8000
   - Backend API: http://localhost:8080

## 🛠️ Development

- **Frontend**: HTML, CSS, JavaScript (vanilla)
- **Backend**: Python Flask with Google Cloud Functions Framework
- **Storage**: Local JSON files (can be configured for Google Cloud Storage)

## 📁 Key Files

- `frontend/index.html` - Main application interface
- `frontend/assets/js/` - JavaScript modules (app, map, ui, api)
- `frontend/assets/css/styles.css` - Main stylesheet
- `backend/main.py` - Backend API server
- `scripts/start_servers.sh` - Development server startup script

## 🗺️ Features

- **Interactive World Map**: Click countries to see your stories
- **Story Creation**: Write and save travel memories
- **Country Tracking**: Visualize visited countries on the map
- **Responsive Design**: Works on desktop and mobile
- **Local Storage**: No external dependencies required

## 📚 Documentation

See the `docs/` folder for detailed documentation:
- `QUICKSTART.md` - Getting started guide
- `DEPLOYMENT_GUIDE.md` - Deployment instructions
- `TESTING.md` - Testing procedures 