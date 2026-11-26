/**
 * NailSense AI — Nail Technician Extension Blueprint & Visual SVG Simulator
 *
 * Maps the 6 detected nail bed archetypes to salon-grade extension shapes,
 * apex/C-curve structural specs, prep/form instructions, and nail art designs.
 */

export const EXTENSION_SHAPES = {
  almond: {
    id: 'almond',
    name: 'Soft Almond',
    shortDesc: 'Tapered sidewalls converging to a rounded peak; optically elongates fingers.',
  },
  oval: {
    id: 'oval',
    name: 'Classic Oval',
    shortDesc: 'Gentle parallel walls with a smooth, natural egg-shaped free edge.',
  },
  coffin: {
    id: 'coffin',
    name: 'Coffin / Ballerina',
    shortDesc: 'Tapered sidewalls with a crisp squared-off flat tip; modern & architectural.',
  },
  squoval: {
    id: 'squoval',
    name: 'Squoval',
    shortDesc: 'Square structure with softened corners; low-snag and high durability.',
  },
  square: {
    id: 'square',
    name: 'Tapered Square',
    shortDesc: 'Clean straight sidewalls with sharp 90° free-edge corners.',
  },
  stiletto: {
    id: 'stiletto',
    name: 'Petite Stiletto',
    shortDesc: 'Dramatic V-taper for maximum lengthening on medium-to-long builds.',
  },
};

export const NAIL_ART_STYLES = {
  'micro-french': {
    id: 'micro-french',
    name: 'Micro-French Tip',
    palette: ['#F6E7E4', '#FFFDFB', '#C98A7B'],
    rationale: 'A razor-thin smile line preserves clean vertical negative space, lengthening the perceived nail plate without cutting the bed in half.',
  },
  'vertical-ombre': {
    id: 'vertical-ombre',
    name: 'Vertical Aura / Ombré',
    palette: ['#F2D6DB', '#D88296', '#FFF8F4'],
    rationale: 'Vertical gradient or centered aura glow draws the eye inward and lengthwise, slimming wide or flared lateral walls.',
  },
  'cat-eye': {
    id: 'cat-eye',
    name: 'Velvet Cat-Eye Gel',
    palette: ['#EED6D3', '#B86E7D', '#F9EFEA'],
    rationale: 'Diagonal magnetic shimmer creates a 3D apex illusion and accentuates narrow tapered silhouettes.',
  },
  'chrome-glaze': {
    id: 'chrome-glaze',
    name: 'Sheer Pearl Glaze',
    palette: ['#F9ECE8', '#EAD5D1', '#FFFFFF'],
    rationale: 'Translucent milky-rose base with pearl chrome highlights smooth surface symmetry and hides minor sidewall asymmetry.',
  },
  'minimal-line': {
    id: 'minimal-line',
    name: 'Vertical Minimalist Line Art',
    palette: ['#F5E4DE', '#3A262B', '#C69A6B'],
    rationale: 'Fine vertical pinstripe or botanical stem guides the eye along the finger axis, making short beds appear 20–30% longer.',
  },
};

