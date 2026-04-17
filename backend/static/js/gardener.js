// ── Gardener extensions ────────────────────────────────────
// Override loadAll to also fetch journal and populate side panel
const _baseLoad = loadAll;
loadAll = async function() {
  await _baseLoad();
  allJournal = await fetch('/api/journal/?limit=100').then(r => r.json());
  populateLogSelects();
  renderJournal();
};

// Override click handler
onPlantClick = selectPlant;

// ── State ──────────────────────────────────────────────────
let allJournal = [];

// ── Side panel ─────────────────────────────────────────────
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

function selectPlant(plant) {
  document.querySelectorAll('.side-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.side-content').forEach(c => c.style.display = 'none');
  document.querySelector('[data-tab="plant"]').classList.add('active');
  document.getElementById('tab-plant').style.display = 'block';
  document.getElementById('plant-empty').style.display = 'none';
  document.getElementById('plant-detail').style.display = 'block';

  const hp = plantHP(plant);
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
    </div>
  `;
}

function renderJournal() {
  const feed = document.getElementById('journal-feed');
  if (!allJournal.length) {
    feed.innerHTML = '<div class="empty-state">No journal entries yet.</div>';
    return;
  }
  feed.innerHTML = allJournal.map(e => {
    const plant = allPlants.find(p => p.id === e.plant_id);
    const zone  = allZones.find(z => z.id === e.zone_id);
    const target = plant ? plant.code : zone ? zone.label : '';
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

// ── Tabs ───────────────────────────────────────────────────
document.querySelectorAll('.side-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.side-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.side-content').forEach(c => c.style.display = 'none');
    tab.classList.add('active');
    document.getElementById(`tab-${tab.dataset.tab}`).style.display = 'block';
  });
});

// ── Log form ───────────────────────────────────────────────
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
    renderJournal();
  }
});

// Kick off the extended load
loadAll();