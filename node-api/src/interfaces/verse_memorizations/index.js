const VerseMemorizationsHandler = require('./handler');
const routes = require('./routes');

module.exports = {
  name: 'versememorizations',
  register: async (server, { container }) => {
    const verseMemorizationsHandler = new VerseMemorizationsHandler(container);
    server.route(routes(verseMemorizationsHandler));
  }
};