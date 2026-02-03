exports.up = (pgm) => {
  pgm.addColumn('users', {
    birth_date: {
      type: 'TEXT',
    },
  });
};

exports.down = (pgm) => {
  pgm.dropColumn('users', ['birth_date']);
};