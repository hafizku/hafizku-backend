const AyahMemorizationsHandler = require('./handler');
const routes = require('./routes');

module.exports = {
  name: 'ayahmemorizations',
  register: async (server, { container }) => {
    const ayahMemorizationsHandler = new AyahMemorizationsHandler(container);
    server.route(routes(ayahMemorizationsHandler));
  }
};