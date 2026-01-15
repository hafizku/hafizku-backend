const AyahMemorizationRepository = require("../../../domains/ayah_memorizations/AyahMemorizationRepository");
const AyahMemorization = require("../../../domains/ayah_memorizations/entities/AyahMemorization");

class AyahMemorizationRepositoryPostgres extends AyahMemorizationRepository {
  constructor(pool, idGenerator, moment) {
    super();
    this._pool = pool;
    this._idGenerator = idGenerator;
    this._moment = moment;
  }


  async addAyahMemorization(userId, addAyahMemorization) {
    const { juz, page, surah, ayah, audio, status, score } = addAyahMemorization;
    const id = `ayahmemorization-${this._idGenerator()}`;
    const date = this._moment().format('DD/MM/YYYY HH:mm:ss');

    const query = {
      text: 'INSERT INTO ayahmemorizations VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)',
      values: [id, userId, juz, page, surah, ayah, audio, status, score, date, date]
    };

    return this._pool.query(query);
  }

  async editAyahMemorization(ayahId, userId, editAyahMemorization) {
    const { audio, status, score } = editAyahMemorization;
    const date = this._moment().format('DD/MM/YYYY HH:mm:ss');

    const query = {
      text: 'UPDATE ayahmemorizations SET audio = $1, status = $2, score = $3, updated = $4 WHERE id = $5 AND user_id = $6',
      values: [audio, status, score, date, ayahId, userId]
    };

    await this._pool.query(query);
  }

  async getAyahMemorization(userId, page) {
    const query = {
      text: "SELECT id, ayah, surah, juz, score, updated FROM ayahmemorizations WHERE page = $1 AND user_id = $2",
      values: [page, userId]
    };

    const result = await this._pool.query(query);
    return result.rows;
  }

  async getJuzMemorization(userId) {
    const query = {
      text: "SELECT juz, COUNT(*) AS verses_memorized FROM ayahmemorizations WHERE status = 'memorized' AND user_id = $1 GROUP BY juz ORDER BY juz",
      values: [userId]
    };

    const result = await this._pool.query(query);
    return result.rows;
  }

  async getPageMemorization(userId, juz) {
    const query = {
      text: "SELECT page, COUNT(*) AS verses_memorized FROM ayahmemorizations WHERE status = 'memorized' AND juz = $1 AND user_id = $2 GROUP BY page ORDER BY page",
      values: [juz, userId]
    };

    const result = await this._pool.query(query);
    return result.rows;
  }
}

module.exports = AyahMemorizationRepositoryPostgres;