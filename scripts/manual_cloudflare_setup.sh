#!/bin/bash

# Manual Cloudflare Setup for WanderLog AI on nomadbuilder.io
# This script helps you set up Cloudflare manually

echo "🌐 Manual Cloudflare Setup for WanderLog AI"
echo "=========================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Step 1: Cloudflare Domain Setup${NC}"
echo "----------------------------------------"
echo "1. Go to https://dash.cloudflare.com"
echo "2. Click 'Add a Site'"
echo "3. Enter: nomadbuilder.io"
echo "4. Choose Free plan"
echo ""

echo -e "${BLUE}Step 2: DNS Configuration${NC}"
echo "--------------------------------"
echo "In Cloudflare DNS settings, add these records:"
echo ""
echo "Record 1:"
echo "  Type: A"
echo "  Name: @"
echo "  Content: 76.76.19.19"
echo "  Proxy status: Proxied (orange cloud)"
echo ""
echo "Record 2:"
echo "  Type: A"
echo "  Name: www"
echo "  Content: 76.76.19.19"
echo "  Proxy status: Proxied (orange cloud)"
echo ""

echo -e "${BLUE}Step 3: Update Nameservers at Porkbun${NC}"
echo "----------------------------------------------"
echo "1. Cloudflare will provide nameservers (like nina.ns.cloudflare.com)"
echo "2. Go to your Porkbun domain settings"
echo "3. Update nameservers to Cloudflare's nameservers"
echo "4. Wait for DNS propagation (1-24 hours)"
echo ""

echo -e "${BLUE}Step 4: Get Cloudflare Credentials${NC}"
echo "------------------------------------------"
echo "1. Get Zone ID:"
echo "   - In Cloudflare dashboard, go to your domain"
echo "   - Right sidebar shows 'Zone ID'"
echo "   - Copy this value"
echo ""
echo "2. Create API Token:"
echo "   - Go to https://dash.cloudflare.com/profile/api-tokens"
echo "   - Click 'Create Token'"
echo "   - Use 'Custom token' template"
echo "   - Permissions needed:"
echo "     * Zone:Edit"
echo "     * Zone:Read"
echo "     * Zone Settings:Edit"
echo "   - Zone Resources: Include -> Specific zone -> nomadbuilder.io"
echo "   - Save the token"
echo ""

echo -e "${BLUE}Step 5: Create Cloudflare Worker${NC}"
echo "----------------------------------------"
echo "1. Go to https://dash.cloudflare.com"
echo "2. Select your domain"
echo "3. Go to 'Workers & Pages'"
echo "4. Click 'Create application'"
echo "5. Choose 'Create Worker'"
echo "6. Name it: wanderlog-ai-router"
echo "7. Click 'Deploy'"
echo ""

echo -e "${BLUE}Step 6: Add Worker Code${NC}"
echo "-------------------------------"
echo "Replace the worker code with:"
echo ""

cat << 'EOF'
// Cloudflare Worker for WanderLog AI
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

echo ""
echo -e "${BLUE}Step 7: Add Route${NC}"
echo "----------------------"
echo "1. In the Worker settings, go to 'Triggers'"
echo "2. Add route: www.nomadbuilder.io/wanderlog_ai/*"
echo "3. Save the route"
echo ""

echo -e "${BLUE}Step 8: Update Frontend Configuration${NC}"
echo "---------------------------------------------"
echo "Update frontend/assets/js/api.js:"
echo "Change line 5 from:"
echo "  this.baseURL = isLocalhost ? 'http://localhost:8080/wanderlog_ai' : 'https://wanderlog-ai-998409381703.northamerica-northeast2.run.app/wanderlog_ai';"
echo "To:"
echo "  this.baseURL = isLocalhost ? 'http://localhost:8080/wanderlog_ai' : 'https://www.nomadbuilder.io/wanderlog_ai';"
echo ""

echo -e "${BLUE}Step 9: Deploy Updated Frontend${NC}"
echo "----------------------------------------"
echo "Run these commands:"
echo ""
echo "cd frontend"
echo "gsutil -m cp -r * gs://wanderlog-ai-frontend/"
echo "gsutil iam ch allUsers:objectViewer gs://wanderlog-ai-frontend"
echo "cd .."
echo ""

echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo "========================"
echo "Your WanderLog AI should now be available at:"
echo -e "${GREEN}https://www.nomadbuilder.io/wanderlog_ai${NC}"
echo ""
echo -e "${YELLOW}Testing:${NC}"
echo "1. Wait for DNS propagation (1-24 hours)"
echo "2. Test the URL above"
echo "3. Check Cloudflare Workers logs if issues occur"
echo ""
echo -e "${BLUE}Support:${NC}"
echo "- Cloudflare Workers docs: https://developers.cloudflare.com/workers/"
echo "- Backend status: https://wanderlog-ai-998409381703.northamerica-northeast2.run.app" 