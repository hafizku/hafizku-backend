const UserRepository = require("../../../domains/users/UserRepository");
const InvariantError = require('../../../commons/exceptions/InvariantError');
const AuthenticationError = require("../../../commons/exceptions/AuthenticationError");
const AuthorizationError = require("../../../commons/exceptions/AuthorizationError");
const NotFoundError = require("../../../commons/exceptions/NotFoundError");
require('dotenv').config();

class UserRepositoryPostgres extends UserRepository {
  constructor(pool, idGenerator, dayjs) {
    super();
    this._pool = pool;
    this._idGenerator = idGenerator;
    this._dayjs = dayjs;
  }

  async verifyAvailableEmail(email) {
    const query = {
      text: 'SELECT email FROM users WHERE email = $1',
      values: [email]
    };

    const result = await this._pool.query(query);

    if (result.rowCount) {
      throw new InvariantError('Email sudah digunakan');
    }
  }

  async verifyAvailablePhone(phone) {
    const query = {
      text: 'SELECT phone FROM users WHERE phone = $1',
      values: [phone]
    };

    const result = await this._pool.query(query);

    if (result.rowCount) {
      throw new InvariantError('Nomor HP sudah digunakan');
    }
  }

  async verifyAvailableUsername(username) {
    const query = {
      text: 'SELECT username FROM users WHERE username = $1',
      values: [username]
    };

    const result = await this._pool.query(query);

    if (result.rowCount) {
      throw new InvariantError('Username sudah digunakan');
    }
  }

  async verifyAdmin(credentialId) {
    const query = {
      text: 'SELECT role FROM users WHERE id = $1',
      values: [credentialId],
    };

    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('user tidak ditemukan');
    }

