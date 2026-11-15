/* ========================
   ADMIN.JS — Star API
   ======================== */

const token = localStorage.getItem('star_token');
let allUsers = [];
let selectedUserId = null;

const PLAN_CONFIG = {
  basico:   { icon: '🌱', color: 'var(--t2)' },
  standard: { icon: '⚡', color: 'var(--c)' },
  premium:  { icon: '⭐', color: 'var(--g)' },
  pro:      { icon: '🚀', color: '#a78bfa' },
  admin:    { icon: '👑', color: 'var(--err)' }
};

document.addEventListener('DOMContentLoaded', async () => {
  if (!token) { window.location.href = '/login.html'; return; }

  // Sidebar
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

  // Verificar que sea admin
  try {
    const r = await fetch('/auth/profile', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const d = await r.json();
    if (!d.status || d.user.role !== 'admin') {
      window.location.href = '/index.html';
      return;
    }
    document.getElementById('sideAvatar').textContent = d.user.username[0].toUpperCase();
    document.getElementById('sideUsername').textContent = d.user.username;
    if (d.user.avatar) {
      document.getElementById('sideAvatar').innerHTML = `<img src="${d.user.avatar}" alt="Avatar"/>`;
    }
  } catch(e) {
    window.location.href = '/login.html';
    return;
  }

  await loadUsers();

  setTimeout(() => {
    const ls = document.getElementById('loadingScreen');
    if (ls) ls.classList.add('hidden');
  }, 800);
});

async function loadUsers() {
  try {
    const r = await fetch('/admin/users', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const d = await r.json();
    if (!d.status) { showToast(d.error, 'error'); return; }

    allUsers = d.users;
    renderStats();
    renderSections();
  } catch(e) {
    showToast('Error al cargar usuarios', 'error');
  }
}

function renderStats() {
  const counts = { basico: 0, standard: 0, premium: 0, pro: 0, admin: 0 };
  allUsers.forEach(u => {
    if (counts[u.plan] !== undefined) counts[u.plan]++;
  });

  document.getElementById('countBasico').textContent = counts.basico;
  document.getElementById('countStandard').textContent = counts.standard;
  document.getElementById('countPremium').textContent = counts.premium;
  document.getElementById('countPro').textContent = counts.pro;
  document.getElementById('countAdmin').textContent = counts.admin;
  document.getElementById('countTotal').textContent = allUsers.length;
}

function renderSections() {
  const container = document.getElementById('planSections');
  container.innerHTML = '';

  const planes = ['admin', 'pro', 'premium', 'standard', 'basico'];

  planes.forEach(plan => {
    const users = allUsers.filter(u => u.plan === plan);
    const cfg = PLAN_CONFIG[plan];

    const section = document.createElement('div');
    section.className = 'plan-section';
    section.id = `section-${plan}`;

    section.innerHTML = `
      <div class="plan-section-head">
        <span class="plan-section-icon">${cfg.icon}</span>
        <span class="plan-section-name" style="color:${cfg.color}">${plan}</span>
        <span class="plan-section-count">${users.length} usuario${users.length !== 1 ? 's' : ''}</span>
      </div>
      <div class="users-grid" id="grid-${plan}">
        ${users.length === 0
          ? '<div class="empty-section">Sin usuarios en este plan</div>'
          : users.map(u => renderUserCard(u)).join('')
        }
      </div>
    `;

    container.appendChild(section);
  });
}

function renderUserCard(user) {
  const initial = user.username[0].toUpperCase();
  const avatar = user.avatar
    ? `<img src="${user.avatar}" alt="Avatar"/>`
    : initial;

  return `
    <div class="user-card" id="card-${user.id}">
      <div class="user-card-avatar">${avatar}</div>
      <div class="user-card-info">
        <div class="user-card-name">${user.username}</div>
        <div class="user-card-email">${user.email}</div>
        <div class="user-card-meta">
          <span class="user-plan-badge badge-${user.plan}">${PLAN_CONFIG[user.plan]?.icon} ${user.plan}</span>
          <span class="user-requests"><i class="fas fa-paper-plane"></i> ${user.requeststoday || 0} hoy</span>
        </div>
      </div>
      <button class="user-card-btn" onclick="openPlanModal('${user.id}', '${user.username}', '${user.plan}')" title="Cambiar plan">
        <i class="fas fa-crown"></i>
      </button>
    </div>
  `;
}

// ========================
// MODAL
// ========================
function openPlanModal(userId, username, currentPlan) {
  selectedUserId = userId;
  document.getElementById('modalUsername').textContent = username + ' — ' + currentPlan;

  // Marcar plan actual
  document.querySelectorAll('.plan-opt').forEach(btn => {
    btn.classList.remove('selected');
  });

  document.getElementById('planModal').classList.add('open');
}

function closePlanModal() {
  document.getElementById('planModal').classList.remove('open');
  selectedUserId = null;
}

document.getElementById('planModal').addEventListener('click', function(e) {
  if (e.target === this) closePlanModal();
});

async function setPlan(newPlan) {
  if (!selectedUserId) return;

  try {
    const r = await fetch(`/admin/users/${selectedUserId}/plan`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ plan: newPlan })
    });
    const d = await r.json();

    if (!d.status) { showToast(d.error, 'error'); return; }

    // Actualizar en memoria
    const idx = allUsers.findIndex(u => u.id === selectedUserId);
    if (idx !== -1) allUsers[idx].plan = newPlan;

    closePlanModal();
    renderStats();
    renderSections();
    showToast(`Plan actualizado a ${newPlan}`, 'success');

  } catch(e) {
    showToast('Error al cambiar el plan', 'error');
  }
}

// ========================
// UTILS
// ========================
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
  if (icon) { icon.className = `toast-icon fas ${icons[type]} me-2`; icon.style.color = colors[type]; }
  const t = bootstrap.Toast.getInstance(toast) || new bootstrap.Toast(toast);
  t.show();
}