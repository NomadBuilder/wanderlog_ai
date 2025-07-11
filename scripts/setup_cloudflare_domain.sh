#!/bin/bash

# WanderLog AI - Cloudflare Domain Setup Script
# This script sets up a custom domain using Cloudflare

echo "🌐 Setting up custom domain with Cloudflare for WanderLog AI..."

# Configuration
DOMAIN="your-domain.com"  # Replace with your actual domain
SUBDIRECTORY="wanderlog"   # The subdirectory where your app will be served
PROJECT_ID="ai-test-394019"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Configuration:${NC}"
echo "Domain: $DOMAIN"
echo "Subdirectory: /$SUBDIRECTORY"
echo "Project: $PROJECT_ID"
echo ""

echo -e "${YELLOW}Step 1: Get your Cloud Run service URL${NC}"
CLOUD_RUN_URL="https://wanderlog-ai-998409381703.northamerica-northeast2.run.app"
echo -e "${GREEN}Cloud Run URL: $CLOUD_RUN_URL${NC}"

echo -e "${YELLOW}Step 2: Get your Cloud Storage frontend URL${NC}"
FRONTEND_URL="https://storage.googleapis.com/wanderlog-ai-frontend"
echo -e "${GREEN}Frontend URL: $FRONTEND_URL${NC}"

echo ""
echo -e "${GREEN}🎉 Manual setup instructions:${NC}"
echo ""
echo -e "${YELLOW}1. Cloudflare DNS Configuration:${NC}"
echo "   - Log into your Cloudflare dashboard"
echo "   - Go to DNS settings for $DOMAIN"
echo "   - Add these records:"
echo ""
echo "   Type: CNAME"
echo "   Name: $SUBDIRECTORY"
echo "   Target: wanderlog-ai-frontend.storage.googleapis.com"
echo "   Proxy: Enabled (Orange cloud)"
echo ""
echo "   Type: CNAME"
echo "   Name: $SUBDIRECTORY-api"
echo "   Target: wanderlog-ai-998409381703.northamerica-northeast2.run.app"
echo "   Proxy: Enabled (Orange cloud)"
echo ""

echo -e "${YELLOW}2. Cloudflare Page Rules:${NC}"
echo "   - Create a Page Rule:"
echo "     URL: $DOMAIN/$SUBDIRECTORY/api/*"
echo "     Forwarding URL: 301 Redirect"
echo "     Destination: $CLOUD_RUN_URL/\$1"
echo ""

echo -e "${YELLOW}3. Update Frontend API Configuration:${NC}"
echo "   - Edit frontend/assets/js/api.js"
echo "   - Change the baseURL to:"
echo "     https://$DOMAIN/$SUBDIRECTORY-api/wanderlog_ai"
echo ""

echo -e "${YELLOW}4. Upload Updated Frontend:${NC}"
echo "   - After updating api.js, upload to Cloud Storage:"
echo "   gsutil -m cp -r frontend/* gs://wanderlog-ai-frontend/"
echo ""

echo -e "${GREEN}Your app will be available at:${NC}"
echo "https://$DOMAIN/$SUBDIRECTORY"
echo ""
echo -e "${GREEN}Your API will be available at:${NC}"
echo "https://$DOMAIN/$SUBDIRECTORY-api/wanderlog_ai" 