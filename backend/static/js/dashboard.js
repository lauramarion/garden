function hpColor(hp) {
  return hp > 60 ? 'var(--green)' : hp > 30 ? 'var(--yellow)' : 'var(--pink)';
}

async function loadDashboard() {
  const [summary, plants] = await Promise.all([
    fetch('/api/dashboard/summary').then(r => r.json()),
    fetch('/api/dashboard/plants').then(r => r.json()),
  ]);

  // Summary
  document.getElementById('vitality-score').textContent =
    summary.vitality_score != null ? summary.vitality_score : '—';
  document.getElementById('vitality-score').style.color =
    summary.vitality_score != null ? hpColor(summary.vitality_score) : '';
  document.getElementById('stat-total').textContent   = summary.plant_count   ?? '—';
  document.getElementById('stat-ok').textContent      = summary.plants_ok     ?? '—';
  document.getElementById('stat-warning').textContent = summary.plants_warning ?? '—';
  document.getElementById('stat-lost').textContent    = summary.plants_lost    ?? '—';

  // Plant list
  const list = document.getElementById('plant-list');
  if (!plants.length) {
    list.innerHTML = '<div class="empty-state">No plants found.</div>';
    return;
  }

  list.innerHTML = plants.map(p => `
    <div class="plant-row">
      <div class="plant-row-left">
        <span class="plant-row-code">${p.code}</span>
        <span class="plant-row-name">${p.common_name}</span>
        <span class="plant-row-zone">${p.zone_label ?? ''}</span>
      </div>
      <div class="plant-row-right">
        <div class="plant-row-hp-wrap">
          <div class="hp-bar-track plant-row-hp-track">
            <div class="hp-bar-fill" style="width:${p.hp}%;background:${hpColor(p.hp)}"></div>
          </div>
          <span class="plant-row-hp-val" style="color:${hpColor(p.hp)}">${p.hp}</span>
        </div>
        <span class="status-badge status-${p.status}">${p.status}</span>
      </div>
    </div>
  `).join('');
}

loadDashboard();
