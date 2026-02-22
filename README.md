# 🍽️ Diet-Mood Tracker (Next.js PWA)

A progressive web app that helps you track the connection between what you eat and how you feel.

## ✨ Features

- **Quick Log** — Log meals with mood, energy, symptoms, and notes
- **AI Food Analysis** — Take a photo and get automatic food analysis with calorie estimates
- **Insights Dashboard** — 7-day mood trends, energy levels, stats, and pattern detection
- **History** — Full entry history with dates, export to JSON
- **PWA** — Works offline, installable on mobile/desktop
- **Dark/Light Theme** — Toggle between themes

## 🚀 Recent Updates

### v1.1.0 - Date Display Fix
- ✅ Entry cards now show **date** (e.g., "Today • 2:30 PM", "Yesterday • 9:00 AM", "Mon, Feb 23 • 7:45 AM")
- ✅ Smart date formatting: Today, Yesterday, or specific date
- ✅ CI/CD pipeline with GitHub Actions for Vercel deployment

## 🛠️ Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Chart.js
- IndexedDB (local storage)
- next-pwa for PWA support
- GitHub Actions for CI/CD

## 🏃 Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## 📦 Deployment

### Vercel (Recommended)

**Automatic CI/CD:**
1. Push code to GitHub
2. Connect repo to Vercel
3. Add GitHub Secrets (see `DEPLOY.md`)
4. Every push to `main` auto-deploys!

**Manual:**
```bash
npm install -g vercel
vercel --prod
```

See [`DEPLOY.md`](DEPLOY.md) for detailed setup instructions.

### Other Platforms

The app builds to `.next/` (standalone output). Deploy to:
- Netlify
- Railway
- Render
- Any Node.js hosting

## 💾 Data Storage

All data is stored locally in your browser using IndexedDB. No account required, no data sent to any server (except AI food analysis if you use that feature).

## 📝 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server at http://localhost:3000 |
| `npm run build` | Build for production |
| `npm run start` | Serve production build |

## 🔧 Environment Variables

For AI food analysis, create `.env.local`:

```env
KIMI_API_KEY=your_api_key_here
```

## 📱 PWA Installation

1. Open the app in Chrome/Safari
2. Tap "Add to Home Screen" or install prompt
3. Use offline!

## 📄 License

MIT
