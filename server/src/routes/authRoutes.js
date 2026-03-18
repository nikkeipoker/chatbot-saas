const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const validator = require('validator');
const db = require('../db');
const { generateToken } = require('../middleware/auth');
const { authLimiter } = require('../middleware/security');
const { sendPasswordResetEmail } = require('../services/emailService');

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

    const existing = await db('users').where('email', email.toLowerCase()).first();
    if (existing) {
      return res.status(409).json({ error: 'Ya existe una cuenta con este email' });
    }

    const result = await db.transaction(async (trx) => {
      const [tenant] = await trx('tenants').insert({ name: restaurantName }).returning('*');
      const passwordHash = await bcrypt.hash(password, 12);
      const [user] = await trx('users').insert({
        tenant_id: tenant.id, name, email: email.toLowerCase(),
        password_hash: passwordHash, role: 'owner'
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
    if (!email || !password) return res.status(400).json({ error: 'Email y contraseña requeridos' });

    const user = await db('users').where('email', email.toLowerCase()).first();
    if (!user) return res.status(401).json({ error: 'Credenciales incorrectas' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Credenciales incorrectas' });

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

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email requerido' });

    const user = await db('users').where('email', email.toLowerCase()).first();

    // Always return success (don't leak if email exists)
    if (!user) return res.json({ message: 'Si el email existe, recibirás un link' });

    // Generate reset token (expires in 1 hour)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    await db('users').where('id', user.id).update({
      password_reset_token: resetToken,
      password_reset_expires: resetExpires
    });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    // Send real email via Resend
    await sendPasswordResetEmail(user.email, resetUrl);
    console.log(`[Auth] Password reset email sent to ${email}`);

    res.json({
      message: 'Si el email existe, recibirás un link',
      // Only in development mode - remove for production
      ...(process.env.NODE_ENV !== 'production' && { debug_url: resetUrl })
    });
  } catch (error) {
    console.error('[Auth] Forgot password error:', error.message);
    res.status(500).json({ error: 'Error al procesar la solicitud' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'Token y contraseña requeridos' });
    if (password.length < 8) return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });

    const user = await db('users')
      .where('password_reset_token', token)
      .where('password_reset_expires', '>', new Date())
      .first();

    if (!user) return res.status(400).json({ error: 'El link expiró o es inválido. Solicitá uno nuevo.' });

    const passwordHash = await bcrypt.hash(password, 12);

    await db('users').where('id', user.id).update({
      password_hash: passwordHash,
      password_reset_token: null,
      password_reset_expires: null
    });

    res.json({ message: 'Contraseña actualizada con éxito' });
  } catch (error) {
    console.error('[Auth] Reset password error:', error.message);
    res.status(500).json({ error: 'Error al cambiar la contraseña' });
  }
});

module.exports = router;
