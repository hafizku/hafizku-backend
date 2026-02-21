/* istanbul ignore file */

const { createContainer } = require('instances-container');

//external agency
const { nanoid } = require('nanoid');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const Jwt = require('@hapi/jwt');
const pool = require('./database/postgres/pool');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const quran = require('hafizku-quran');

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Asia/Jakarta");

//services
const UserRepositoryPostgres = require('./repositories/postgres/UserRepositoryPostgres');
const VerseMemorizationRepositoryPostgres = require('./repositories/postgres/VerseMemorizationRepositoryPostgres');

const BcryptPasswordHash = require('./security/BcryptPasswordHash');
const JwtTokenManager = require('./security/JwtTokenManager');
const QcQuranService = require('./services/QcQuranService');
const HafizkuEmailService = require('./services/HafizkuEmailService');

//use cases
const RegisterUseCase = require('../applications/usecases/RegisterUseCase');
const LoginUseCase = require('../applications/usecases/LoginUseCase');
const ChangePasswordUseCase = require('../applications/usecases/ChangePasswordUseCase');
const UserUseCase = require('../applications/usecases/UserUseCase');
const VerseMemorizationUseCase = require('../applications/usecases/VerseMemorizationUseCase');

const UserRepository = require('../domains/users/UserRepository');
const VerseMemorizationRepository = require('../domains/verse_memorizations/VerseMemorizationRepository');

const PasswordHash = require('../applications/security/PasswordHash');
const TokenManager = require('../applications/security/TokenManager');
const QuranService = require('../applications/services/QuranService');
const EmailService = require('../applications/services/EmailService');

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
          concrete: dayjs
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
    key: EmailService.name,
    Class: HafizkuEmailService,
    parameter: {
      dependencies: [
        {
          concrete: nodemailer
        }
      ]
    }
  },
  {
    key: VerseMemorizationRepository.name,
    Class: VerseMemorizationRepositoryPostgres,
    parameter: {
      dependencies: [
        {
          concrete: pool,
        },
        {
          concrete: nanoid
        },
        {
          concrete: dayjs
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
        },
        {
          name: 'verseMemorizationRepository',
          internal: VerseMemorizationRepository.name,
        },
      ]
    }
  },
  {
    key: VerseMemorizationUseCase.name,
    Class: VerseMemorizationUseCase,
    parameter: {
      injectType: 'destructuring',
      dependencies: [
        {
          name: 'verseMemorizationRepository',
          internal: VerseMemorizationRepository.name,
        },
        {
          name: 'quranService',
          internal: QuranService.name,
        },
        {
          name: 'userRepository',
          internal: UserRepository.name,
        },
      ]
    }
  }
]);

module.exports = container;