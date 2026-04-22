function hpColor(hp) {
  return hp > 60 ? 'var(--green)' : hp > 30 ? 'var(--yellow)' : 'var(--pink)';
}

async function loadDashboard() {
  const [summary, plants, profile, journal] = await Promise.all([
    fetch('/api/dashboard/summary').then(r => r.json()),
    fetch('/api/dashboard/plants').then(r => r.json()),
    fetch('/api/gardener/profile').then(r => r.json()),
    fetch('/api/journal/?limit=5').then(r => r.json()),
  ]);

  // Vitality summary
  document.getElementById('vitality-score').textContent =
    summary.vitality_score != null ? summary.vitality_score : '—';
  document.getElementById('vitality-score').style.color =
    summary.vitality_score != null ? hpColor(summary.vitality_score) : '';
  document.getElementById('stat-total').textContent   = summary.plant_count   ?? '—';
  document.getElementById('stat-ok').textContent      = summary.plants_ok     ?? '—';
  document.getElementById('stat-warning').textContent = summary.plants_warning ?? '—';
  document.getElementById('stat-lost').textContent    = summary.plants_lost    ?? '—';

  // XP bar
  if (profile && profile.xp_total > 0) {
    document.getElementById('dash-xp-bar').style.display = 'block';
    document.getElementById('xp-title').textContent = `Lv.${profile.level} ${profile.title}`;
    document.getElementById('xp-val').textContent   = `${profile.xp_total} XP`;
    document.getElementById('xp-fill').style.width  = `${profile.xp_progress}%`;
  }

  // Disturbances — plants with Struggling or Lost status, worst first
  const struggling = plants.filter(p => p.status === 'Struggling' || p.status === 'Lost');
  if (struggling.length) {
    document.getElementById('disturbances-title').style.display = 'block';
    document.getElementById('disturbances-list').innerHTML = struggling.map(p => `
      <div class="plant-row">
        <div class="plant-row-left">
          <span class="plant-row-code">${p.code}</span>
          <span class="plant-row-name">${p.common_name}</span>
          <span class="status-badge status-${p.status}">${p.status}</span>
        </div>
        <div class="plant-row-right">
          <a href="/plants/${p.id}" class="btn-back">View →</a>
        </div>
      </div>`).join('');
  }

  // Plant HP list
  const list = document.getElementById('plant-list');
  if (!plants.length) {
    list.innerHTML = '<div class="empty-state">No plants found.</div>';
  } else {
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
      </div>`).join('');
  }

  // Recent journal
  const djEl = document.getElementById('dash-journal');
  if (!journal.length) {
    djEl.innerHTML = '<div class="empty-state">No entries yet.</div>';
  } else {
    djEl.innerHTML = journal.map(e => `
      <div class="dash-journal-row">
        <span class="journal-card-date">${e.entry_date}</span>
        <span class="journal-card-type">${e.entry_type}</span>
        <span class="dash-journal-details">${e.details}</span>
      </div>`).join('');
  }
}

loadDashboard();
