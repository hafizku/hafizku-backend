const QuranService = require("../../applications/services/QuranService");
const NotFoundError = require("../../commons/exceptions/NotFoundError");

class QcQuranService extends QuranService {
  constructor(quran) {
    super();
    this._quran = quran;
  }

  async getAllJuz() {
    return this._quran.getAllJuz();
  }

  async getPagesByJuz(juz) {
    const data = await this._quran.getPagesByJuz(parseInt(juz, 10));
    if (data === undefined || data.length == 0) {
      throw new NotFoundError("data tidak ditemukan");
    }
    return data;
  }

  async getVersesByPage(page) {
    const data = await this._quran.getVersesByPage(parseInt(page, 10));
    if (data === undefined) {
      throw new NotFoundError("data tidak ditemukan");
    }

    return data;
  }

  async getVerseDetail(page, verseId) {
    try {
      const data = await this._quran.getVerseDetail(parseInt(page, 10), parseInt(verseId, 10));
      if (data === undefined) {
        throw new NotFoundError("data tidak ditemukan");
      }
      return data;
    } catch (error) {
      throw new NotFoundError("data tidak ditemukan");
    }

  }

  async getChapterById(chapterId) {
    const data = await this._quran.getChapterById(parseInt(chapterId, 10));
    if (data === undefined) {
      throw new NotFoundError("data tidak ditemukan");
    }
    return data;
  }
}

module.exports = QcQuranService;