import {
  analyzeNailImage,
  drawVisionOverlay,
  renderDiagnosticCanvases,
  initMediaPipeHands,
} from './nailAnalyzer.js';
import {
  ARCHETYPE_BLUEPRINTS,
  EXTENSION_SHAPES,
  NAIL_ART_STYLES,
  renderExtensionSVG,
} from './recommendations.js';
import { generatePresetCanvas } from './sampleGenerator.js';

const GEMINI_STORAGE_KEY = 'nailsense_gemini_api_key';

const state = {
  rawCanvas: null,
  analysis: null,
  manualROI: null,
  selectedShapeId: 'almond',
  selectedLength: 'medium',
  selectedArtId: 'micro-french',
  showOverlay: true,
  webcamStream: null,
  dragROI: null,
};

// DOM elements
const els = {
  engineBadge: document.getElementById('engineBadge'),
  engineBadgeText: document.getElementById('engineBadgeText'),
  fileInput: document.getElementById('fileInput'),
  btnWebcam: document.getElementById('btnWebcam'),
  btnCaptureFrame: document.getElementById('btnCaptureFrame'),
  btnStopCamera: document.getElementById('btnStopCamera'),
  cameraOverlayBar: document.getElementById('cameraOverlayBar'),
  webcamVideo: document.getElementById('webcamVideo'),
  stageWrapper: document.getElementById('stageWrapper'),
  dropPlaceholder: document.getElementById('dropPlaceholder'),
  visionCanvas: document.getElementById('visionCanvas'),
  toggleOverlay: document.getElementById('toggleOverlay'),
  btnReanalyze: document.getElementById('btnReanalyze'),
  btnResetROI: document.getElementById('btnResetROI'),
  fingerMetricsStrip: document.getElementById('fingerMetricsStrip'),
  metricShape: document.getElementById('metricShape'),
  metricRatio: document.getElementById('metricRatio'),
  metricTaper: document.getElementById('metricTaper'),
  metricFlare: document.getElementById('metricFlare'),
  metricConfidence: document.getElementById('metricConfidence'),
  cvStagesBox: document.getElementById('cvStagesBox'),
  cvMethodTag: document.getElementById('cvMethodTag'),
  roiCropCanvas: document.getElementById('roiCropCanvas'),
  roiMaskCanvas: document.getElementById('roiMaskCanvas'),
  roiContourCanvas: document.getElementById('roiContourCanvas'),

  blueprintEmpty: document.getElementById('blueprintEmpty'),
  blueprintContent: document.getElementById('blueprintContent'),
  btnExportSpec: document.getElementById('btnExportSpec'),
  diagnosisCategory: document.getElementById('diagnosisCategory'),
  diagnosisTitle: document.getElementById('diagnosisTitle'),
  diagnosisConfBadge: document.getElementById('diagnosisConfBadge'),
  diagnosisSummary: document.getElementById('diagnosisSummary'),
  shapeRecsGrid: document.getElementById('shapeRecsGrid'),
  avoidText: document.getElementById('avoidText'),

  simLengthSelect: document.getElementById('simLengthSelect'),
  simArtSelect: document.getElementById('simArtSelect'),
  nailPreviewSvgWrap: document.getElementById('nailPreviewSvgWrap'),
  simShapeTitle: document.getElementById('simShapeTitle'),
  simArtTitle: document.getElementById('simArtTitle'),
  simArtRationale: document.getElementById('simArtRationale'),
  paletteSwatches: document.getElementById('paletteSwatches'),

  structureGrid: document.getElementById('structureGrid'),
  prepStepsList: document.getElementById('prepStepsList'),
  designRulesList: document.getElementById('designRulesList'),
  tabGeminiBtn: document.getElementById('tabGeminiBtn'),
  geminiResultBox: document.getElementById('geminiResultBox'),

  btnPipelineModal: document.getElementById('btnPipelineModal'),
  pipelineModal: document.getElementById('pipelineModal'),
  btnGeminiConfig: document.getElementById('btnGeminiConfig'),
  geminiBtnLabel: document.getElementById('geminiBtnLabel'),
  geminiModal: document.getElementById('geminiModal'),
  geminiKeyInput: document.getElementById('geminiKeyInput'),
  btnSaveGemini: document.getElementById('btnSaveGemini'),
  btnClearGemini: document.getElementById('btnClearGemini'),
};

