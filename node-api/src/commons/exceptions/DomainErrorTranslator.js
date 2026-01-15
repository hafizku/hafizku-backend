const InvariantError = require('./InvariantError');

const DomainErrorTranslator = {
  translate(error) {
    return DomainErrorTranslator._directories[error.message] || error;
  },
};

DomainErrorTranslator._directories = {
  'NOT_CONTAIN_NEEDED_PROPERTY': new InvariantError('data yang dibutuhkan tidak lengkap'),
  'NOT_MEET_DATA_TYPE_SPECIFICATION': new InvariantError('tipe data tidak sesuai'),
};

module.exports = DomainErrorTranslator;