    if (result.rows[0].role !== 'admin') {
      throw new AuthorizationError('Akses ditolak');
    }
  }

  async addUser(registerUser) {
    const { username, email, password, name, role, phone, token } = registerUser;

    let queryData;

    const id = `user-${this._idGenerator()}`;
    let roleData = role;
    if (token != null && token != '-' && token == process.env.ADMIN_TOKEN) {
      roleData = 'admin';
    } else {
      if (roleData == 'admin') throw new AuthorizationError('Pembuatan akun admin ditolak');
    }
    let tokenParent = '-';
    if (role == 'parent') {
      tokenParent = `${name}-${this._idGenerator()}`;
    }
    const date = this._dayjs().tz().format('DD/MM/YYYY HH:mm:ss');

    if (username == '-') {
      queryData = {
        text: 'INSERT INTO users (id, email, password, name, phone, avatar, status, role, token, created, updated) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)',
        values: [id, email, password, name, phone, '-', 'free', roleData, tokenParent, date, date]
      }
    } else {
      queryData = {
        text: 'INSERT INTO users (id, username, password, name, phone, avatar, status, role, token, created, updated) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)',
        values: [id, username, password, name, phone, '-', 'free', roleData, tokenParent, date, date]
      }
    }

    return this._pool.query(queryData);
  }

  async editUser(userId, editUser) {
    const { name, phone, birthdate, gender, avatar } = editUser;
    const date = this._dayjs().tz().format('DD/MM/YYYY HH:mm:ss');

    const query = {
      text: 'UPDATE users SET name = $1, phone = $2, birth_date = $3, updated = $4, gender = $5, avatar = $6 WHERE id = $7',
      values: [name, phone, birthdate, date, gender, avatar, userId]
    };

    await this._pool.query(query);
  }

  async changePassword(userId, changePassword) {
    const { newPassword } = changePassword;
    const date = this._dayjs().tz().format('DD/MM/YYYY HH:mm:ss');

    const query = {
      text: 'UPDATE users SET password = $1, updated = $2 WHERE id = $3',
      values: [newPassword, date, userId]
    };

    await this._pool.query(query);
  }

  async getUserByEmailOrPhone(email) {
    let queryText;
    if (email.includes('@')) {
      queryText = 'SELECT id, username, email, password, name, role, status, avatar FROM users WHERE email = $1';
    } else {
      queryText = 'SELECT id, email, password, name, role, status, avatar FROM users WHERE phone = $1';
    }
    const query = {
      text: queryText,
      values: [email]
    };

    const result = await this._pool.query(query);
    if (result.rowCount) {
      return { ...result.rows[0] };
    } else {
      throw new AuthenticationError('akun belum terdaftar');
    }

  }

  async getUserByUsername(username) {
    const query = {
      text: "SELECT id, username, email, password, name, role, status, avatar FROM users WHERE username = $1",
      values: [username]
    };

    const result = await this._pool.query(query);
    if (result.rowCount) {
      return { ...result.rows[0] };
    } else {
      throw new AuthenticationError('akun belum terdaftar');
    }

  }

  async getUserDetail(id) {
    const query = {
      text: 'SELECT * FROM users WHERE id = $1',
      values: [id]
    };

    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('data tidak ditemukan');
    }

    return { ...result.rows[0] };

  }

  async getParentName(id) {
    const query = {
      text: 'SELECT u.name FROM users AS u LEFT JOIN parentchilds AS pc ON pc.parent_id = u.id WHERE pc.child_id = $1',
      values: [id]
    };

    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('data tidak ditemukan');
    }

    return result.rows[0].name;

  }

  async getAllUser() {
    const query = {
      text: 'SELECT * FROM users',
      values: []
    };

    const result = await this._pool.query(query);
    // const users = [];
    // // eslint-disable-next-line no-plusplus
    // for (let i = 0; i < result.rowCount; i++) {
    //   const user = {
    //     ...result.rows[i],
    //   };
    //   users.push({ ...user });
    // }

    return result.rows;

  }

  async deleteUser(id) {
    const query = {
      text: 'DELETE FROM users WHERE id = $1',
      values: [id],
    };

    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('data tidak ditemukan');
    }
  }

  async parentLink(userId, parentId) {
    const id = `parentchild-${this._idGenerator()}`;
    const date = this._dayjs().tz().format('DD/MM/YYYY HH:mm:ss');

    const query = {
      text: 'INSERT INTO parentchilds VALUES($1,$2,$3,$4,$5)',
      values: [id, parentId, userId, date, date]
    };

    return this._pool.query(query);
  }

  async verifyParentToken(token) {
    const query = {
      text: 'SELECT id FROM users WHERE token = $1',
      values: [token]
    };

    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('token tidak valid');
    }

    return result.rows[0].id;

  }

  async checkParentChild(userId, parentId) {
    const query = {
      text: 'SELECT id FROM parentchilds WHERE parent_id = $1 AND child_id = $2',
      values: [parentId, userId]
    };

    const result = await this._pool.query(query);

    if (result.rowCount) {
      throw new InvariantError('Akun sudah terhubung');
    }
  }

  async verifyParentChild(parentId, childId) {
    const query = {
      text: 'SELECT id FROM parentchilds WHERE parent_id = $1 AND child_id = $2',
      values: [parentId, childId]
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Belum ada akun anak yang terhubung');
    }
  }

  async getListChild(parentId) {
    const query = {
      text: "SELECT u.id, u.name, u.avatar FROM users u JOIN parentchilds pc ON u.id = pc.child_id WHERE pc.parent_id = $1 GROUP BY u.id, u.name",
      values: [parentId]
    };

    const result = await this._pool.query(query);

    return result.rows;
  }

  async getScoreChild(childId) {
    const query = {
      text: "SELECT ROUND(AVG(CAST(NULLIF(regexp_replace(vm.score, '[^0-9.]', '', 'g'), '') AS NUMERIC)), 0) AS total_score FROM users u JOIN parentchilds pc ON u.id = pc.child_id JOIN versememorizations vm ON vm.user_id = u.id WHERE vm.status = 'memorized' AND pc.child_id = $1",
      values: [childId]
    };

    const result = await this._pool.query(query);

    return result.rows[0].total_score;
  }


}

module.exports = UserRepositoryPostgres;