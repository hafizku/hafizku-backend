class VerseMemorization {
  constructor(payload) {
    this._verifyPayload(payload);


    const { id, juz, page, surah, verse, audio, status, score, created, updated } = payload;

    this.id = id;
    this.juz = juz;
    this.page = page;
    this.surah = surah;
    this.verse = verse;
    this.audio = audio;
    this.status = status;
    this.score = score;
    this.created = created;
    this.updated = updated;
  }

  _verifyPayload({ id, juz, page, surah, verse, audio, status, score, created, updated }) {
    if (!id, !juz, !page, !surah, !verse, !audio, !status, !score, !created, !updated) {
      throw new Error('NOT_CONTAIN_NEEDED_PROPERTY');
    }

    if (typeof id !== 'string' || typeof juz !== 'string' || typeof page !== 'string' || typeof surah !== 'string' || typeof verse !== 'string' || typeof audio !== 'string' || typeof status !== 'string' || typeof score !== 'string' || typeof created !== 'string' || typeof updated !== 'string') {
      throw new Error('NOT_MEET_DATA_TYPE_SPECIFICATION');
    }
  }
}

module.exports = VerseMemorization;