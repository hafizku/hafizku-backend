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
    this.getSummaryVerseMemorizationHandler = this.getSummaryVerseMemorizationHandler.bind(this);
    this.getChildsSummaryHandler = this.getChildsSummaryHandler.bind(this);
    this.getAllJuzChildHandler = this.getAllJuzChildHandler.bind(this);
    this.getPagesByJuzChildHandler = this.getPagesByJuzChildHandler.bind(this);
    this.getVersesByPageChildHandler = this.getVersesByPageChildHandler.bind(this);
  }

  async postVerseMemorizationHandler(request, h) {

    const verseMemorizationUseCase = this._container.getInstance(VerseMemorizationUseCase.name);
    const { id: credentialId } = request.auth.credentials;
    const { verseId } = request.params;
    const data = await verseMemorizationUseCase.addVerseMemorization(credentialId, verseId, request.payload);

    const response = h.response({
      status: 'success',
      message: 'Berhasil menambah hafalan ayat',
      data
    });
    response.code(201);
    return response;

  }

  async putVerseMemorizationHandler(request, h) {

    const verseMemorizationUseCase = this._container.getInstance(VerseMemorizationUseCase.name);
    const { id: credentialId } = request.auth.credentials;
    const { verseId } = request.params;
    const data = await verseMemorizationUseCase.editVerseMemorization(credentialId, verseId, request.payload);

    const response = h.response({
      status: 'success',
      message: 'Berhasil mengupdate hafalan ayat',
      data
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
      memorized_verse: data.memorized_verse,
      total_verse: data.total_verse,
      data: data.merged
    });
    response.code(200);
    return response;

  }

  async getAllJuzChildHandler(request, h) {
    const verseMemorizationUseCase = this._container.getInstance(VerseMemorizationUseCase.name);
    const { id: credentialId } = request.auth.credentials;
    const { childId } = request.params;
    const data = await verseMemorizationUseCase.getJuzChildMemorization(credentialId, childId);

    const response = h.response({
      status: 'success',
      message: 'Berhasil menampilkan daftar hafalan juz anak',
      memorized_juz: data.memorized_juz,
      memorized_verse: data.memorized_verse,
      total_verse: data.total_verse,
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
      memorized_verse: data.memorized_verse,
      total_verse: data.total_verse,
      data: data.merged
    });
    response.code(200);
    return response;

  }

  async getPagesByJuzChildHandler(request, h) {
    const verseMemorizationUseCase = this._container.getInstance(VerseMemorizationUseCase.name);
    const { id: credentialId } = request.auth.credentials;
    const { childId, juzId } = request.params;
    const data = await verseMemorizationUseCase.getPageChildMemorization(credentialId, childId, juzId);

    const response = h.response({
      status: 'success',
      message: 'Berhasil menampilkan daftar halaman anak',
      memorized_page: data.memorized_page,
      memorized_verse: data.memorized_verse,
      total_verse: data.total_verse,
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

  async getVersesByPageChildHandler(request, h) {
    const verseMemorizationUseCase = this._container.getInstance(VerseMemorizationUseCase.name);
    const { id: credentialId } = request.auth.credentials;
    const { childId, pageId } = request.params;
    const data = await verseMemorizationUseCase.getVerseChildMemorization(credentialId, childId, pageId);

    const response = h.response({
      status: 'success',
      message: 'Berhasil menampilkan daftar ayat anak',
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
    const { verseMemoId } = request.query;
    const data = await verseMemorizationUseCase.getVerseDetailMemorization(credentialId, pageId, verseId, verseMemoId);

    const response = h.response({
      status: 'success',
      message: 'Berhasil menampilkan detail ayat',
      data
    });
    response.code(200);
    return response;

  }

  async getSummaryVerseMemorizationHandler(request, h) {
    const verseMemorizationUseCase = this._container.getInstance(VerseMemorizationUseCase.name);
    const { id: credentialId } = request.auth.credentials;
    const data = await verseMemorizationUseCase.getSummaryVerseMemorization(credentialId);

    const response = h.response({
      status: 'success',
      message: 'Berhasil menampilkan hafalan ayat terakhir',
      ...data
    });
    response.code(200);
    return response;

  }

  async getChildsSummaryHandler(request, h) {
    const { id: credentialId } = request.auth.credentials;
    const verseMemorizationUseCase = this._container.getInstance(VerseMemorizationUseCase.name);
    const data = await verseMemorizationUseCase.getChildSummary(credentialId);
    const response = h.response({
      status: 'success',
      message: 'Berhasil mendapatkan data summary anak',
      data
    });

    response.code(200);
    return response;

  }
}

module.exports = VerseMemorizationsHandler;