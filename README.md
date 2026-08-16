# ☕ माहौल · mahaul.wtf
> *Desi sounds, familiar places — slow evenings & long roads.*

An immersive, theme-driven ambient music player celebrating the sounds, nostalgia, and moods of South Asia.

---

## ✨ Features

- 🎭 **Curated Desi Moods & Themes**:
  - **Chai Nukkad** (60s & 70s Bollywood Classics)
  - **Pehla Pyaar** (Timeless Bollywood Romantic Melodies)
  - **Raju Mistry** (80s & 90s Golden Hour Hits)
  - **Dil Ka Tootna** (Heartbreak & Soulful Healing Tracks)
  - **Party Mode** (High-Energy Bollywood Dance Anthems)
  - **Marathi Dance** (Dhol Tasha & High-Energy Zingaat Tracks)
  - **Marathi Love** (Soulful Marathi Romantic Hits)
- 🔀 **Smart Playback Engine**:
  - Shuffle & Sequential playlist modes
  - Draggable & clickable progress seeking bar
  - Volume control with smooth slider
  - MediaSession API integration for native lock-screen & keyboard media key controls
  - Endless Radio fallback for uninterrupted playback
- 🎨 **Visual Aesthetics**:
  - Custom handcrafted theme artworks
  - Dynamic smooth background crossfades
  - Alternating English (`mahaul.`) and Devanagari (`माहौल.`) brand logo
  - Ultra-sleek floating glassmorphism player

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Python](https://python.org/) (3.10+)

### 1. Install Dependencies
```bash
# Frontend dependencies
npm install

# Backend dependencies
pip install -r backend/requirements.txt
```

### 2. Run Development Server
```bash
npm run dev
```

This starts both the FastAPI backend (`http://localhost:2439`) and the Vite frontend (`http://localhost:3003`) concurrently.

- **Web App**: `http://localhost:3003`
- **Backend API Docs**: `http://localhost:2439/docs`

---

## 📦 Building for Production

To create a static production build:
```bash
npm run build
```
This generates the optimized production assets in the `build/` directory.

---

## 🌐 Deployment

### Deploy on Vercel
1. Import your GitHub repository into [Vercel](https://vercel.com/new).
2. Framework preset: **Vite**
3. Build command: `npm run build`
4. Output directory: `build`
5. Click **Deploy**.

### Deploy on Netlify
- **Option 1 (Drag and Drop)**: Drag and drop the `build/` folder into [app.netlify.com/drop](https://app.netlify.com/drop).
- **Option 2 (Git)**: Connect repository to Netlify; it will automatically use [netlify.toml](netlify.toml).

---

## ⚖️ Copyright & Disclaimer

All music & media rights belong to their respective copyright owners. Mahaul is built for educational, curation, and personal appreciation purposes.
