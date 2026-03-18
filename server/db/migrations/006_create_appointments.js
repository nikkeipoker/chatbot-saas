exports.up = function (knex) {
  return knex.schema
    .createTable('availability_rules', (t) => {
      t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      t.uuid('tenant_id').references('id').inTable('tenants').onDelete('CASCADE').notNullable();
      t.integer('day_of_week').notNullable(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      t.time('start_time').notNullable(); // e.g., '09:00:00'
      t.time('end_time').notNullable();   // e.g., '18:00:00'
      t.integer('slot_duration_minutes').defaultTo(30).notNullable();
      t.boolean('is_active').defaultTo(true);
      t.timestamps(true, true);
      // Ensure one rule per day per tenant to simplify UI
      t.unique(['tenant_id', 'day_of_week']);
    })
    .createTable('appointments', (t) => {
      t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      t.uuid('tenant_id').references('id').inTable('tenants').onDelete('CASCADE').notNullable();
      t.string('customer_name').notNullable();
      t.string('customer_phone').notNullable(); // E.164 format from WA
      t.timestamp('appointment_time').notNullable();
      t.string('status').defaultTo('confirmed'); // pending, confirmed, cancelled
      t.text('notes');
      t.timestamps(true, true);
    });
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists('appointments')
    .dropTableIfExists('availability_rules');
};
