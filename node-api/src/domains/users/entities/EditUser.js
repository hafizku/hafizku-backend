class EditUser {
  constructor(payload) {
    this._verifyPayload(payload);


    const { name, phone, birthdate, gender, avatar } = payload;

    this.name = name;
    this.phone = phone;
    this.birthdate = birthdate;
    this.gender = gender;
    this.avatar = avatar;
  }

  _verifyPayload({ name, phone, birthdate, gender, avatar }) {
    if (!name || !phone || !birthdate, !gender, !avatar) {
      throw new Error('NOT_CONTAIN_NEEDED_PROPERTY');
    }

    if (typeof name !== 'string' || typeof phone !== 'string' || typeof birthdate !== 'string' || typeof gender !== 'string' || typeof avatar !== 'string') {
      throw new Error('NOT_MEET_DATA_TYPE_SPECIFICATION');
    }
  }
}

module.exports = EditUser;