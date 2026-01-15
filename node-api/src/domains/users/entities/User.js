class GetUser {
  constructor(payload) {
    this._verifyPayload(payload);


    const { id, email, name, phone, avatar, status, created, updated, role, token } = payload;

    this.id = id;
    this.email = email;
    this.name = name;
    this.role = role;
    this.phone = phone;
    this.avatar = avatar;
    this.status = status;
    this.created = created;
    this.updated = updated;
    this.token = token;
  }

  _verifyPayload({ id, email, name, role, phone, avatar, status, created, updated, token }) {
    if (!email, !id, !name, !role, !phone, !avatar, !status, !created, !updated, !token) {
      throw new Error('NOT_CONTAIN_NEEDED_PROPERTY');
    }

    if (typeof email !== 'string' || typeof id !== 'string' || typeof name !== 'string' || typeof role !== 'string' || typeof phone !== 'string' || typeof avatar !== 'string' || typeof status !== 'string' || typeof created !== 'string' || typeof updated !== 'string' || typeof token !== 'string') {
      throw new Error('NOT_MEET_DATA_TYPE_SPECIFICATION');
    }
  }
}

module.exports = GetUser;