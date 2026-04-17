// ── Constants ──────────────────────────────────────────────
const canvas = document.getElementById('garden-canvas');
const ctx = canvas.getContext('2d');
const TW = 52, TH = 26;
const ORIGIN_X = 120, ORIGIN_Y = 200;

// Bounding box of the rendered grid in base (unscaled) coordinates.
// Kitchen tiles (c>=13, r>=5) are not rendered, so the rightmost point is now
// max(c+r)=21 shared by c=12,r=9 and c=17,r=4  →  MAP_X2 = 718 (was 848).
const MAP_X1 = ORIGIN_X;
const MAP_X2 = ORIGIN_X + 21 * (TW / 2) + TW;          // 718
const MAP_Y1 = ORIGIN_Y - 9 * (TH / 2) - TH / 2;       // 70
const MAP_Y2 = ORIGIN_Y + 17 * (TH / 2) + TH / 2;      // 434

// Viewport transform – updated by fitCanvas(), used by render() and hit detection
let _dx = 0, _dy = 0, _rs = 1;

function fitCanvas() {
  const panel = canvas.parentElement;
  const pw = panel.clientWidth;
  const ph = panel.clientHeight;
  canvas.width  = pw;
  canvas.height = ph;
  const PAD = 24;
  const cw = MAP_X2 - MAP_X1;
  const ch = MAP_Y2 - MAP_Y1;
  _rs = Math.min((pw - PAD * 2) / cw, (ph - PAD * 2) / ch);
  _dx = (pw - cw * _rs) / 2 - MAP_X1 * _rs;
  _dy = (ph - ch * _rs) / 2 - MAP_Y1 * _rs;
}

// ── Coordinate conversion ──────────────────────────────────
function toScreen(c, r) {
  return {
    x: ORIGIN_X + c * (TW / 2) + r * (TW / 2),
    y: ORIGIN_Y + c * (TH / 2) - r * (TH / 2)
  };
}

// ── Zone colours ───────────────────────────────────────────
// Zone colours are defined here rather than in CSS because canvas
// drawing uses JS values directly
// CSS does not apply to canvas elements.
const ZONE_COLORS = {
  back:               { fill: '#a8d5a2', stroke: '#7db87a' },
  left_border_front:  { fill: '#4caf50', stroke: '#388e3c' },
  left_border_back:   { fill: '#4caf50', stroke: '#388e3c' },
  left_path:          { fill: '#c8c8c0', stroke: '#a8a89e' },
  lawn:               { fill: '#7ec850', stroke: '#5aaa2e' },
  right_border_front: { fill: '#66bb6a', stroke: '#43a047' },
  right_border_back:  { fill: '#81c784', stroke: '#558b2f' },
  entry:              { fill: '#b8b8b0', stroke: '#989890' },
  retaining_wall:     { fill: '#a8a8a0', stroke: '#888880' },
  stairs:             { fill: '#c8bfb0', stroke: '#a09888' },
  patio_uncovered:    { fill: '#dcdcd8', stroke: '#bcbcb8' },
  patio_covered:      { fill: '#d0d0cc', stroke: '#b0b0ac' },
  patio_shelf_1:      { fill: '#e8e8e4', stroke: '#c8c8c4' },
  patio_shelf_2:      { fill: '#e8e8e4', stroke: '#c8c8c4' },
  pond:               { fill: '#4fc3f7', stroke: '#0288d1' },
  rain_barrel:        { fill: '#78909c', stroke: '#546e7a' },
  compost:            { fill: '#8d6e63', stroke: '#6d4c41' },
  default:            { fill: '#a5d6a7', stroke: '#81c784' },
};

function zoneCodeAt(c, r) {
  if (c >= 13 && r >= 5) return null;   // kitchen — not part of the garden map
  if ((c === 12 || c === 13) && r <= 1) return 'stairs';
  if (c >= 15) return r <= 1 ? 'patio_shelf_1' : 'patio_covered';
  if (c >= 13) return 'patio_uncovered';
  if (c === 12) return 'retaining_wall';
  if (c >= 10 && c <= 11) return 'entry';
  if (c <= 1) {
    if (r >= 3 && r <= 5) return 'pond';
    if (r === 6) return 'compost';
    return 'back';
  }
  if (r === 0 || (r === 1 && c <= 5)) return 'left_border_front';
  if (r === 1) return 'left_border_back';
  if (r >= 8) return c <= 5 ? 'right_border_front' : 'right_border_back';
  if (r === 2) return 'left_path';
  return 'lawn';
}

// ── Grid coordinate system ─────────────────────────────────
// Letters A–J  →  r axis  (A = r=0, the left/bottom edge)
// Numbers 1–18 →  c axis  (1 = c=17 patio front, 18 = c=0 back of garden)
// Example: A1 = (c=17, r=0) = front-left of patio
function tileCoord(c, r) {
  return String.fromCharCode(65 + r) + (18 - c);
}

