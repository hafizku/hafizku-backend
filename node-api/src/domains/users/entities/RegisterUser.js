class RegisterUser {
  constructor(payload) {
    this._verifyPayload(payload);


    const { username, email, password, name, role, phone, token } = payload;

    this.username = username;
    this.email = email;
    this.password = password;
    this.name = name;
    this.role = role;
    this.phone = phone;
    this.token = token;
  }

  _verifyPayload({ username, email, password, name, role, phone }) {
    if (!username, !email, !password, !name, !role, !phone) {
      throw new Error('NOT_CONTAIN_NEEDED_PROPERTY');
    }

    if (typeof username !== 'string' || typeof email !== 'string' || typeof password !== 'string' || typeof name !== 'string' || typeof role !== 'string' || typeof phone !== 'string') {
      throw new Error('NOT_MEET_DATA_TYPE_SPECIFICATION');
    }
  }
}

module.exports = RegisterUser;