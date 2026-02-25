class LoggedUser {
  constructor(payload) {
    this._verifyPayload(payload);


    const { id, username, email, name, role, status, avatar, accessToken } = payload;

    this.id = id;
    this.username = username;
    this.email = email;
    this.name = name;
    this.role = role;
    this.status = status;
    this.avatar = avatar;
    this.accessToken = accessToken;
  }

  _verifyPayload({ id, username, email, name, role, status, avatar, accessToken }) {
    if (!email, !id, !username, !name, !role, !status, !avatar, !accessToken) {
      throw new Error('NOT_CONTAIN_NEEDED_PROPERTY');
    }

    if (typeof id !== 'string' || typeof name !== 'string' || typeof role !== 'string' || typeof status !== 'string' || typeof avatar != 'string' || typeof accessToken !== 'string') {
      throw new Error('NOT_MEET_DATA_TYPE_SPECIFICATION');
    }
  }
}

module.exports = LoggedUser;