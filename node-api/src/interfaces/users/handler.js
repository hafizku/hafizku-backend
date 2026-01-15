const RegisterUseCase = require('../../applications/usecases/RegisterUseCase');
const LoginUseCase = require('../../applications/usecases/LoginUseCase');
const UserUseCase = require('../../applications/usecases/UserUseCase');
const ChangePasswordUseCase = require('../../applications/usecases/ChangePasswordUseCase');

class UsersHandler {
  constructor(container) {
    this._container = container;
    this.postLoginHandler = this.postLoginHandler.bind(this);
    this.postRegisterHandler = this.postRegisterHandler.bind(this);
    this.postChangePasswordHandler = this.postChangePasswordHandler.bind(this);
    this.editUserHandler = this.editUserHandler.bind(this);
    this.deleteUserHandler = this.deleteUserHandler.bind(this);
    this.getUserDetailHandler = this.getUserDetailHandler.bind(this);
    this.getAllUserHandler = this.getAllUserHandler.bind(this);
    this.postParentLinkHandler = this.postParentLinkHandler.bind(this);
  }

  async postRegisterHandler(request, h) {

    const registerUseCase = this._container.getInstance(RegisterUseCase.name);
    await registerUseCase.execute(request.payload);

    const response = h.response({
      status: 'success',
      message: 'Berhasil Menambahkan Akun',
    });

    response.code(201);
    return response;

  }

  async editUserHandler(request, h) {
    const userUseCase = this._container.getInstance(UserUseCase.name);
    const { id: credentialId } = request.auth.credentials;
    await userUseCase.editUser(credentialId, request.payload);

    const response = h.response({
      status: 'success',
      message: 'Berhasil Merubah Akun',
    });
    response.code(200);
    return response;

  }

  async deleteUserHandler(request, h) {
    const userUseCase = this._container.getInstance(UserUseCase.name);
    const { id: credentialId } = request.auth.credentials;
    const { userId } = request.params;
    await userUseCase.deleteUser(userId, credentialId);

    const response = h.response({
      status: 'success',
      message: 'Berhasil Menghapus Akun',
    });
    response.code(200);
    return response;

  }

  async getUserDetailHandler(request, h) {
    const userUseCase = this._container.getInstance(UserUseCase.name);
    const { id: credentialId } = request.auth.credentials;
    const data = await userUseCase.getUserDetail(credentialId);

    const response = h.response({
      status: 'success',
      data
    });

    response.code(200);
    return response;

  }

  async getAllUserHandler(request, h) {
    const userUseCase = this._container.getInstance(UserUseCase.name);
    const { id: credentialId } = request.auth.credentials;
    const data = await userUseCase.getAllUser(credentialId);

    const response = h.response({
      status: 'success',
      data
    });

    response.code(200);
    return response;

  }

  async postChangePasswordHandler(request, h) {
    const { id: credentialId } = request.auth.credentials;
    const changePasswordUseCase = this._container.getInstance(ChangePasswordUseCase.name);
    await changePasswordUseCase.execute(credentialId, request.payload);

    const response = h.response({
      status: 'success',
      message: 'berhasil merubah password',
    });
    response.code(200);
    return response;

  }

  async postLoginHandler(request, h) {

    const loginUseCase = this._container.getInstance(LoginUseCase.name);
    const loggedUser = await loginUseCase.execute(request.payload);

    const response = h.response({
      status: 'success',
      data: {
        ...loggedUser
      }
    });

    response.code(200);
    return response;

  }

  async postParentLinkHandler(request, h) {
    const { id: credentialId } = request.auth.credentials;
    const userUseCase = this._container.getInstance(UserUseCase.name);
    await userUseCase.parentLink(credentialId, request.payload);
    const response = h.response({
      status: 'success',
      message: 'Berhasil menghubungkan akun orang tua dan anak',
    });

    response.code(201);
    return response;

  }
}

module.exports = UsersHandler;