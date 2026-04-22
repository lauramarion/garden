// ── Gardener extensions ────────────────────────────────────
const _baseLoad = loadAll;
loadAll = async function() {
  await _baseLoad();
  allJournal = await fetch('/api/journal/?limit=100').then(r => r.json());
  populateLogSelects();
  renderSidePlantList();
  renderZonesList();
};

onPlantClick = function(plant) {
  showPlantDetail(plant);
  // Switch to Plants tab if not already there
  activateTab('plants');
};

// ── State ──────────────────────────────────────────────────
let allJournal = [];

// ── Tabs ───────────────────────────────────────────────────
function activateTab(name) {
  document.querySelectorAll('.side-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.side-content').forEach(c => c.style.display = 'none');
  document.querySelector(`[data-tab="${name}"]`).classList.add('active');
  document.getElementById(`tab-${name}`).style.display = 'block';
}

document.querySelectorAll('.side-tab').forEach(tab => {
  tab.addEventListener('click', () => activateTab(tab.dataset.tab));
});

// ── Plants tab ─────────────────────────────────────────────
function renderSidePlantList() {
  const list = document.getElementById('side-plant-list');
  if (!allPlants.length) {
    list.innerHTML = '<div class="empty-state">No plants.</div>';
    return;
  }
  list.innerHTML = allPlants.map(p => {
    const hp = plantHP(p);
    return `
      <div class="side-plant-row" data-id="${p.id}">
        <div class="side-plant-row-left">
          <span class="plant-code">${p.code}</span>
          <span class="side-plant-name">${p.common_name}</span>
        </div>
        <span class="status-badge status-${p.status}">${p.status}</span>
      </div>`;
  }).join('');

  list.querySelectorAll('.side-plant-row').forEach(row => {
    row.addEventListener('click', () => {
      const plant = allPlants.find(p => p.id === +row.dataset.id);
      if (plant) {
        showPlantDetail(plant);
        // Highlight on map
        hoveredPlant = plant;
        render(plant);
      }
    });
  });
}

function showPlantDetail(plant) {
  document.getElementById('side-plant-list').style.display = 'none';
  document.getElementById('side-plant-detail').style.display = 'block';

  const hp   = plantHP(plant);
  const zone = allZones.find(z => z.id === plant.zone_id);
  const spriteHtml = plant.sprite_path
    ? `<img src="/static/${plant.sprite_path}" width="64" height="64" class="plant-sprite-img">`
    : `<div class="plant-sprite-placeholder">no sprite</div>`;

  document.getElementById('plant-detail').innerHTML = `
    <div class="plant-card">
      <div class="plant-card-header">
        <div class="plant-sprite">${spriteHtml}</div>
        <div class="plant-card-info">
          <div class="plant-code">${plant.code}</div>
          <div class="plant-name">${plant.common_name}</div>
          <div class="plant-latin">${plant.latin_name || '—'}</div>
          <div class="status-badge status-${plant.status}">${plant.status}</div>
        </div>
      </div>
      <div class="hp-bar-label">HP ${hp}/100</div>
      <div class="hp-bar-track">
        <div class="hp-bar-fill" style="width:${hp}%;background:${hpColor(hp)}"></div>
      </div>
      <div class="plant-meta">
        <div class="plant-meta-item">Zone <span>${zone ? zone.label : '—'}</span></div>
        <div class="plant-meta-item">Container <span>${plant.container || '—'}</span></div>
        <div class="plant-meta-item">Acquired <span>${plant.acquired_date || '—'}</span></div>
        <div class="plant-meta-item">From <span>${plant.acquired_from || '—'}</span></div>
      </div>
      ${plant.status_notes ? `<div class="plant-notes">${plant.status_notes}</div>` : ''}
      <a href="/plants/${plant.id}" class="btn-back side-detail-link">Full detail →</a>
    </div>
  `;
}

document.getElementById('side-back').addEventListener('click', () => {
  document.getElementById('side-plant-list').style.display = 'block';
  document.getElementById('side-plant-detail').style.display = 'none';
  hoveredPlant = null;
  render(null);
});

// ── Zones tab ──────────────────────────────────────────────
function renderZonesList() {
  const el = document.getElementById('zones-list');
  if (!allZones.length) {
    el.innerHTML = '<div class="empty-state">No zones.</div>';
    return;
  }
  el.innerHTML = allZones.map(z => `
    <div class="zone-row">
      <div class="zone-row-label">${z.label}</div>
      <div class="zone-row-meta">
        ${z.light    ? `<span class="task-tag">${z.light}</span>` : ''}
        ${z.moisture ? `<span class="task-tag">${z.moisture}</span>` : ''}
        ${z.covered  ? `<span class="task-tag">covered</span>` : ''}
      </div>
    </div>`).join('');
}

// ── Log form ───────────────────────────────────────────────
function populateLogSelects() {
  const plantSel = document.getElementById('log-plant');
  const zoneSel  = document.getElementById('log-zone');
  allPlants.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = `${p.code} — ${p.common_name}`;
    plantSel.appendChild(opt);
  });
  allZones.forEach(z => {
    const opt = document.createElement('option');
    opt.value = z.id;
    opt.textContent = z.label;
    zoneSel.appendChild(opt);
  });
}

document.getElementById('log-date').value = new Date().toISOString().split('T')[0];

document.getElementById('log-form').addEventListener('submit', async e => {
  e.preventDefault();
  const details = document.getElementById('log-details').value.trim();
  if (!details) return;

  const payload = {
    entry_date: document.getElementById('log-date').value,
    entry_type: document.getElementById('log-type').value,
    details,
    plant_id: document.getElementById('log-plant').value || null,
    zone_id:  document.getElementById('log-zone').value  || null,
  };

  const res = await fetch('/api/journal/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (res.ok) {
    document.getElementById('log-details').value = '';
    const fb = document.getElementById('log-feedback');
    fb.style.display = 'block';
    setTimeout(() => fb.style.display = 'none', 3000);
    allJournal = await fetch('/api/journal/?limit=100').then(r => r.json());
  }
});

loadAll();
