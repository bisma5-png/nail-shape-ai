/**
 * NailSense AI — Computer Vision & Morphological Nail Shape Analyzer
 *
 * Pipeline:
 *  1. Finger / Nail ROI localization (MediaPipe Hands DIP->TIP landmarks, or skin-blob fallback, or manual user ROI)
 *  2. Axis-aligned patch warping into a normalized 120x140 diagnostic frame
 *  3. Adaptive skin-vs-nail chrominance & luminance segmentation + 3x3 morphological cleanup
 *  4. Row-wise width profiling (W_prox, W_mid, W_dist, Length, Tip Taper, Sidewall Flare)
 *  5. Nearest-prototype soft classifier into 6 nail bed archetypes
 */

const ROI_W = 120;
const ROI_H = 140;

const FINGER_PAIRS = [
  { name: 'Index', dip: 7, tip: 8 },
  { name: 'Middle', dip: 11, tip: 12 },
  { name: 'Ring', dip: 15, tip: 16 },
  { name: 'Pinky', dip: 19, tip: 20 },
  { name: 'Thumb', dip: 3, tip: 4 },
];

const ARCHETYPE_PROTOTYPES = [
  {
    id: 'short-wide',
    label: 'Short & Wide Nail Bed',
    ideal: { ratio: 1.08, taper: 0.12, flare: 0.02 },
    weights: { ratio: 3.2, taper: 1.0, flare: 1.4 },
  },
  {
    id: 'square',
    label: 'Square / Flat Free Edge',
    ideal: { ratio: 0.84, taper: 0.06, flare: 0.01 },
    weights: { ratio: 2.2, taper: 2.4, flare: 1.8 },
  },
  {
    id: 'squoval',
    label: 'Squoval / Balanced Parallel',
    ideal: { ratio: 0.76, taper: 0.16, flare: 0.0 },
    weights: { ratio: 2.0, taper: 1.8, flare: 1.6 },
  },
  {
    id: 'oval',
    label: 'Classic Oval',
    ideal: { ratio: 0.68, taper: 0.28, flare: -0.04 },
    weights: { ratio: 2.0, taper: 2.2, flare: 1.4 },
  },
  {
    id: 'almond',
    label: 'Narrow / Almond Tapered',
    ideal: { ratio: 0.54, taper: 0.44, flare: -0.10 },
    weights: { ratio: 2.4, taper: 2.6, flare: 1.4 },
  },
  {
    id: 'fan',
    label: 'Fan-Shaped / Flared',
    ideal: { ratio: 0.88, taper: -0.14, flare: 0.22 },
    weights: { ratio: 1.4, taper: 2.2, flare: 3.6 },
  },
];

let mpHandsInstance = null;
let mpHandsReady = false;

/**
 * Initialize MediaPipe Hands if CDN script is available.
 */
export async function initMediaPipeHands() {
  if (mpHandsInstance) return mpHandsReady;
  if (typeof window === 'undefined' || typeof window.Hands !== 'function') {
    mpHandsReady = false;
    return false;
  }

  try {
    const hands = new window.Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });
    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.55,
      minTrackingConfidence: 0.55,
    });
    mpHandsInstance = hands;
    mpHandsReady = true;
    return true;
  } catch (err) {
    console.warn('MediaPipe Hands init skipped, using local CV fallback:', err);
    mpHandsReady = false;
    return false;
  }
}

function runMediaPipe(imageSource) {
  return new Promise((resolve) => {
    if (!mpHandsInstance) {
      resolve(null);
      return;
    }
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve(null);
      }
    }, 3500);

    mpHandsInstance.onResults((results) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (results && results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        resolve(results.multiHandLandmarks[0]);
      } else {
        resolve(null);
      }
    });

    mpHandsInstance.send({ image: imageSource }).catch(() => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolve(null);
      }
    });
  });
}

function rgbToYCbCr(r, g, b) {
  const y = 0.299 * r + 0.587 * g + 0.114 * b;
  const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
  const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
  return { y, cb, cr };
}

function isSkinPixel(r, g, b) {
  const { y, cb, cr } = rgbToYCbCr(r, g, b);
  return y > 45 && cb >= 74 && cb <= 132 && cr >= 130 && cr <= 182;
}

