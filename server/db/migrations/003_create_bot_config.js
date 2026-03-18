exports.up = function(knex) {
  return knex.schema.createTable('bot_config', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('tenant_id').references('id').inTable('tenants').onDelete('CASCADE').unique();

    // Mode: 'ai' or 'static'
    t.string('bot_mode').defaultTo('static');
    t.boolean('bot_active').defaultTo(true);

    // --- Welcome & Branding ---
    t.string('business_emoji').defaultTo('🏪');
    t.text('welcome_message'); // Auto-generated from tenant name + emoji + options

    // --- Static Mode: Up to 5 fully customizable options ---
    // JSONB array: [{ "label": "Ver Menú 📋", "response": "Aquí tienes..." }, ...]
    t.jsonb('static_options').defaultTo(JSON.stringify([
      { label: 'Ver Menu 📋', response: '📋 Aqui tienes nuestro menu:\n\n(Configura tu URL o lista de productos)' },
      { label: 'Hacer una Consulta 📝', response: '📝 Por favor, escribi tu consulta y te responderemos a la brevedad.' },
      { label: 'Horarios 🕐', response: '🕐 Nuestros horarios:\n\nLunes a Viernes: 11:00 - 23:00\nSabados y Domingos: 12:00 - 00:00' }
    ]));
    t.text('default_response').defaultTo('Gracias por tu mensaje. Un encargado te respondera pronto. 🙏');

    // --- AI Mode Config (optional) ---
    t.text('openai_api_key');
    t.text('system_prompt').defaultTo('Eres un asistente amable. Ayudas a los clientes con consultas. Responde siempre en español, de forma breve y profesional.');
    t.string('ai_model').defaultTo('gpt-4o-mini');
    t.integer('max_tokens').defaultTo(300);
    t.float('temperature').defaultTo(0.7);

    t.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('bot_config');
};
