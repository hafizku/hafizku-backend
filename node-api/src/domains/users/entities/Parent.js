class Parent {
  constructor(payload) {
    this._verifyPayload(payload);


    const { id, email, name, phone, avatar, status, created, updated, role, token, birth_date, gender } = payload;

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
    this.birth_date = birth_date;
    this.gender = gender;
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

module.exports = Parent;