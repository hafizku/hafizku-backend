const ParentalPraiseUseCase = require('../../applications/usecases/ParentalPraiseUseCase');

class ParentalPraiseHandler {
  constructor(container) {
    this._container = container;
    this.postParentalPraiseHandler = this.postParentalPraiseHandler.bind(this);
    this.putParentalPraiseHandler = this.putParentalPraiseHandler.bind(this);
    this.getParentalPraiseHandler = this.getParentalPraiseHandler.bind(this);
    this.deleteParentalPraiseHandler = this.deleteParentalPraiseHandler.bind(this);
  }

  async postParentalPraiseHandler(request, h) {

    const parentalPraiseUseCase = this._container.getInstance(ParentalPraiseUseCase.name);
    const { id: credentialId } = request.auth.credentials;
    const { childId, verseMemoId } = request.params;
    const data = await parentalPraiseUseCase.addParentalPraise(verseMemoId, credentialId, childId, request.payload);

    const response = h.response({
      status: 'success',
      message: 'Berhasil menambah kata semangat',
      data
    });
    response.code(201);
    return response;

  }

  async putParentalPraiseHandler(request, h) {

    const parentalPraiseUseCase = this._container.getInstance(ParentalPraiseUseCase.name);
    const { id: credentialId } = request.auth.credentials;
    const { parentalPraiseId, childId } = request.params;
    const data = await parentalPraiseUseCase.editParentalPraise(parentalPraiseId, credentialId, childId, request.payload);

    const response = h.response({
      status: 'success',
      message: 'Berhasil mengupdate kata semangat',
      data
    });
    response.code(200);
    return response;

  }

  async getParentalPraiseHandler(request, h) {
    const parentalPraiseUseCase = this._container.getInstance(ParentalPraiseUseCase.name);
    const { id: credentialId } = request.auth.credentials;
    const { verseMemoId, childId } = request.params;
    const data = await parentalPraiseUseCase.getParentalPraise(verseMemoId, childId);

    const response = h.response({
      status: 'success',
      message: 'Berhasil menampilkan kata semangat',
      data
    });
    response.code(200);
    return response;

  }

  async deleteParentalPraiseHandler(request, h) {
    const { id: credentialId } = request.auth.credentials;
    const { parentalPraiseId } = request.params;
    const parentalPraiseUseCase = this._container.getInstance(ParentalPraiseUseCase.name);
    const data = await parentalPraiseUseCase.deleteParentalPraise(parentalPraiseId);
    const response = h.response({
      status: 'success',
      message: 'Berhasil menghapus kata semangat',
      data
    });

    response.code(200);
    return response;

  }
}

module.exports = ParentalPraiseHandler;