function setStatus(text, busy = false) {
  els.engineBadgeText.textContent = text;
  els.engineBadge.classList.toggle('busy', busy);
}

function getGeminiKey() {
  return localStorage.getItem(GEMINI_STORAGE_KEY) || '';
}

function updateGeminiButtonUI() {
  const hasKey = Boolean(getGeminiKey());
  els.geminiBtnLabel.textContent = hasKey ? 'Gemini Vision: Enabled' : 'Gemini Vision: Optional';
  els.tabGeminiBtn.classList.toggle('hidden', !hasKey);
}

function populateArtDropdown(preferredIds = []) {
  els.simArtSelect.innerHTML = '';
  const allIds = Object.keys(NAIL_ART_STYLES);
  const ordered = [...new Set([...preferredIds, ...allIds])];
  for (const id of ordered) {
    const opt = document.createElement('option');
    opt.value = id;
    opt.textContent = NAIL_ART_STYLES[id].name + (preferredIds.includes(id) ? ' ★' : '');
    els.simArtSelect.appendChild(opt);
  }
}

function renderSimulator() {
  const shape = EXTENSION_SHAPES[state.selectedShapeId] || EXTENSION_SHAPES.almond;
  const art = NAIL_ART_STYLES[state.selectedArtId] || NAIL_ART_STYLES['micro-french'];

  els.simShapeTitle.textContent = shape.name;
  els.simArtTitle.textContent = art.name;
  els.simArtRationale.textContent = art.rationale;
  els.nailPreviewSvgWrap.innerHTML = renderExtensionSVG(state.selectedShapeId, state.selectedLength, state.selectedArtId);

  els.paletteSwatches.innerHTML = '';
  for (const hex of art.palette) {
    const sw = document.createElement('span');
    sw.className = 'swatch';
    sw.style.background = hex;
    sw.title = hex;
    els.paletteSwatches.appendChild(sw);
  }
}

function renderBlueprint(analysis) {
  const archetypeId = analysis.classification.archetypeId;
  const blueprint = ARCHETYPE_BLUEPRINTS[archetypeId] || ARCHETYPE_BLUEPRINTS.squoval;

  els.blueprintEmpty.classList.add('hidden');
  els.blueprintContent.classList.remove('hidden');
  els.btnExportSpec.disabled = false;

  els.diagnosisCategory.textContent = blueprint.category;
  els.diagnosisTitle.textContent = blueprint.title;
  els.diagnosisConfBadge.textContent = `${analysis.classification.confidence}%`;
  els.diagnosisSummary.textContent = blueprint.summary;
  els.avoidText.textContent = blueprint.avoid;

  // Top 3 recommended extension shapes
  state.selectedShapeId = blueprint.recommendations[0].shapeId;
  state.selectedLength = blueprint.defaultLength;
  state.selectedArtId = blueprint.recommendedArt[0];

  els.simLengthSelect.value = state.selectedLength;
  populateArtDropdown(blueprint.recommendedArt);
  els.simArtSelect.value = state.selectedArtId;

  els.shapeRecsGrid.innerHTML = '';
  blueprint.recommendations.forEach((rec, idx) => {
    const shapeMeta = EXTENSION_SHAPES[rec.shapeId];
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `shape-card${idx === 0 ? ' selected' : ''}`;
    btn.innerHTML = `
      <div class="shape-card-top">
        <span class="shape-card-name">${shapeMeta.name}</span>
        <span class="shape-match">${rec.match}%</span>
      </div>
      <p>${rec.note}</p>
    `;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.shape-card').forEach((c) => c.classList.remove('selected'));
      btn.classList.add('selected');
      state.selectedShapeId = rec.shapeId;
      renderSimulator();
    });
    els.shapeRecsGrid.appendChild(btn);
  });

  renderSimulator();

  // Structure Grid
  els.structureGrid.innerHTML = '';
  blueprint.structure.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'protocol-card';
    card.innerHTML = `<span>${item.label}</span><p>${item.value}</p>`;
    els.structureGrid.appendChild(card);
  });

  // Prep Steps
  els.prepStepsList.innerHTML = '';
  blueprint.prepSteps.forEach((step) => {
    const li = document.createElement('li');
    li.textContent = step;
    els.prepStepsList.appendChild(li);
  });

  // Design Rules
  els.designRulesList.innerHTML = '';
  blueprint.designRules.forEach((rule) => {
    const div = document.createElement('div');
    div.className = 'design-rule-item';
    div.textContent = rule;
    els.designRulesList.appendChild(div);
  });
}

