#!/bin/bash

# WanderLog AI - Cloudflare Domain Setup for nomadbuilder.io
# This script sets up Cloudflare routing for https://www.nomadbuilder.io/wanderlog_ai

echo "🌐 Setting up WanderLog AI on nomadbuilder.io domain..."

# Configuration
DOMAIN="nomadbuilder.io"
SUBDIRECTORY="wanderlog_ai"
CLOUDFLARE_ZONE_ID=""
CLOUDFLARE_API_TOKEN=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 Configuration:${NC}"
echo "   Domain: $DOMAIN"
echo "   Subdirectory: $SUBDIRECTORY"
echo "   Target URL: https://www.$DOMAIN/$SUBDIRECTORY"
echo ""

# Check if required tools are installed
check_requirements() {
    echo -e "${BLUE}🔍 Checking requirements...${NC}"
    
    if ! command -v curl &> /dev/null; then
        echo -e "${RED}❌ curl is required but not installed${NC}"
        exit 1
    fi
    
    if ! command -v jq &> /dev/null; then
        echo -e "${YELLOW}⚠️  jq is recommended for JSON parsing${NC}"
        echo "   Install with: brew install jq (macOS) or apt-get install jq (Ubuntu)"
    fi
    
    echo -e "${GREEN}✅ Requirements check passed${NC}"
}

# Get Cloudflare credentials
get_cloudflare_credentials() {
    echo -e "${BLUE}🔐 Cloudflare Configuration${NC}"
    
    if [ -z "$CLOUDFLARE_ZONE_ID" ]; then
        echo -e "${YELLOW}Please provide your Cloudflare Zone ID:${NC}"
        echo "   You can find this in your Cloudflare dashboard under the domain settings"
        read -p "   Zone ID: " CLOUDFLARE_ZONE_ID
    fi
    
    if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
        echo -e "${YELLOW}Please provide your Cloudflare API Token:${NC}"
        echo "   Create one at: https://dash.cloudflare.com/profile/api-tokens"
        echo "   Required permissions: Zone:Edit, DNS:Edit"
        read -s -p "   API Token: " CLOUDFLARE_API_TOKEN
        echo ""
    fi
    
    # Test credentials
    echo -e "${BLUE}🔍 Testing Cloudflare credentials...${NC}"
    RESPONSE=$(curl -s -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
        "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID")
    
    if echo "$RESPONSE" | grep -q '"success":true'; then
        echo -e "${GREEN}✅ Cloudflare credentials verified${NC}"
    else
        echo -e "${RED}❌ Invalid Cloudflare credentials${NC}"
        echo "Response: $RESPONSE"
        exit 1
    fi
}

# Create Cloudflare Worker script
create_worker_script() {
    echo -e "${BLUE}📝 Creating Cloudflare Worker script...${NC}"
    
    cat > cloudflare-worker.js << 'EOF'
// Cloudflare Worker for WanderLog AI
// Routes /wanderlog_ai/* to Google Cloud Storage and API calls to Cloud Run

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  const path = url.pathname
  
  // Handle API calls to Cloud Run backend
  if (path.startsWith('/wanderlog_ai') && request.method !== 'GET') {
    return handleAPICall(request)
  }
  
  // Handle static files from Google Cloud Storage
  if (path.startsWith('/wanderlog_ai')) {
    return handleStaticFiles(request)
  }
  
  // Default response for root
  return new Response('WanderLog AI is available at /wanderlog_ai', {
    status: 200,
    headers: { 'Content-Type': 'text/plain' }
  })
}

async function handleAPICall(request) {
  const url = new URL(request.url)
  const backendUrl = 'https://wanderlog-ai-998409381703.northamerica-northeast2.run.app'
  
  // Forward the request to Cloud Run
  const backendRequest = new Request(backendUrl + url.pathname, {
    method: request.method,
    headers: request.headers,
    body: request.body
  })
  
  try {
    const response = await fetch(backendRequest)
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        ...response.headers,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Backend service unavailable' }), {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
}

async function handleStaticFiles(request) {
  const url = new URL(request.url)
  const storageUrl = 'https://storage.googleapis.com/wanderlog-ai-frontend'
  
  // Map the path to the storage bucket
  let storagePath = url.pathname.replace('/wanderlog_ai', '')
  if (storagePath === '' || storagePath === '/') {
    storagePath = '/index.html'
  }
  
  const storageRequest = new Request(storageUrl + storagePath, {
    method: 'GET',
    headers: {
      'User-Agent': request.headers.get('User-Agent') || ''
    }
  })
  
  try {
    const response = await fetch(storageRequest)
    
    if (response.status === 404) {
      // Try index.html for directory requests
      if (!storagePath.endsWith('.html') && !storagePath.includes('.')) {
        const indexRequest = new Request(storageUrl + storagePath + '/index.html')
        const indexResponse = await fetch(indexRequest)
        if (indexResponse.status === 200) {
          return new Response(indexResponse.body, {
            status: 200,
            headers: {
              ...indexResponse.headers,
              'Content-Type': 'text/html'
            }
          })
        }
      }
      
      return new Response('File not found', { status: 404 })
    }
    
    return new Response(response.body, {
      status: response.status,
      headers: {
        ...response.headers,
        'Access-Control-Allow-Origin': '*'
      }
    })
  } catch (error) {
    return new Response('Storage service unavailable', { status: 503 })
  }
}
EOF

    echo -e "${GREEN}✅ Worker script created${NC}"
}

