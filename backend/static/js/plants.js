let allPlants = [];
let allZones  = [];

const HP_BY_STATUS = { Thriving: 80, Stable: 65, New: 60, Dormant: 50, Struggling: 35 };
function hpFor(p) { return HP_BY_STATUS[p.status] ?? 5; }
function hpColor(hp) { return hp > 60 ? 'var(--green)' : hp > 30 ? 'var(--yellow)' : 'var(--pink)'; }

function tileCoord(c, r) {
  if (c == null || r == null) return null;
  return String.fromCharCode(65 + r) + (18 - c);
}

function plantCard(p) {
  const zone = allZones.find(z => z.id === p.zone_id);
  const hp   = hpFor(p);
  const coord = tileCoord(p.grid_col, p.grid_row);
  const sprite = p.sprite_path
    ? `<img src="${p.sprite_path}" width="36" height="36" class="plant-card-sprite">`
    : `<div class="plant-card-sprite-placeholder"></div>`;

  return `
    <a href="/plants/${p.id}" class="plant-card-link">
      <div class="plant-card-grid">
        <div class="plant-card-sprite-wrap">${sprite}</div>
        <div class="plant-card-body">
          <div class="plant-card-top">
            <span class="plant-code">${p.code}</span>
            <span class="status-badge status-${p.status}">${p.status}</span>
          </div>
          <div class="plant-name">${p.common_name}</div>
          <div class="plant-tags">
            ${zone  ? `<span class="task-tag">${zone.label}</span>` : ''}
            ${p.container ? `<span class="task-tag">${p.container}</span>` : ''}
            ${coord ? `<span class="task-tag">${coord}</span>` : ''}
          </div>
          <div class="hp-bar-track plant-card-hp-bar">
            <div class="hp-bar-fill" style="width:${hp}%;background:${hpColor(hp)}"></div>
          </div>
        </div>
      </div>
    </a>`;
}

function render() {
  const search  = document.getElementById('plant-search').value.toLowerCase();
  const status  = document.getElementById('filter-status').value;
  const zone    = document.getElementById('filter-zone').value;
  const sort    = document.getElementById('filter-sort').value;

  let plants = allPlants;
  if (search)  plants = plants.filter(p =>
    p.common_name.toLowerCase().includes(search) ||
    p.code.toLowerCase().includes(search) ||
    (p.latin_name && p.latin_name.toLowerCase().includes(search))
  );
  if (status)  plants = plants.filter(p => p.status === status);
  if (zone)    plants = plants.filter(p => String(p.zone_id) === zone);

  if (sort === 'name')     plants = [...plants].sort((a, b) => a.common_name.localeCompare(b.common_name));
  if (sort === 'hp-asc')   plants = [...plants].sort((a, b) => hpFor(a) - hpFor(b));
  if (sort === 'hp-desc')  plants = [...plants].sort((a, b) => hpFor(b) - hpFor(a));
  if (sort === 'zone')     plants = [...plants].sort((a, b) => (a.zone_id ?? 999) - (b.zone_id ?? 999));

  document.getElementById('plants-count').textContent = plants.length;

  const grid = document.getElementById('plants-grid');
  if (!plants.length) {
    grid.innerHTML = '<div class="empty-state">No plants match your filters.</div>';
    return;
  }
  grid.innerHTML = plants.map(plantCard).join('');
}

function populateZoneFilter() {
  const selectors = ['filter-zone', 'ap-zone'];
  selectors.forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    allZones.forEach(z => {
      const o = document.createElement('option');
      o.value = z.id; o.textContent = z.label;
      sel.appendChild(o);
    });
  });
}

['filter-status', 'filter-zone', 'filter-sort'].forEach(id =>
  document.getElementById(id).addEventListener('change', render)
);
document.getElementById('plant-search').addEventListener('input', render);

// ── Add plant modal ────────────────────────────────────────
let currentStep = 1;
const totalSteps = 3;

function coordToGrid(coord) {
  if (!coord || coord.length < 2) return { col: null, row: null };
  const row = coord.charCodeAt(0) - 65;
  const col = 18 - parseInt(coord.slice(1), 10);
  return { col, row };
}

function showStep(n) {
  for (let i = 1; i <= totalSteps; i++)
    document.getElementById(`step-${i}`).style.display = i === n ? 'block' : 'none';
  document.getElementById('ap-back').style.display = n > 1 ? 'inline-block' : 'none';
  document.getElementById('ap-next').textContent = n === totalSteps ? 'Save plant' : 'Next →';
  currentStep = n;
}

document.getElementById('open-add-plant').addEventListener('click', () => {
  showStep(1);
  document.getElementById('add-plant-modal').style.display = 'flex';
});

document.getElementById('close-add-plant').addEventListener('click', () => {
  document.getElementById('add-plant-modal').style.display = 'none';
});

document.getElementById('add-plant-modal').addEventListener('click', e => {
  if (e.target === e.currentTarget)
    document.getElementById('add-plant-modal').style.display = 'none';
});

document.getElementById('ap-back').addEventListener('click', () => showStep(currentStep - 1));

document.getElementById('ap-next').addEventListener('click', async () => {
  if (currentStep < totalSteps) { showStep(currentStep + 1); return; }

  const code = document.getElementById('ap-code').value.trim();
  const name = document.getElementById('ap-name').value.trim();
  if (!code || !name) { showStep(1); return; }

  const coord    = document.getElementById('ap-coord').value.trim().toUpperCase();
  const { col, row } = coordToGrid(coord);
  const status   = document.querySelector('input[name="ap-status"]:checked').value;
  const zoneVal  = document.getElementById('ap-zone').value;

  const payload = {
    code,
    common_name:   name,
    latin_name:    document.getElementById('ap-latin').value.trim() || null,
    container:     document.getElementById('ap-container').value.trim() || null,
    acquired_date: document.getElementById('ap-date').value || null,
    acquired_from: document.getElementById('ap-from').value.trim() || null,
    zone_id:       zoneVal ? +zoneVal : null,
    grid_col:      col,
    grid_row:      row,
    grid_slot:     +document.getElementById('ap-slot').value,
    status,
    is_active:     true,
  };

  const res = await fetch('/api/plants/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (res.ok) {
    const plant = await res.json();
    // Log the addition
    await fetch('/api/journal/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entry_type: 'action',
        details: 'Plant added',
        plant_id: plant.id,
      }),
    });
    allPlants.push(plant);
    document.getElementById('add-plant-modal').style.display = 'none';
    render();
  }
});

async function init() {
  [allPlants, allZones] = await Promise.all([
    fetch('/api/plants/').then(r => r.json()),
    fetch('/api/zones/').then(r => r.json()),
  ]);
  populateZoneFilter();
  render();
}

init();
