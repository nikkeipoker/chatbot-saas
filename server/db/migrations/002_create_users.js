exports.up = function(knex) {
  return knex.schema.createTable('users', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('tenant_id').references('id').inTable('tenants').onDelete('CASCADE');
    t.string('name').notNullable();
    t.string('email').notNullable().unique();
    t.string('password_hash').notNullable();
    t.string('role').defaultTo('owner'); // owner, manager, staff
    t.boolean('is_super_admin').defaultTo(false); // Platform admin (you)
    t.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('users');
};
