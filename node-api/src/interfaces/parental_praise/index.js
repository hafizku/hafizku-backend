const ParentalPraiseHandler = require('./handler');
const routes = require('./routes');

module.exports = {
  name: 'parentalpraise',
  register: async (server, { container }) => {
    const parentalPraiseHandler = new ParentalPraiseHandler(container);
    server.route(routes(parentalPraiseHandler));
  }
};