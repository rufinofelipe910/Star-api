const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const PLAN_LIMITS = {
  basico: 100,
  standard: 500,
  premium: 2000,
  pro: 10000,
  admin: -1
};

// ========================
// HELPERS
// ========================

function verifyToken(req) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return null;
  try { return jwt.verify(token, JWT_SECRET); }
  catch(e) { return null; }
}

function safeUser(user) {
  const { password, ...rest } = user;
  return rest;
}

function resetIfNewDay(user) {
  const today = new Date().toISOString().split('T')[0];
  if (user.lastreset !== today) {
    user.requeststoday = 0;
    user.lastreset = today;
  }
  return user;
}

// ========================
// REGISTRO
// ========================
router.post('/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password)
      return res.status(400).json({ status: false, error: 'Faltan campos requeridos' });

    if (password.length < 6)
      return res.status(400).json({ status: false, error: 'La contraseña debe tener al menos 6 caracteres' });

    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .or(`email.eq.${email},username.eq.${username}`)
      .limit(1);

    if (existing && existing.length > 0)
      return res.status(400).json({ status: false, error: 'El correo o nombre de usuario ya está en uso' });

    const newUser = {
      id: crypto.randomBytes(8).toString('hex'),
      username,
      email,
      password: bcrypt.hashSync(password, 12),
      apikey: 'star-' + crypto.randomBytes(16).toString('hex'),
      plan: 'basico',
      role: 'user',
      avatar: '',
      requeststoday: 0,
      lastreset: new Date().toISOString().split('T')[0],
      createdat: new Date().toISOString().split('T')[0]
    };

    const { error } = await supabase.from('users').insert(newUser);
    if (error) return res.status(500).json({ status: false, error: error.message });

    res.status(201).json({ status: true, message: 'Cuenta creada correctamente', user: safeUser(newUser) });
  } catch(err) {
    res.status(500).json({ status: false, error: err.message });
  }
});

// ========================
// LOGIN
// ========================
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ status: false, error: 'Faltan campos requeridos' });

    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .limit(1);

    if (error || !users || users.length === 0)
      return res.status(401).json({ status: false, error: 'Credenciales incorrectas' });

    const user = users[0];

    // Soporte texto plano (primera vez) y hash bcrypt
    let valid = false;
    if (user.password.startsWith('$2')) {
      valid = bcrypt.compareSync(password, user.password);
    } else {
      valid = password === user.password;
      if (valid) {
        const hashed = bcrypt.hashSync(password, 12);
        await supabase.from('users').update({ password: hashed }).eq('id', user.id);
        user.password = hashed;
      }
    }

    if (!valid)
      return res.status(401).json({ status: false, error: 'Credenciales incorrectas' });

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ status: true, token, user: safeUser(user) });
  } catch(err) {
    res.status(500).json({ status: false, error: err.message });
  }
});

// ========================
// PERFIL
// ========================
router.get('/auth/profile', async (req, res) => {
  try {
    const decoded = verifyToken(req);
    if (!decoded) return res.status(401).json({ status: false, error: 'Token inválido o expirado' });

    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.id)
      .limit(1);

    if (error || !users || users.length === 0)
      return res.status(404).json({ status: false, error: 'Usuario no encontrado' });

    let user = users[0];
    user = resetIfNewDay(user);

    await supabase.from('users').update({
      requeststoday: user.requeststoday,
      lastreset: user.lastreset
    }).eq('id', user.id);

    const limit = PLAN_LIMITS[user.plan] ?? 100;

    res.json({
      status: true,
      user: safeUser(user),
      limits: {
        plan: user.plan,
        requestsToday: user.requeststoday,
        dailyLimit: limit === -1 ? 'Ilimitado' : limit,
        remaining: limit === -1 ? 'Ilimitado' : Math.max(0, limit - user.requeststoday)
      }
    });
  } catch(err) {
    res.status(500).json({ status: false, error: err.message });
  }
});

