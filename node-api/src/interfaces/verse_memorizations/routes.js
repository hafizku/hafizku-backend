const routes = (handler) => ([
  {
    method: 'POST',
    path: '/versememorization/{verseId}',
    handler: handler.postVerseMemorizationHandler,
    options: {
      auth: 'hafizku_jwt',
    },
  },
  {
    method: 'PUT',
    path: '/versememorization/{verseId}',
    handler: handler.putVerseMemorizationHandler,
    options: {
      auth: 'hafizku_jwt',
    },
  },
  {
    method: 'GET',
    path: '/juzs',
    handler: handler.getAllJuzHandler,
    options: {
      auth: 'hafizku_jwt',
    },
  },
  {
    method: 'GET',
    path: '/pages/{juzId}',
    handler: handler.getPagesByJuzHandler,
    options: {
      auth: 'hafizku_jwt',
    },
  },
  {
    method: 'GET',
    path: '/verses/{pageId}',
    handler: handler.getVersesByPageHandler,
    options: {
      auth: 'hafizku_jwt',
    },
  },
  {
    method: 'GET',
    path: '/verses/detail/{pageId}/{verseId}',
    handler: handler.getVerseDetailHandler,
    options: {
      auth: 'hafizku_jwt',
    },
  },
  {
    method: 'GET',
    path: '/versememorization/summary',
    handler: handler.getSummaryVerseMemorizationHandler,
    options: {
      auth: 'hafizku_jwt',
    },
  },
]);

module.exports = routes;