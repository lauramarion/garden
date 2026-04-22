const plantId = +window.location.pathname.split('/').pop();

const HP_BY_STATUS = { Thriving: 80, Stable: 65, New: 60, Dormant: 50, Struggling: 35 };
function hpFor(p)    { return HP_BY_STATUS[p.status] ?? 5; }
function hpColor(hp) { return hp > 60 ? 'var(--green)' : hp > 30 ? 'var(--yellow)' : 'var(--pink)'; }
function tileCoord(c, r) {
  if (c == null || r == null) return null;
  return String.fromCharCode(65 + r) + (18 - c);
}

function entryRow(e, plants, zones) {
  const plant = plants.find(p => p.id === e.plant_id);
  const zone  = zones.find(z => z.id === e.zone_id);
  const tag   = plant ? plant.code : zone ? zone.label : '';
  return `
    <div class="journal-card">
      <div class="journal-card-meta">
        <span class="journal-card-date">${e.entry_date}</span>
        <span class="journal-card-type">${e.entry_type}</span>
        ${tag ? `<span class="task-tag">${tag}</span>` : ''}
      </div>
      <div class="journal-card-details">${e.details}</div>
    </div>`;
}

function taskRow(t) {
  return `
    <div class="task-row">
      <div class="task-row-main">
        <span class="task-title">${t.title}</span>
        ${t.priority ? `<span class="task-priority task-priority-${t.priority}">${t.priority}</span>` : ''}
        ${t.due_date ? `<span class="task-due">${t.due_date}</span>` : ''}
      </div>
    </div>`;
}

async function markLost(id) {
  if (!confirm('Mark this plant as Lost?')) return;
  await fetch(`/api/plants/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'Lost' }),
  });
  window.location.reload();
}

async function init() {
  const [plant, allPlants, allZones, journal, tasks] = await Promise.all([
    fetch(`/api/plants/${plantId}`).then(r => r.ok ? r.json() : null),
    fetch('/api/plants/').then(r => r.json()),
    fetch('/api/zones/').then(r => r.json()),
    fetch(`/api/journal/?plant_id=${plantId}&limit=10`).then(r => r.json()),
    fetch(`/api/tasks/?plant_id=${plantId}`).then(r => r.json()),
  ]);

  if (!plant) {
    document.getElementById('detail-root').innerHTML =
      '<div class="empty-state">Plant not found. <a href="/plants">Back to plants</a></div>';
    return;
  }

  document.title = `garden_project — ${plant.common_name}`;

  const zone   = allZones.find(z => z.id === plant.zone_id);
  const hp     = hpFor(plant);
  const coord  = tileCoord(plant.grid_col, plant.grid_row);
  const sprite = plant.sprite_path
    ? `<img src="/static/${plant.sprite_path}" width="64" height="64" class="plant-sprite-img">`
    : `<div class="plant-sprite-placeholder detail-sprite-placeholder">no sprite</div>`;

  const pendingTasks = tasks.filter(t => t.status !== 'done');
  const journalHtml  = journal.length
    ? journal.map(e => entryRow(e, allPlants, allZones)).join('')
    : '<div class="empty-state">No entries yet.</div>';
  const tasksHtml    = pendingTasks.length
    ? pendingTasks.map(taskRow).join('')
    : '<div class="empty-state">No pending tasks.</div>';

  document.getElementById('detail-root').innerHTML = `
    <div class="detail-back">
      <a href="/plants" class="btn-back">← Plants</a>
    </div>

    <div class="detail-hero">
      <div class="detail-sprite">${sprite}</div>
      <div class="detail-hero-info">
        <div class="detail-hero-top">
          <span class="plant-code">${plant.code}</span>
          <span class="status-badge status-${plant.status}">${plant.status}</span>
        </div>
        <div class="detail-common-name">${plant.common_name}</div>
        ${plant.latin_name ? `<div class="detail-latin-name">${plant.latin_name}</div>` : ''}
        <div class="hp-bar-track detail-hp-bar">
          <div class="hp-bar-fill" style="width:${hp}%;background:${hpColor(hp)}"></div>
        </div>
        <div class="detail-hp-label" style="color:${hpColor(hp)}">HP ${hp}/100</div>
      </div>
      <div class="detail-actions">
        <button class="btn-danger-outline" id="btn-mark-lost">Mark as lost</button>
      </div>
    </div>

    <div class="detail-grid">
      <div class="detail-meta-item"><span class="detail-meta-label">Zone</span><span>${zone ? zone.label : '—'}</span></div>
      <div class="detail-meta-item"><span class="detail-meta-label">Container</span><span>${plant.container || '—'}</span></div>
      <div class="detail-meta-item"><span class="detail-meta-label">Acquired</span><span>${plant.acquired_date || '—'}</span></div>
      <div class="detail-meta-item"><span class="detail-meta-label">From</span><span>${plant.acquired_from || '—'}</span></div>
      <div class="detail-meta-item"><span class="detail-meta-label">Location</span><span>${coord || '—'}</span></div>
      <div class="detail-meta-item"><span class="detail-meta-label">Slot</span><span>${plant.grid_slot ?? '—'}</span></div>
    </div>

    ${plant.status_notes ? `<div class="detail-notes">${plant.status_notes}</div>` : ''}

    <div class="detail-section-title">Journal (last 10)</div>
    <div class="detail-journal">${journalHtml}</div>

    <div class="detail-section-title">Pending tasks</div>
    <div class="detail-tasks">${tasksHtml}</div>
  `;

  document.getElementById('btn-mark-lost').addEventListener('click', () => markLost(plantId));
}

init();