/**
 * Fallback finger ROI locator when MediaPipe is offline or photo is a single close-up finger.
 */
function locateFallbackFingerROI(srcCanvas) {
  const w = srcCanvas.width;
  const h = srcCanvas.height;
  const ctx = srcCanvas.getContext('2d', { willReadFrequently: true });
  const imgData = ctx.getImageData(0, 0, w, h);
  const { data } = imgData;

  let sumX = 0;
  let sumY = 0;
  let count = 0;
  let minX = w;
  let maxX = 0;
  let minY = h;
  let maxY = 0;

  const step = Math.max(1, Math.floor(Math.min(w, h) / 160));
  for (let py = 0; py < h; py += step) {
    for (let px = 0; px < w; px += step) {
      const idx = (py * w + px) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      if (isSkinPixel(r, g, b)) {
        sumX += px;
        sumY += py;
        count++;
        if (px < minX) minX = px;
        if (px > maxX) maxX = px;
        if (py < minY) minY = py;
        if (py > maxY) maxY = py;
      }
    }
  }

  // If image has clear skin region, focus near upper-middle distal tip of skin blob
  if (count > 25) {
    const blobH = Math.max(40, maxY - minY);
    const centerX = sumX / count;
    // Nail bed usually lies in upper ~25% of a vertically-oriented finger photo
    const roiSize = Math.min(w, h) * 0.38;
    const cx = Math.min(Math.max(centerX, roiSize * 0.55), w - roiSize * 0.55);
    const cy = Math.min(Math.max(minY + blobH * 0.24, roiSize * 0.55), h - roiSize * 0.55);
    return {
      fingerName: 'Primary Nail (Auto-ROI)',
      cx,
      cy,
      boxW: roiSize * 0.86,
      boxH: roiSize,
      angleRad: 0,
      method: 'Skin-Blob Contour ROI',
    };
  }

  // Generic centered ROI fallback
  const size = Math.min(w, h) * 0.42;
  return {
    fingerName: 'Center Nail ROI',
    cx: w / 2,
    cy: h * 0.42,
    boxW: size * 0.86,
    boxH: size,
    angleRad: 0,
    method: 'Center Frame ROI',
  };
}

/**
 * Convert MediaPipe landmarks into finger ROIs and pick the clearest middle/index finger.
 */
function buildFingerROIsFromLandmarks(landmarks, w, h) {
  const rois = [];
  for (const f of FINGER_PAIRS) {
    const dip = landmarks[f.dip];
    const tip = landmarks[f.tip];
    if (!dip || !tip) continue;

    const dx = (tip.x - dip.x) * w;
    const dy = (tip.y - dip.y) * h;
    const segLen = Math.hypot(dx, dy);
    if (segLen < 12) continue;

    // Angle from upward vertical axis (-Y)
    const angleRad = Math.atan2(dx, -dy);
    const cx = (dip.x * 0.32 + tip.x * 0.68) * w;
    const cy = (dip.y * 0.32 + tip.y * 0.68) * h;

    rois.push({
      fingerName: f.name,
      cx,
      cy,
      boxW: Math.max(46, segLen * 0.92),
      boxH: Math.max(58, segLen * 1.15),
      angleRad,
      dipPx: { x: dip.x * w, y: dip.y * h },
      tipPx: { x: tip.x * w, y: tip.y * h },
      method: 'MediaPipe 21-Keypoint',
    });
  }
  return rois;
}

/**
 * Extract an axis-aligned 120x140 patch from the source canvas.
 */
function extractAlignedPatch(srcCanvas, roi) {
  const patchCanvas = document.createElement('canvas');
  patchCanvas.width = ROI_W;
  patchCanvas.height = ROI_H;
  const pCtx = patchCanvas.getContext('2d', { willReadFrequently: true });

  pCtx.fillStyle = '#20181a';
  pCtx.fillRect(0, 0, ROI_W, ROI_H);

  pCtx.save();
  pCtx.translate(ROI_W / 2, ROI_H / 2);
  pCtx.scale(ROI_W / roi.boxW, ROI_H / roi.boxH);
  pCtx.rotate(-roi.angleRad);
  pCtx.drawImage(srcCanvas, -roi.cx, -roi.cy);
  pCtx.restore();

  return patchCanvas;
}

