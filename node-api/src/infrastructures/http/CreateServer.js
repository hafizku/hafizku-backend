const Hapi = require('@hapi/hapi');
const Jwt = require('@hapi/jwt');
const users = require('../../interfaces/users');
const versememorizations = require('../../interfaces/verse_memorizations');
const parentalpraise = require('../../interfaces/parental_praise');

const config = require('../../commons/config');
const DomainErrorTranslator = require('../../commons/exceptions/DomainErrorTranslator');
const ClientError = require('../../commons/exceptions/ClientError');

const createServer = async (container) => {
  const server = Hapi.server({
    host: config.app.host,
    port: config.app.port,
    debug: config.app.debug,
    routes: {
      cors: {
        origin: ['*'],
      },
    },
  });

  // plugin external
  await server.register([
    {
      plugin: Jwt,
    },
  ]);

  server.auth.strategy('hafizku_jwt', 'jwt', {
    keys: [process.env.ACCESS_TOKEN_KEY, process.env.REFRESH_TOKEN_KEY],
    verify: {
      aud: false,
      iss: false,
      sub: false,
      maxAgeSec: process.env.ACCESS_TOKEN_AGE,
    },
    validate: (artifacts) => ({
      isValid: true,
      credentials: {
        id: artifacts.decoded.payload.id,
        token: artifacts.token,
      },
    }),
  });

  await server.register([
    {
      plugin: users,
      options: { container }
    },
    {
      plugin: versememorizations,
      options: { container }
    },
    {
      plugin: parentalpraise,
      options: { container }
    },
  ]);

  server.ext('onPreResponse', (request, h) => {
    const { response } = request;

    if (response instanceof Error) {
      const translatedError = DomainErrorTranslator.translate(response);

      if (translatedError instanceof ClientError) {
        const newResponse = h.response({
          status: 'fail',
          message: translatedError.message
        });

        newResponse.code(translatedError.statusCode);
        return newResponse;
      }

      if (!translatedError.isServer) {
        return h.continue;
      }

      const newResponse = h.response({
        status: 'error',
        message: 'terjadi kegagalan pada server',
      });
      newResponse.code(500);
      return newResponse;
    }

    return h.continue;
  });

  return server;
};


module.exports = createServer;
