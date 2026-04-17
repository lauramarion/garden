// ── Constants ──────────────────────────────────────────────
const canvas = document.getElementById('garden-canvas');
const ctx = canvas.getContext('2d');
const TW = 52, TH = 26;
const ORIGIN_X = 120, ORIGIN_Y = 200;

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
  back:               { fill: '#1a2e10', stroke: '#243a16' },
  left_border_front:  { fill: '#1e3a12', stroke: '#2a5018' },
  left_border_back:   { fill: '#1e3a12', stroke: '#2a5018' },
  left_path:          { fill: '#2a2218', stroke: '#3a3224' },
  lawn:               { fill: '#2a5616', stroke: '#367020' },
  right_border_front: { fill: '#1a3610', stroke: '#264a18' },
  right_border_back:  { fill: '#162e0e', stroke: '#1e4014' },
  entry:              { fill: '#282018', stroke: '#383024' },
  retaining_wall:     { fill: '#302820', stroke: '#403828' },
  patio_uncovered:    { fill: '#201c14', stroke: '#302c20' },
  patio_covered:      { fill: '#1a1810', stroke: '#2a2818' },
  patio_shelf_1:      { fill: '#181610', stroke: '#28260e' },
  patio_shelf_2:      { fill: '#181610', stroke: '#28260e' },
  pond:               { fill: '#0c2838', stroke: '#164858' },
  rain_barrel:        { fill: '#1e2e10', stroke: '#2a4018' },
  compost:            { fill: '#1a1e0e', stroke: '#242810' },
  default:            { fill: '#1a2a1a', stroke: '#2a3a2a' },
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
    ctx.fillStyle = '#0c2838';
    ctx.fill();
    ctx.strokeStyle = '#1a4858';
    ctx.lineWidth = 0.5;
    ctx.stroke();
    ctx.fillStyle = '#1e6a2a';
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
  ctx.strokeStyle = '#6a5a40';
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

canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  const sx = canvas.width / rect.width;
  const p = plantAtMouse((e.clientX - rect.left) * sx, (e.clientY - rect.top) * sx);
  hoveredPlant = p;
  canvas.style.cursor = p ? 'pointer' : 'default';
  render(p);
  if (p) showTooltip(p, e.clientX, e.clientY);
  else hideTooltip();
});

canvas.addEventListener('click', e => {
  const rect = canvas.getBoundingClientRect();
  const sx = canvas.width / rect.width;
  const p = plantAtMouse((e.clientX - rect.left) * sx, (e.clientY - rect.top) * sx);
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