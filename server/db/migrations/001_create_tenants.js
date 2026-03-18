exports.up = function(knex) {
  return knex.schema.createTable('tenants', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('name').notNullable();
    t.string('phone_number');
    // Meta WhatsApp Cloud API credentials (per tenant)
    t.string('meta_phone_number_id');
    t.text('meta_access_token');
    t.string('meta_waba_id'); // WhatsApp Business Account ID
    // Subscription
    t.string('subscription_status').defaultTo('trial');
    t.timestamp('trial_ends_at').defaultTo(knex.raw("NOW() + INTERVAL '14 days'"));
    t.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('tenants');
};
