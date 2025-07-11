# WanderLog AI - Vercel Deployment Guide

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Ensure your code is pushed to GitHub
3. **Vercel CLI** (optional): `npm i -g vercel`

## Deployment Steps

### Method 1: Deploy via Vercel Dashboard (Recommended)

1. **Connect Repository**:
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository

2. **Configure Project**:
   - **Framework Preset**: Other
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: Leave empty (not needed for static files)
   - **Output Directory**: Leave empty (Vercel will auto-detect)

3. **Environment Variables** (if needed):
   - Add any required environment variables in the Vercel dashboard
   - Common variables: `OPENAI_API_KEY`, `GOOGLE_CLOUD_STORAGE_BUCKET`

4. **Deploy**:
   - Click "Deploy"
   - Vercel will automatically build and deploy your application

### Method 2: Deploy via Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```

4. **Follow the prompts**:
   - Link to existing project or create new
   - Confirm settings
   - Deploy

## Project Structure for Vercel

```
wanderlog_ai/
├── frontend/           # Static files (HTML, CSS, JS)
├── backend/            # Python serverless functions
├── vercel.json         # Vercel configuration
├── package.json        # Project metadata
└── .vercelignore      # Files to exclude from deployment
```

## Configuration Files

### vercel.json
- Routes API calls to backend functions
- Serves static files from frontend directory
- Configures Python runtime

### API Configuration
- Frontend automatically detects localhost vs production
- Uses relative URLs for production deployment
- Maintains backward compatibility

## Post-Deployment

1. **Test the Application**:
   - Visit your Vercel URL
   - Test all features: story creation, map interaction, etc.

2. **Monitor Logs**:
   - Check Vercel dashboard for function logs
   - Monitor API performance

3. **Custom Domain** (Optional):
   - Add custom domain in Vercel dashboard
   - Configure DNS settings

## Troubleshooting

### Common Issues

1. **API Calls Failing**:
   - Check that `vercel.json` routes are correct
   - Verify backend function is properly configured
   - Check function logs in Vercel dashboard

2. **Static Files Not Loading**:
   - Ensure files are in `frontend/` directory
   - Check file paths in HTML/CSS/JS

3. **Python Dependencies**:
   - Verify `backend/requirements.txt` is complete
   - Check Python runtime version in `vercel.json`

### Environment Variables

If your app requires environment variables:

1. **Add in Vercel Dashboard**:
   - Go to Project Settings → Environment Variables
   - Add required variables (e.g., API keys)

2. **Local Development**:
   - Create `.env` file for local development
   - Add `.env` to `.vercelignore`

## Development Workflow

1. **Local Development**:
   ```bash
   bash scripts/start_servers.sh
   ```

2. **Deploy Changes**:
   - Push to GitHub
   - Vercel automatically redeploys

3. **Preview Deployments**:
   - Create pull requests for preview deployments
   - Test changes before merging

## Support

- **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **Python Runtime**: [vercel.com/docs/runtimes#official-runtimes/python](https://vercel.com/docs/runtimes#official-runtimes/python)
- **Serverless Functions**: [vercel.com/docs/serverless-functions](https://vercel.com/docs/serverless-functions) 