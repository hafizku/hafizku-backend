const PasswordHash = require("../../applications/security/PasswordHash");
const AuthenticationError = require('../../commons/exceptions/AuthenticationError');

class BcryptPasswordHash extends PasswordHash {
  constructor(bcrypt, saltRound = 10) {
    super();
    this._bcrypt = bcrypt;
    this._saltRound = saltRound;
  }

  async hash(password) {
    return this._bcrypt.hash(password, this._saltRound);
  }

  async comparePassword(plainPassword, encryptedPassword) {
    const result = await this._bcrypt.compare(plainPassword, encryptedPassword);

    if (!result) {
      throw new AuthenticationError('password salah');
    }
  }
}

module.exports = BcryptPasswordHash;