class EditUser {
  constructor(payload) {
    this._verifyPayload(payload);


    const { name, phone, birthdate, gender } = payload;

    this.name = name;
    this.phone = phone;
    this.birthdate = birthdate;
    this.gender = gender;
  }

  _verifyPayload({ name, phone, birthdate, gender }) {
    if (!name || !phone || !birthdate, !gender) {
      throw new Error('NOT_CONTAIN_NEEDED_PROPERTY');
    }

    if (typeof name !== 'string' || typeof phone !== 'string' || typeof birthdate !== 'string' || typeof gender !== 'string') {
      throw new Error('NOT_MEET_DATA_TYPE_SPECIFICATION');
    }
  }
}

module.exports = EditUser;