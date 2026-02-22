const ParentalPraiseRepository = require("../../../domains/parental_praise/ParentalPraiseRepository");
const ParentalPraise = require("../../../domains/parental_praise/entities/ParentalPraise");
const NotFoundError = require("../../../commons/exceptions/NotFoundError");

class ParentalPraiseRepositoryPostgres extends ParentalPraiseRepository {
  constructor(pool, idGenerator, dayjs) {
    super();
    this._pool = pool;
    this._idGenerator = idGenerator;
    this._dayjs = dayjs;
  }


  async addParentalPraise(verseMemoId, parentId, childId, addParentalPraise) {
    const { praise, voice } = addParentalPraise;
    const id = `parentalpraise-${this._idGenerator()}`;
    const date = this._dayjs().tz().format('DD/MM/YYYY HH:mm:ss');

    const query = {
      text: 'INSERT INTO parental_praise VALUES($1,$2,$3,$4,$5,$6,$7,$8)',
      values: [id, verseMemoId, parentId, childId, praise, voice, date, date]
    };

    const result = await this._pool.query(query);

    return result.rows[0];
  }


  async editParentalPraise(parentalPraiseId, parentId, childId, editParentalPraise) {
    const { praise, voice } = editParentalPraise;

    const date = this._dayjs().tz().format('DD/MM/YYYY HH:mm:ss');

    const query = {
      text: 'UPDATE parental_praise SET praise = $1, voice = $2, updated = $3 WHERE id = $4 AND child_id = $5 AND parent_id = $6',
      values: [praise, voice, date, parentalPraiseId, childId, parentId]
    };

    await this._pool.query(query);
  }

  async deleteParentalPraise(parentalPraiseId) {
    const query = {
      text: 'DELETE FROM parental_praise WHERE id = $1',
      values: [parentalPraiseId],
    };

    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('data tidak ditemukan');
    }
  }


  async getParentalPraise(verseMemoId, parentId, childId) {
    const query = {
      text: "SELECT id, praise, voice, created, updated FROM parental_praise WHERE versememorization_id = $1 AND parent_id = $2 AND child_id = $3",
      values: [verseMemoId, parentId, childId]
    };

    const result = await this._pool.query(query);
    return result.rows;
  }
}

module.exports = ParentalPraiseRepositoryPostgres;