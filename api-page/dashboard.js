/* ========================
   DASHBOARD.JS — Star API
   Para index.html
   ======================== */

document.addEventListener('DOMContentLoaded', async () => {

  // Verificar sesión
  const token = localStorage.getItem('star_token');
  if (!token) {
    window.location.href = '/login.html';
    return;
  }

  // Sidebar collapse
  const sideNav = document.getElementById('sideNav');
  const collapseBtn = document.getElementById('collapseBtn');
  const menuToggle = document.getElementById('menuToggle');

  if (collapseBtn) {
    collapseBtn.addEventListener('click', () => sideNav.classList.toggle('collapsed'));
  }
  if (menuToggle) {
    menuToggle.addEventListener('click', () => sideNav.classList.toggle('open'));
  }
  document.addEventListener('click', e => {
    if (sideNav && !sideNav.contains(e.target) && menuToggle && !menuToggle.contains(e.target)) {
      sideNav.classList.remove('open');
    }
  });

  // Bell
  const bellBtn = document.getElementById('bellBtn');
  if (bellBtn) bellBtn.addEventListener('click', () => showToast('No hay notificaciones nuevas.', 'info'));

  // Cargar perfil
  try {
    const r = await fetch('/auth/profile', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const d = await r.json();

    if (!d.status) {
      localStorage.removeItem('star_token');
      localStorage.removeItem('star_user');
      window.location.href = '/login.html';
      return;
    }

    const user = d.user;
    const limits = d.limits;

    // Guardar usuario actualizado
    localStorage.setItem('star_user', JSON.stringify(user));

    // Sidebar
    const firstLetter = user.username[0].toUpperCase();
    document.getElementById('sideAvatar').textContent = firstLetter;
    document.getElementById('sideUsername').textContent = user.username;
    document.getElementById('sidePlan').textContent = '⚡ ' + user.plan;

    // Welcome card
    document.getElementById('welcomeAvatar').textContent = firstLetter;
    document.getElementById('welcomeMsg').textContent = `¡Hola, ${user.username}! 👋`;
    document.getElementById('welcomeEmail').textContent = user.email;
    document.getElementById('welcomePlan').textContent = '✨ ' + user.plan;

    // Si tiene foto de perfil
    if (user.avatar) {
      const avatarEls = document.querySelectorAll('#sideAvatar, #welcomeAvatar');
      avatarEls.forEach(el => {
        el.innerHTML = `<img src="${user.avatar}" alt="Avatar"/>`;
      });
    }

    // Stats
    document.getElementById('statToday').textContent = limits.requestsToday;
    document.getElementById('statLimit').textContent = limits.dailyLimit;
    document.getElementById('statRemaining').textContent = limits.remaining;
    document.getElementById('statPlan').textContent = user.plan;

    // Barra de uso
    const pct = limits.dailyLimit === 'Ilimitado' ? 0 :
      Math.min(100, (limits.requestsToday / parseInt(limits.dailyLimit)) * 100);
    document.getElementById('usageBar').style.width = pct + '%';
    document.getElementById('usageText').textContent = `${limits.requestsToday} / ${limits.dailyLimit}`;

    // Color de la barra según uso
    const bar = document.getElementById('usageBar');
    if (pct >= 90) bar.style.background = 'linear-gradient(90deg, #ff4444, #ff6b6b)';
    else if (pct >= 70) bar.style.background = 'linear-gradient(90deg, var(--g), #ffaa00)';

  } catch(e) {
    showToast('Error al cargar el perfil', 'error');
  }

  // Ocultar loading
  setTimeout(() => {
    const ls = document.getElementById('loadingScreen');
    if (ls) ls.classList.add('hidden');
  }, 800);

});

function doLogout() {
  localStorage.removeItem('star_token');
  localStorage.removeItem('star_user');
  window.location.href = '/login.html';
}

function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  const body = toast.querySelector('.toast-body');
  const icon = toast.querySelector('.toast-icon');
  if (body) body.textContent = message;
  const colors = { success: 'var(--ok)', error: 'var(--err)', info: 'var(--c)' };
  const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle' };
  if (icon) {
    icon.className = `toast-icon fas ${icons[type] || icons.info} me-2`;
    icon.style.color = colors[type] || colors.info;
  }
  const t = bootstrap.Toast.getInstance(toast) || new bootstrap.Toast(toast);
  t.show();
}