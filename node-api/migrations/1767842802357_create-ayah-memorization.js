/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('ayahmemorizations', {
    id: {
      type: 'VARCHAR(50)',
      primaryKey: true,
    },
    user_id: {
      type: 'TEXT',
      notNull: true,
    },
    juz: {
      type: 'TEXT',
      notNull: true,
    },
    page: {
      type: 'TEXT',
      notNull: true,
    },
    surah: {
      type: 'TEXT',
      notNull: true,
    },
    ayah: {
      type: 'TEXT',
      notNull: true,
    },
    audio: {
      type: 'TEXT',
      notNull: true,
    },
    status: {
      type: 'TEXT',
      notNull: true,
    },
    score: {
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

  pgm.addConstraint('ayahmemorizations', 'fk_ayahmemorizations.user_id_users.id', 'FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE');

  /*
  status:
  new
  memorizing
  memorized
  */
};

exports.down = (pgm) => {
  pgm.dropTable('ayahmemorizations');
};
