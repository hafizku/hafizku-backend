class ChangePassword {
  constructor(payload) {
    this._verifyPayload(payload);


    const { oldPassword, newPassword } = payload;

    this.oldPassword = oldPassword;
    this.newPassword = newPassword;
  }

  _verifyPayload({ oldPassword, newPassword }) {
    if (!oldPassword, !newPassword) {
      throw new Error('NOT_CONTAIN_NEEDED_PROPERTY');
    }

    if (typeof oldPassword !== 'string' || typeof newPassword !== 'string') {
      throw new Error('NOT_MEET_DATA_TYPE_SPECIFICATION');
    }
  }
}

module.exports = ChangePassword;