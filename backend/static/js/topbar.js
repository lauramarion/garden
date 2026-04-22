(function () {
  const path = window.location.pathname;

  const nav = [
    { href: '/gardener',  label: 'Map',       icon: 'map' },
    { href: '/plants',    label: 'Plants',    icon: 'plant' },
    { href: '/journal',   label: 'Journal',   icon: 'calendar' },
    { href: '/tasks',     label: 'Tasks',     icon: 'task' },
    { href: '/dashboard', label: 'Dashboard', icon: 'sun' },
  ];

  const month = new Date().getMonth();
  const season =
    month <= 1 || month === 11 ? { label: 'Winter', cls: 'season-winter' } :
    month <= 4                 ? { label: 'Spring', cls: 'season-spring' } :
    month <= 7                 ? { label: 'Summer', cls: 'season-summer' } :
                                 { label: 'Autumn', cls: 'season-autumn' };

  const navLinks = nav.map(({ href, label }) =>
    `<a href="${href}" class="topbar-nav-link${path === href ? ' active' : ''}">${label}</a>`
  ).join('');

  const mobileTabBar = nav.map(({ href, label, icon }) =>
    `<a href="${href}" class="mobile-tab${path === href ? ' active' : ''}">
      <img src="/static/icons/${icon}.svg" width="20" height="20" alt="">
      <span>${label}</span>
    </a>`
  ).join('');

  document.getElementById('topbar').outerHTML = `
    <header class="topbar">
      <div class="topbar-title">garden_project</div>
      <nav class="topbar-nav">${navLinks}</nav>
      <div class="topbar-right">
        <span class="season-badge ${season.cls}">${season.label}</span>
        <div class="hud">
          <div class="hud-stat">
            <div class="label">Vitality</div>
            <div class="hud-bar-track">
              <div class="hud-bar-fill" id="hud-vitality-bar" style="width:0%"></div>
            </div>
            <div class="value" id="hud-vitality-val">—</div>
          </div>
          <div class="hud-stat">
            <div class="label">Gardener</div>
            <div class="value" id="hud-level">Lv.1 Seedling</div>
          </div>
          <div class="hud-stat">
            <div class="label">XP</div>
            <div class="value" id="hud-xp">0</div>
          </div>
        </div>
      </div>
    </header>
    <nav class="mobile-tabbar">${mobileTabBar}</nav>`;
}());
