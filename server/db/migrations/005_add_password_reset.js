exports.up = function(knex) {
  return knex.schema.table('users', (t) => {
    t.string('password_reset_token');
    t.timestamp('password_reset_expires');
  });
};

exports.down = function(knex) {
  return knex.schema.table('users', (t) => {
    t.dropColumn('password_reset_token');
    t.dropColumn('password_reset_expires');
  });
};
