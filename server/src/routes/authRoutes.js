const express = require('express');
const bcrypt = require('bcrypt');
const validator = require('validator');
const db = require('../db');
const { generateToken } = require('../middleware/auth');
const { authLimiter } = require('../middleware/security');

const router = express.Router();
router.use(authLimiter);

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, restaurantName } = req.body;

    if (!email || !password || !name || !restaurantName) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }
    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
    }

    // Check existing
    const existing = await db('users').where('email', email.toLowerCase()).first();
    if (existing) {
      return res.status(409).json({ error: 'Ya existe una cuenta con este email' });
    }

    // Create atomically: tenant → user → bot_config
    const result = await db.transaction(async (trx) => {
      const [tenant] = await trx('tenants').insert({
        name: restaurantName
      }).returning('*');

      const passwordHash = await bcrypt.hash(password, 12);

      const [user] = await trx('users').insert({
        tenant_id: tenant.id,
        name: name,
        email: email.toLowerCase(),
        password_hash: passwordHash,
        role: 'owner'
      }).returning('*');

      await trx('bot_config').insert({ tenant_id: tenant.id });

      return { tenant, user };
    });

    const token = generateToken(result.user.id);

    res.status(201).json({
      token,
      user: { id: result.user.id, name: result.user.name, email: result.user.email, role: result.user.role, is_super_admin: result.user.is_super_admin },
      tenant: { id: result.tenant.id, name: result.tenant.name, subscription_status: result.tenant.subscription_status }
    });
  } catch (error) {
    console.error('[Auth] Register error:', error.message);
    res.status(500).json({ error: 'Error al crear la cuenta' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }

    const user = await db('users').where('email', email.toLowerCase()).first();
    if (!user) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const tenant = await db('tenants').where('id', user.tenant_id).first();
    const token = generateToken(user.id);

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, is_super_admin: user.is_super_admin },
      tenant: { id: tenant.id, name: tenant.name, subscription_status: tenant.subscription_status }
    });
  } catch (error) {
    console.error('[Auth] Login error:', error.message);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

module.exports = router;
