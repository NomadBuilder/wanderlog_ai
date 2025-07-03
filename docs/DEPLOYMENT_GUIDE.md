# 🚀 WanderLog AI Deployment Guide

## Quick Deployment

### Option 1: Using the Deployment Script (Recommended)

```bash
./deploy.sh
```

This script will:
- ✅ Check for uncommitted changes
- ✅ Stage all modified files
- ✅ Prompt for a commit message (or use default)
- ✅ Commit changes
- ✅ Push to GitHub
- ✅ Show deployment status

### Option 2: Manual Git Commands

```bash
# Stage all changes
git add .

# Commit with a message
git commit -m "Your commit message here"

# Push to GitHub
git push origin main
```

## When to Deploy

Deploy your changes when you've made:

### 🎯 Major Features
- New functionality added
- Significant UI improvements
- Backend API changes
- Database schema updates

### 🔧 Refactoring
- Code restructuring
- Performance improvements
- Bug fixes
- Documentation updates

### 🐛 Bug Fixes
- Critical bug fixes
- Security patches
- Error handling improvements

## Deployment Workflow

1. **Make your changes** to the codebase
2. **Test locally** to ensure everything works
3. **Run the deployment script:**
   ```bash
   ./deploy.sh
   ```
4. **Enter a descriptive commit message** when prompted
5. **Verify deployment** on GitHub

## Commit Message Guidelines

### Good Examples:
- `Add interactive world map feature`
- `Fix story detail view navigation bug`
- `Refactor backend API for better performance`
- `Update UI styling and responsive design`
- `Add error handling for Google Cloud Storage`

### Avoid:
- `fix stuff`
- `update`
- `changes`
- `wip`

## Repository Information

- **GitHub URL:** https://github.com/NomadBuilder/wanderlog_ai
- **Main Branch:** `main`
- **Remote:** `origin`

## Troubleshooting

### If deployment fails:

1. **Check Git status:**
   ```bash
   git status
   ```

2. **Check remote connection:**
   ```bash
   git remote -v
   ```

3. **Check for conflicts:**
   ```bash
   git pull origin main
   ```

4. **Manual push:**
   ```bash
   git push origin main
   ```

### Common Issues:

- **Authentication errors:** Make sure you're logged into GitHub
- **Merge conflicts:** Resolve conflicts before pushing
- **Network issues:** Check your internet connection

## Development vs Production

- **Development:** Local changes on your machine
- **Production:** Code deployed to GitHub (your source of truth)

Remember: Always test locally before deploying to production!

---

**Happy Deploying! 🎉** 