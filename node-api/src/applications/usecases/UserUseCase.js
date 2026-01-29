const Child = require("../../domains/users/entities/Child");
const EditUser = require("../../domains/users/entities/EditUser");
const Parent = require("../../domains/users/entities/Parent");
const User = require("../../domains/users/entities/User");


class UserUseCase {
  constructor({ userRepository }) {
    this._userRepository = userRepository;
  }

  async editUser(userId, useCasePayload) {
    const editUser = new EditUser(useCasePayload);
    return this._userRepository.editUser(userId, editUser);
  }

  async getUserDetail(userId) {
    const data = await this._userRepository.getUserDetail(userId);
    return new User(data);
  }
  async getParentDetail(parentId) {
    const parent = await this._userRepository.getUserDetail(parentId);
    return new Parent(parent);
  }
  async getChildDetail(childId) {
    const child = await this._userRepository.getUserDetail(childId);
    let parentName;

    try {
      parentName = await this._userRepository.getParentName(childId);
    } catch (error) {
      parentName = '-';
    }

    return new Child({ ...child, parent: parentName });
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