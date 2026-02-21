class AddVerseMemorization {
  constructor(payload) {
    this._verifyPayload(payload);


    const { juz, page, surah, verse, audio, status, score, threshold, wordstranscript } = payload;

    this.juz = juz;
    this.page = page;
    this.surah = surah;
    this.verse = verse;
    this.audio = audio;
    this.status = status;
    this.score = score;
    this.threshold = threshold;
    this.wordstranscript = wordstranscript;
  }

  _verifyPayload({ juz, page, surah, verse, audio, status, score, threshold, wordstranscript }) {
    if (!juz, !page, !surah, !verse, !audio, !status, !score, !threshold, !wordstranscript) {
      throw new Error('NOT_CONTAIN_NEEDED_PROPERTY');
    }

    if (typeof juz !== 'string' || typeof page !== 'string' || typeof surah !== 'string' || typeof verse !== 'string' || typeof audio !== 'string' || typeof status !== 'string' || typeof score !== 'string' || typeof threshold !== 'string' || !Array.isArray(wordstranscript)) {
      throw new Error('NOT_MEET_DATA_TYPE_SPECIFICATION');
    }
  }
}

module.exports = AddVerseMemorization;