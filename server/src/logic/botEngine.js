const db = require('../db');
const metaService = require('../services/metaService');
const openaiService = require('../services/openaiService');

/**
 * Multi-tenant bot engine — TWO MODES:
 *
 * STATIC: Personalized welcome (name + emoji) + up to 5 custom options
 * AI: Tenant's own OpenAI key for intelligent responses
 */
async function handleMessage(tenantId, customerPhone, messageText, messageId) {
  try {
    const tenant = await db('tenants').where('id', tenantId).first();
    if (!tenant || !tenant.meta_phone_number_id || !tenant.meta_access_token) return;

    // Check subscription
    if (tenant.subscription_status === 'suspended') return;
    if (tenant.subscription_status === 'trial' && new Date(tenant.trial_ends_at) < new Date()) return;

    const config = await db('bot_config').where('tenant_id', tenantId).first();
    if (!config) {
      console.warn(`[Bot] [${tenant.name}] No config found for tenant ${tenantId}`);
      return;
    }
    
    if (!config.bot_active) {
      console.log(`[Bot] [${tenant.name}] Bot is inactive`);
      return;
    }

    // Diagnostic logging
    console.log(`[Bot] [${tenant.name}] Processing message from ${customerPhone}. Mode: ${config.bot_mode}`);

    // Mark as read
    await metaService.markAsRead(tenant.meta_phone_number_id, tenant.meta_access_token, messageId);

    let conversation = await getOrCreateConversation(tenantId, customerPhone);
    const history = typeof conversation.messages === 'string' ? JSON.parse(conversation.messages) : (conversation.messages || []);

    let responseText;

    if (config.bot_mode === 'ai' && config.openai_api_key) {
      responseText = await handleAIMode(tenantId, customerPhone, messageText, config, history);
    } else {
      responseText = await handleStaticMode(messageText, config, tenant.name, tenantId, customerPhone, history);
    }

    if (responseText) {
      await metaService.sendMessage(tenant.meta_phone_number_id, tenant.meta_access_token, customerPhone, responseText);
    }

    await updateConversation(tenantId, customerPhone, messageText, responseText);
    console.log(`[Bot] [${tenant.name}] Response sent to ${customerPhone}`);

  } catch (error) {
    console.error(`[Bot] CRITICAL Error tenant ${tenantId}:`, error.message);
  }
}

// ========== STATIC MODE ==========
async function handleStaticMode(messageText, config, tenantName, tenantId, customerPhone, history) {
  const text = messageText.trim();
  const emoji = config.business_emoji || '🏪';

  // Parse static_options
  const options = typeof config.static_options === 'string'
    ? JSON.parse(config.static_options)
    : (config.static_options || []);

  // Check if user sent a number matching an option
  const num = parseInt(text);
  if (!isNaN(num) && num >= 1 && num <= options.length) {
    const selectedResponse = options[num - 1].response;
    
    if (selectedResponse === '__FLOW_BOOKING__') {
      if (config.booking_url) {
        return `📅 Podés ver nuestra disponibilidad y agendar tu turno directamente aquí:\n${config.booking_url}`;
      } else {
        return `📅 El sistema de reservas aún no está configurado. Por favor, escribinos tu consulta.`;
      }
    }

    return selectedResponse || config.default_response || 'Gracias por tu mensaje.';
  }

  // Any other message → show welcome message from config or generate default
  if (config.welcome_message) {
    return config.welcome_message;
  }

  let welcome = `${emoji} *¡Hola! Bienvenido a ${tenantName}* ${emoji}\n\n`;
  welcome += '¿En qué podemos ayudarte? Respondé con un número:\n\n';

  const numberEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];
  options.forEach((opt, i) => {
    welcome += `${numberEmojis[i]} ${opt.label}\n`;
  });

  return welcome;
}

// ========== AI MODE ==========
async function handleAIMode(tenantId, customerPhone, messageText, config, history) {
  let prompt = config.system_prompt || '';
  if (config.booking_url) {
    prompt += `\n\nIMPORTANTE: Si el usuario quiere agendar un turno o reserva, proporcionale siempre este enlace para que lo haga directamente: ${config.booking_url}`;
  }

  try {
    const aiResponse = await openaiService.generateResponse(
      config.openai_api_key, prompt, history, messageText,
      { model: config.ai_model, maxTokens: config.max_tokens, temperature: config.temperature }
    );

    return aiResponse.content || config.default_response || 'Gracias por tu mensaje.';
  } catch (error) {
    console.error('[AI Mode] Error:', error);
    return config.default_response || 'En este momento estoy teniendo problemas para responder.';
  }
}

// ========== SAVE CONVERSATION ==========
async function getOrCreateConversation(tenantId, customerPhone) {
  let conversation = await db('conversations')
    .where({ tenant_id: tenantId, customer_phone: customerPhone }).first();

  if (!conversation) {
    [conversation] = await db('conversations').insert({
      tenant_id: tenantId, customer_phone: customerPhone,
      messages: JSON.stringify([]), message_count: 0
    }).returning('*');
  }
  return conversation;
}

async function updateConversation(tenantId, customerPhone, userMsg, botMsg) {
  let conversation = await db('conversations')
    .where({ tenant_id: tenantId, customer_phone: customerPhone }).first();

  const newMsgs = [
    { role: 'user', content: userMsg, timestamp: new Date().toISOString() },
    ...(botMsg ? [{ role: 'assistant', content: botMsg, timestamp: new Date().toISOString() }] : [])
  ];

  if (!conversation) {
    await db('conversations').insert({
      tenant_id: tenantId, customer_phone: customerPhone,
      messages: JSON.stringify(newMsgs), message_count: newMsgs.length
    });
    return;
  }

  const history = typeof conversation.messages === 'string'
    ? JSON.parse(conversation.messages) : (conversation.messages || []);

  const merged = [...history, ...newMsgs].slice(-50);

  await db('conversations')
    .where({ tenant_id: tenantId, customer_phone: customerPhone })
    .update({ messages: JSON.stringify(merged), message_count: merged.length, last_message_at: new Date() });
}

module.exports = { handleMessage };
