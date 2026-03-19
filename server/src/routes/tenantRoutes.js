const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/tenant — Get tenant info + bot config
router.get('/', async (req, res) => {
  try {
    const tenant = await db('tenants').where('id', req.tenant.id).first();
    const botConfig = await db('bot_config').where('tenant_id', req.tenant.id).first();

    // Mask OpenAI key for security (show only last 4 chars)
    if (botConfig && botConfig.openai_api_key) {
      botConfig.openai_api_key_masked = '••••' + botConfig.openai_api_key.slice(-4);
      botConfig.has_openai_key = true;
      delete botConfig.openai_api_key;
    } else if (botConfig) {
      botConfig.has_openai_key = false;
    }

    res.json({
      tenant: {
        id: tenant.id,
        name: tenant.name,
        phone_number: tenant.phone_number,
        meta_phone_number_id: tenant.meta_phone_number_id,
        meta_waba_id: tenant.meta_waba_id,
        subscription_status: tenant.subscription_status,
        trial_ends_at: tenant.trial_ends_at
      },
      botConfig: botConfig || null
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener datos' });
  }
});

// PUT /api/tenant — Update tenant profile
router.put('/', async (req, res) => {
  try {
    const { name, phone_number } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (phone_number) updates.phone_number = phone_number;

    const [tenant] = await db('tenants')
      .where('id', req.tenant.id)
      .update(updates)
      .returning('*');

    res.json({ tenant });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar perfil' });
  }
});

// PUT /api/tenant/bot-config — Update bot configuration (both modes)
router.put('/bot-config', async (req, res) => {
  try {
    const {
      bot_mode, bot_active, openai_api_key, business_emoji,
      // AI fields
      system_prompt, ai_model, max_tokens, temperature,
      // Static fields
      static_options, default_response,
      booking_url
    } = req.body;

    const updates = {};
    if (bot_mode !== undefined) updates.bot_mode = bot_mode;
    if (bot_active !== undefined) updates.bot_active = bot_active;
    if (openai_api_key !== undefined) updates.openai_api_key = openai_api_key;
    if (business_emoji !== undefined) updates.business_emoji = business_emoji;
    if (system_prompt !== undefined) updates.system_prompt = system_prompt;
    if (ai_model !== undefined) updates.ai_model = ai_model;
    if (max_tokens !== undefined) updates.max_tokens = max_tokens;
    if (temperature !== undefined) updates.temperature = temperature;
    if (static_options !== undefined) updates.static_options = JSON.stringify(static_options);
    if (default_response !== undefined) updates.default_response = default_response;
    if (booking_url !== undefined) updates.booking_url = booking_url;

    const [config] = await db('bot_config')
      .where('tenant_id', req.tenant.id)
      .update(updates)
      .returning('*');

    // Mask key in response
    if (config.openai_api_key) {
      config.openai_api_key_masked = '••••' + config.openai_api_key.slice(-4);
      config.has_openai_key = true;
      delete config.openai_api_key;
    } else {
      config.has_openai_key = false;
    }

    // Parse static_options for response
    if (typeof config.static_options === 'string') {
      config.static_options = JSON.parse(config.static_options);
    }

    res.json({ botConfig: config });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar configuración' });
  }
});

// PUT /api/tenant/meta — Save Meta WhatsApp credentials
router.put('/meta', async (req, res) => {
  try {
    const { meta_phone_number_id, meta_access_token, meta_waba_id } = req.body;

    if (!meta_phone_number_id || !meta_access_token) {
      return res.status(400).json({ error: 'Phone Number ID y Access Token son requeridos' });
    }

    await db('tenants')
      .where('id', req.tenant.id)
      .update({ meta_phone_number_id, meta_access_token, meta_waba_id: meta_waba_id || null });

    res.json({ message: 'Credenciales de Meta guardadas' });
  } catch (error) {
    res.status(500).json({ error: 'Error al guardar credenciales' });
  }
});

// GET /api/tenant/conversations — Get all conversations
router.get('/conversations', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const conversations = await db('conversations')
      .where('tenant_id', req.tenant.id)
      .orderBy('last_message_at', 'desc')
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db('conversations')
      .where('tenant_id', req.tenant.id)
      .count('* as count');

    res.json({
      conversations: conversations.map(c => ({
        ...c,
        messages: typeof c.messages === 'string' ? JSON.parse(c.messages) : c.messages
      })),
      pagination: {
        page,
        totalPages: Math.ceil(parseInt(count) / limit),
        total: parseInt(count)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener conversaciones' });
  }
});

// GET /api/tenant/stats — Dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const tenantId = req.tenant.id;
    const today = new Date().toISOString().split('T')[0];

    const [{ count: totalConversations }] = await db('conversations')
      .where('tenant_id', tenantId)
      .count('* as count');

    const [{ count: todayActive }] = await db('conversations')
      .where('tenant_id', tenantId)
      .where('last_message_at', '>=', today)
      .count('* as count');

    const [{ sum: totalMessages }] = await db('conversations')
      .where('tenant_id', tenantId)
      .sum('message_count as sum');

    res.json({
      totalConversations: parseInt(totalConversations),
      todayActive: parseInt(todayActive),
      totalMessages: parseInt(totalMessages) || 0
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

module.exports = router;
