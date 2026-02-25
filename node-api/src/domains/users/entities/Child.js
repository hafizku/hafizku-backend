class Child {
  constructor(payload) {
    this._verifyPayload(payload);


    const { id, username, name, phone, avatar, status, created, updated, role, parent, birth_date, gender } = payload;

    this.id = id;
    this.username = username;
    this.name = name;
    this.role = role;
    this.phone = phone;
    this.avatar = avatar;
    this.status = status;
    this.created = created;
    this.updated = updated;
    this.parent = parent;
    this.birth_date = birth_date;
    this.gender = gender;
  }

  _verifyPayload({ id, username, name, role, phone, avatar, status, created, updated, parent }) {
    if (!username, !id, !name, !role, !phone, !avatar, !status, !created, !updated, !parent) {
      throw new Error('NOT_CONTAIN_NEEDED_PROPERTY');
    }

    if (typeof username !== 'string' || typeof id !== 'string' || typeof name !== 'string' || typeof role !== 'string' || typeof phone !== 'string' || typeof avatar !== 'string' || typeof status !== 'string' || typeof created !== 'string' || typeof updated !== 'string' || typeof parent !== 'string') {
      throw new Error('NOT_MEET_DATA_TYPE_SPECIFICATION');
    }
  }
}

module.exports = Child;