class EditAyahMemorization {
  constructor(payload) {
    this._verifyPayload(payload);


    const { audio, status, score } = payload;

    this.audio = audio;
    this.status = status;
    this.score = score;
  }

  _verifyPayload({ audio, status, score }) {
    if (!audio, !status, !score) {
      throw new Error('NOT_CONTAIN_NEEDED_PROPERTY');
    }

    if (typeof audio !== 'string' || typeof status !== 'string' || typeof score !== 'string') {
      throw new Error('NOT_MEET_DATA_TYPE_SPECIFICATION');
    }
  }
}

module.exports = EditAyahMemorization;