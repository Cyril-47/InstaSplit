# 🌅 InstaSplit — Seamless Carousel Studio

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PWA: Offline Ready](https://img.shields.io/badge/PWA-Offline%20Ready-brightgreen.svg)]()
[![Platform: Web](https://img.shields.io/badge/Platform-Web-blue.svg)]()

InstaSplit is a beautiful, premium, client-side web application designed to split panoramic and wide landscape photos into seamless Instagram carousel posts. 

It is 100% privacy-first and runs entirely in your browser—**no images are ever uploaded to a server**.

---

## ✨ Features

- **Seamless Transitions:** Split wide panoramic images (e.g. 2880×1620) into a series of perfectly adjacent slides so they flow continuously when swiped on Instagram.
- **Aspect Ratio Formats:** Choose between **4:5 Portrait** (1080×1350 px, optimized for mobile feeds) or **1:1 Square** (1080×1080 px).
- **Interactive Crop & Zoom:** Use click-and-drag panning, mouse-wheel zooming, or precise sliders to position your crop exactly.
- **Live Smartphone Preview:** Verify your layout inside an interactive, swipable phone mockup showing exactly how the slides will look on a mobile Instagram feed.
- **Offline PWA Support:** Install the app directly onto your desktop or mobile home screen, enabling 100% offline functionality.
- **Fast Client-Side ZIP Export:** Slices are rendered instantly via the HTML Canvas API and compressed into a ZIP folder for single-click downloading.
- **Privacy First:** Built purely on client-side technology. Your photos stay on your device.

---

## 🚀 Getting Started

Since InstaSplit is built using pure HTML, CSS, and Vanilla JavaScript, it requires no complex build systems or package installations.

### Option A: Open Directly
Double-click `index.html` in your file explorer to open and run it directly in your web browser.

### Option B: Serve Locally (Recommended for PWA/Installation)
To enable the offline application installation (Progressive Web App features), serve the folder using any local web server:

1. **Python Server:**
   ```bash
   python -m http.server 8080
   ```
2. **Node.js (http-server):**
   ```bash
   npx http-server -p 8080
   ```
3. Open `http://localhost:8080` in your web browser.
4. Click **Install App** in the banner at the top, or the Install icon (⊕) in the browser's URL address bar.

---

## ⌨️ Keyboard Shortcuts & Controls

| Shortcut / Action | Command | Description |
|---|---|---|
| <kbd>Ctrl</kbd> + <kbd>O</kbd> | Open File | Open the system file picker to load an image |
| <kbd>Ctrl</kbd> + <kbd>V</kbd> | Paste Image | Paste an image directly from your clipboard |
| <kbd>Ctrl</kbd> + <kbd>S</kbd> | Export ZIP | Render and download the sliced carousel |
| <kbd>Ctrl</kbd> + <kbd>R</kbd> | Reset Crop | Reset image zoom and pan offset to default |
| <kbd>Ctrl</kbd> + <kbd>F</kbd> | Auto-fit | Auto-fit image dimensions to the crop area |
| <kbd>+</kbd> / <kbd>-</kbd> | Zoom | Increase or decrease zoom level by a step |
| **Scroll Wheel** | Canvas Zoom | Zoom in/out centered directly at the pointer position |
| **Mouse Drag** | Pan | Move the image inside the crop area |
| **Swipe Mockup** | Live Swipe | Swipe horizontally inside the phone mockup to preview |

---

## 💡 Pro Tips for Perfect Instagram Carousels

1. **Aspect Ratio Choice:** Use **4:5 Portrait** for maximum screen real estate on mobile devices. It stands out much more in users' feeds!
2. **Order of Upload:** When posting to Instagram, tap the **+** button, tap the **Select Multiple** icon, and make sure to select the exported slides in correct order (Slide 1, Slide 2, etc.).
3. **Avoid Filters:** Do not apply any filters or adjustments inside Instagram during upload, as doing so can create slight color or lighting mismatches at the borders and break the seamless transition effect.
4. **Original Quality:** Export quality defaults to 90% JPEG, which provides the best balance of file size and visual fidelity. You can increase it to 100% if you want maximum detail.

---

## 🛠️ Technology Stack

- **Markup:** Semantic HTML5
- **Styling:** Premium Custom Vanilla CSS (featuring glassmorphism, responsive grid layout, and dark-theme aesthetics)
- **Logic:** Vanilla JavaScript ES6+
- **Zip Compression:** [JSZip](https://stuk.github.io/jszip/) (loaded via CDN)
- **Offline Capabilities:** Service Worker caching & PWA Manifest

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
