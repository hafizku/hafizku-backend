const RegisterUser = require("../../domains/users/entities/RegisterUser");

class RegisterUseCase {
  constructor({ userRepository, passwordHash }) {
    this._userRepository = userRepository;
    this._passwordHash = passwordHash;
  }

  async execute(useCasePayload) {
    const registerUser = new RegisterUser(useCasePayload);

    if (registerUser.role == 'child') {
      await this._userRepository.verifyAvailableUsername(registerUser.username);
      await this._userRepository.verifyAvailablePhone(registerUser.phone);
    } else {
      await this._userRepository.verifyAvailableEmail(registerUser.email);
      await this._userRepository.verifyAvailablePhone(registerUser.phone);
    }
    registerUser.password = await this._passwordHash.hash(registerUser.password);
    return this._userRepository.addUser(registerUser);
  }
}

module.exports = RegisterUseCase;