export const ARCHETYPE_BLUEPRINTS = {
  'short-wide': {
    title: 'Short & Wide Nail Bed',
    category: 'High W/L Ratio (> 0.92)',
    summary:
      'Your client has a wide, compact nail plate. The primary goal is optical elongation and slimming the lateral silhouette without creating bulky sidewalls.',
    recommendations: [
      { shapeId: 'almond', match: 96, note: 'Best overall — narrows the tip and elongates short fingers.' },
      { shapeId: 'oval', match: 91, note: 'Natural lengthening with strong daily-wear durability.' },
      { shapeId: 'squoval', match: 83, note: 'Great if the client prefers a short, low-maintenance length.' },
    ],
    avoid: 'Wide blunt Square or chunky thick tips — they emphasize horizontal width and make fingers look shorter.',
    defaultLength: 'medium',
    recommendedArt: ['vertical-ombre', 'micro-french', 'minimal-line'],
    structure: [
      { label: 'Extension System', value: 'Sculpted Hard Gel or Soft Gel-X (slim-fit almond tip)' },
      { label: 'Apex Placement', value: '40% from cuticle; keep apex slim (1.1–1.3mm) to avoid bulbous profile' },
      { label: 'Pinching & C-Curve', value: 'Light pinch at 10–12s flash cure to pull sidewalls inward by ~10%' },
      { label: 'Form / Tip Fit', value: 'Deeply pre-cut paper form smile line; tilt form slightly upward (5°)' },
    ],
    prepSteps: [
      'Push back proximal fold gently and perform dry e-file cuticle exfoliation to reveal hidden nail bed length (+1.5–2mm gain).',
      'Trim any ragged free edge flush, leaving 0.5mm for snug paper form seating under the hyponychium.',
      'Bevel lateral sidewalls lightly with a 180-grit file so product stays flush without overflowing into lateral grooves.',
      'Use a cover-pink builder gel slightly extending past the natural free edge (reverse French bed elongation) before shaping.',
    ],
    designRules: [
      'Leave a 0.5mm clean margin along lateral sidewalls ("tight-lining" technique) so the plate reads narrower.',
      'Avoid thick horizontal stripes or chunky French bands across the middle of the nail.',
      'Choose sheer-to-medium milky pinks or vertical aura gradients that blur the short natural smile line.',
    ],
  },

  square: {
    title: 'Square / Flat Nail Bed',
    category: 'Parallel Walls • Low Taper',
    summary:
      'Strong, flat parallel sidewalls and a wide squared free edge. This nail bed handles architectural shapes effortlessly and holds crisp structure well.',
    recommendations: [
      { shapeId: 'coffin', match: 95, note: 'Flattering taper off straight sidewalls with a sleek flat tip.' },
      { shapeId: 'square', match: 92, note: 'Honors natural parallel geometry; crisp and structured.' },
      { shapeId: 'squoval', match: 89, note: 'Softens sharp corners to prevent corner chipping.' },
    ],
    avoid: 'Over-filed narrow Stiletto on very short lengths — over-filing sidewalls weakens stress points.',
    defaultLength: 'medium',
    recommendedArt: ['micro-french', 'chrome-glaze', 'minimal-line'],
    structure: [
      { label: 'Extension System', value: 'Polygel, Acrylic, or Structured Builder Gel on paper forms' },
      { label: 'Apex Placement', value: '45% from cuticle; medium 1.4mm stress arch aligned straight down center' },
      { label: 'Pinching & C-Curve', value: 'Moderate C-curve (25–30%); hold crisp lower-parallel line from sidewall to tip' },
      { label: 'Form / Tip Fit', value: 'Zero-tilt straight form alignment; pinch form tabs cleanly at the tip for Coffin' },
    ],
    prepSteps: [
      'Check natural C-curve flatness; if plate is flat, pre-pinch paper form into a subtle U-tunnel.',
      'Keep lower-parallel lines continuous with the lateral finger edge—never file upward into the stress points.',
      'For Tapered Square or Coffin, taper only from the natural free-edge exit onward.',
      'Finish-file the free edge at a 90° crisp bevel, then lightly buff corners if client works with hands.',
    ],
    designRules: [
      'Sharp micro-French or geometric French tips echo the flat free-edge architecture beautifully.',
      'Pearl chrome glaze over sheer nude emphasizes clean parallel reflections down the center.',
      'Keep cuticle line rounded rather than square so the base still looks delicate.',
    ],
  },

  squoval: {
    title: 'Squoval / Balanced Nail Bed',
    category: 'Balanced Ratio (0.72–0.82)',
    summary:
      'Well-proportioned nail bed with parallel sidewalls and softly rounded corners. Nearly every salon extension shape works cleanly on this versatile canvas.',
    recommendations: [
      { shapeId: 'squoval', match: 96, note: 'Effortless natural harmony with maximum strength.' },
      { shapeId: 'almond', match: 92, note: 'Adds feminine taper when extended to medium/long.' },
      { shapeId: 'coffin', match: 88, note: 'Great statement upgrade with tapered sidewalls.' },
    ],
    avoid: 'Excessively bulky overlays — natural balance needs minimal corrective sculpting.',
    defaultLength: 'medium',
    recommendedArt: ['chrome-glaze', 'cat-eye', 'micro-french'],
    structure: [
      { label: 'Extension System', value: 'BIAB / Builder Gel or Soft Gel Tips' },
      { label: 'Apex Placement', value: 'Classic 45–50% centered apex; smooth 1.2–1.4mm transition' },
      { label: 'Pinching & C-Curve', value: 'Natural 25% C-curve; minimal pinching needed' },
      { label: 'Form / Tip Fit', value: 'Standard straight form fit following natural growth angle' },
    ],
    prepSteps: [
      'Standard dry Russian/e-file manicure or gentle cuticle push-back and dehydrator + acid-free primer.',
      'If extending to Medium+, taper sidewalls slightly past the free edge to prevent a "duck-foot" silhouette.',
      'Refine surface with 180-grit sponge buffer before color for mirror-smooth light line.',
    ],
    designRules: [
      'Velvet cat-eye magnetic polish pops across a balanced apex curve.',
      'Any French curvature (classic smile or micro-French) sits harmoniously on this bed.',
      'Ideal canvas for minimalist gold chrome accents or negative-space designs.',
    ],
  },

  oval: {
    title: 'Classic Oval Nail Bed',
    category: 'Gentle Taper (0.62–0.74)',
    summary:
      'Naturally graceful nail plate with a soft egg-shaped free edge and slender proportions. Already elongated, so extensions should preserve its organic taper.',
    recommendations: [
      { shapeId: 'oval', match: 97, note: 'Seamless match to natural cuticle and free-edge curves.' },
      { shapeId: 'almond', match: 94, note: 'Natural next step when going medium to long.' },
      { shapeId: 'stiletto', match: 84, note: 'Elegant petite stiletto works smoothly on narrow beds.' },
    ],
    avoid: 'Sharp heavy Square corners — fighting the natural curve often leads to corner lifting or snags.',
    defaultLength: 'medium',
    recommendedArt: ['cat-eye', 'chrome-glaze', 'micro-french'],
    structure: [
      { label: 'Extension System', value: 'Hard Gel Sculpting or Pre-shaped Almond/Oval Soft Gel Tips' },
      { label: 'Apex Placement', value: '45% from cuticle; feather product ultra-thin at cuticle & sidewalls' },
      { label: 'Pinching & C-Curve', value: 'Gentle C-curve matching natural arch; avoid over-pinching narrow beds' },
      { label: 'Form / Tip Fit', value: 'Close paper form slightly at the distal tab to mirror oval taper' },
    ],
    prepSteps: [
      'Round natural free edge smoothly before placing form so there are no sharp side corners.',
      'Follow the natural cuticle arc when painting base gel to maintain continuous oval symmetry.',
      'Use a long-bristle liner brush to refine lower parallels on extensions.',
    ],
    designRules: [
      'Deep V-smile micro-French elongates the oval sweep dramatically.',
      'Soft glazed pearl, rose quartz, or velvet cat-eye complement organic curves.',
      'Curved swirl accents or diagonal aura fades look ultra-balanced.',
    ],
  },

  almond: {
    title: 'Narrow / Almond Nail Bed',
    category: 'Slender Ratio (< 0.65)',
    summary:
      'Long, slender nail bed with pronounced natural taper. Requires careful stress-point reinforcement so narrow extensions stay strong without snapping.',
    recommendations: [
      { shapeId: 'almond', match: 98, note: 'Tailor-made for narrow plates; chic and structurally natural.' },
      { shapeId: 'stiletto', match: 90, note: 'Clean taper transitions effortlessly into a sharp point.' },
      { shapeId: 'oval', match: 88, note: 'Soft, timeless everyday alternative.' },
    ],
    avoid: 'Flared wide tips or oversized square forms — they look disproportionate on slender nail beds.',
    defaultLength: 'long',
    recommendedArt: ['cat-eye', 'micro-french', 'chrome-glaze'],
    structure: [
      { label: 'Extension System', value: 'Hard Gel or Acrylic (higher tensile strength for slender tips)' },
      { label: 'Apex Placement', value: '45–50% centered apex; ensure adequate thickness (1.5mm) at stress zone' },
      { label: 'Pinching & C-Curve', value: 'Do NOT over-pinch—narrow beds already have a deep C-curve' },
      { label: 'Form / Tip Fit', value: 'Pinch form wings tightly to prevent excess product pooling under narrow plate' },
    ],
    prepSteps: [
      'Avoid aggressive lateral filing—narrow beds need every millimeter of sidewall support at the stress area.',
      'Check if natural nail curves downward (ski-slope/hook); angle form slightly up by 5–8° if needed.',
      'Reinforce the stress zone with a slight slip-layer + bead placement before tapering the tip.',
    ],
    designRules: [
      'This shape shines with luxury cat-eye velvet, glazed donut chrome, and delicate deep-V French tips.',
      'Avoid chunky 3D charms right on the tip; place accents closer to the lunula/cuticle.',
      'Vertical ombre or sheer jelly tones highlight natural elegance.',
    ],
  },

  fan: {
    title: 'Fan-Shaped / Flared Nail Bed',
    category: 'Distal Flare (W_dist > W_prox)',
    summary:
      'The nail plate widens noticeably from cuticle toward the free edge. Corrective architecture is essential: tuck sidewalls visually and avoid shapes that exaggerate flare.',
    recommendations: [
      { shapeId: 'almond', match: 95, note: 'Strongest optical correction — tapers flared edges inward.' },
      { shapeId: 'coffin', match: 89, note: 'Re-establishes straight tapered lines if sidewalls are pinched.' },
      { shapeId: 'oval', match: 86, note: 'Softens wide distal corners naturally.' },
    ],
    avoid: 'Un-tapered Square or Duck-flare tips — they amplify distal flare and look wide at the tip.',
    defaultLength: 'medium',
    recommendedArt: ['vertical-ombre', 'minimal-line', 'micro-french'],
    structure: [
      { label: 'Extension System', value: 'Sculpted Hard Gel or Acrylic with deliberate sidewall pinching' },
      { label: 'Apex Placement', value: '42% from cuticle; taper product thickness cleanly toward lateral edges' },
      { label: 'Pinching & C-Curve', value: 'Essential: pinch sidewalls gently at 12–15s flash cure to straighten flare' },
      { label: 'Form / Tip Fit', value: 'Trim form corners so it sits tightly under flared lateral folds without gaps' },
    ],
    prepSteps: [
      'Trim flared natural free edge short before sculpting—extending straight from a flared edge locks in the wide shape.',
      'Do NOT over-file the natural nail corners behind the stress point (causes onycholysis); correct flare via pinching + tapered extension.',
      'Keep builder gel 0.5mm shy of the outermost flared skin fold ("optical slimming margin").',
      'File extension sidewalls straight inward from the stress point to create a sleek Almond or Coffin silhouette.',
    ],
    designRules: [
      'Vertical aura/ombre or centered vertical line art pulls focus away from wide outer corners.',
      'Use a deep-curved micro-French smile line rather than a flat horizontal tip.',
      'Dark or high-contrast full-cover shades should leave a crisp hair-thin negative border along sidewalls.',
    ],
  },
};