// Draw axis labels outside the viewport transform so text stays at a fixed
// screen size regardless of zoom level.
function drawGridLabels() {
  ctx.save();
  ctx.font = 'bold 8px Silkscreen, monospace';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(8, 8, 24, 0.28)';

  // Number labels (1–18) along the r=0 edge (bottom-left diagonal).
  // Placed at the midpoint of each tile's outer edge using c+0.5.
  ctx.textAlign = 'right';
  for (let c = 0; c <= 17; c++) {
    const { x, y } = toScreen(c + 0.5, 0);
    ctx.fillText(String(18 - c), x * _rs + _dx - 12, y * _rs + _dy);
  }

  // Letter labels (A–J) along the c=0 edge (top-left diagonal).
  // Placed at the midpoint of each tile's outer edge using r+0.5.
  for (let r = 0; r <= 9; r++) {
    const { x, y } = toScreen(0, r + 0.5);
    ctx.fillText(String.fromCharCode(65 + r), x * _rs + _dx - 12, y * _rs + _dy);
  }

  ctx.restore();
}

// ── Drawing ────────────────────────────────────────────────
function drawTile(c, r, zoneCode) {
  const { x, y } = toScreen(c, r);
  const z = ZONE_COLORS[zoneCode] || ZONE_COLORS.default;
  ctx.beginPath();
  ctx.moveTo(x + TW / 2, y - TH / 2);
  ctx.lineTo(x + TW,     y);
  ctx.lineTo(x + TW / 2, y + TH / 2);
  ctx.lineTo(x,          y);
  ctx.closePath();
  ctx.fillStyle = z.fill;
  ctx.fill();
  ctx.strokeStyle = z.stroke;
  ctx.lineWidth = 0.5;
  ctx.stroke();

  // Step lines for stairs tiles: three horizontal bands across the diamond.
  // At offset dy from the diamond centre, the line runs from x+|dy|*(TW/TH)
  // to x+TW-|dy|*(TW/TH).  TW/TH = 2, so the factor simplifies nicely.
  if (zoneCode === 'stairs') {
    // Lines parallel to the r axis (letter axis): direction (TW/2, -TH/2).
    // At c-fraction f the line runs from the bottom-left edge to the top-right edge.
    ctx.strokeStyle = '#a09888';
    ctx.lineWidth = 0.8;
    [1 / 4, 1 / 2, 3 / 4].forEach(f => {
      ctx.beginPath();
      ctx.moveTo(x + f * (TW / 2),           y + f * (TH / 2));
      ctx.lineTo(x + (1 + f) * (TW / 2),     y + (f - 1) * (TH / 2));
      ctx.stroke();
    });
  }
}

