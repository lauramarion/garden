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
      ${!done ? `
        <div class="task-row-actions">
          <button class="btn-dismiss" data-id="${t.id}">Dismiss</button>
          <button class="btn btn-done" data-id="${t.id}">Done</button>
        </div>` : ''}
    </div>`;
}

function render() {
  const pending = allTasks.filter(t => t.status !== 'done' && t.status !== 'dismissed');
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
    btn.addEventListener('click', () => showDoneModal(+btn.dataset.id));
  });
  document.querySelectorAll('.btn-dismiss').forEach(btn => {
    btn.addEventListener('click', () => dismissTask(+btn.dataset.id));
  });
}

async function dismissTask(id) {
  await fetch(`/api/tasks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'dismissed' }),
  });
  const t = allTasks.find(t => t.id === id);
  if (t) t.status = 'dismissed';
  render();
}

// ── Done modal ──────────────────────────────────────────────
let activeDoneTaskId = null;

function showDoneModal(id) {
  activeDoneTaskId = id;
  const t = allTasks.find(t => t.id === id);
  document.getElementById('done-task-name').textContent = t ? t.title : '';
  document.getElementById('done-choice').style.display = 'block';
  document.getElementById('done-monitor-form').style.display = 'none';
  document.getElementById('done-modal-footer').style.display = 'none';
  document.getElementById('done-modal').style.display = 'flex';
}

document.getElementById('done-modal-close').addEventListener('click', () => {
  document.getElementById('done-modal').style.display = 'none';
});
document.getElementById('done-modal').addEventListener('click', e => {
  if (e.target === e.currentTarget)
    document.getElementById('done-modal').style.display = 'none';
});

document.getElementById('done-complete').addEventListener('click', async () => {
  if (activeDoneTaskId === null) return;
  await fetch(`/api/tasks/${activeDoneTaskId}/complete`, { method: 'PATCH' });
  const t = allTasks.find(t => t.id === activeDoneTaskId);
  if (t) { t.status = 'done'; t.completed_at = new Date().toISOString(); }
  document.getElementById('done-modal').style.display = 'none';
  render();
});

document.getElementById('done-monitor').addEventListener('click', () => {
  const week = new Date(); week.setDate(week.getDate() + 7);
  document.getElementById('monitor-date').value = week.toISOString().split('T')[0];
  document.getElementById('done-choice').style.display = 'none';
  document.getElementById('done-monitor-form').style.display = 'block';
  document.getElementById('done-modal-footer').style.display = 'flex';
});

document.getElementById('monitor-back').addEventListener('click', () => {
  document.getElementById('done-choice').style.display = 'block';
  document.getElementById('done-monitor-form').style.display = 'none';
  document.getElementById('done-modal-footer').style.display = 'none';
});

document.getElementById('monitor-save').addEventListener('click', async () => {
  if (activeDoneTaskId === null) return;
  const original = allTasks.find(t => t.id === activeDoneTaskId);
  const note    = document.getElementById('monitor-note').value.trim();
  const obsDate = document.getElementById('monitor-date').value || null;

  const res = await fetch('/api/tasks/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title:       original ? original.title : 'Follow-up',
      description: note || null,
      due_date:    obsDate,
      priority:    'soon',
      plant_id:    original ? original.plant_id : null,
      zone_id:     original ? original.zone_id  : null,
      status:      'pending',
      source:      'manual',
    }),
  });
  if (res.ok) allTasks.unshift(await res.json());

  await fetch(`/api/tasks/${activeDoneTaskId}/complete`, { method: 'PATCH' });
  if (original) { original.status = 'done'; original.completed_at = new Date().toISOString(); }

  document.getElementById('monitor-note').value = '';
  document.getElementById('done-modal').style.display = 'none';
  render();
});

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
