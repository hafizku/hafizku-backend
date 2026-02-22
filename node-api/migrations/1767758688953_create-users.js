/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('users', {
    id: {
      type: 'VARCHAR(50)',
      primaryKey: true,
    },
    username: {
      type: 'TEXT',
      notNull: true,
      unique: true,
    },
    email: {
      type: 'TEXT',
      notNull: true,
      unique: true,
    },
    password: {
      type: 'TEXT',
      notNull: true,
    },
    name: {
      type: 'TEXT',
      notNull: true,
    },
    phone: {
      type: 'TEXT',
      notNull: true,
      unique: true,
    },
    avatar: {
      type: 'TEXT',
    },
    status: {
      type: 'TEXT',
      notNull: true,
    },
    role: {
      type: 'TEXT',
      notNull: true,
    },
    token: {
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

  /*
  role:
  admin
  parent
  child
  */
};

exports.down = (pgm) => {
  pgm.dropTable('users');
};
