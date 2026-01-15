const ChangePassword = require("../../domains/users/entities/ChangePassword");

class ChangePasswordUseCase {
  constructor({ userRepository, passwordHash }) {
    this._userRepository = userRepository;
    this._passwordHash = passwordHash;
  }

  async execute(userId, useCasePayload) {
    const changePassword = new ChangePassword(useCasePayload);
    const { password } = await this._userRepository.getUserDetail(userId);
    await this._passwordHash.comparePassword(useCasePayload.oldPassword, password);
    changePassword.newPassword = await this._passwordHash.hash(changePassword.newPassword);
    return this._userRepository.changePassword(userId, changePassword);
  }
}

module.exports = ChangePasswordUseCase;