class AddAyahMemorization {
  constructor(payload) {
    this._verifyPayload(payload);


    const { juz, page, surah, ayah, audio, status, score } = payload;

    this.juz = juz;
    this.page = page;
    this.surah = surah;
    this.ayah = ayah;
    this.audio = audio;
    this.status = status;
    this.score = score;
  }

  _verifyPayload({ juz, page, surah, ayah, audio, status, score }) {
    if (!juz, !page, !surah, !ayah, !audio, !status, !score) {
      throw new Error('NOT_CONTAIN_NEEDED_PROPERTY');
    }

    if (typeof juz !== 'string' || typeof page !== 'string' || typeof surah !== 'string' || typeof ayah !== 'string' || typeof audio !== 'string' || typeof status !== 'string' || typeof score !== 'string') {
      throw new Error('NOT_MEET_DATA_TYPE_SPECIFICATION');
    }
  }
}

module.exports = AddAyahMemorization;