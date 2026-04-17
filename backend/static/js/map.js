// ── Constants ──────────────────────────────────────────────
const canvas = document.getElementById('garden-canvas');
const ctx = canvas.getContext('2d');
const TW = 52, TH = 26;
const ORIGIN_X = 120, ORIGIN_Y = 200;

// Bounding box of the full grid in base (unscaled) coordinates
// x: ORIGIN_X … ORIGIN_X + (maxCol+maxRow)*(TW/2) + TW
// y: ORIGIN_Y - maxRow*(TH/2) - TH/2 … ORIGIN_Y + maxCol*(TH/2) + TH/2
const MAP_X1 = ORIGIN_X;
const MAP_X2 = ORIGIN_X + (17 + 9) * (TW / 2) + TW;   // 848
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
  if (c >= 15) return r <= 1 ? 'patio_shelf_1' : r >= 7 ? 'patio_shelf_2' : 'patio_covered';
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
  const top = toScreen(12, -0.5);
  const bot = toScreen(12, 9);
  ctx.strokeStyle = '#888880';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(top.x + TW / 2, top.y);
  ctx.lineTo(bot.x + TW / 2, bot.y);
  ctx.stroke();
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
      if (zone !== 'pond') drawTile(c, r, zone);
    }
  }
  drawPond();
  drawWall();
  [...plants]
    .sort((a, b) => (a.grid_col + a.grid_row) - (b.grid_col + b.grid_row))
    .forEach(p => drawPlant(p, hoveredPlant && hoveredPlant.id === p.id));
  ctx.restore();
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
  tooltip.innerHTML = `
    <div class="tt-code">${plant.code}</div>
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