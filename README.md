# NailSense AI — Nail Shape Detection & Extension Studio

An interactive computer-vision web application that detects natural nail bed geometry and generates a salon-grade technician blueprint for custom nail extensions, apex placement, form fitting, and nail art design.

Built as a clean, dependency-free web app (works 100% client-side in any modern browser and deploys directly to GitHub Pages).

## Features

- **Real-Time Nail Shape & Proportion Detection (`js/nailAnalyzer.js`)**:
  - Uses **MediaPipe Hands** (21-landmark detection to locate DIP-to-TIP finger axes) with a built-in **YCbCr skin-blob + chrominance/luminance segmentation fallback** so it works even offline or on close-up single-finger shots.
  - Extracts a normalized `120x140` axis-aligned nail ROI, performs 3x3 morphological cleanup, and measures:
    - **Width / Length Ratio (`W/L`)**
    - **Tip Taper Index**
    - **Sidewall Flare**
  - Classifies into 6 nail bed archetypes: *Short & Wide*, *Square / Flat*, *Squoval / Balanced*, *Classic Oval*, *Narrow / Almond*, and *Fan-Shaped / Flared*.
  - Interactive **manual ROI calibration** (click & drag a box over any nail to re-run geometry on that exact region).
- **Technician Extension Blueprint (`js/recommendations.js`)**:
  - Top 3 recommended extension shapes with match percentages + shapes to avoid.
  - Structural protocol: extension system, apex placement %, pinching/C-curve timing, paper form tilt, prep steps, and optical design rules.
  - **Interactive SVG Extension & Art Simulator** (preview *Soft Almond, Classic Oval, Coffin, Squoval, Tapered Square, Petite Stiletto* across *Short, Medium, Long, XL* lengths and 5 curated art styles).
  - Exportable `.txt` Technician Consultation Spec Sheet.
- **Optional Gemini Vision Integration**:
  - Works completely without API keys; optionally add a Gemini API key in the UI for multimodal VLM nail inspection notes.

## Project Structure

```text
nail-shape-ai/
├── index.html              # Studio UI, CV diagnostic views, simulator & modals
├── css/
│   └── styles.css          # Responsive salon-tech aesthetic
├── js/
│   ├── app.js              # UI controller, webcam/upload/ROI drag, Gemini hook
│   ├── nailAnalyzer.js     # MediaPipe + local CV segmentation & geometry classifier
│   ├── recommendations.js  # 6 archetype blueprints + interactive SVG simulator
│   └── sampleGenerator.js  # Synthetic clinical finger presets for 1-click testing
├── .gitignore
└── README.md
```

## Running Locally

Because the app uses ES Modules (`<script type="module">`), serve it over any local HTTP server (opening `file://` directly blocks ES module imports in Chrome/Edge):

- **Option A (Windows 1-Click — No Node/Python required)**: Double-click `Launch-NailSense.bat` in this folder. It starts a built-in PowerShell HTTP server on `http://localhost:8080/` and opens your browser.
- **Option B (Python, if installed)**:
  ```bash
  python -m http.server 8080
  ```
  Then open `http://localhost:8080`.
- **Option C (Node.js, if installed)**:
  ```bash
  npx serve .
  ```

## Deploying to GitHub Pages

1. Create a new repository on GitHub (e.g., `nail-shape-ai`).
2. Push this folder's contents to the `main` branch.
3. In your GitHub repository go to **Settings → Pages → Build and deployment**:
   - Source: **Deploy from a branch**
   - Branch: `main` / `/ (root)`
4. Your live site will be available at `https://<your-username>.github.io/nail-shape-ai/`.

## Embedded / Edge Extension Idea

The 4-stage CV pipeline in `js/nailAnalyzer.js` uses lightweight integer/float array ops (`120x140` ROI patches) and YCbCr thresholding, making it straightforward to port to **OpenCV (C++/Python)** on a **Raspberry Pi**, **Jetson Orin Nano**, or an **ESP32-S3-EYE** smart salon mirror / nail scanner rig.
