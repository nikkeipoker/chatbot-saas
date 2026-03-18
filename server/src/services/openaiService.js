const OpenAI = require('openai');

/**
 * Generate an AI response using the TENANT'S OWN OpenAI API key.
 * Each client provides their own key — you don't pay for their usage.
 */
async function generateResponse(tenantApiKey, systemPrompt, conversationHistory, userMessage, options = {}) {
  try {
    if (!tenantApiKey) {
      return null; // No key = can't use AI, fallback to static
    }

    const openai = new OpenAI({ apiKey: tenantApiKey });

    const model = options.model || 'gpt-4o-mini';
    const maxTokens = options.maxTokens || 300;
    const temperature = options.temperature || 0.7;

    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    // Add last 10 messages for context
    const recentHistory = (conversationHistory || []).slice(-10);
    for (const msg of recentHistory) {
      messages.push({ role: msg.role, content: msg.content });
    }

    messages.push({ role: 'user', content: userMessage });

    const completion = await openai.chat.completions.create({
      model,
      messages,
      max_tokens: maxTokens,
      temperature
    });

    const reply = completion.choices[0]?.message?.content?.trim();

    if (!reply) {
      console.warn('[OpenAI] Empty response');
      return 'Lo siento, no pude procesar tu mensaje. ¿Podrías intentarlo de nuevo?';
    }

    console.log(`[OpenAI] (${completion.usage?.total_tokens} tokens): ${reply.substring(0, 60)}...`);
    return reply;
  } catch (error) {
    console.error('[OpenAI] Error:', error.message);

    if (error.code === 'invalid_api_key') {
      return '⚠️ La clave de OpenAI configurada no es válida. Contacta al administrador.';
    }
    if (error.code === 'insufficient_quota') {
      return '⚠️ Se agotó el crédito de OpenAI. Contacta al administrador.';
    }

    return 'Disculpa, tuve un problema procesando tu mensaje. ¿Podrías intentarlo de nuevo?';
  }
}

module.exports = { generateResponse };
