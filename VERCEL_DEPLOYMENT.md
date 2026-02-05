# Vercel Deployment Guide

## Quick Start

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   cd /Users/alex.voitik/Documents/Code/regex-dojo
   vercel
   ```

4. **Set Environment Variable**:
   When prompted or after deployment:
   ```bash
   vercel env add GEMINI_API_KEY
   ```
   Paste your API key: `AIzaSyAweX5NCA6XwdB7VJJyJtkAwmSraC1gnXA`

5. **Redeploy** (to apply environment variable):
   ```bash
   vercel --prod
   ```

## What Vercel Will Do

- ✅ Build your React frontend
- ✅ Deploy frontend to global CDN
- ✅ Deploy `/api/explain` as serverless function
- ✅ Provide HTTPS URL automatically
- ✅ Enable automatic deployments on git push

## Your Live URLs

After deployment, you'll get:
- **Frontend**: `https://your-project.vercel.app`
- **API**: `https://your-project.vercel.app/api/explain`

## Testing

Once deployed, test the "Explain" button on your live site!

## Updating

To update your deployment:
```bash
git add .
git commit -m "Update"
git push
vercel --prod
```

Or connect your GitHub repo for automatic deployments on every push!
