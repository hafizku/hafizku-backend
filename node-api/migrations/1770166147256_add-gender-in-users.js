exports.up = (pgm) => {
  pgm.addColumn('users', {
    gender: {
      type: 'TEXT',
    },
  });
};

//L / P

exports.down = (pgm) => {
  pgm.dropColumn('users', ['gender']);
};