let allTasks = [];
let allPlants = [];
let allZones = [];

const today = new Date();
today.setHours(0, 0, 0, 0);
const weekEnd = new Date(today);
weekEnd.setDate(weekEnd.getDate() + 7);

function taskDate(t) {
  return t.due_date ? new Date(t.due_date) : null;
}

function bucket(t) {
  const d = taskDate(t);
  if (!d) return 'upcoming';
  if (d < today) return 'overdue';
  if (d <= weekEnd) return 'week';
  return 'upcoming';
}

function plantLabel(t) {
  const p = allPlants.find(p => p.id === t.plant_id);
  const z = allZones.find(z => z.id === t.zone_id);
  if (p) return `<span class="task-tag">${p.code}</span>`;
  if (z) return `<span class="task-tag">${z.label}</span>`;
  return '';
}

function taskRow(t) {
  const d = taskDate(t);
  const dateStr = d ? d.toLocaleDateString('fr-BE', { day: 'numeric', month: 'short' }) : '';
  const done = t.status === 'done';
  return `
    <div class="task-row${done ? ' task-done' : ''}" data-id="${t.id}">
      <div class="task-row-main">
        <span class="task-title">${t.title}</span>
        ${plantLabel(t)}
        ${t.priority ? `<span class="task-priority task-priority-${t.priority}">${t.priority}</span>` : ''}
        ${dateStr ? `<span class="task-due">${dateStr}</span>` : ''}
      </div>
      ${!done ? `<button class="btn btn-done" data-id="${t.id}">Done</button>` : ''}
    </div>`;
}

function render() {
  const pending = allTasks.filter(t => t.status !== 'done');
  const done    = allTasks.filter(t => t.status === 'done');

  const overdue  = pending.filter(t => bucket(t) === 'overdue');
  const week     = pending.filter(t => bucket(t) === 'week');
  const upcoming = pending.filter(t => bucket(t) === 'upcoming');

  const show = (id, items, listId) => {
    document.getElementById(id).style.display = items.length ? 'block' : 'none';
    document.getElementById(listId).innerHTML = items.map(taskRow).join('');
  };

  show('tasks-overdue',  overdue,  'list-overdue');
  show('tasks-week',     week,     'list-week');
  show('tasks-upcoming', upcoming, 'list-upcoming');

  document.getElementById('tasks-empty').style.display = pending.length ? 'none' : 'block';

  const archive = document.getElementById('tasks-archive');
  archive.style.display = done.length ? 'block' : 'none';
  document.getElementById('list-done').innerHTML = done.map(taskRow).join('');

  document.querySelectorAll('.btn-done').forEach(btn => {
    btn.addEventListener('click', () => markDone(+btn.dataset.id));
  });
}

async function markDone(id) {
  await fetch(`/api/tasks/${id}/complete`, { method: 'PATCH' });
  const t = allTasks.find(t => t.id === id);
  if (t) { t.status = 'done'; t.completed_at = new Date().toISOString(); }
  render();
}

function populateSelects() {
  const ps = document.getElementById('task-plant');
  const zs = document.getElementById('task-zone');
  allPlants.forEach(p => {
    const o = document.createElement('option');
    o.value = p.id; o.textContent = `${p.code} — ${p.common_name}`;
    ps.appendChild(o);
  });
  allZones.forEach(z => {
    const o = document.createElement('option');
    o.value = z.id; o.textContent = z.label;
    zs.appendChild(o);
  });
}

document.getElementById('add-task-toggle').addEventListener('click', () => {
  const form = document.getElementById('add-task-form');
  form.style.display = form.style.display === 'none' ? 'block' : 'none';
});

document.getElementById('task-cancel').addEventListener('click', () => {
  document.getElementById('add-task-form').style.display = 'none';
});

document.getElementById('task-submit').addEventListener('click', async () => {
  const title = document.getElementById('task-title').value.trim();
  if (!title) return;
  const payload = {
    title,
    due_date:  document.getElementById('task-due').value || null,
    priority:  document.getElementById('task-priority').value,
    plant_id:  document.getElementById('task-plant').value || null,
    zone_id:   document.getElementById('task-zone').value  || null,
    status:    'pending',
    source:    'manual',
  };
  const res = await fetch('/api/tasks/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (res.ok) {
    const t = await res.json();
    allTasks.unshift(t);
    render();
    document.getElementById('task-title').value = '';
    document.getElementById('task-due').value = '';
    document.getElementById('add-task-form').style.display = 'none';
  }
});

async function init() {
  [allTasks, allPlants, allZones] = await Promise.all([
    fetch('/api/tasks/').then(r => r.json()),
    fetch('/api/plants/').then(r => r.json()),
    fetch('/api/zones/').then(r => r.json()),
  ]);
  populateSelects();
  render();
}

init();
