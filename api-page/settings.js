/* ========================
   SETTINGS.JS — Star API
   ======================== */

let currentUser = null;
let newAvatarBase64 = null;

document.addEventListener('DOMContentLoaded', async () => {

  const token = localStorage.getItem('star_token');
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

  // Detectar dispositivo
  const ua = navigator.userAgent;
  let device = 'Escritorio';
  if (/android/i.test(ua)) device = 'Android';
  else if (/iphone|ipad/i.test(ua)) device = 'iPhone/iPad';
  else if (/windows/i.test(ua)) device = 'Windows';
  else if (/mac/i.test(ua)) device = 'Mac';
  document.getElementById('sessionDevice').textContent = `${device} — Este dispositivo`;

  // Cargar perfil
  try {
    const r = await fetch('/auth/profile', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const d = await r.json();
    if (!d.status) { window.location.href = '/login.html'; return; }

    currentUser = d.user;

    // Sidebar
    document.getElementById('sideAvatar').textContent = currentUser.username[0].toUpperCase();
    document.getElementById('sideUsername').textContent = currentUser.username;
    document.getElementById('sidePlan').textContent = '⚡ ' + currentUser.plan;

    // Rellenar campos
    document.getElementById('newUsername').value = currentUser.username;
    document.getElementById('newEmail').value = currentUser.email;
    document.getElementById('newEmail').disabled = true;

    // Avatar
    if (currentUser.avatar) {
      document.getElementById('avatarPreview').innerHTML = `<img src="${currentUser.avatar}" alt="Avatar"/>`;
      document.getElementById('sideAvatar').innerHTML = `<img src="${currentUser.avatar}" alt="Avatar"/>`;
    } else {
      document.getElementById('avatarPreview').textContent = currentUser.username[0].toUpperCase();
    }

  } catch(e) {
    showToast('Error al cargar ajustes', 'error');
  }

  setTimeout(() => {
    const ls = document.getElementById('loadingScreen');
    if (ls) ls.classList.add('hidden');
  }, 800);
});

// Preview avatar antes de subir
function previewAvatar(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) {
    showAlert('avatarAlert', 'La imagen no puede superar 2MB', 'error');
    return;
  }
  const reader = new FileReader();
  reader.onload = e => {
    newAvatarBase64 = e.target.result;
    document.getElementById('avatarPreview').innerHTML = `<img src="${newAvatarBase64}" alt="Avatar"/>`;
  };
  reader.readAsDataURL(file);
}

function removeAvatar() {
  newAvatarBase64 = 'remove';
  document.getElementById('avatarPreview').textContent = currentUser?.username[0].toUpperCase() || 'R';
}

async function saveAvatar() {
  if (!newAvatarBase64) { showAlert('avatarAlert', 'Selecciona una imagen primero', 'error'); return; }
  const token = localStorage.getItem('star_token');
  try {
    const r = await fetch('/auth/update', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ avatar: newAvatarBase64 === 'remove' ? '' : newAvatarBase64 })
    });
    const d = await r.json();
    if (!d.status) { showAlert('avatarAlert', d.error, 'error'); return; }
    showAlert('avatarAlert', 'Foto actualizada correctamente', 'success');
    newAvatarBase64 = null;
  } catch(e) {
    showAlert('avatarAlert', 'Error al guardar la foto', 'error');
  }
}

async function saveInfo() {
  const username = document.getElementById('newUsername').value.trim();
  if (!username) { showAlert('infoAlert', 'El nombre no puede estar vacío', 'error'); return; }
  const token = localStorage.getItem('star_token');
  try {
    const r = await fetch('/auth/update', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ username })
    });
    const d = await r.json();
    if (!d.status) { showAlert('infoAlert', d.error, 'error'); return; }
    showAlert('infoAlert', 'Información actualizada correctamente', 'success');
    document.getElementById('sideUsername').textContent = username;
    document.getElementById('sideAvatar').textContent = username[0].toUpperCase();
  } catch(e) {
    showAlert('infoAlert', 'Error al guardar los cambios', 'error');
  }
}

async function changePassword() {
  const current = document.getElementById('currentPass').value;
  const newP = document.getElementById('newPass').value;
  const confirm = document.getElementById('confirmPass').value;

  if (!current || !newP || !confirm) { showAlert('passAlert', 'Completa todos los campos', 'error'); return; }
  if (newP.length < 6) { showAlert('passAlert', 'La contraseña debe tener al menos 6 caracteres', 'error'); return; }
  if (newP !== confirm) { showAlert('passAlert', 'Las contraseñas no coinciden', 'error'); return; }

  const token = localStorage.getItem('star_token');
  try {
    const r = await fetch('/auth/change-password', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ currentPassword: current, newPassword: newP })
    });
    const d = await r.json();
    if (!d.status) { showAlert('passAlert', d.error, 'error'); return; }
    showAlert('passAlert', 'Contraseña actualizada correctamente', 'success');
    document.getElementById('currentPass').value = '';
    document.getElementById('newPass').value = '';
    document.getElementById('confirmPass').value = '';
  } catch(e) {
    showAlert('passAlert', 'Error al cambiar la contraseña', 'error');
  }
}

function confirmDelete() {
  if (confirm('¿Estás seguro de que quieres eliminar tu cuenta? Esta acción es irreversible.')) {
    deleteAccount();
  }
}

async function deleteAccount() {
  const token = localStorage.getItem('star_token');
  try {
    const r = await fetch('/auth/delete', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    const d = await r.json();
    if (!d.status) { showToast(d.error, 'error'); return; }
    localStorage.removeItem('star_token');
    localStorage.removeItem('star_user');
    window.location.href = '/register.html';
  } catch(e) {
    showToast('Error al eliminar la cuenta', 'error');
  }
}

function togglePass(id, btn) {
  const input = document.getElementById(id);
  const isPass = input.type === 'password';
  input.type = isPass ? 'text' : 'password';
  btn.innerHTML = isPass ? '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>';
}

function showAlert(id, msg, type) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.className = `settings-alert ${type}`;
  setTimeout(() => { el.className = 'settings-alert hidden'; }, 4000);
}

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