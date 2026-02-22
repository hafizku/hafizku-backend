class ParentalPraise {
  constructor(payload) {
    this._verifyPayload(payload);


    const { id, praise, voice, created, updated } = payload;

    this.id = id;
    this.praise = praise;
    this.voice = voice;
    this.created = created;
    this.updated = updated;
  }

  _verifyPayload({ id, praise, voice, created, updated }) {
    if (!id, !praise, !voice, !created, !updated) {
      throw new Error('NOT_CONTAIN_NEEDED_PROPERTY');
    }

    if (typeof id !== 'string' || typeof praise !== 'string' || typeof voice !== 'string' || typeof created !== 'string' || typeof updated !== 'string') {
      throw new Error('NOT_MEET_DATA_TYPE_SPECIFICATION');
    }
  }
}

module.exports = ParentalPraise;