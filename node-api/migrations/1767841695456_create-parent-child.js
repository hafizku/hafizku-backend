/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('parentchilds', {
    id: {
      type: 'VARCHAR(50)',
      primaryKey: true,
    },
    parent_id: {
      type: 'TEXT',
      notNull: true,
    },
    child_id: {
      type: 'TEXT',
      notNull: true,
    },
    created: {
      type: 'TEXT',
      notNull: true,
    },
    updated: {
      type: 'TEXT',
      notNull: true,
    },
  });

  pgm.addConstraint('parentchilds', 'fk_parentchilds.parent_id_users.id', 'FOREIGN KEY(parent_id) REFERENCES users(id) ON DELETE CASCADE');

  pgm.addConstraint('parentchilds', 'fk_parentchilds.child_id_users.id', 'FOREIGN KEY(child_id) REFERENCES users(id) ON DELETE CASCADE');

};

exports.down = (pgm) => {
  pgm.dropTable('parentchilds');
};
