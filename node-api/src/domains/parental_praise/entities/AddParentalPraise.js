class AddParentalPraise {
  constructor(payload) {
    this._verifyPayload(payload);


    const { praise, voice } = payload;

    this.praise = praise;
    this.voice = voice;

  }

  _verifyPayload({ praise, voice, }) {
    if (!praise, !voice) {
      throw new Error('NOT_CONTAIN_NEEDED_PROPERTY');
    }

    if (typeof praise !== 'string' || typeof voice !== 'string') {
      throw new Error('NOT_MEET_DATA_TYPE_SPECIFICATION');
    }
  }
}

module.exports = AddParentalPraise;