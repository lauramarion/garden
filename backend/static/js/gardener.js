// ── Data loading ───────────────────────────────────────────
let allPlants = [];
let allZones  = [];
let allJournal = [];

async function loadAll() {
  [allPlants, allZones, allJournal] = await Promise.all([
    fetch('/api/plants/').then(r => r.json()),
    fetch('/api/zones/').then(r => r.json()),
    fetch('/api/journal/?limit=100').then(r => r.json()),
  ]);

  plants = allPlants; // expose to map.js
  populateLogSelects();
  renderJournal();
  render(null);
}

// ── Log selects ────────────────────────────────────────────
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

// ── Default date ───────────────────────────────────────────
function setDefaultDate() {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('log-date').value = today;
}

// ── Tabs ───────────────────────────────────────────────────
document.querySelectorAll('.side-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.side-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.side-content').forEach(c => c.style.display = 'none');
    tab.classList.add('active');
    document.getElementById(`tab-${tab.dataset.tab}`).style.display = 'block';
  });
});

// ── Plant card ─────────────────────────────────────────────
function selectPlant(plant) {
  // Switch to plant tab
  document.querySelectorAll('.side-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.side-content').forEach(c => c.style.display = 'none');
  document.querySelector('[data-tab="plant"]').classList.add('active');
  document.getElementById('tab-plant').style.display = 'block';

  document.getElementById('plant-empty').style.display = 'none';
  document.getElementById('plant-detail').style.display = 'block';

  const hp = plant._hp !== undefined ? plant._hp :
             plant.status === 'OK' ? 80 :
             plant.status === 'WARNING' ? 35 : 5;

  const hpCol = hp > 60 ? 'var(--hp-ok)' : hp > 30 ? 'var(--hp-warn)' : 'var(--hp-crit)';

  const zone = allZones.find(z => z.id === plant.zone_id);
  const zoneName = zone ? zone.label : '—';

  const spriteHtml = plant.sprite_path
    ? `<img src="/static/${plant.sprite_path}" width="64" height="64" style="image-rendering:pixelated">`
    : `<div style="width:64px;height:64px;background:#0a1a0a;border:1px solid var(--border);border-radius:4px;display:flex;align-items:center;justify-content:center;color:var(--text-muted);font-size:10px;">no sprite</div>`;

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
        <div class="hp-bar-fill" style="width:${hp}%;background:${hpCol}"></div>
      </div>
      <div class="plant-meta">
        <div class="plant-meta-item">Zone <span>${zoneName}</span></div>
        <div class="plant-meta-item">Container <span>${plant.container || '—'}</span></div>
        <div class="plant-meta-item">Acquired <span>${plant.acquired_date || '—'}</span></div>
        <div class="plant-meta-item">From <span>${plant.acquired_from || '—'}</span></div>
      </div>
      ${plant.status_notes ? `<div class="plant-notes">${plant.status_notes}</div>` : ''}
    </div>
  `;
}

// ── Journal feed ───────────────────────────────────────────
function renderJournal() {
  const feed = document.getElementById('journal-feed');
  if (!allJournal.length) {
    feed.innerHTML = '<div class="empty-state">No journal entries yet.</div>';
    return;
  }

  feed.innerHTML = allJournal.map(e => {
    const plant = allPlants.find(p => p.id === e.plant_id);
    const zone  = allZones.find(z => z.id === e.zone_id);
    const target = plant ? `${plant.code}` : zone ? zone.label : '';
    return `
      <div class="journal-entry">
        <div class="journal-meta">
          <span class="journal-date">${e.entry_date}</span>
          <span class="journal-type">${e.entry_type}</span>
          ${target ? `<span class="journal-target">${target}</span>` : ''}
        </div>
        <div class="journal-details">${e.details}</div>
      </div>
    `;
  }).join('');
}

// ── Log form ───────────────────────────────────────────────
document.getElementById('log-form').addEventListener('submit', async e => {
  e.preventDefault();

  const date    = document.getElementById('log-date').value;
  const plantId = document.getElementById('log-plant').value;
  const zoneId  = document.getElementById('log-zone').value;
  const type    = document.getElementById('log-type').value;
  const details = document.getElementById('log-details').value.trim();

  if (!details) return;

  const payload = {
    entry_date: date,
    entry_type: type,
    details,
    plant_id: plantId ? parseInt(plantId) : null,
    zone_id:  zoneId  ? parseInt(zoneId)  : null,
  };

  const res = await fetch('/api/journal/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (res.ok) {
    document.getElementById('log-details').value = '';
    document.getElementById('log-feedback').style.display = 'block';
    setTimeout(() => document.getElementById('log-feedback').style.display = 'none', 3000);
    // Reload journal
    allJournal = await fetch('/api/journal/?limit=100').then(r => r.json());
    renderJournal();
  }
});

// ── Init ───────────────────────────────────────────────────
setDefaultDate();
loadAll();