function redrawMainCanvas() {
  if (!state.rawCanvas) return;
  els.visionCanvas.width = state.rawCanvas.width;
  els.visionCanvas.height = state.rawCanvas.height;
  const ctx = els.visionCanvas.getContext('2d');
  ctx.clearRect(0, 0, els.visionCanvas.width, els.visionCanvas.height);
  ctx.drawImage(state.rawCanvas, 0, 0);

  if (state.showOverlay && state.analysis) {
    drawVisionOverlay(ctx, state.analysis);
  }

  // Draw active user ROI drag rectangle if dragging
  if (state.dragROI && state.dragROI.active) {
    const { x1, y1, x2, y2 } = state.dragROI;
    ctx.save();
    ctx.strokeStyle = '#6ee7b7';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.strokeRect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1));
    ctx.restore();
  }
}

async function runGeminiInspection(sourceCanvas, localAnalysis) {
  const apiKey = getGeminiKey();
  if (!apiKey) return;

  els.tabGeminiBtn.classList.remove('hidden');
  els.geminiResultBox.textContent = 'Running optional Gemini Vision nail inspection...';

  try {
    const base64Data = sourceCanvas.toDataURL('image/jpeg', 0.85).split(',')[1];
    const prompt = `You are a master nail technician and educator.
Local CV geometry measured:
- Detected Archetype: ${localAnalysis.classification.archetypeLabel}
- Width/Length Ratio: ${localAnalysis.metrics.aspectRatio}
- Tip Taper: ${localAnalysis.metrics.tipTaper}
- Sidewall Flare: ${localAnalysis.metrics.sidewallFlare}

Inspect this nail image and give concise technician guidance in 4 short bullet points:
1) Natural nail bed & cuticle condition you observe,
2) Best extension shape & length balance,
3) Apex/form placement tip,
4) One specific salon nail art design suggestion.`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                { inline_data: { mime_type: 'image/jpeg', data: base64Data } },
              ],
            },
          ],
        }),
      }
    );

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const json = await res.json();
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response text returned.';
    els.geminiResultBox.textContent = text;
  } catch (err) {
    els.geminiResultBox.textContent = `Gemini Vision request failed (${err.message}). Local CV blueprint remains active.`;
  }
}

async function processCanvas(rawCanvas, manualROI = null) {
  stopWebcam();
  state.rawCanvas = rawCanvas;
  state.manualROI = manualROI;

  els.dropPlaceholder.classList.add('hidden');
  els.visionCanvas.classList.remove('hidden');
  els.btnReanalyze.disabled = false;
  els.btnResetROI.disabled = !manualROI;

  setStatus('Analyzing nail geometry...', true);
  redrawMainCanvas();

  try {
    const analysis = await analyzeNailImage(rawCanvas, manualROI);
    state.analysis = analysis;

    // Update strip metrics
    els.fingerMetricsStrip.classList.remove('hidden');
    els.cvStagesBox.classList.remove('hidden');

    els.metricShape.textContent = analysis.classification.archetypeLabel;
    els.metricRatio.textContent = analysis.metrics.aspectRatio.toFixed(2);
    els.metricTaper.textContent = `${Math.round(analysis.metrics.tipTaper * 100)}%`;
    els.metricFlare.textContent = `${analysis.metrics.sidewallFlare >= 0 ? '+' : ''}${Math.round(analysis.metrics.sidewallFlare * 100)}%`;
    els.metricConfidence.textContent = `${analysis.classification.confidence}%`;
    els.cvMethodTag.textContent = analysis.primaryROI.method;

    renderDiagnosticCanvases(analysis.patchCanvas, analysis.segResult, {
      roiCropCanvas: els.roiCropCanvas,
      roiMaskCanvas: els.roiMaskCanvas,
      roiContourCanvas: els.roiContourCanvas,
    });

    redrawMainCanvas();
    renderBlueprint(analysis);
    setStatus('Scan complete', false);

    if (getGeminiKey()) {
      runGeminiInspection(rawCanvas, analysis);
    }
  } catch (err) {
    console.error(err);
    setStatus('Analysis error', false);
  }
}

