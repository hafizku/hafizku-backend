exports.up = (pgm) => {
  pgm.addColumn('versememorizations', {
    verse_id: {
      type: 'TEXT',
    },
  });
};

exports.down = (pgm) => {
  pgm.dropColumn('versememorizations', ['verse_id']);
};