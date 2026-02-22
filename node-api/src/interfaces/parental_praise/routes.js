const routes = (handler) => ([
  {
    method: 'POST',
    path: '/parentalpraise/{verseMemoId}/{childId}',
    handler: handler.postParentalPraiseHandler,
    options: {
      auth: 'hafizku_jwt',
    },
  },
  {
    method: 'PUT',
    path: '/parentalpraise/{parentalPraiseId}/{childId}',
    handler: handler.putParentalPraiseHandler,
    options: {
      auth: 'hafizku_jwt',
    },
  },
  {
    method: 'GET',
    path: '/parentalpraise/{verseMemoId}/{childId}',
    handler: handler.getParentalPraiseHandler,
    options: {
      auth: 'hafizku_jwt',
    },
  },
  {
    method: 'DELETE',
    path: '/parentalpraise/{parentalPraiseId}',
    handler: handler.deleteParentalPraiseHandler,
    options: {
      auth: 'hafizku_jwt',
    },
  },
]);

module.exports = routes;