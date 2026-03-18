const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Middleware: only super admins
function requireSuperAdmin(req, res, next) {
  if (!req.user.is_super_admin) {
    return res.status(403).json({ error: 'Acceso restringido a administradores' });
  }
  next();
}

router.use(authenticate);
router.use(requireSuperAdmin);

// GET /api/admin/tenants — List all clients
router.get('/tenants', async (req, res) => {
  try {
    const tenants = await db('tenants')
      .select('tenants.*')
      .leftJoin('bot_config', 'tenants.id', 'bot_config.tenant_id')
      .select(
        'bot_config.bot_mode',
        'bot_config.bot_active'
      )
      .orderBy('tenants.created_at', 'desc');

    // Get conversation counts per tenant
    const counts = await db('conversations')
      .select('tenant_id')
      .count('* as conversation_count')
      .sum('message_count as total_messages')
      .groupBy('tenant_id');

    const countsMap = {};
    counts.forEach(c => {
      countsMap[c.tenant_id] = {
        conversations: parseInt(c.conversation_count),
        messages: parseInt(c.total_messages) || 0
      };
    });

    const tenantsWithStats = tenants.map(t => ({
      ...t,
      conversation_count: countsMap[t.id]?.conversations || 0,
      total_messages: countsMap[t.id]?.messages || 0,
      // Hide sensitive data
      meta_access_token: t.meta_access_token ? '••••connected' : null
    }));

    res.json({ tenants: tenantsWithStats });
  } catch (error) {
    console.error('[Admin]', error.message);
    res.status(500).json({ error: 'Error al obtener clientes' });
  }
});

// PUT /api/admin/tenants/:id/status — Enable/disable a client
router.put('/tenants/:id/status', async (req, res) => {
  try {
    const { subscription_status } = req.body;
    const validStatuses = ['trial', 'active', 'suspended', 'cancelled'];

    if (!validStatuses.includes(subscription_status)) {
      return res.status(400).json({ error: 'Estado invalido' });
    }

    const [tenant] = await db('tenants')
      .where('id', req.params.id)
      .update({ subscription_status })
      .returning('*');

    if (!tenant) return res.status(404).json({ error: 'Cliente no encontrado' });

    res.json({ tenant });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
});

// DELETE /api/admin/tenants/:id — Delete a client (careful!)
router.delete('/tenants/:id', async (req, res) => {
  try {
    await db('tenants').where('id', req.params.id).del();
    res.json({ message: 'Cliente eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar cliente' });
  }
});

// GET /api/admin/stats — Platform-wide stats
router.get('/stats', async (req, res) => {
  try {
    const [{ count: totalTenants }] = await db('tenants').count('* as count');
    const [{ count: activeTenants }] = await db('tenants').where('subscription_status', 'active').orWhere('subscription_status', 'trial').count('* as count');
    const [{ count: totalConversations }] = await db('conversations').count('* as count');
    const [{ sum: totalMessages }] = await db('conversations').sum('message_count as sum');

    res.json({
      totalTenants: parseInt(totalTenants),
      activeTenants: parseInt(activeTenants),
      totalConversations: parseInt(totalConversations),
      totalMessages: parseInt(totalMessages) || 0
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener estadisticas' });
  }
});

module.exports = router;