/**
 * Segment the nail plate inside the 120x140 normalized patch and measure its contour geometry.
 */
function segmentAndMeasureNail(patchCanvas) {
  const ctx = patchCanvas.getContext('2d', { willReadFrequently: true });
  const img = ctx.getImageData(0, 0, ROI_W, ROI_H);
  const { data } = img;

  // Sample skin tone reference from the lateral sidewalls & lower proximal border (preferring skin pixels)
  let skinR = 0, skinG = 0, skinB = 0, skinN = 0;
  let allBorderR = 0, allBorderG = 0, allBorderB = 0, allBorderN = 0;
  for (let y = Math.floor(ROI_H * 0.35); y < Math.floor(ROI_H * 0.94); y++) {
    for (let x = 4; x < ROI_W - 4; x++) {
      const isSideOrBottom = x < 22 || x > ROI_W - 22 || y > Math.floor(ROI_H * 0.84);
      if (!isSideOrBottom) continue;
      const idx = (y * ROI_W + x) * 4;
      const r = data[idx], g = data[idx + 1], b = data[idx + 2];
      allBorderR += r; allBorderG += g; allBorderB += b; allBorderN++;
      if (isSkinPixel(r, g, b)) {
        skinR += r;
        skinG += g;
        skinB += b;
        skinN++;
      }
    }
  }
  if (skinN >= 20) {
    skinR /= skinN; skinG /= skinN; skinB /= skinN;
  } else {
    skinR = allBorderN ? allBorderR / allBorderN : 195;
    skinG = allBorderN ? allBorderG / allBorderN : 150;
    skinB = allBorderN ? allBorderB / allBorderN : 132;
  }
  const skinYCC = rgbToYCbCr(skinR, skinG, skinB);

  // Sample central nail core reference
  let coreR = 0, coreG = 0, coreB = 0, coreN = 0;
  for (let y = Math.floor(ROI_H * 0.36); y < Math.floor(ROI_H * 0.64); y++) {
    for (let x = Math.floor(ROI_W * 0.38); x < Math.floor(ROI_W * 0.62); x++) {
      const idx = (y * ROI_W + x) * 4;
      coreR += data[idx];
      coreG += data[idx + 1];
      coreB += data[idx + 2];
      coreN++;
    }
  }
  coreR /= Math.max(1, coreN);
  coreG /= Math.max(1, coreN);
  coreB /= Math.max(1, coreN);
  const coreYCC = rgbToYCbCr(coreR, coreG, coreB);

  // Compute soft nail score for every pixel
  const rawMask = new Uint8Array(ROI_W * ROI_H);
  const scores = new Float32Array(ROI_W * ROI_H);

  // Nail plates are typically lighter/pinker or glossier than skin OR polished (different chrominance from skin)
  const coreDiffFromSkin = Math.hypot(
    coreYCC.y - skinYCC.y,
    (coreYCC.cb - skinYCC.cb) * 1.5,
    (coreYCC.cr - skinYCC.cr) * 1.5
  );

  for (let y = 0; y < ROI_H; y++) {
    for (let x = 0; x < ROI_W; x++) {
      const i = y * ROI_W + x;
      const idx = i * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const ycc = rgbToYCbCr(r, g, b);

      const dSkin = Math.hypot(
        (ycc.y - skinYCC.y) * 0.75,
        (ycc.cb - skinYCC.cb) * 1.7,
        (ycc.cr - skinYCC.cr) * 1.7
      );
      const dCore = Math.hypot(
        (ycc.y - coreYCC.y) * 0.85,
        (ycc.cb - coreYCC.cb) * 1.5,
        (ycc.cr - coreYCC.cr) * 1.5
      );

      // Gentle radial prior keeping background corners out
      const nx = (x - ROI_W / 2) / (ROI_W * 0.42);
      const ny = (y - ROI_H * 0.48) / (ROI_H * 0.44);
      const radialPenalty = (nx * nx + ny * ny) * 14;

      // Positive if closer to core nail appearance & distinct from surrounding skin
      const brightnessBoost = (ycc.y - skinYCC.y) * 0.35;
      const score = (dSkin * 1.05 - dCore * 0.95 + brightnessBoost) - radialPenalty + (coreDiffFromSkin > 12 ? 4 : 8);
      scores[i] = score;
      rawMask[i] = score > 2.5 ? 1 : 0;
    }
  }

  // Morphological 3x3 smoothing (2 passes)
  let mask = new Uint8Array(rawMask);
  for (let pass = 0; pass < 2; pass++) {
    const next = new Uint8Array(ROI_W * ROI_H);
    for (let y = 1; y < ROI_H - 1; y++) {
      for (let x = 1; x < ROI_W - 1; x++) {
        let sum = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            sum += mask[(y + dy) * ROI_W + (x + dx)];
          }
        }
        next[y * ROI_W + x] = sum >= 5 ? 1 : 0;
      }
    }
    mask = next;
  }

  // Extract row-wise left/right spans near the central x region to avoid stray noise blobs
  const rowSpans = [];
  for (let y = 8; y < ROI_H - 8; y++) {
    // Expand outward from center x = ROI_W/2 (or nearest active pixel near center)
    let cx = Math.floor(ROI_W / 2);
    if (!mask[y * ROI_W + cx]) {
      let found = -1;
      for (let offset = 1; offset < 18; offset++) {
        if (mask[y * ROI_W + cx - offset]) { found = cx - offset; break; }
        if (mask[y * ROI_W + cx + offset]) { found = cx + offset; break; }
      }
      if (found === -1) continue;
      cx = found;
    }

    let left = cx;
    while (left > 4 && mask[y * ROI_W + left - 1]) left--;
    let right = cx;
    while (right < ROI_W - 5 && mask[y * ROI_W + right + 1]) right++;

    const width = right - left + 1;
    if (width >= 10) {
      rowSpans.push({ y, left, right, width });
    }
  }

  // Fallback synthetic geometry if segmentation failed completely (e.g. blank/dark image)
  if (rowSpans.length < 18) {
    return {
      mask,
      rowSpans,
      metrics: {
        aspectRatio: 0.78,
        tipTaper: 0.16,
        sidewallFlare: 0.01,
        widthPx: 44,
        lengthPx: 56,
        segmentationQuality: 0.45,
      },
    };
  }

  const yTop = rowSpans[0].y;
  const yBot = rowSpans[rowSpans.length - 1].y;
  const lengthPx = Math.max(18, yBot - yTop + 1);

  const bandAvgWidth = (startFrac, endFrac) => {
    const startY = yTop + lengthPx * startFrac;
    const endY = yTop + lengthPx * endFrac;
    const subset = rowSpans.filter((r) => r.y >= startY && r.y <= endY);
    if (!subset.length) return rowSpans[Math.floor(rowSpans.length / 2)].width;
    return subset.reduce((acc, r) => acc + r.width, 0) / subset.length;
  };

  const wDist = bandAvgWidth(0.08, 0.22); // near free edge (top)
  const wMid = bandAvgWidth(0.38, 0.62);  // mid nail plate
  const wProx = bandAvgWidth(0.72, 0.88); // near cuticle (bottom)

  const aspectRatio = Number((wMid / lengthPx).toFixed(3));
  const tipTaper = Number((1 - wDist / Math.max(1, wMid)).toFixed(3));
  const sidewallFlare = Number(((wDist - wProx) / Math.max(1, wProx)).toFixed(3));

  return {
    mask,
    rowSpans,
    metrics: {
      aspectRatio,
      tipTaper,
      sidewallFlare,
      widthPx: Math.round(wMid),
      lengthPx: Math.round(lengthPx),
      wProx: Math.round(wProx),
      wMid: Math.round(wMid),
      wDist: Math.round(wDist),
      yTop,
      yBot,
      segmentationQuality: Math.min(0.98, 0.62 + Math.min(0.36, rowSpans.length / 180)),
    },
  };
}

