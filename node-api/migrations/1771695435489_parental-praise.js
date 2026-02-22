/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('parental_praise', {
    id: {
      type: 'TEXT',
      primaryKey: true,
    },
    versememorization_id: {
      type: 'TEXT',
      notNull: true,
    },
    parent_id: {
      type: 'TEXT',
      notNull: true,
    },
    child_id: {
      type: 'TEXT',
      notNull: true,
    },
    praise: {
      type: 'TEXT',
      notNull: true,
    },
    voice: {
      type: 'TEXT',
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

  pgm.addConstraint('parental_praise', 'fk_parental_praise.versememorization_id_versememorizations.id', 'FOREIGN KEY(versememorization_id) REFERENCES versememorizations(id) ON DELETE CASCADE');

  pgm.addConstraint('parental_praise', 'fk_parental_praise.parent_id_users.id', 'FOREIGN KEY(parent_id) REFERENCES users(id) ON DELETE CASCADE');

  pgm.addConstraint('parental_praise', 'fk_parental_praise.child_id_users.id', 'FOREIGN KEY(child_id) REFERENCES users(id) ON DELETE CASCADE');

};

exports.down = (pgm) => {
  pgm.dropTable('parental_praise');
};
