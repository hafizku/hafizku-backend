class EditUser {
  constructor(payload) {
    this._verifyPayload(payload);


    const { name, phone, avatar } = payload;

    this.name = name;
    this.phone = phone;
    this.avatar = avatar;
  }

  _verifyPayload({ name, phone, avatar }) {
    if (!name || !phone || !avatar) {
      throw new Error('NOT_CONTAIN_NEEDED_PROPERTY');
    }

    if (typeof name !== 'string' || typeof phone !== 'string' || typeof avatar !== 'string') {
      throw new Error('NOT_MEET_DATA_TYPE_SPECIFICATION');
    }
  }
}

module.exports = EditUser;