/**
 * Classify geometric metrics into one of the 6 nail bed archetypes.
 */
function classifyNailMetrics(metrics) {
  const scored = ARCHETYPE_PROTOTYPES.map((proto) => {
    const dRatio = (metrics.aspectRatio - proto.ideal.ratio) * proto.weights.ratio;
    const dTaper = (metrics.tipTaper - proto.ideal.taper) * proto.weights.taper;
    const dFlare = (metrics.sidewallFlare - proto.ideal.flare) * proto.weights.flare;
    const dist = Math.sqrt(dRatio * dRatio + dTaper * dTaper + dFlare * dFlare);
    return { ...proto, dist };
  }).sort((a, b) => a.dist - b.dist);

  const best = scored[0];
  const second = scored[1];
  const margin = Math.max(0.05, second.dist - best.dist);
  const rawConf = 0.72 + Math.min(0.24, margin * 0.28) * (metrics.segmentationQuality || 0.85);
  const confidence = Math.round(Math.min(97, Math.max(71, rawConf * 100)));

  return {
    archetypeId: best.id,
    archetypeLabel: best.label,
    confidence,
    runnerUp: second.label,
  };
}

/**
 * Render the 3 diagnostic mini-canvases (ROI, Mask, Width Profile).
 */
export function renderDiagnosticCanvases(patchCanvas, segResult, canvases) {
  const { roiCropCanvas, roiMaskCanvas, roiContourCanvas } = canvases;
  if (!roiCropCanvas || !roiMaskCanvas || !roiContourCanvas) return;

  // 1. Aligned ROI
  const c1 = roiCropCanvas.getContext('2d');
  c1.clearRect(0, 0, ROI_W, ROI_H);
  c1.drawImage(patchCanvas, 0, 0);

  // 2. Binary Mask overlay
  const c2 = roiMaskCanvas.getContext('2d');
  const maskImg = c2.createImageData(ROI_W, ROI_H);
  for (let i = 0; i < ROI_W * ROI_H; i++) {
    const on = segResult.mask[i] === 1;
    const idx = i * 4;
    maskImg.data[idx] = on ? 245 : 28;
    maskImg.data[idx + 1] = on ? 168 : 22;
    maskImg.data[idx + 2] = on ? 184 : 25;
    maskImg.data[idx + 3] = 255;
  }
  c2.putImageData(maskImg, 0, 0);

  // 3. Width / Taper Contour Profile
  const c3 = roiContourCanvas.getContext('2d');
  c3.fillStyle = '#1b1416';
  c3.fillRect(0, 0, ROI_W, ROI_H);

  // Draw midline
  c3.strokeStyle = 'rgba(255,255,255,0.16)';
  c3.setLineDash([3, 3]);
  c3.beginPath();
  c3.moveTo(ROI_W / 2, 6);
  c3.lineTo(ROI_W / 2, ROI_H - 6);
  c3.stroke();
  c3.setLineDash([]);

  if (segResult.rowSpans.length > 0) {
    c3.strokeStyle = '#ff9cb0';
    c3.lineWidth = 2;
    c3.beginPath();
    segResult.rowSpans.forEach((r, idx) => {
      if (idx === 0) c3.moveTo(r.left, r.y);
      else c3.lineTo(r.left, r.y);
    });
    for (let i = segResult.rowSpans.length - 1; i >= 0; i--) {
      const r = segResult.rowSpans[i];
      c3.lineTo(r.right, r.y);
    }
    c3.closePath();
    c3.fillStyle = 'rgba(184, 93, 110, 0.25)';
    c3.fill();
    c3.stroke();

    // Draw W_dist, W_mid, W_prox horizontal measurement lines
    const { yTop, lengthPx } = segResult.metrics;
    const marks = [
      { frac: 0.15, color: '#6ee7b7', label: 'Wd' },
      { frac: 0.50, color: '#fde68a', label: 'Wm' },
      { frac: 0.80, color: '#93c5fd', label: 'Wp' },
    ];
    marks.forEach((m) => {
      const targetY = Math.round(yTop + lengthPx * m.frac);
      const span = segResult.rowSpans.find((r) => r.y >= targetY);
      if (span) {
        c3.strokeStyle = m.color;
        c3.lineWidth = 1.6;
        c3.beginPath();
        c3.moveTo(span.left, span.y);
        c3.lineTo(span.right, span.y);
        c3.stroke();
      }
    });
  }
}

