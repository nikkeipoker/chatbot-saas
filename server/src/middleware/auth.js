const jwt = require('jsonwebtoken');
const db = require('../db');

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token requerido' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await db('users').where('id', decoded.userId).first();
    if (!user) return res.status(401).json({ error: 'Usuario no encontrado' });

    const tenant = await db('tenants').where('id', user.tenant_id).first();
    if (!tenant) return res.status(401).json({ error: 'Cuenta no encontrada' });

    // Check subscription
    if (tenant.subscription_status === 'trial' && new Date(tenant.trial_ends_at) < new Date()) {
      return res.status(403).json({ error: 'Tu periodo de prueba ha expirado' });
    }
    if (tenant.subscription_status === 'suspended') {
      return res.status(403).json({ error: 'Cuenta suspendida' });
    }

    req.user = user;
    req.tenant = tenant;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido' });
    }
    return res.status(500).json({ error: 'Error de autenticación' });
  }
}

function generateToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

module.exports = { authenticate, generateToken };
