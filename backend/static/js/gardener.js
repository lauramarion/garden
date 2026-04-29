// ── Gardener extensions ────────────────────────────────────
const _baseLoad = loadAll;
loadAll = async function() {
  await _baseLoad();
  allJournal = await fetch('/api/journal/?limit=100').then(r => r.json());
  populateLogSelects();
  renderSidePlantList();
  renderZonesList();
  initPlantSearch();
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
function renderSidePlantList(filtered = allPlants) {
  const list = document.getElementById('side-plant-list');
  if (!filtered.length) {
    list.innerHTML = '<div class="empty-state">No plants found.</div>';
    return;
  }
  list.innerHTML = filtered.map(p => {
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
        hoveredPlant = plant;
        render(plant);
      }
    });
  });
}

function initPlantSearch() {
  const input = document.getElementById('plant-search');
  if (!input) return;
  input.addEventListener('input', e => {
    const q = e.target.value.trim().toLowerCase();
    if (!q) { renderSidePlantList(); return; }
    const filtered = allPlants.filter(p =>
      p.code.toLowerCase().includes(q) ||
      p.common_name.toLowerCase().includes(q) ||
      (p.latin_name && p.latin_name.toLowerCase().includes(q))
    );
    renderSidePlantList(filtered);
  });
}

async function showPlantDetail(plant) {
  document.getElementById('side-search').style.display = 'none';
  document.getElementById('side-plant-list').style.display = 'none';
  document.getElementById('side-plant-detail').style.display = 'block';

  const [hp, zone, allTasks] = [
    plantHP(plant),
    allZones.find(z => z.id === plant.zone_id),
    await fetch(`/api/tasks/?plant_id=${plant.id}`).then(r => r.json()),
  ];
  const pendingTasks = allTasks.filter(t => t.status !== 'done');

  const spriteSrc = plant.sprite_path || `/static/sprites/${plant.code}.svg`;
  const spriteHtml = `<img src="${spriteSrc}" width="64" height="64" class="plant-sprite-img"
    onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
    <div class="plant-sprite-placeholder" style="display:none">no sprite</div>`;

  const tasksHtml = pendingTasks.length
    ? pendingTasks.map(t => `
        <div class="plant-task-row" data-task-id="${t.id}">
          <span class="plant-task-title">${t.title}</span>
          ${t.due_date ? `<span class="task-due">${t.due_date}</span>` : ''}
          <button class="btn-done plant-task-done" data-task-id="${t.id}">Done</button>
        </div>`).join('')
    : '';

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
      ${tasksHtml ? `<div class="plant-card-tasks">${tasksHtml}</div>` : ''}
      <div class="plant-card-actions">
        <button class="btn-action" id="btn-sprite">${plant.sprite_path ? 'Update sprite' : 'Add sprite'}</button>
        <button class="btn-action" id="btn-log-action">Log action</button>
        <button class="btn-action" id="btn-log-obs">Log obs</button>
        <button class="btn-action" id="btn-location">Location</button>
      </div>
      <div class="location-form" id="location-form" style="display:none">
        <input type="number" class="form-control loc-input" id="loc-col" placeholder="Col" value="${plant.grid_col ?? ''}">
        <input type="number" class="form-control loc-input" id="loc-row" placeholder="Row" value="${plant.grid_row ?? ''}">
        <input type="number" class="form-control loc-input" id="loc-slot" placeholder="Slot" value="${plant.grid_slot ?? ''}">
        <button class="btn-ghost" id="btn-save-location">Save</button>
      </div>
      <input type="file" id="sprite-input" accept=".svg" style="display:none">
      <a href="/plants/${plant.id}" class="btn-back side-detail-link">Full detail →</a>
    </div>
  `;

  // Sprite upload
  const spriteInput = document.getElementById('sprite-input');
  document.getElementById('btn-sprite').addEventListener('click', () => spriteInput.click());
  spriteInput.addEventListener('change', async () => {
    const file = spriteInput.files[0];
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`/api/plants/${plant.id}/sprite`, { method: 'POST', body: form });
    if (res.ok) {
      const newSrc = `/static/sprites/${plant.code}.svg?t=${Date.now()}`;
      const imgEl = document.querySelector('#plant-detail .plant-sprite-img');
      if (imgEl) { imgEl.style.display = ''; imgEl.src = newSrc; }
      plant.sprite_path = `/static/sprites/${plant.code}.svg`;
      document.getElementById('btn-sprite').textContent = 'Update sprite';
      const newImg = new Image();
      newImg.onload = () => { plant.sprite_img = newImg; render(hoveredPlant); };
      newImg.src = newSrc;
    }
  });

  // Log shortcuts — pre-fill Log tab and switch to it
  document.getElementById('btn-log-action').addEventListener('click', () => {
    document.getElementById('log-plant').value = plant.id;
    document.getElementById('log-type').value = 'action';
    activateTab('log');
  });
  document.getElementById('btn-log-obs').addEventListener('click', () => {
    document.getElementById('log-plant').value = plant.id;
    document.getElementById('log-type').value = 'observation';
    activateTab('log');
  });

  // Update location — toggle inline form
  document.getElementById('btn-location').addEventListener('click', () => {
    const form = document.getElementById('location-form');
    form.style.display = form.style.display === 'none' ? 'flex' : 'none';
  });
  document.getElementById('btn-save-location').addEventListener('click', async () => {
    const col  = document.getElementById('loc-col').value;
    const row  = document.getElementById('loc-row').value;
    const slot = document.getElementById('loc-slot').value;
    await fetch(`/api/plants/${plant.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grid_col:  col  !== '' ? +col  : null,
        grid_row:  row  !== '' ? +row  : null,
        grid_slot: slot !== '' ? +slot : null,
      }),
    });
    plant.grid_col  = col  !== '' ? +col  : null;
    plant.grid_row  = row  !== '' ? +row  : null;
    plant.grid_slot = slot !== '' ? +slot : null;
    document.getElementById('location-form').style.display = 'none';
    render(hoveredPlant);
  });

  // Pending task Done buttons
  document.querySelectorAll('.plant-task-done').forEach(btn => {
    btn.addEventListener('click', async () => {
      const taskId = +btn.dataset.taskId;
      const res = await fetch(`/api/tasks/${taskId}/complete`, { method: 'PATCH' });
      if (res.ok) {
        const row = btn.closest('.plant-task-row');
        row.remove();
      }
    });
  });
}

document.getElementById('side-back').addEventListener('click', () => {
  document.getElementById('side-search').style.display = 'block';
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
