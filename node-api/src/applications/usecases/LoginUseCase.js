const LoggedUser = require("../../domains/users/entities/LoggedUser");
const LoginUser = require('../../domains/users/entities/LoginUser');


class LoginUseCase {
  constructor({ userRepository, passwordHash, tokenManager }) {
    this._userRepository = userRepository;
    this._passwordHash = passwordHash;
    this._tokenManager = tokenManager;
  }

  async execute(useCasePayload) {
    const loginUser = new LoginUser(useCasePayload);
    let data;
    try {
      data = await this._userRepository.getUserByUsername(loginUser.email);
    } catch (error) {
      data = await this._userRepository.getUserByEmailOrPhone(loginUser.email);
    }
    const { id, username, email, password, name, role, status, avatar } = data;
    await this._passwordHash.comparePassword(loginUser.password, password);
    const accessToken = await this._tokenManager.createAccessToken({ id, email });
    const loggedUser = new LoggedUser({
      id,
      username,
      email,
      name,
      role,
      status,
      avatar,
      accessToken
    })
    return loggedUser;
  }
}

module.exports = LoginUseCase;