function loadImageFile(file) {
  if (!file || !file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const maxDim = 900;
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      document.querySelectorAll('.chip-btn').forEach((b) => b.classList.remove('active'));
      processCanvas(c, null);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

async function startWebcam() {
  if (!navigator.mediaDevices?.getUserMedia) {
    alert('Camera access is not supported in this browser or context.');
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 960 }, height: { ideal: 720 } },
      audio: false,
    });
    state.webcamStream = stream;
    els.webcamVideo.srcObject = stream;
    els.dropPlaceholder.classList.add('hidden');
    els.visionCanvas.classList.add('hidden');
    els.webcamVideo.classList.remove('hidden');
    els.cameraOverlayBar.classList.remove('hidden');
    setStatus('Camera live', true);
  } catch (err) {
    alert(`Could not access webcam: ${err.message}`);
  }
}

function stopWebcam() {
  if (state.webcamStream) {
    state.webcamStream.getTracks().forEach((t) => t.stop());
    state.webcamStream = null;
  }
  els.webcamVideo.classList.add('hidden');
  els.cameraOverlayBar.classList.add('hidden');
}

function exportTechSheet() {
  if (!state.analysis) return;
  const archId = state.analysis.classification.archetypeId;
  const bp = ARCHETYPE_BLUEPRINTS[archId];
  const shape = EXTENSION_SHAPES[state.selectedShapeId];
  const art = NAIL_ART_STYLES[state.selectedArtId];

  const report = [
    `NAILSENSE AI — TECHNICIAN EXTENSION BLUEPRINT`,
    `Generated: ${new Date().toLocaleString()}`,
    `--------------------------------------------------`,
    `DETECTED NAIL BED: ${bp.title} (${state.analysis.classification.confidence}% confidence)`,
    `Detection Method: ${state.analysis.primaryROI.method}`,
    `Metrics: W/L Ratio=${state.analysis.metrics.aspectRatio} | Tip Taper=${Math.round(state.analysis.metrics.tipTaper * 100)}% | Sidewall Flare=${Math.round(state.analysis.metrics.sidewallFlare * 100)}%`,
    ``,
    `SELECTED CLIENT PLAN:`,
    `- Extension Shape: ${shape.name}`,
    `- Length: ${state.selectedLength.toUpperCase()}`,
    `- Nail Art Style: ${art.name}`,
    `- Avoid: ${bp.avoid}`,
    ``,
    `STRUCTURAL ARCHITECTURE:`,
    ...bp.structure.map((s) => `- ${s.label}: ${s.value}`),
    ``,
    `PREP & FORM STEPS:`,
    ...bp.prepSteps.map((s, i) => `${i + 1}. ${s}`),
    ``,
    `DESIGN RULES:`,
    ...bp.designRules.map((r) => `- ${r}`),
  ].join('\n');

  const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `nailsense-tech-sheet-${archId}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

function bindEvents() {
  // File upload
  els.fileInput.addEventListener('change', (e) => {
    if (e.target.files?.[0]) loadImageFile(e.target.files[0]);
  });

  // Drag & Drop
  ['dragenter', 'dragover'].forEach((evt) => {
    els.stageWrapper.addEventListener(evt, (e) => {
      e.preventDefault();
      els.stageWrapper.classList.add('dragover');
    });
  });
  ['dragleave', 'drop'].forEach((evt) => {
    els.stageWrapper.addEventListener(evt, (e) => {
      e.preventDefault();
      els.stageWrapper.classList.remove('dragover');
    });
  });
  els.stageWrapper.addEventListener('drop', (e) => {
    const file = e.dataTransfer?.files?.[0];
    if (file) loadImageFile(file);
  });

  // Webcam
  els.btnWebcam.addEventListener('click', startWebcam);
  els.btnStopCamera.addEventListener('click', () => {
    stopWebcam();
    if (!state.rawCanvas) els.dropPlaceholder.classList.remove('hidden');
    else els.visionCanvas.classList.remove('hidden');
    setStatus('CV Engine Ready', false);
  });
  els.btnCaptureFrame.addEventListener('click', () => {
    const vw = els.webcamVideo.videoWidth || 640;
    const vh = els.webcamVideo.videoHeight || 480;
    const c = document.createElement('canvas');
    c.width = vw;
    c.height = vh;
    c.getContext('2d').drawImage(els.webcamVideo, 0, 0, vw, vh);
    document.querySelectorAll('.chip-btn').forEach((b) => b.classList.remove('active'));
    processCanvas(c, null);
  });

  // Preset buttons
  document.querySelectorAll('.chip-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.chip-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const canvas = generatePresetCanvas(btn.dataset.preset);
      processCanvas(canvas, null);
    });
  });

  // Calibration controls
  els.toggleOverlay.addEventListener('change', () => {
    state.showOverlay = els.toggleOverlay.checked;
    redrawMainCanvas();
  });
  els.btnReanalyze.addEventListener('click', () => {
    if (state.rawCanvas) processCanvas(state.rawCanvas, state.manualROI);
  });
  els.btnResetROI.addEventListener('click', () => {
    if (state.rawCanvas) processCanvas(state.rawCanvas, null);
  });

  // Interactive manual ROI drag on canvas
  const getCanvasPoint = (evt) => {
    const rect = els.visionCanvas.getBoundingClientRect();
    const scaleX = els.visionCanvas.width / rect.width;
    const scaleY = els.visionCanvas.height / rect.height;
    return {
      x: (evt.clientX - rect.left) * scaleX,
      y: (evt.clientY - rect.top) * scaleY,
    };
  };

  els.visionCanvas.addEventListener('mousedown', (e) => {
    if (!state.rawCanvas) return;
    const pt = getCanvasPoint(e);
    state.dragROI = { active: true, x1: pt.x, y1: pt.y, x2: pt.x, y2: pt.y };
  });
  window.addEventListener('mousemove', (e) => {
    if (!state.dragROI?.active) return;
    const pt = getCanvasPoint(e);
    state.dragROI.x2 = pt.x;
    state.dragROI.y2 = pt.y;
    redrawMainCanvas();
  });
  window.addEventListener('mouseup', () => {
    if (!state.dragROI?.active) return;
    const { x1, y1, x2, y2 } = state.dragROI;
    state.dragROI.active = false;
    const boxW = Math.abs(x2 - x1);
    const boxH = Math.abs(y2 - y1);
    if (boxW > 24 && boxH > 24 && state.rawCanvas) {
      processCanvas(state.rawCanvas, {
        cx: (x1 + x2) / 2,
        cy: (y1 + y2) / 2,
        boxW,
        boxH,
      });
    } else {
      redrawMainCanvas();
    }
  });

  // Simulator controls
  els.simLengthSelect.addEventListener('change', (e) => {
    state.selectedLength = e.target.value;
    renderSimulator();
  });
  els.simArtSelect.addEventListener('change', (e) => {
    state.selectedArtId = e.target.value;
    renderSimulator();
  });

  // Tabs
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach((b) => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      document.querySelectorAll('.tab-pane').forEach((p) => p.classList.remove('active'));
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      document.getElementById(`tab-${btn.dataset.tab}`)?.classList.add('active');
    });
  });

  // Export
  els.btnExportSpec.addEventListener('click', exportTechSheet);

  // Modals
  els.btnPipelineModal.addEventListener('click', () => els.pipelineModal.showModal());
  els.btnGeminiConfig.addEventListener('click', () => {
    els.geminiKeyInput.value = getGeminiKey();
    els.geminiModal.showModal();
  });
  document.querySelectorAll('[data-close-modal]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.getElementById(btn.dataset.closeModal)?.close();
    });
  });
  els.btnSaveGemini.addEventListener('click', () => {
    const val = els.geminiKeyInput.value.trim();
    if (val) localStorage.setItem(GEMINI_STORAGE_KEY, val);
    else localStorage.removeItem(GEMINI_STORAGE_KEY);
    updateGeminiButtonUI();
    els.geminiModal.close();
  });
  els.btnClearGemini.addEventListener('click', () => {
    localStorage.removeItem(GEMINI_STORAGE_KEY);
    els.geminiKeyInput.value = '';
    updateGeminiButtonUI();
    els.geminiModal.close();
  });
}

// Boot
updateGeminiButtonUI();
populateArtDropdown();
bindEvents();
initMediaPipeHands().then((ok) => {
  setStatus(ok ? 'MediaPipe + CV Ready' : 'Local CV Ready', false);
});
