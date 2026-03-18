const db = require('../db');
const metaService = require('../services/metaService');
const openaiService = require('../services/openaiService');
const availabilityService = require('../services/availabilityService');

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
    if (!config || !config.bot_active) return;

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
    console.log(`[Bot] [${tenant.name}] [${config.bot_mode}] ${customerPhone}`);

  } catch (error) {
    console.error(`[Bot] Error tenant ${tenantId}:`, error.message);
  }
}

// ========== STATIC MODE ==========
async function handleStaticMode(messageText, config, tenantName, tenantId, customerPhone, history) {
  const text = messageText.trim();
  const emoji = config.business_emoji || '🏪';

  // Check if we are in the middle of a BOOKING FLOW
  if (history.length > 0) {
    const lastMsg = history[history.length - 1];
    if (lastMsg.role === 'assistant' && lastMsg.content.includes('-- RESERVAS --')) {
      // User is responding to the slot selection
      const match = text.match(/^(\d+)\s+(.+)$/);
      if (match) {
        const slotIndex = parseInt(match[1], 10) - 1;
        const customerName = match[2].trim();
        
        try {
          const slots = await availabilityService.getAvailableSlots(tenantId);
          if (slotIndex >= 0 && slotIndex < slots.length) {
            const selectedSlot = slots[slotIndex];
            await availabilityService.bookAppointment(tenantId, customerName, customerPhone, selectedSlot.start);
            return `✅ *¡Turno Confirmado!*\n\nTe esperamos el ${selectedSlot.formatted}, ${customerName}.\n\nPara volver al menú principal, escribí "Menu".`;
          } else {
            return `❌ El número de turno no es válido. Escribí "Menu" y volvé a intentarlo.`;
          }
        } catch (err) {
          return `❌ *Error al agendar:* ${err.message}\nEscribí "Menu" para volver.`;
        }
      } else {
        return `⚠️ Formato incorrecto. Por favor, respondé con el NÚMERO del turno y tu NOMBRE. Ej: "1 Juan Perez".\nEscribí "Menu" para cancelar.`;
      }
    }
  }

  // Parse static_options
  const options = typeof config.static_options === 'string'
    ? JSON.parse(config.static_options)
    : (config.static_options || []);

  // Check if user sent a number matching an option
  const num = parseInt(text);
  if (!isNaN(num) && num >= 1 && num <= options.length) {
    const selectedResponse = options[num - 1].response;
    
    if (selectedResponse === '__FLOW_BOOKING__') {
      // Initiate Booking Flow
      const slots = await availabilityService.getAvailableSlots(tenantId);
      if (slots.length === 0) return `Lo siento, no hay turnos disponibles en los próximos días.`;
      
      let msg = `📅 *Turnos Disponibles*\n-- RESERVAS --\n\n`;
      slots.forEach((s, idx) => {
        msg += `${idx + 1}) ${s.formatted}\n`;
      });
      msg += `\nPara reservar, respondé con el *número del turno* seguido de tu *nombre y apellido*.\nEjemplo: \`1 Juan Perez\``;
      return msg;
    }

    return selectedResponse || config.default_response || 'Gracias por tu mensaje.';
  }

  // Any other message → show personalized welcome with options menu
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
  // Define tools for OpenAI Function Calling capability
  const tools = [
    {
      type: 'function',
      function: {
        name: 'get_available_slots',
        description: 'Verifica los próximos turnos u horarios disponibles para reservas.',
        parameters: { type: 'object', properties: {} }
      }
    },
    {
      type: 'function',
      function: {
        name: 'book_appointment',
        description: 'Agenda un turno en el sistema. REQUIERE la fecha exacta del turno (ISO string) y el nombre del cliente.',
        parameters: {
          type: 'object',
          properties: {
            customer_name: { type: 'string', description: 'Nombre y apellido del cliente' },
            start_time_iso: { type: 'string', description: 'Fecha y hora de inicio en formato ISO 8601' }
          },
          required: ['customer_name', 'start_time_iso']
        }
      }
    }
  ];

  try {
    const aiResponse = await openaiService.generateResponse(
      config.openai_api_key, config.system_prompt, history, messageText,
      { model: config.ai_model, maxTokens: config.max_tokens, temperature: config.temperature, tools }
    );

    // If AI decided to call a function, we execute it locally and return the result to the user.
    // In a real advanced implementation, we would pass the tool output back to the AI for a final summary,
    // but for WhatsApp speed, if it's a booking, we handle the final confirmation directly.
    if (aiResponse.toolCalls && aiResponse.toolCalls.length > 0) {
      const toolCall = aiResponse.toolCalls[0];
      
      if (toolCall.function.name === 'get_available_slots') {
        const slots = await availabilityService.getAvailableSlots(tenantId);
        if (!slots.length) return "Lo siento, no hay turnos disponibles en este momento.";
        
        let msg = "📅 *Horarios disponibles:*\n\n";
        slots.forEach((s) => {
          msg += `• ${s.formatted} (ID Interno: ${s.start.toISOString()})\n`;
        });
        msg += "\nDecime a qué nombre reservo y cuál elegís.";
        return msg;
      }
      
      if (toolCall.function.name === 'book_appointment') {
        const args = JSON.parse(toolCall.function.arguments);
        const { customer_name, start_time_iso } = args;
        
        try {
          const startTime = new Date(start_time_iso);
          await availabilityService.bookAppointment(tenantId, customer_name, customerPhone, startTime);
          return `✅ *¡Turno Confirmado!*\n\nPerfecto ${customer_name}, te agendé para el día y horario elegido. ¡Te esperamos!`;
        } catch (err) {
          return `❌ *No pudimos agendar el turno:*\n${err.message}`;
        }
      }
    }

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
