const EditUser = require("../../domains/users/entities/EditUser");


class UserUseCase {
  constructor({ userRepository }) {
    this._userRepository = userRepository;
  }

  async editUser(userId, useCasePayload) {
    const editUser = new EditUser(useCasePayload);
    return this._userRepository.editUser(userId, editUser);
  }

  async getUserDetail(userId) {
    return this._userRepository.getUserDetail(userId);
  }

  async getAllUser(credentialId) {
    await this._userRepository.verifyAdmin(credentialId);
    return this._userRepository.getAllUser();
  }

  async deleteUser(userId, credentialId) {
    await this._userRepository.verifyAdmin(credentialId);
    return this._userRepository.deleteUser(userId);
  }

  async parentLink(userId, useCasePayload) {
    const parentId = await this._userRepository.verifyParentToken(useCasePayload.token);
    await this._userRepository.checkParentChild(userId, parentId);
    return this._userRepository.parentLink(userId, parentId);
  }
}

module.exports = UserUseCase;