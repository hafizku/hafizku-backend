class EditVerseMemorization {
  constructor(payload) {
    this._verifyPayload(payload);


    const { audio, status, score, threshold, wordstranscript } = payload;

    this.audio = audio;
    this.status = status;
    this.score = score;
    this.threshold = threshold;
    this.wordstranscript = wordstranscript;
  }

  _verifyPayload({ audio, status, score, threshold, wordstranscript }) {
    if (!audio, !status, !score, !threshold, !wordstranscript) {
      throw new Error('NOT_CONTAIN_NEEDED_PROPERTY');
    }

    if (typeof audio !== 'string' || typeof status !== 'string' || typeof score !== 'string' || typeof threshold !== 'string' || !Array.isArray(wordstranscript)) {
      throw new Error('NOT_MEET_DATA_TYPE_SPECIFICATION');
    }
  }
}

module.exports = EditVerseMemorization;