/**
 * Render an interactive SVG preview of the chosen extension shape, length, and nail art style.
 */
export function renderExtensionSVG(shapeId, lengthKey, artId) {
  const art = NAIL_ART_STYLES[artId] || NAIL_ART_STYLES['micro-french'];
  const [baseColor, accentColor, highlightColor] = art.palette;

  const lengthScale = {
    short: 0.78,
    medium: 1.0,
    long: 1.24,
    xl: 1.44,
  }[lengthKey] || 1.0;

  // Coordinates inside viewBox 0 0 180 230; cuticle sits around y=188
  const cutY = 188;
  const tipY = Math.round(188 - 102 * lengthScale); // ranges from ~108 (short) to ~41 (xl)
  const leftX = 56;
  const rightX = 124;
  const midY = Math.round((cutY + tipY) / 2);

  let nailPath = '';
  let tipPath = '';

  switch (shapeId) {
    case 'stiletto':
      nailPath = `M ${leftX} ${cutY} C ${leftX - 2} ${midY + 12}, 70 ${tipY + 34}, 90 ${tipY} C 110 ${tipY + 34}, ${rightX + 2} ${midY + 12}, ${rightX} ${cutY} C ${rightX - 10} ${cutY + 18}, ${leftX + 10} ${cutY + 18}, ${leftX} ${cutY} Z`;
      tipPath = `M 72 ${tipY + 26} Q 90 ${tipY + 14} 108 ${tipY + 26} L 90 ${tipY} Z`;
      break;
    case 'almond':
      nailPath = `M ${leftX} ${cutY} C ${leftX - 3} ${midY + 10}, 66 ${tipY + 28}, 90 ${tipY + 2} C 114 ${tipY + 28}, ${rightX + 3} ${midY + 10}, ${rightX} ${cutY} C ${rightX - 10} ${cutY + 18}, ${leftX + 10} ${cutY + 18}, ${leftX} ${cutY} Z`;
      tipPath = `M 66 ${tipY + 24} Q 90 ${tipY + 34} 114 ${tipY + 24} C 106 ${tipY + 11}, 97 ${tipY + 2}, 90 ${tipY + 2} C 83 ${tipY + 2}, 74 ${tipY + 11}, 66 ${tipY + 24} Z`;
      break;
    case 'coffin':
      nailPath = `M ${leftX} ${cutY} L 68 ${tipY + 4} Q 90 ${tipY + 1} 112 ${tipY + 4} L ${rightX} ${cutY} C ${rightX - 10} ${cutY + 18}, ${leftX + 10} ${cutY + 18}, ${leftX} ${cutY} Z`;
      tipPath = `M 66 ${tipY + 14} Q 90 ${tipY + 18} 114 ${tipY + 14} L 112 ${tipY + 4} Q 90 ${tipY + 1} 68 ${tipY + 4} Z`;
      break;
    case 'square':
      nailPath = `M ${leftX} ${cutY} L ${leftX + 2} ${tipY + 4} Q 90 ${tipY + 2} ${rightX - 2} ${tipY + 4} L ${rightX} ${cutY} C ${rightX - 10} ${cutY + 18}, ${leftX + 10} ${cutY + 18}, ${leftX} ${cutY} Z`;
      tipPath = `M ${leftX + 2} ${tipY + 14} Q 90 ${tipY + 16} ${rightX - 2} ${tipY + 14} L ${rightX - 2} ${tipY + 4} Q 90 ${tipY + 2} ${leftX + 2} ${tipY + 4} Z`;
      break;
    case 'squoval':
      nailPath = `M ${leftX} ${cutY} L ${leftX + 2} ${tipY + 14} Q ${leftX + 4} ${tipY + 3}, 90 ${tipY + 3} Q ${rightX - 4} ${tipY + 3}, ${rightX - 2} ${tipY + 14} L ${rightX} ${cutY} C ${rightX - 10} ${cutY + 18}, ${leftX + 10} ${cutY + 18}, ${leftX} ${cutY} Z`;
      tipPath = `M ${leftX + 2} ${tipY + 16} Q 90 ${tipY + 22} ${rightX - 2} ${tipY + 16} L ${rightX - 2} ${tipY + 14} Q ${rightX - 4} ${tipY + 3}, 90 ${tipY + 3} Q ${leftX + 4} ${tipY + 3}, ${leftX + 2} ${tipY + 14} Z`;
      break;
    case 'oval':
    default:
      nailPath = `M ${leftX} ${cutY} C ${leftX - 2} ${midY}, 62 ${tipY + 12}, 90 ${tipY + 3} C 118 ${tipY + 12}, ${rightX + 2} ${midY}, ${rightX} ${cutY} C ${rightX - 10} ${cutY + 18}, ${leftX + 10} ${cutY + 18}, ${leftX} ${cutY} Z`;
      tipPath = `M 62 ${tipY + 22} Q 90 ${tipY + 32} 118 ${tipY + 22} C 110 ${tipY + 9}, 100 ${tipY + 3}, 90 ${tipY + 3} C 80 ${tipY + 3}, 70 ${tipY + 9}, 62 ${tipY + 22} Z`;
      break;
  }

  let artOverlay = '';
  if (artId === 'micro-french') {
    artOverlay = `<path d="${tipPath}" fill="${accentColor}" opacity="0.95" />`;
  } else if (artId === 'vertical-ombre') {
    artOverlay = `
      <ellipse cx="90" cy="${midY}" rx="22" ry="${Math.round(36 * lengthScale)}" fill="${accentColor}" opacity="0.58" filter="url(#softBlur)" />
    `;
  } else if (artId === 'cat-eye') {
    artOverlay = `
      <path d="M 62 ${cutY - 22} L 118 ${tipY + 26}" stroke="${highlightColor}" stroke-width="14" stroke-linecap="round" opacity="0.52" filter="url(#softBlur)" />
    `;
  } else if (artId === 'chrome-glaze') {
    artOverlay = `
      <ellipse cx="82" cy="${midY - 8}" rx="12" ry="${Math.round(34 * lengthScale)}" fill="#FFFFFF" opacity="0.45" filter="url(#softBlur)" />
    `;
  } else if (artId === 'minimal-line') {
    artOverlay = `
      <line x1="90" y1="${cutY - 8}" x2="90" y2="${tipY + 16}" stroke="${accentColor}" stroke-width="2" stroke-linecap="round" />
      <circle cx="90" cy="${cutY - 18}" r="3.2" fill="${highlightColor}" />
    `;
  }

  return `
    <svg viewBox="0 0 180 230" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${shapeId} extension with ${art.name}">
      <defs>
        <linearGradient id="fingerSkin" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#DEB39C"/>
          <stop offset="50%" stop-color="#EDC9B4"/>
          <stop offset="100%" stop-color="#D7A78E"/>
        </linearGradient>
        <linearGradient id="nailBase" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${baseColor}"/>
          <stop offset="100%" stop-color="${highlightColor}"/>
        </linearGradient>
        <filter id="softBlur" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="5"/>
        </filter>
        <clipPath id="nailClip">
          <path d="${nailPath}" />
        </clipPath>
      </defs>

      <!-- Finger silhouette -->
      <path d="M 44 230 L 44 132 C 44 82, 54 34, 90 34 C 126 34, 136 82, 136 132 L 136 230 Z" fill="url(#fingerSkin)" />
      <path d="M 60 202 Q 90 212 120 202" stroke="#C9967D" stroke-width="1.6" fill="none" opacity="0.55" />

      <!-- Nail Extension -->
      <path d="${nailPath}" fill="url(#nailBase)" stroke="rgba(120,75,85,0.28)" stroke-width="1.2" />
      <g clip-path="url(#nailClip)">
        ${artOverlay}
        <!-- Apex Gloss Highlight -->
        <path d="M 73 ${cutY - 14} Q 77 ${midY} 75 ${tipY + 22}" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round" fill="none" opacity="0.48" />
      </g>
    </svg>
  `;
}
