/**
 * NailSense AI — Synthetic Clinical Finger & Nail Preset Generator
 *
 * Generates realistic finger + nail bed images onto an HTMLCanvasElement
 * so the CV segmentation and geometric classifier can be tested in 1 click
 * without needing an external image file.
 */

export function generatePresetCanvas(presetId) {
  const canvas = document.createElement('canvas');
  canvas.width = 520;
  canvas.height = 460;
  const ctx = canvas.getContext('2d');

  // Soft studio mat background
  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, '#efe6df');
  bgGrad.addColorStop(1, '#e1d3c9');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle fabric/table texture dots
  ctx.fillStyle = 'rgba(130, 105, 95, 0.04)';
  for (let y = 12; y < canvas.height; y += 16) {
    for (let x = 12; x < canvas.width; x += 16) {
      ctx.fillRect(x, y, 2, 2);
    }
  }

  const cx = canvas.width / 2;
  const fingerW = presetId === 'short-wide' || presetId === 'fan' ? 148 : presetId === 'almond' ? 118 : 132;
  const fingerTopY = 74;

  // Drop shadow under finger
  ctx.save();
  ctx.shadowColor = 'rgba(55, 30, 25, 0.22)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 10;

  // Finger silhouette
  const skinGrad = ctx.createLinearGradient(cx - fingerW / 2, 0, cx + fingerW / 2, 0);
  skinGrad.addColorStop(0, '#c89278');
  skinGrad.addColorStop(0.28, '#e3b39a');
  skinGrad.addColorStop(0.55, '#ecc0a8');
  skinGrad.addColorStop(0.82, '#dcab91');
  skinGrad.addColorStop(1, '#be876d');

  ctx.fillStyle = skinGrad;
  ctx.beginPath();
  ctx.moveTo(cx - fingerW / 2, canvas.height);
  ctx.lineTo(cx - fingerW / 2, fingerTopY + 78);
  ctx.bezierCurveTo(
    cx - fingerW / 2, fingerTopY,
    cx + fingerW / 2, fingerTopY,
    cx + fingerW / 2, fingerTopY + 78
  );
  ctx.lineTo(cx + fingerW / 2, canvas.height);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Subtle knuckle crease
  ctx.strokeStyle = 'rgba(145, 95, 75, 0.28)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(cx - fingerW * 0.28, 326 + i * 9);
    ctx.quadraticCurveTo(cx, 332 + i * 9, cx + fingerW * 0.28, 326 + i * 9);
    ctx.stroke();
  }

  // Nail bed geometry per archetype
  let nailTopY = 104;
  let nailBotY = 236;
  let wProx = 76;
  let wMid = 78;
  let wDist = 70;

  switch (presetId) {
    case 'short-wide':
      nailTopY = 132;
      nailBotY = 216;
      wProx = 88;
      wMid = 92;
      wDist = 84;
      break;
    case 'square':
      nailTopY = 108;
      nailBotY = 228;
      wProx = 82;
      wMid = 84;
      wDist = 80;
      break;
    case 'oval':
      nailTopY = 98;
      nailBotY = 236;
      wProx = 76;
      wMid = 74;
      wDist = 54;
      break;
    case 'almond':
      nailTopY = 88;
      nailBotY = 244;
      wProx = 68;
      wMid = 62;
      wDist = 34;
      break;
    case 'fan':
      nailTopY = 108;
      nailBotY = 224;
      wProx = 68;
      wMid = 84;
      wDist = 98;
      break;
  }

  const drawNailPath = () => {
    const pL = cx - wProx / 2;
    const pR = cx + wProx / 2;
    const mL = cx - wMid / 2;
    const mR = cx + wMid / 2;
    const dL = cx - wDist / 2;
    const dR = cx + wDist / 2;
    const midY = (nailTopY + nailBotY) / 2;
    const tipCurveCtrlY = presetId === 'square' ? nailTopY + 3 : nailTopY - 4;

    ctx.beginPath();
    ctx.moveTo(pL, nailBotY - 12);
    ctx.bezierCurveTo(mL, midY + 10, mL, midY - 14, dL, nailTopY + 16);
    if (presetId === 'square' || presetId === 'fan') {
      ctx.quadraticCurveTo(cx, tipCurveCtrlY, dR, nailTopY + 16);
    } else {
      ctx.bezierCurveTo(dL + 4, nailTopY, dR - 4, nailTopY, dR, nailTopY + 16);
    }
    ctx.bezierCurveTo(mR, midY - 14, mR, midY + 10, pR, nailBotY - 12);
    ctx.quadraticCurveTo(cx, nailBotY + 12, pL, nailBotY - 12);
    ctx.closePath();
  };

  // Lateral cuticle shadow
  ctx.save();
  drawNailPath();
  ctx.shadowColor = 'rgba(115, 65, 55, 0.35)';
  ctx.shadowBlur = 6;
  const nailGrad = ctx.createLinearGradient(cx, nailTopY, cx, nailBotY);
  nailGrad.addColorStop(0, '#faf3ef');    // free edge ivory
  nailGrad.addColorStop(0.18, '#f4d9da'); // smile transition
  nailGrad.addColorStop(0.75, '#eabec2'); // nail bed pink
  nailGrad.addColorStop(1, '#f3d6d8');    // lunula warmth
  ctx.fillStyle = nailGrad;
  ctx.fill();
  ctx.restore();

  // Lunula (half-moon near cuticle)
  ctx.save();
  drawNailPath();
  ctx.clip();

  ctx.fillStyle = 'rgba(255, 249, 246, 0.58)';
  ctx.beginPath();
  ctx.ellipse(cx, nailBotY - 4, wProx * 0.34, 18, 0, Math.PI, 0);
  ctx.fill();

  // Subtle vertical specular highlight
  const gloss = ctx.createLinearGradient(cx - wMid * 0.25, nailTopY, cx - wMid * 0.08, nailBotY);
  gloss.addColorStop(0, 'rgba(255,255,255,0.45)');
  gloss.addColorStop(1, 'rgba(255,255,255,0.08)');
  ctx.fillStyle = gloss;
  ctx.fillRect(cx - wMid * 0.22, nailTopY + 8, 8, nailBotY - nailTopY - 24);
  ctx.restore();

  // Crisp cuticle fold rim
  ctx.save();
  drawNailPath();
  ctx.strokeStyle = 'rgba(150, 96, 82, 0.45)';
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.restore();

  return canvas;
}
