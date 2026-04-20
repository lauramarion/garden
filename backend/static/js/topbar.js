(function () {
  const path = window.location.pathname;

  const nav = [
    { href: '/gardener',  label: 'Map' },
    { href: '/dashboard', label: 'Dashboard' },
  ];

  const navLinks = nav.map(({ href, label }) =>
    `<a href="${href}" class="topbar-nav-link${path === href ? ' active' : ''}">${label}</a>`
  ).join('');

  document.getElementById('topbar').outerHTML = `
    <header class="topbar">
      <div class="topbar-title">garden_project</div>
      <nav class="topbar-nav">${navLinks}</nav>
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
    </header>`;
}());
