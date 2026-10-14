# ZenStars ✦

> A calm, meditative Star Battle (Queens / Two Not Touch) celestial grid logic puzzle game.

[![CI](https://github.com/OfferPk/zenstars/actions/workflows/ci.yml/badge.svg)](https://github.com/OfferPk/zenstars/actions/workflows/ci.yml)
[![Android](https://github.com/OfferPk/zenstars/actions/workflows/android.yml/badge.svg)](https://github.com/OfferPk/zenstars/actions/workflows/android.yml)
[![Pages](https://github.com/OfferPk/zenstars/actions/workflows/pages.yml/badge.svg)](https://github.com/OfferPk/zenstars/actions/workflows/pages.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-teal.svg)](LICENSE)

Place glowing celestial stars onto an $N \times N$ grid partitioned into colored constellation regions such that each row, column, and color zone contains the exact required number of stars (1 or 2 stars), and no two stars touch horizontally, vertically, or diagonally.

---

## ✨ Features

- 🌌 **50 Solver-Verified Levels**: 5 thematic constellation packs progressing from gentle 5x5 dawns to mind-bending 9x9 multi-star cosmic galaxies.
- 🎵 **Procedural Starlight Audio**: Web Audio API celestial acoustic synthesizer producing harmonic chimes, soft dot taps, starlight sweeps, and cascading arpeggios.
- 📱 **Multi-Platform Zero-Network**: 100% offline Progressive Web App (PWA) with service worker offline caching and Capacitor 6 Android packaging.
- 🎨 **Cosmic Glassmorphism UI**: High-contrast, deep obsidian cosmic canvas with glowing stellar bodies, pastel nebula zones, fluid animations, and high-DPI scaling.
- 💡 **Smart Deduction Assistant**: Intelligent constraint propagation solver that offers organic, non-spoiling hints or verifies your logical board state.
- 🔄 **Player-Friendly Quality of Life**: 3-state cell cycling (Empty ➔ Dot ➔ Star ➔ Empty), quick dot drag-painting, unlimited undo, restart, level progress tracking, and ambient sound toggle.

---

## 🎮 Play Online

Play the live demo directly in any modern mobile or desktop browser:
👉 **[https://offerpk.github.io/zenstars/](https://offerpk.github.io/zenstars/)**

---

## 📦 Android APK Download

Download the signed debug Android APK from GitHub Actions Artifacts or the Releases page:
- **[Latest APK Artifact (GitHub Actions)](https://github.com/OfferPk/zenstars/actions/workflows/android.yml)**

---

## 🛠️ Local Development & Build

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- npm

### Setup
```bash
git clone https://github.com/OfferPk/zenstars.git
cd zenstars
npm install
```

### Running Tests
Run the automated engine and puzzle solver test suite:
```bash
npm test
```

### Building Web Assets
Bundle the web runtime assets into `www/`:
```bash
npm run build
```

### Building for Android (Capacitor)
```bash
npx cap add android
npx cap sync android
cd android
./gradlew assembleDebug
```

---

## 📜 License

Distributed under the [MIT License](LICENSE). Copyright © 2026 OfferPk.
