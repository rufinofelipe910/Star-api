const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://tzrhivqnbnazyjogzryv.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_X6yxNfMLUUFxhTuXHuroIw_oC76EOFY';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const PLAN_LIMITS = {
  basico: 100,
  standard: 500,
  premium: 2000,
  pro: 10000,
  admin: -1
};

module.exports = async function apiKeyMiddleware(req, res, next) {
  try {
    const apiKey = req.query.apikey || req.headers['x-api-key'];

    if (!apiKey) {
      return res.status(401).json({
        status: false,
        error: 'API key requerida. Regístrate en starapi-rosy.vercel.app para obtener una.'
      });
    }

    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('apikey', apiKey)
      .limit(1);

    if (error || !users || users.length === 0) {
      return res.status(401).json({
        status: false,
        error: 'API key inválida.'
      });
    }

    let user = users[0];

    // Resetear contador si es un nuevo día
    const today = new Date().toISOString().split('T')[0];
    if (user.lastreset !== today) {
      user.requeststoday = 0;
      user.lastreset = today;
    }

    const limit = PLAN_LIMITS[user.plan] ?? 100;

    if (limit !== -1 && user.requeststoday >= limit) {
      return res.status(429).json({
        status: false,
        error: `Límite diario alcanzado. Tu plan ${user.plan} permite ${limit} peticiones/día. Mejora tu plan para continuar.`
      });
    }

    // Contar petición y guardar en Supabase
    await supabase
      .from('users')
      .update({
        requeststoday: user.requeststoday + 1,
        lastreset: today
      })
      .eq('id', user.id);

    req.user = user;
    next();

  } catch(err) {
    res.status(500).json({ status: false, error: err.message });
  }
};