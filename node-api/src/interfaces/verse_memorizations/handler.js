const VerseMemorizationUseCase = require('../../applications/usecases/VerseMemorizationUseCase');

class VerseMemorizationsHandler {
  constructor(container) {
    this._container = container;
    this.postVerseMemorizationHandler = this.postVerseMemorizationHandler.bind(this);
    this.putVerseMemorizationHandler = this.putVerseMemorizationHandler.bind(this);
    this.getAllJuzHandler = this.getAllJuzHandler.bind(this);
    this.getPagesByJuzHandler = this.getPagesByJuzHandler.bind(this);
    this.getVersesByPageHandler = this.getVersesByPageHandler.bind(this);
    this.getVerseDetailHandler = this.getVerseDetailHandler.bind(this);
  }

  async postVerseMemorizationHandler(request, h) {
    const verseMemorizationUseCase = this._container.getInstance(VerseMemorizationUseCase.name);
    const { id: credentialId } = request.auth.credentials;
    await verseMemorizationUseCase.addVerseMemorization(credentialId, request.payload);

    const response = h.response({
      status: 'success',
      message: 'Berhasil menambah hafalan ayat',
    });
    response.code(201);
    return response;

  }

  async putVerseMemorizationHandler(request, h) {
    const verseMemorizationUseCase = this._container.getInstance(VerseMemorizationUseCase.name);
    const { id: credentialId } = request.auth.credentials;
    const { verseId } = request.params;
    await verseMemorizationUseCase.editVerseMemorization(credentialId, verseId, request.payload);

    const response = h.response({
      status: 'success',
      message: 'Berhasil mengupdate hafalan ayat',
    });
    response.code(200);
    return response;

  }

  async getAllJuzHandler(request, h) {
    const verseMemorizationUseCase = this._container.getInstance(VerseMemorizationUseCase.name);
    const { id: credentialId } = request.auth.credentials;
    const data = await verseMemorizationUseCase.getJuzMemorization(credentialId);

    const response = h.response({
      status: 'success',
      message: 'Berhasil menampilkan daftar juz',
      memorized_juz: data.memorized_juz,
      data: data.merged
    });
    response.code(200);
    return response;

  }

  async getPagesByJuzHandler(request, h) {
    const verseMemorizationUseCase = this._container.getInstance(VerseMemorizationUseCase.name);
    const { id: credentialId } = request.auth.credentials;
    const { juzId } = request.params;
    const data = await verseMemorizationUseCase.getPageMemorization(credentialId, juzId);

    const response = h.response({
      status: 'success',
      message: 'Berhasil menampilkan daftar halaman',
      memorized_page: data.memorized_page,
      data: data.merged
    });
    response.code(200);
    return response;

  }

  async getVersesByPageHandler(request, h) {
    const verseMemorizationUseCase = this._container.getInstance(VerseMemorizationUseCase.name);
    const { id: credentialId } = request.auth.credentials;
    const { pageId } = request.params;
    const data = await verseMemorizationUseCase.getVerseMemorization(credentialId, pageId);

    const response = h.response({
      status: 'success',
      message: 'Berhasil menampilkan daftar ayat',
      memorized_verse: data.memorized_verse,
      data: data.merged
    });
    response.code(200);
    return response;

  }

  async getVerseDetailHandler(request, h) {
    const verseMemorizationUseCase = this._container.getInstance(VerseMemorizationUseCase.name);
    const { id: credentialId } = request.auth.credentials;
    const { pageId, verseId } = request.params;
    const data = await verseMemorizationUseCase.getVerseDetailMemorization(credentialId, pageId, verseId);

    const response = h.response({
      status: 'success',
      message: 'Berhasil menampilkan detail ayat',
      data
    });
    response.code(200);
    return response;

  }
}

module.exports = VerseMemorizationsHandler;