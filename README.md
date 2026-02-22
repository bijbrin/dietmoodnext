# Diet-Mood Tracker (Next.js PWA)

A progressive web app that helps you track the connection between what you eat and how you feel.

## Features

- **Quick Log** — Log meals with mood, energy, symptoms, and notes
- **Insights Dashboard** — 7-day mood trends, energy levels, stats, and pattern detection
- **History** — Full entry history with export to JSON
- **PWA** — Works offline, installable on mobile/desktop
- **Dark/Light Theme** — Toggle between themes

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Chart.js
- IndexedDB (local storage)
- next-pwa for PWA support

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

The built app will be in the `dist` folder, ready to deploy to any static hosting (Vercel, Netlify, GitHub Pages, etc.).

## Development

- `npm run dev` — Start dev server at http://localhost:3000
- `npm run build` — Build static export to `dist/`
- `npm run start` — Serve production build

## Data Storage

All data is stored locally in your browser using IndexedDB. No account required, no data sent to any server.

## Deploy

The app is configured for static export. Deploy the `dist` folder to:
- Vercel
- Netlify
- GitHub Pages
- Any static hosting
