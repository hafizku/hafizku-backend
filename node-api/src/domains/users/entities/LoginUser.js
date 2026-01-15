class LoginUser {
  constructor(payload) {
    this._verifyPayload(payload);


    const { email, password } = payload;

    this.email = email;
    this.password = password;
  }

  _verifyPayload({ email, password }) {
    if (!email, !password) {
      throw new Error('NOT_CONTAIN_NEEDED_PROPERTY');
    }

    if (typeof email !== 'string' || typeof password !== 'string') {
      throw new Error('NOT_MEET_DATA_TYPE_SPECIFICATION');
    }
  }
}

module.exports = LoginUser;