# Deploy Cloudflare Worker
deploy_worker() {
    echo -e "${BLUE}🚀 Deploying Cloudflare Worker...${NC}"
    
    # Create worker
    WORKER_NAME="wanderlog-ai-router"
    
    # Upload worker script
    UPLOAD_RESPONSE=$(curl -s -X PUT \
        -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
        -H "Content-Type: application/javascript" \
        --data-binary @cloudflare-worker.js \
        "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/workers/scripts/$WORKER_NAME")
    
    if echo "$UPLOAD_RESPONSE" | grep -q '"success":true'; then
        echo -e "${GREEN}✅ Worker script uploaded${NC}"
    else
        echo -e "${RED}❌ Failed to upload worker script${NC}"
        echo "Response: $UPLOAD_RESPONSE"
        exit 1
    fi
    
    # Create route
    ROUTE_RESPONSE=$(curl -s -X POST \
        -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"pattern\": \"www.$DOMAIN/wanderlog_ai/*\",
            \"script\": \"$WORKER_NAME\"
        }" \
        "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/workers/routes")
    
    if echo "$ROUTE_RESPONSE" | grep -q '"success":true'; then
        echo -e "${GREEN}✅ Route created successfully${NC}"
    else
        echo -e "${RED}❌ Failed to create route${NC}"
        echo "Response: $ROUTE_RESPONSE"
        exit 1
    fi
}

# Update frontend configuration
update_frontend_config() {
    echo -e "${BLUE}🔧 Updating frontend configuration...${NC}"
    
    # Create a backup
    cp frontend/assets/js/api.js frontend/assets/js/api.js.backup
    
    # Update the API configuration
    sed -i.bak 's|https://wanderlog-ai-998409381703.northamerica-northeast2.run.app/wanderlog_ai|https://www.nomadbuilder.io/wanderlog_ai|g' frontend/assets/js/api.js
    
    echo -e "${GREEN}✅ Frontend configuration updated${NC}"
    echo "   API calls will now go to: https://www.nomadbuilder.io/wanderlog_ai"
}

# Deploy updated frontend to Cloud Storage
deploy_frontend() {
    echo -e "${BLUE}📤 Deploying updated frontend to Cloud Storage...${NC}"
    
    # Build and upload frontend
    cd frontend
    
    # Upload all files to Cloud Storage
    gsutil -m cp -r * gs://wanderlog-ai-frontend/
    
    # Set public read permissions
    gsutil iam ch allUsers:objectViewer gs://wanderlog-ai-frontend
    
    cd ..
    
    echo -e "${GREEN}✅ Frontend deployed to Cloud Storage${NC}"
}

# Main execution
main() {
    echo -e "${GREEN}🚀 WanderLog AI Domain Setup${NC}"
    echo "=================================="
    
    check_requirements
    get_cloudflare_credentials
    create_worker_script
    deploy_worker
    update_frontend_config
    deploy_frontend
    
    echo ""
    echo -e "${GREEN}🎉 Setup Complete!${NC}"
    echo "=================================="
    echo -e "${BLUE}Your WanderLog AI is now available at:${NC}"
    echo -e "${GREEN}https://www.nomadbuilder.io/wanderlog_ai${NC}"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "1. Test the application at the URL above"
    echo "2. Update your DNS if needed"
    echo "3. Configure SSL certificates in Cloudflare"
    echo ""
    echo -e "${BLUE}Configuration files:${NC}"
    echo "- Worker script: cloudflare-worker.js"
    echo "- Frontend backup: frontend/assets/js/api.js.backup"
    echo ""
    echo -e "${YELLOW}To revert changes:${NC}"
    echo "- Restore api.js from backup: cp frontend/assets/js/api.js.backup frontend/assets/js/api.js"
    echo "- Delete the Cloudflare Worker route manually"
}

# Run main function
main "$@" 