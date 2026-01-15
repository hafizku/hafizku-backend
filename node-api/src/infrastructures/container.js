/* istanbul ignore file */

const { createContainer } = require('instances-container');

//external agency
const { nanoid } = require('nanoid');
const bcrypt = require('bcrypt');
const Jwt = require('@hapi/jwt');
const pool = require('./database/postgres/pool');
const moment = require('moment');
const quran = require('hafizku-quran');

//services
const UserRepositoryPostgres = require('./repositories/postgres/UserRepositoryPostgres');
const AyahMemorizationRepositoryPostgres = require('./repositories/postgres/AyahMemorizationRepositoryPostgres');

const BcryptPasswordHash = require('./security/BcryptPasswordHash');
const JwtTokenManager = require('./security/JwtTokenManager');
const QcQuranService = require('./services/QcQuranService');

//use cases
const RegisterUseCase = require('../applications/usecases/RegisterUseCase');
const LoginUseCase = require('../applications/usecases/LoginUseCase');
const ChangePasswordUseCase = require('../applications/usecases/ChangePasswordUseCase');
const UserUseCase = require('../applications/usecases/UserUseCase');
const AyahMemorizationUseCase = require('../applications/usecases/AyahMemorizationUseCase');

const UserRepository = require('../domains/users/UserRepository');
const AyahMemorizationRepository = require('../domains/ayah_memorizations/AyahMemorizationRepository');

const PasswordHash = require('../applications/security/PasswordHash');
const TokenManager = require('../applications/security/TokenManager');
const QuranService = require('../applications/services/QuranService');

//creating container
const container = createContainer();

//registering services & repository
container.register([
  {
    key: UserRepository.name,
    Class: UserRepositoryPostgres,
    parameter: {
      dependencies: [
        {
          concrete: pool,
        },
        {
          concrete: nanoid
        },
        {
          concrete: moment
        }
      ]
    }
  },
  {
    key: PasswordHash.name,
    Class: BcryptPasswordHash,
    parameter: {
      dependencies: [
        {
          concrete: bcrypt
        }
      ]
    }
  },
  {
    key: TokenManager.name,
    Class: JwtTokenManager,
    parameter: {
      dependencies: [
        {
          concrete: Jwt.token
        }
      ]
    }
  },
  {
    key: QuranService.name,
    Class: QcQuranService,
    parameter: {
      dependencies: [
        {
          concrete: quran
        }
      ]
    }
  },
  {
    key: AyahMemorizationRepository.name,
    Class: AyahMemorizationRepositoryPostgres,
    parameter: {
      dependencies: [
        {
          concrete: pool,
        },
        {
          concrete: nanoid
        },
        {
          concrete: moment
        }
      ]
    }
  },
]);

//registering use cases
container.register([
  {
    key: RegisterUseCase.name,
    Class: RegisterUseCase,
    parameter: {
      injectType: 'destructuring',
      dependencies: [
        {
          name: 'userRepository',
          internal: UserRepository.name,
        },
        {
          name: 'passwordHash',
          internal: PasswordHash.name
        }
      ]
    }
  },
  {
    key: LoginUseCase.name,
    Class: LoginUseCase,
    parameter: {
      injectType: 'destructuring',
      dependencies: [
        {
          name: 'userRepository',
          internal: UserRepository.name,
        },
        {
          name: 'passwordHash',
          internal: PasswordHash.name
        },
        {
          name: 'tokenManager',
          internal: TokenManager.name
        }
      ]
    }
  },
  {
    key: ChangePasswordUseCase.name,
    Class: ChangePasswordUseCase,
    parameter: {
      injectType: 'destructuring',
      dependencies: [
        {
          name: 'userRepository',
          internal: UserRepository.name,
        },
        {
          name: 'passwordHash',
          internal: PasswordHash.name
        }
      ]
    }
  },
  {
    key: UserUseCase.name,
    Class: UserUseCase,
    parameter: {
      injectType: 'destructuring',
      dependencies: [
        {
          name: 'userRepository',
          internal: UserRepository.name,
        }
      ]
    }
  },
  {
    key: AyahMemorizationUseCase.name,
    Class: AyahMemorizationUseCase,
    parameter: {
      injectType: 'destructuring',
      dependencies: [
        {
          name: 'ayahMemorizationRepository',
          internal: AyahMemorizationRepository.name,
        },
        {
          name: 'quranService',
          internal: QuranService.name,
        }
      ]
    }
  }
]);

module.exports = container;