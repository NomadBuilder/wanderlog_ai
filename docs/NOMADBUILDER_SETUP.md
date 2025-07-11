# WanderLog AI Setup for nomadbuilder.io

## Overview
This guide will help you set up WanderLog AI on your existing domain `https://www.nomadbuilder.io/wanderlog_ai` while keeping your current Vercel deployment intact.

## Prerequisites
- Domain: nomadbuilder.io (already purchased from Porkbun)
- Existing Vercel deployment on root domain
- Cloudflare account (free tier works fine)
- Google Cloud project with deployed backend

## Step 1: Set up Cloudflare

1. **Add your domain to Cloudflare:**
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
   - Click "Add a Site"
   - Enter: `nomadbuilder.io`
   - Choose the Free plan

2. **Update DNS settings:**
   - In Cloudflare, go to DNS settings
   - Add these records:
     ```
     Type: A
     Name: @
     Content: 76.76.19.19 (Vercel's IP)
     Proxy status: Proxied
     
     Type: A
     Name: www
     Content: 76.76.19.19 (Vercel's IP)
     Proxy status: Proxied
     ```

3. **Update nameservers at Porkbun:**
   - Cloudflare will provide you with nameservers (like `nina.ns.cloudflare.com`)
   - Go to your Porkbun domain settings
   - Update nameservers to Cloudflare's nameservers

## Step 2: Get Cloudflare Credentials

1. **Get Zone ID:**
   - In Cloudflare dashboard, go to your domain
   - On the right sidebar, you'll see "Zone ID"
   - Copy this value

2. **Create API Token:**
   - Go to [API Tokens](https://dash.cloudflare.com/profile/api-tokens)
   - Click "Create Token"
   - Use "Custom token" template
   - Permissions needed:
     - Zone:Edit
     - Zone:Read
     - Zone Settings:Edit
   - Zone Resources: Include -> Specific zone -> nomadbuilder.io
   - Save the token

## Step 3: Run the Setup Script

```bash
# Make the script executable
chmod +x scripts/setup_nomadbuilder_domain.sh

# Run the setup
bash scripts/setup_nomadbuilder_domain.sh
```

The script will:
- Create a Cloudflare Worker to route `/wanderlog_ai/*` requests
- Update your frontend configuration
- Deploy the updated frontend to Google Cloud Storage

## Step 4: Test Your Setup

After running the script, test your application:

1. **Frontend:** https://www.nomadbuilder.io/wanderlog_ai
2. **API calls:** Will automatically route to your Cloud Run backend

## How It Works

```
User visits: https://www.nomadbuilder.io/wanderlog_ai
    ↓
Cloudflare Worker routes the request
    ↓
Static files: Served from Google Cloud Storage
API calls: Forwarded to Google Cloud Run backend
```

## Troubleshooting

### If the setup fails:

1. **Check Cloudflare credentials:**
   - Verify Zone ID is correct
   - Ensure API token has proper permissions

2. **DNS propagation:**
   - Changes can take up to 24 hours
   - Usually works within 1-2 hours

3. **Worker deployment issues:**
   - Check Cloudflare Workers dashboard
   - Verify the route pattern is correct

### To revert changes:

```bash
# Restore original API configuration
cp frontend/assets/js/api.js.backup frontend/assets/js/api.js

# Delete the Cloudflare Worker manually in the dashboard
```

## Current Status

✅ **Backend:** Deployed on Google Cloud Run  
✅ **Frontend:** Deployed on Google Cloud Storage  
🔄 **Domain Setup:** Ready for Cloudflare configuration  

## Next Steps

1. Run the setup script with your Cloudflare credentials
2. Test the application at the new URL
3. Update any existing links to point to the new subdirectory
4. Consider adding a redirect from the old URL if needed

## Support

If you encounter issues:
1. Check the Cloudflare Workers logs
2. Verify DNS propagation using `dig nomadbuilder.io`
3. Test the backend directly: https://wanderlog-ai-998409381703.northamerica-northeast2.run.app 