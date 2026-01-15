const routes = (handler) => ([
  {
    method: 'POST',
    path: '/register',
    handler: handler.postRegisterHandler,
  },
  {
    method: 'POST',
    path: '/login',
    handler: handler.postLoginHandler,
  },
  {
    method: 'POST',
    path: '/changePassword',
    handler: handler.postChangePasswordHandler,
    options: {
      auth: 'hafizku_jwt',
    },
  },
  {
    method: 'PUT',
    path: '/users/edit',
    handler: handler.editUserHandler,
    options: {
      auth: 'hafizku_jwt',
    },
  },
  {
    method: 'DELETE',
    path: '/users/{userId}',
    handler: handler.deleteUserHandler,
    options: {
      auth: 'hafizku_jwt',
    },
  },
  {
    method: 'GET',
    path: '/users/detail',
    handler: handler.getUserDetailHandler,
    options: {
      auth: 'hafizku_jwt',
    },
  },
  {
    method: 'GET',
    path: '/users',
    handler: handler.getAllUserHandler,
    options: {
      auth: 'hafizku_jwt',
    },
  },
  {
    method: 'POST',
    path: '/parentlink',
    handler: handler.postParentLinkHandler,
    options: {
      auth: 'hafizku_jwt',
    },
  },
]);

module.exports = routes;