/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('activities', {
    id: {
      type: 'VARCHAR(50)',
      primaryKey: true,
    },
    user_id: {
      type: 'TEXT',
      notNull: true,
    },
    activity: {
      type: 'TEXT',
      notNull: true,
    },
    created: {
      type: 'TEXT',
      notNull: true,
    },
  });

  pgm.addConstraint('activities', 'fk_activities.user_id_users.id', 'FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE');

};

exports.down = (pgm) => {
  pgm.dropTable('activities');
};
