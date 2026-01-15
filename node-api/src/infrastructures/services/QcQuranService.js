const QuranService = require("../../applications/services/QuranService");

class QcQuranService extends QuranService {
  constructor(quran) {
    super();
    this._quran = quran;
  }

  async getAllJuz() {
    return this._quran.getAllJuz();
  }

  async getPagesByJuz(juz) {
    return this._quran.getPagesByJuz(parseInt(juz, 10));
  }

  async getVersesByPage(page) {
    return this._quran.getVersesByPage(parseInt(page, 10));
  }
}

module.exports = QcQuranService;