// ========================
// ACTUALIZAR PERFIL
// ========================
router.patch('/auth/update', async (req, res) => {
  try {
    const decoded = verifyToken(req);
    if (!decoded) return res.status(401).json({ status: false, error: 'Token inválido o expirado' });

    const { username, avatar } = req.body;
    const updates = {};

    if (username) {
      if (username.length < 3)
        return res.status(400).json({ status: false, error: 'El nombre debe tener al menos 3 caracteres' });

      const { data: taken } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .neq('id', decoded.id)
        .limit(1);

      if (taken && taken.length > 0)
        return res.status(400).json({ status: false, error: 'El nombre de usuario ya está en uso' });

      updates.username = username;
    }

    if (avatar !== undefined) {
      if (avatar.length > 3 * 1024 * 1024)
        return res.status(400).json({ status: false, error: 'La imagen es demasiado grande (máx 2MB)' });
      updates.avatar = avatar;
    }

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', decoded.id)
      .select()
      .single();

    if (error) return res.status(500).json({ status: false, error: error.message });

    res.json({ status: true, message: 'Perfil actualizado', user: safeUser(data) });
  } catch(err) {
    res.status(500).json({ status: false, error: err.message });
  }
});

// ========================
// CAMBIAR CONTRASEÑA
// ========================
router.patch('/auth/change-password', async (req, res) => {
  try {
    const decoded = verifyToken(req);
    if (!decoded) return res.status(401).json({ status: false, error: 'Token inválido o expirado' });

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword)
      return res.status(400).json({ status: false, error: 'Faltan campos requeridos' });

    if (newPassword.length < 6)
      return res.status(400).json({ status: false, error: 'La nueva contraseña debe tener al menos 6 caracteres' });

    const { data: users } = await supabase
      .from('users').select('*').eq('id', decoded.id).limit(1);

    if (!users || users.length === 0)
      return res.status(404).json({ status: false, error: 'Usuario no encontrado' });

    const user = users[0];
    const valid = bcrypt.compareSync(currentPassword, user.password);
    if (!valid)
      return res.status(401).json({ status: false, error: 'La contraseña actual es incorrecta' });

    await supabase.from('users')
      .update({ password: bcrypt.hashSync(newPassword, 12) })
      .eq('id', decoded.id);

    res.json({ status: true, message: 'Contraseña actualizada correctamente' });
  } catch(err) {
    res.status(500).json({ status: false, error: err.message });
  }
});

// ========================
// ELIMINAR CUENTA
// ========================
router.delete('/auth/delete', async (req, res) => {
  try {
    const decoded = verifyToken(req);
    if (!decoded) return res.status(401).json({ status: false, error: 'Token inválido o expirado' });

    const { data: users } = await supabase
      .from('users').select('role').eq('id', decoded.id).limit(1);

    if (!users || users.length === 0)
      return res.status(404).json({ status: false, error: 'Usuario no encontrado' });

    if (users[0].role === 'admin')
      return res.status(403).json({ status: false, error: 'No puedes eliminar la cuenta de administrador' });

    await supabase.from('users').delete().eq('id', decoded.id);
    res.json({ status: true, message: 'Cuenta eliminada correctamente' });
  } catch(err) {
    res.status(500).json({ status: false, error: err.message });
  }
});

// ========================
// ADMIN - VER USUARIOS
// ========================
router.get('/admin/users', async (req, res) => {
  try {
    const decoded = verifyToken(req);
    if (!decoded) return res.status(401).json({ status: false, error: 'Token inválido' });

    const { data: admin } = await supabase
      .from('users').select('role').eq('id', decoded.id).single();

    if (!admin || admin.role !== 'admin')
      return res.status(403).json({ status: false, error: 'Acceso denegado' });

    const { data: users, error } = await supabase
      .from('users')
      .select('id, username, email, plan, role, createdat, requeststoday')
      .order('createdat', { ascending: false });

    if (error) return res.status(500).json({ status: false, error: error.message });

    res.json({ status: true, users });
  } catch(err) {
    res.status(500).json({ status: false, error: err.message });
  }
});

// ========================
// ADMIN - CAMBIAR PLAN
// ========================
router.patch('/admin/users/:id/plan', async (req, res) => {
  try {
    const decoded = verifyToken(req);
    if (!decoded) return res.status(401).json({ status: false, error: 'Token inválido' });

    const { data: admin } = await supabase
      .from('users').select('role').eq('id', decoded.id).single();

    if (!admin || admin.role !== 'admin')
      return res.status(403).json({ status: false, error: 'Acceso denegado' });

    const { plan } = req.body;
    const planes = ['basico', 'standard', 'premium', 'pro', 'admin'];

    if (!planes.includes(plan))
      return res.status(400).json({ status: false, error: 'Plan inválido' });

    const { data, error } = await supabase
      .from('users')
      .update({ plan })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) return res.status(500).json({ status: false, error: error.message });

    res.json({ status: true, message: `Plan actualizado a ${plan}`, user: safeUser(data) });
  } catch(err) {
    res.status(500).json({ status: false, error: err.message });
  }
});

module.exports = router;