#!/bin/bash

# WanderLog AI - Custom Domain Setup Script
# This script sets up a custom domain with Google Cloud Load Balancer

echo "🌐 Setting up custom domain for WanderLog AI..."

# Configuration
DOMAIN="your-domain.com"  # Replace with your actual domain
SUBDIRECTORY="wanderlog"   # The subdirectory where your app will be served
PROJECT_ID="ai-test-394019"
REGION="northamerica-northeast2"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Configuration:${NC}"
echo "Domain: $DOMAIN"
echo "Subdirectory: /$SUBDIRECTORY"
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo ""

# Step 1: Reserve a static IP address
echo -e "${YELLOW}Step 1: Reserving static IP address...${NC}"
gcloud compute addresses create wanderlog-ip --global --project=$PROJECT_ID
STATIC_IP=$(gcloud compute addresses describe wanderlog-ip --global --project=$PROJECT_ID --format="value(address)")
echo -e "${GREEN}Static IP reserved: $STATIC_IP${NC}"

# Step 2: Create SSL certificate
echo -e "${YELLOW}Step 2: Creating SSL certificate...${NC}"
gcloud compute ssl-certificates create wanderlog-cert \
    --domains="$DOMAIN" \
    --global \
    --project=$PROJECT_ID
echo -e "${GREEN}SSL certificate created${NC}"

# Step 3: Create backend bucket for frontend
echo -e "${YELLOW}Step 3: Creating backend bucket...${NC}"
gcloud compute backend-buckets create wanderlog-frontend-bucket \
    --gcs-bucket-name=wanderlog-ai-frontend \
    --enable-cdn \
    --project=$PROJECT_ID
echo -e "${GREEN}Backend bucket created${NC}"

# Step 4: Create backend service for Cloud Run
echo -e "${YELLOW}Step 4: Creating backend service for Cloud Run...${NC}"
gcloud compute backend-services create wanderlog-backend-service \
    --global \
    --load-balancing-scheme=EXTERNAL_MANAGED \
    --protocol=HTTPS \
    --port-name=http \
    --project=$PROJECT_ID

# Add Cloud Run backend
gcloud compute backend-services add-backend wanderlog-backend-service \
    --global \
    --address=wanderlog-ai-998409381703.northamerica-northeast2.run.app \
    --project=$PROJECT_ID
echo -e "${GREEN}Backend service created${NC}"

# Step 5: Create URL map
echo -e "${YELLOW}Step 5: Creating URL map...${NC}"
gcloud compute url-maps create wanderlog-url-map \
    --default-service=wanderlog-frontend-bucket \
    --project=$PROJECT_ID

# Add path matcher for API routes
gcloud compute url-maps add-path-matcher wanderlog-url-map \
    --path-matcher-name=wanderlog-path-matcher \
    --default-service=wanderlog-frontend-bucket \
    --backend-service-path-rules="/wanderlog/api/*=wanderlog-backend-service" \
    --project=$PROJECT_ID
echo -e "${GREEN}URL map created${NC}"

# Step 6: Create HTTPS proxy
echo -e "${YELLOW}Step 6: Creating HTTPS proxy...${NC}"
gcloud compute target-https-proxies create wanderlog-https-proxy \
    --url-map=wanderlog-url-map \
    --ssl-certificates=wanderlog-cert \
    --project=$PROJECT_ID
echo -e "${GREEN}HTTPS proxy created${NC}"

# Step 7: Create forwarding rule
echo -e "${YELLOW}Step 7: Creating forwarding rule...${NC}"
gcloud compute forwarding-rules create wanderlog-forwarding-rule \
    --global \
    --target-https-proxy=wanderlog-https-proxy \
    --address=$STATIC_IP \
    --ports=443 \
    --project=$PROJECT_ID
echo -e "${GREEN}Forwarding rule created${NC}"

# Step 8: Create HTTP to HTTPS redirect
echo -e "${YELLOW}Step 8: Creating HTTP to HTTPS redirect...${NC}"
gcloud compute url-maps create wanderlog-http-redirect \
    --default-url-redirect=https://$DOMAIN \
    --project=$PROJECT_ID

gcloud compute target-http-proxies create wanderlog-http-proxy \
    --url-map=wanderlog-http-redirect \
    --project=$PROJECT_ID

gcloud compute forwarding-rules create wanderlog-http-forwarding-rule \
    --global \
    --target-http-proxy=wanderlog-http-proxy \
    --address=$STATIC_IP \
    --ports=80 \
    --project=$PROJECT_ID
echo -e "${GREEN}HTTP redirect created${NC}"

echo ""
echo -e "${GREEN}🎉 Custom domain setup complete!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Update your DNS records:"
echo "   - Add an A record for $DOMAIN pointing to $STATIC_IP"
echo "2. Wait for DNS propagation (5-10 minutes)"
echo "3. Your app will be available at: https://$DOMAIN/$SUBDIRECTORY"
echo "4. API will be available at: https://$DOMAIN/$SUBDIRECTORY/api"
echo ""
echo -e "${YELLOW}To update the frontend API configuration:${NC}"
echo "Update frontend/assets/js/api.js to use:"
echo "https://$DOMAIN/$SUBDIRECTORY/api/wanderlog_ai" 