/**
 * Full analysis entry point.
 * @param {HTMLCanvasElement} sourceCanvas - Raw image canvas (without CV overlays drawn on it).
 * @param {Object|null} manualROI - Optional manual { cx, cy, boxW, boxH } from user drag.
 */
export async function analyzeNailImage(sourceCanvas, manualROI = null) {
  const w = sourceCanvas.width;
  const h = sourceCanvas.height;

  let rois = [];
  let landmarks = null;

  if (manualROI) {
    rois = [{
      fingerName: 'Manual Calibrated Nail',
      cx: manualROI.cx,
      cy: manualROI.cy,
      boxW: Math.max(36, manualROI.boxW),
      boxH: Math.max(42, manualROI.boxH),
      angleRad: 0,
      method: 'Manual ROI Calibration',
    }];
  } else {
    await initMediaPipeHands();
    landmarks = await runMediaPipe(sourceCanvas);
    if (landmarks) {
      rois = buildFingerROIsFromLandmarks(landmarks, w, h);
    }
    if (!rois.length) {
      rois = [locateFallbackFingerROI(sourceCanvas)];
    }
  }

  // Prefer Middle or Index finger if multiple landmarks exist
  const primaryROI =
    rois.find((r) => r.fingerName === 'Middle') ||
    rois.find((r) => r.fingerName === 'Index') ||
    rois[0];

  const patchCanvas = extractAlignedPatch(sourceCanvas, primaryROI);
  const segResult = segmentAndMeasureNail(patchCanvas);
  const classification = classifyNailMetrics(segResult.metrics);

  return {
    primaryROI,
    allROIs: rois,
    landmarks,
    patchCanvas,
    segResult,
    metrics: segResult.metrics,
    classification,
  };
}

