exports.up = function(knex) {
  return knex.schema.alterTable('bot_config', (t) => {
    t.string('booking_url'); // Used for Calendly/Cal.com integration
  }).then(() => {
    // Optionally drop the old complex appointment tables if they exist
    return knex.schema.dropTableIfExists('appointments').then(() => {
      return knex.schema.dropTableIfExists('availability_rules');
    });
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('bot_config', (t) => {
    t.dropColumn('booking_url');
  });
};