function drawPond() {
  [[0,3],[0,4],[0,5],[1,3],[1,4],[1,5]].forEach(([c, r]) => {
    const { x, y } = toScreen(c, r);
    ctx.beginPath();
    ctx.moveTo(x + TW / 2, y - TH / 2);
    ctx.lineTo(x + TW,     y);
    ctx.lineTo(x + TW / 2, y + TH / 2);
    ctx.lineTo(x,          y);
    ctx.closePath();
    ctx.fillStyle = '#4fc3f7';
    ctx.fill();
    ctx.strokeStyle = '#0288d1';
    ctx.lineWidth = 0.5;
    ctx.stroke();
    ctx.fillStyle = '#66bb6a';
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(x + TW / 2 - 6 + i * 4, y + i % 2 * 3, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function drawWall() {
  ctx.strokeStyle = '#888880';
  ctx.lineWidth = 3;
  // Single segment above the stairs gap (r=0–1); the stub below is removed
  [[1.9, 9]].forEach(([r0, r1]) => {
    const p0 = toScreen(12, r0);
    const p1 = toScreen(12, r1);
    ctx.beginPath();
    ctx.moveTo(p0.x + TW / 2, p0.y);
    ctx.lineTo(p1.x + TW / 2, p1.y);
    ctx.stroke();
  });
}

const SLOT_OFFSETS = [{dx:0,dy:0},{dx:-9,dy:-5},{dx:9,dy:-5}];

function hpColor(hp) {
  return hp > 60 ? '#44dd44' : hp > 30 ? '#ddaa22' : '#dd2222';
}

function plantHP(plant) {
  if (plant._hp !== undefined) return plant._hp;
  return plant.status === 'OK' ? 80 : plant.status === 'WARNING' ? 35 : 5;
}

function drawPlant(plant, highlight) {
  const { x, y } = toScreen(plant.grid_col, plant.grid_row);
  const { dx, dy } = SLOT_OFFSETS[plant.grid_slot || 0] || SLOT_OFFSETS[0];
  const px = x + TW / 2 + dx;
  const py = y + dy - 8;
  const s = highlight ? 1.25 : 1;

  // Sprite or placeholder
  if (plant.sprite_img) {
    ctx.drawImage(plant.sprite_img, px - 16 * s, py - 24 * s, 32 * s, 32 * s);
  } else {
    const color = plant.status === 'OK' ? '#44aa44' : plant.status === 'WARNING' ? '#aa6622' : '#661111';
    ctx.fillStyle = '#585050';
    ctx.fillRect(px - 5 * s, py + 8 * s, 10 * s, 7 * s);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(px, py + 2 * s, 8 * s, 0, Math.PI * 2);
    ctx.fill();
    if (highlight) {
      ctx.strokeStyle = '#ffffff66';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  // HP bar
  const hp = plantHP(plant);
  const bx = px - 10, by = py - 14 * s;
  ctx.fillStyle = '#111';
  ctx.fillRect(bx, by, 20, 3);
  ctx.fillStyle = hpColor(hp);
  ctx.fillRect(bx, by, 20 * hp / 100, 3);

  // Warning indicator
  if (plant.status === 'WARNING') {
    ctx.fillStyle = '#ffaa00';
    ctx.font = `${10 * s}px monospace`;
    ctx.fillText('!', px + 8 * s, py - 8 * s);
  }
}

function render(hoveredPlant) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(_dx, _dy);
  ctx.scale(_rs, _rs);
  for (let c = 0; c <= 17; c++) {
    for (let r = 0; r <= 9; r++) {
      const zone = zoneCodeAt(c, r);
      if (zone === null) continue;
      if (zone !== 'pond') drawTile(c, r, zone);
    }
  }
  drawPond();
  drawWall();
  [...plants]
    .filter(p => zoneCodeAt(p.grid_col, p.grid_row) !== null)
    .sort((a, b) => (a.grid_col + a.grid_row) - (b.grid_col + b.grid_row))
    .forEach(p => drawPlant(p, hoveredPlant && hoveredPlant.id === p.id));
  ctx.restore();
  drawGridLabels();
}

// ── Hit detection ──────────────────────────────────────────
function plantAtMouse(mx, my) {
  let best = null, bestD = 22;
  plants.forEach(p => {
    const { x, y } = toScreen(p.grid_col, p.grid_row);
    const { dx, dy } = SLOT_OFFSETS[p.grid_slot || 0] || SLOT_OFFSETS[0];
    const d = Math.hypot(mx - (x + TW / 2 + dx), my - (y + dy - 6));
    if (d < bestD) { bestD = d; best = p; }
  });
  return best;
}

// ── Tooltip ────────────────────────────────────────────────
const tooltip = document.getElementById('map-tooltip');

function showTooltip(plant, mx, my) {
  const zone = allZones.find(z => z.id === plant.zone_id);
  const hp = plantHP(plant);
  const coord = (plant.grid_col != null && plant.grid_row != null)
    ? tileCoord(plant.grid_col, plant.grid_row) : '';
  tooltip.innerHTML = `
    <div class="tt-code">${plant.code}${coord ? ` <span style="color:var(--aqua-dk);opacity:0.8">${coord}</span>` : ''}</div>
    <div class="tt-name">${plant.common_name}</div>
    ${plant.latin_name ? `<div class="tt-latin">${plant.latin_name}</div>` : ''}
    <div class="tt-hp" style="color:${hpColor(hp)}">HP ${hp}/100 · ${plant.status}</div>
    ${zone ? `<div class="tt-zone">${zone.label}</div>` : ''}
  `;
  tooltip.style.left = (mx + 14) + 'px';
  tooltip.style.top  = (my - 10) + 'px';
  tooltip.style.display = 'block';
}

function hideTooltip() {
  tooltip.style.display = 'none';
}

// ── Events ─────────────────────────────────────────────────
// onPlantClick is null by default — gardener.js overrides it
let onPlantClick = null;
let hoveredPlant = null;

function toLogical(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const css = canvas.width / rect.width;
  return {
    x: ((clientX - rect.left) * css - _dx) / _rs,
    y: ((clientY - rect.top)  * css - _dy) / _rs,
  };
}

canvas.addEventListener('mousemove', e => {
  const { x, y } = toLogical(e.clientX, e.clientY);
  const p = plantAtMouse(x, y);
  hoveredPlant = p;
  canvas.style.cursor = p ? 'pointer' : 'default';
  render(p);
  if (p) showTooltip(p, e.clientX, e.clientY);
  else hideTooltip();
});

canvas.addEventListener('click', e => {
  const { x, y } = toLogical(e.clientX, e.clientY);
  const p = plantAtMouse(x, y);
  if (p && onPlantClick) onPlantClick(p);
});

canvas.addEventListener('mouseleave', () => {
  hoveredPlant = null;
  hideTooltip();
  render(null);
});

// ── Data & init ────────────────────────────────────────────
// Shared across both pages. gardener.js extends this.
let plants = [];
let allZones = [];
let allPlants = [];

async function loadAll() {
  fitCanvas();
  window.addEventListener('resize', () => { fitCanvas(); render(hoveredPlant); });

  [allPlants, allZones] = await Promise.all([
    fetch('/api/plants/').then(r => r.json()),
    fetch('/api/zones/').then(r => r.json()),
  ]);
  plants = allPlants;

  // Populate public stats if the elements exist on this page
  const el = id => document.getElementById(id);
  if (el('stat-plants'))  el('stat-plants').textContent  = allPlants.length;
  if (el('stat-ok'))      el('stat-ok').textContent      = allPlants.filter(p => p.status === 'OK').length;
  if (el('stat-warning')) el('stat-warning').textContent = allPlants.filter(p => p.status === 'WARNING').length;

  render(null);
}

loadAll();