/**
 * Draw CV overlays (landmarks, finger axis, ROI box, metric callout) onto display canvas.
 */
export function drawVisionOverlay(displayCtx, analysis) {
  if (!analysis) return;
  const { allROIs, primaryROI, landmarks, classification, metrics } = analysis;
  const w = displayCtx.canvas.width;
  const h = displayCtx.canvas.height;

  displayCtx.save();

  // Draw subtle hand skeleton if MediaPipe landmarks were detected
  if (landmarks) {
    displayCtx.fillStyle = 'rgba(255, 255, 255, 0.78)';
    for (const lm of landmarks) {
      displayCtx.beginPath();
      displayCtx.arc(lm.x * w, lm.y * h, 3, 0, Math.PI * 2);
      displayCtx.fill();
    }
  }

  // Draw secondary finger ROIs lightly
  for (const roi of allROIs) {
    const isPrimary = roi === primaryROI;
    displayCtx.save();
    displayCtx.translate(roi.cx, roi.cy);
    displayCtx.rotate(roi.angleRad);

    displayCtx.strokeStyle = isPrimary ? '#ff5e7e' : 'rgba(255, 255, 255, 0.55)';
    displayCtx.lineWidth = isPrimary ? 2.5 : 1.3;
    displayCtx.setLineDash(isPrimary ? [] : [4, 4]);
    displayCtx.strokeRect(-roi.boxW / 2, -roi.boxH / 2, roi.boxW, roi.boxH);

    if (isPrimary) {
      // Axis arrow
      displayCtx.setLineDash([]);
      displayCtx.strokeStyle = '#6ee7b7';
      displayCtx.lineWidth = 1.8;
      displayCtx.beginPath();
      displayCtx.moveTo(0, roi.boxH * 0.35);
      displayCtx.lineTo(0, -roi.boxH * 0.35);
      displayCtx.stroke();
    }
    displayCtx.restore();
  }

  // Floating HUD pill near primary ROI
  const label = `${classification.archetypeLabel} • W/L ${metrics.aspectRatio.toFixed(2)} (${classification.confidence}%)`;
  displayCtx.font = '600 12px "Plus Jakarta Sans", sans-serif';
  const textW = displayCtx.measureText(label).width;
  const pillW = textW + 20;
  const pillH = 26;
  const px = Math.min(Math.max(10, primaryROI.cx - pillW / 2), w - pillW - 10);
  const py = Math.max(10, primaryROI.cy - primaryROI.boxH / 2 - 34);

  displayCtx.fillStyle = 'rgba(35, 24, 27, 0.86)';
  displayCtx.beginPath();
  displayCtx.roundRect(px, py, pillW, pillH, 999);
  displayCtx.fill();

  displayCtx.fillStyle = '#fff9f5';
  displayCtx.fillText(label, px + 10, py + 17);

  displayCtx.restore();
}
