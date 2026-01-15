const routes = (handler) => ([
  {
    method: 'POST',
    path: '/ayahmemorization',
    handler: handler.postAyahMemorizationHandler,
    options: {
      auth: 'hafizku_jwt',
    },
  },
  {
    method: 'PUT',
    path: '/ayahmemorization/{ayahId}',
    handler: handler.putAyahMemorizationHandler,
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
]);

module.exports = routes;