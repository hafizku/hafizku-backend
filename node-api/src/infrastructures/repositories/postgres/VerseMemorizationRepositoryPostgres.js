const VerseMemorizationRepository = require("../../../domains/verse_memorizations/VerseMemorizationRepository");
const VerseMemorization = require("../../../domains/verse_memorizations/entities/VerseMemorization");
const NotFoundError = require("../../../commons/exceptions/NotFoundError");

class VerseMemorizationRepositoryPostgres extends VerseMemorizationRepository {
  constructor(pool, idGenerator, dayjs) {
    super();
    this._pool = pool;
    this._idGenerator = idGenerator;
    this._dayjs = dayjs;
  }


  async addVerseMemorization(userId, verseId, addVerseMemorization) {
    const { juz, page, surah, verse, audio, status, score, threshold, wordstranscript } = addVerseMemorization;
    const id = `versememorization-${this._idGenerator()}`;
    const date = this._dayjs().tz().format('DD/MM/YYYY HH:mm:ss');

    const query = {
      text: 'INSERT INTO versememorizations VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING id, score, page, verse_id',
      values: [id, userId, juz, page, surah, verse, audio, status, score, threshold, wordstranscript, date, date, verseId]
    };

    const result = await this._pool.query(query);

    return result.rows[0];
  }


  async editVerseMemorization(verseId, userId, editVerseMemorization) {
    const { audio, status, score, threshold, wordstranscript } = editVerseMemorization;

    const date = this._dayjs().tz().format('DD/MM/YYYY HH:mm:ss');

    const query = {
      text: 'UPDATE versememorizations SET audio = $1, status = $2, score = $3, threshold = $4, words = $5, updated = $6 WHERE id = $7 AND user_id = $8',
      values: [audio, status, score, threshold, JSON.stringify(wordstranscript), date, verseId, userId]
    };

    await this._pool.query(query);
  }


  async getVerseDetailMemorization(userId, verseMemoId) {
    const query = {
      text: "SELECT id, score, status, threshold, words, audio FROM versememorizations WHERE id = $1 AND user_id = $2",
      values: [verseMemoId, userId]
    };

    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('data tidak ditemukan');
    }

    return { ...result.rows[0] };
  }

  async getVerseMemorization(userId, page) {
    const query = {
      text: "SELECT id, verse, surah, juz, score, threshold, status, audio, updated FROM versememorizations WHERE page = $1 AND user_id = $2",
      values: [page, userId]
    };

    const result = await this._pool.query(query);
    return result.rows;
  }

  async getLastVerseMemorization(userId) {
    const query = {
      text: "SELECT id, verse, surah, page, juz, score, updated FROM versememorizations WHERE status = 'memorizing' AND user_id = $1 ORDER BY updated DESC",
      values: [userId]
    };

    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('tidak ada ayat yang sedang dihafal');
    }
    return result.rows[0];
  }

  async getJuzMemorization(userId) {
    const query = {
      text: "SELECT juz, COUNT(*) AS verses_memorized FROM versememorizations WHERE status = 'memorized' AND user_id = $1 GROUP BY juz ORDER BY juz",
      values: [userId]
    };

    const result = await this._pool.query(query);
    return result.rows;
  }

  async getPageMemorization(userId, juz) {
    const query = {
      text: "SELECT page, COUNT(*) AS verses_memorized FROM versememorizations WHERE status = 'memorized' AND juz = $1 AND user_id = $2 GROUP BY page ORDER BY page",
      values: [juz, userId]
    };

    const result = await this._pool.query(query);
    return result.rows;
  }
}

module.exports = VerseMemorizationRepositoryPostgres;