/* ========================
   PLANS.JS — Star API
   ======================== */

document.addEventListener('DOMContentLoaded', async () => {

  const token = localStorage.getItem('star_token');
  if (!token) { window.location.href = '/login.html'; return; }

  const sideNav = document.getElementById('sideNav');
  const collapseBtn = document.getElementById('collapseBtn');
  const menuToggle = document.getElementById('menuToggle');

  if (collapseBtn) collapseBtn.addEventListener('click', () => sideNav.classList.toggle('collapsed'));
  if (menuToggle) menuToggle.addEventListener('click', () => sideNav.classList.toggle('open'));
  document.addEventListener('click', e => {
    if (sideNav && !sideNav.contains(e.target) && menuToggle && !menuToggle.contains(e.target)) {
      sideNav.classList.remove('open');
    }
  });

  try {
    const r = await fetch('/auth/profile', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const d = await r.json();
    if (!d.status) { window.location.href = '/login.html'; return; }

    const user = d.user;

    // Sidebar
    document.getElementById('sideAvatar').textContent = user.username[0].toUpperCase();
    document.getElementById('sideUsername').textContent = user.username;
    document.getElementById('sidePlan').textContent = '⚡ ' + user.plan;
    if (user.avatar) {
      document.getElementById('sideAvatar').innerHTML = `<img src="${user.avatar}" alt="Avatar"/>`;
    }

    // Resaltar plan actual
    const planName = user.plan.toLowerCase();
    document.getElementById('currentPlanName').textContent = user.plan;
    const planCard = document.getElementById(`plan-${planName}`);
    if (planCard) {
      planCard.classList.add('is-current');
      const btn = planCard.querySelector('.plan-btn');
      if (btn) btn.textContent = '✓ Plan actual';
    }

  } catch(e) {}

  setTimeout(() => {
    const ls = document.getElementById('loadingScreen');
    if (ls) ls.classList.add('hidden');
  }, 800);

});

function toggleFaq(el) {
  el.classList.toggle('open');
}

function doLogout() {
  localStorage.removeItem('star_token');
  localStorage.removeItem('star_user');
  window.location.href = '/login.html';
}