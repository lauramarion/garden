// ── Isometric map renderer ─────────────────────────────────
const canvas = document.getElementById('garden-canvas');
const ctx = canvas.getContext('2d');

const TW = 52, TH = 26;
const ORIGIN_X = 120, ORIGIN_Y = 200;

function toScreen(c, r) {
  return {
    x: ORIGIN_X + c * (TW / 2) + r * (TW / 2),
    y: ORIGIN_Y + c * (TH / 2) - r * (TH / 2)
  };
}

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

// Grid layout: col = depth (0=back, 17=patio right), row = width (0=left, 8=right)
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
  if (r === 0) return 'left_border_front';
  if (r === 1) return r <= 5 ? 'left_border_front' : 'left_border_back';
  if (r >= 8) return c <= 5 ? 'right_border_front' : 'right_border_back';
  if (r === 2) return 'left_path';
  if (c === 9 && r === 0) return 'rain_barrel';
  return 'lawn';
}

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

const SLOT_OFFSETS = [
  { dx: 0,  dy: 0  },
  { dx: -9, dy: -5 },
  { dx: 9,  dy: -5 },
];

function hpColor(hp) {
  if (hp > 60) return '#44dd44';
  if (hp > 30) return '#ddaa22';
  return '#dd2222';
}

function drawPlant(plant, highlight) {
  const { x, y } = toScreen(plant.grid_col, plant.grid_row);
  const off = SLOT_OFFSETS[plant.grid_slot || 0] || { dx: 0, dy: 0 };
  const px = x + TW / 2 + off.dx;
  const py = y + off.dy - 8;
  const s = highlight ? 1.25 : 1;

  if (plant.sprite_img) {
    ctx.drawImage(plant.sprite_img, px - 16 * s, py - 24 * s, 32 * s, 32 * s);
  } else {
    // Placeholder — coloured circle + pot
    const color = plant.status === 'OK' ? '#44aa44' :
                  plant.status === 'WARNING' ? '#aa6622' : '#661111';
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
  const hp = plant._hp !== undefined ? plant._hp : (plant.status === 'OK' ? 80 : plant.status === 'WARNING' ? 35 : 5);
  const bw = 20, bh = 3;
  const bx = px - bw / 2, by = py - 14 * s;
  ctx.fillStyle = '#111';
  ctx.fillRect(bx, by, bw, bh);
  ctx.fillStyle = hpColor(hp);
  ctx.fillRect(bx, by, bw * hp / 100, bh);

  // Warning indicator
  if (plant.status === 'WARNING') {
    ctx.fillStyle = '#ffaa00';
    ctx.font = `${10 * s}px monospace`;
    ctx.fillText('!', px + 8 * s, py - 8 * s);
  }
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

function drawPond() {
  const pondCells = [
    { c: 0, r: 3 }, { c: 0, r: 4 }, { c: 0, r: 5 },
    { c: 1, r: 3 }, { c: 1, r: 4 }, { c: 1, r: 5 },
  ];
  pondCells.forEach(({ c, r }) => {
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
    // Duckweed dots
    ctx.fillStyle = '#1e6a2a';
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(x + TW / 2 - 6 + i * 4, y + i % 2 * 3, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

let hoveredPlant = null;
let plants = [];

function render(hov) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw tiles
  for (let c = 0; c <= 17; c++) {
    for (let r = 0; r <= 9; r++) {
      const zone = zoneCodeAt(c, r);
      if (zone === 'pond') continue;
      drawTile(c, r, zone);
    }
  }
  drawPond();
  drawWall();

  // Draw plants sorted back to front
  const sorted = [...plants].sort((a, b) => (a.grid_col + a.grid_row) - (b.grid_col + b.grid_row));
  sorted.forEach(p => drawPlant(p, hov && hov.id === p.id));
}

function plantAtMouse(mx, my) {
  let best = null, bestD = 22;
  plants.forEach(p => {
    const { x, y } = toScreen(p.grid_col, p.grid_row);
    const off = SLOT_OFFSETS[p.grid_slot || 0] || { dx: 0, dy: 0 };
    const px = x + TW / 2 + off.dx;
    const py = y + off.dy - 8;
    const d = Math.hypot(mx - px, my - (py + 2));
    if (d < bestD) { bestD = d; best = p; }
  });
  return best;
}

canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  const sx = canvas.width / rect.width;
  const mx = (e.clientX - rect.left) * sx;
  const my = (e.clientY - rect.top) * sx;
  const p = plantAtMouse(mx, my);
  hoveredPlant = p;
  canvas.style.cursor = p ? 'pointer' : 'default';
  render(p);
});

canvas.addEventListener('click', e => {
  const rect = canvas.getBoundingClientRect();
  const sx = canvas.width / rect.width;
  const mx = (e.clientX - rect.left) * sx;
  const my = (e.clientY - rect.top) * sx;
  const p = plantAtMouse(mx, my);
  if (p) selectPlant(p);
});

canvas.addEventListener('mouseleave', () => {
  hoveredPlant = null;
  render(null);
});