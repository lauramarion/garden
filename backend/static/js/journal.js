let allEntries = [];
let allPlants  = [];
let allZones   = [];

const TYPE_ACCENT = {
  action:      'var(--aqua)',
  observation: 'var(--bg-lav-dk)',
  purchase:    'var(--yellow)',
  decision:    'var(--pink)',
  event:       'var(--green)',
};

function seasonLabel(dateStr) {
  const d = new Date(dateStr);
  const m = d.getMonth();
  const y = d.getFullYear();
  if (m <= 1 || m === 11) return `Winter ${m === 11 ? y : y}`;
  if (m <= 4) return `Spring ${y}`;
  if (m <= 7) return `Summer ${y}`;
  return `Autumn ${y}`;
}

function entryCard(e) {
  const plant = allPlants.find(p => p.id === e.plant_id);
  const zone  = allZones.find(z => z.id === e.zone_id);
  const tag   = plant ? plant.code : zone ? zone.label : '';
  const d     = new Date(e.entry_date);
  const dateStr = d.toLocaleDateString('fr-BE', { day: 'numeric', month: 'short', year: 'numeric' });
  const accent = TYPE_ACCENT[e.entry_type] || 'var(--border)';
  return `
    <div class="journal-card" style="border-left-color:${accent}">
      <div class="journal-card-meta">
        <span class="journal-card-date">${dateStr}</span>
        <span class="journal-card-type">${e.entry_type}</span>
        ${tag ? `<span class="task-tag">${tag}</span>` : ''}
      </div>
      <div class="journal-card-details">${e.details}</div>
      ${e.result ? `<div class="journal-card-result">${e.result}</div>` : ''}
    </div>`;
}

function render() {
  const filterPlant = document.getElementById('filter-plant').value;
  const filterType  = document.getElementById('filter-type').value;

  let entries = allEntries;
  if (filterPlant) entries = entries.filter(e => String(e.plant_id) === filterPlant);
  if (filterType)  entries = entries.filter(e => e.entry_type === filterType);

  const feed = document.getElementById('journal-feed');
  if (!entries.length) {
    feed.innerHTML = '<div class="empty-state">No entries found.</div>';
    return;
  }

  // Group by season
  const groups = new Map();
  entries.forEach(e => {
    const key = seasonLabel(e.entry_date);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(e);
  });

  feed.innerHTML = [...groups.entries()].map(([season, items]) => `
    <div class="journal-season">
      <div class="journal-season-label">${season}</div>
      ${items.map(entryCard).join('')}
    </div>`
  ).join('');
}

function populateSelects() {
  const ps = document.getElementById('entry-plant');
  const zs = document.getElementById('entry-zone');
  const fp = document.getElementById('filter-plant');
  allPlants.forEach(p => {
    [ps, fp].forEach(sel => {
      const o = document.createElement('option');
      o.value = p.id; o.textContent = `${p.code} — ${p.common_name}`;
      sel.appendChild(o);
    });
  });
  allZones.forEach(z => {
    const o = document.createElement('option');
    o.value = z.id; o.textContent = z.label;
    zs.appendChild(o);
  });
}

document.getElementById('entry-date').value = new Date().toISOString().split('T')[0];

document.getElementById('add-entry-toggle').addEventListener('click', () => {
  const f = document.getElementById('add-entry-form');
  f.style.display = f.style.display === 'none' ? 'block' : 'none';
});

document.getElementById('entry-cancel').addEventListener('click', () => {
  document.getElementById('add-entry-form').style.display = 'none';
});

document.getElementById('entry-submit').addEventListener('click', async () => {
  const details = document.getElementById('entry-details').value.trim();
  if (!details) return;
  const payload = {
    entry_date: document.getElementById('entry-date').value,
    entry_type: document.getElementById('entry-type').value,
    details,
    plant_id: document.getElementById('entry-plant').value || null,
    zone_id:  document.getElementById('entry-zone').value  || null,
  };
  const res = await fetch('/api/journal/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (res.ok) {
    const e = await res.json();
    allEntries.unshift(e);
    document.getElementById('entry-details').value = '';
    document.getElementById('add-entry-form').style.display = 'none';
    render();
  }
});

document.getElementById('filter-plant').addEventListener('change', render);
document.getElementById('filter-type').addEventListener('change', render);

async function init() {
  [allEntries, allPlants, allZones] = await Promise.all([
    fetch('/api/journal/?limit=500').then(r => r.json()),
    fetch('/api/plants/').then(r => r.json()),
    fetch('/api/zones/').then(r => r.json()),
  ]);
  populateSelects();
  render();
}

init();
