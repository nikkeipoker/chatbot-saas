exports.up = function(knex) {
  return knex.schema.createTable('conversations', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('tenant_id').references('id').inTable('tenants').onDelete('CASCADE');
    t.string('customer_phone').notNullable();
    t.string('customer_name');
    // Full conversation history for OpenAI context
    t.jsonb('messages').defaultTo('[]');
    t.integer('message_count').defaultTo(0);
    t.timestamp('last_message_at').defaultTo(knex.fn.now());
    t.timestamps(true, true);
    // Index for fast lookup
    t.unique(['tenant_id', 'customer_phone']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('conversations');
};
