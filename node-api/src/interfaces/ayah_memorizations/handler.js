const AyahMemorizationUseCase = require('../../applications/usecases/AyahMemorizationUseCase');

class AyahMemorizationsHandler {
  constructor(container) {
    this._container = container;
    this.postAyahMemorizationHandler = this.postAyahMemorizationHandler.bind(this);
    this.putAyahMemorizationHandler = this.putAyahMemorizationHandler.bind(this);
    this.getAllJuzHandler = this.getAllJuzHandler.bind(this);
    this.getPagesByJuzHandler = this.getPagesByJuzHandler.bind(this);
    this.getVersesByPageHandler = this.getVersesByPageHandler.bind(this);
  }

  async postAyahMemorizationHandler(request, h) {
    const ayahMemorizationUseCase = this._container.getInstance(AyahMemorizationUseCase.name);
    const { id: credentialId } = request.auth.credentials;
    await ayahMemorizationUseCase.addAyahMemorization(credentialId, request.payload);

    const response = h.response({
      status: 'success',
      message: 'Berhasil menambah hafalan ayat',
    });
    response.code(201);
    return response;

  }

  async putAyahMemorizationHandler(request, h) {
    const ayahMemorizationUseCase = this._container.getInstance(AyahMemorizationUseCase.name);
    const { id: credentialId } = request.auth.credentials;
    const { ayahId } = request.params;
    await ayahMemorizationUseCase.editAyahMemorization(credentialId, ayahId, request.payload);

    const response = h.response({
      status: 'success',
      message: 'Berhasil mengupdate hafalan ayat',
    });
    response.code(200);
    return response;

  }

  async getAllJuzHandler(request, h) {
    const ayahMemorizationUseCase = this._container.getInstance(AyahMemorizationUseCase.name);
    const { id: credentialId } = request.auth.credentials;
    const data = await ayahMemorizationUseCase.getJuzMemorization(credentialId);

    const response = h.response({
      status: 'success',
      message: 'Berhasil menampilkan list juz',
      data
    });
    response.code(200);
    return response;

  }

  async getPagesByJuzHandler(request, h) {
    const ayahMemorizationUseCase = this._container.getInstance(AyahMemorizationUseCase.name);
    const { id: credentialId } = request.auth.credentials;
    const { juzId } = request.params;
    const data = await ayahMemorizationUseCase.getPageMemorization(credentialId, juzId);

    const response = h.response({
      status: 'success',
      message: 'Berhasil menampilkan list halaman',
      data
    });
    response.code(200);
    return response;

  }

  async getVersesByPageHandler(request, h) {
    const ayahMemorizationUseCase = this._container.getInstance(AyahMemorizationUseCase.name);
    const { id: credentialId } = request.auth.credentials;
    const { pageId } = request.params;
    const data = await ayahMemorizationUseCase.getAyahMemorization(credentialId, pageId);

    const response = h.response({
      status: 'success',
      message: 'Berhasil menampilkan list ayat',
      data
    });
    response.code(200);
    return response;

  }
}

module.exports = AyahMemorizationsHandler;