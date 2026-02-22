# 🍽️ Diet Mood Next - Vercel Deployment Guide

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Push this code to GitHub
3. **Vercel CLI** (optional, for local testing): `npm i -g vercel`

## Setup Instructions

### Step 1: Connect to Vercel

**Option A: Via Vercel Dashboard (Recommended)**
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Vercel will auto-detect Next.js settings

**Option B: Via CLI**
```bash
npm install -g vercel
vercel login
vercel --prod
```

### Step 2: Configure GitHub Secrets

For CI/CD deployment via GitHub Actions, add these secrets to your repository:

| Secret | How to Get It |
|--------|---------------|
| `VERCEL_TOKEN` | Vercel Dashboard → Settings → Tokens → Create |
| `VERCEL_ORG_ID` | `.vercel/project.json` after first deploy, or Team Settings |
| `VERCEL_PROJECT_ID` | `.vercel/project.json` after first deploy |

**To add secrets:**
1. GitHub Repo → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add each secret above

### Step 3: Get Vercel IDs

After linking your project (via dashboard or CLI), find these in `.vercel/project.json`:

```json
{
  "orgId": "YOUR_ORG_ID",
  "projectId": "YOUR_PROJECT_ID"
}
```

Add these values to your GitHub secrets as `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID`.

### Step 4: Deploy

**Automatic (CI/CD):**
- Push to `main` branch → Auto deploys to production
- Create a Pull Request → Deploys preview URL

**Manual:**
```bash
vercel --prod
```

## Environment Variables

If your app needs API keys (e.g., for food analysis), add them in:
- Vercel Dashboard → Project Settings → Environment Variables
- Or via CLI: `vercel env add KIMI_API_KEY`

## Features

- ✅ Next.js 14 with App Router
- ✅ PWA Support (offline capable)
- ✅ IndexedDB for local data storage
- ✅ GitHub Actions CI/CD
- ✅ Preview deployments for PRs
- ✅ Automatic production deployments

## Troubleshooting

### Build Fails
```bash
# Test locally
npm run build
```

### Deployment Fails
- Check GitHub Secrets are set correctly
- Verify Vercel token has deployment permissions
- Check Actions logs for specific errors

### Static Assets Not Loading
- Ensure `next.config.js` has correct output settings
- Check Vercel build output settings

## Project Structure

```
diet-mood-next/
├── .github/workflows/
│   └── deploy.yml          # CI/CD configuration
├── app/
│   ├── api/                # API routes
│   ├── components/         # React components
│   ├── hooks/              # Custom hooks
│   ├── lib/                # Utilities
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home page
├── public/                 # Static assets
├── next.config.js          # Next.js config
└── package.json
```

## Learn More

- [Next.js on Vercel](https://nextjs.org/docs/deployment)
- [Vercel GitHub Integration](https://vercel.com/docs/concepts/git/vercel-for-github)
- [GitHub Actions](https://docs.github.com/en/actions)
