const UserRepository = require("../../../domains/users/UserRepository");
const InvariantError = require('../../../commons/exceptions/InvariantError');
const AuthenticationError = require("../../../commons/exceptions/AuthenticationError");
const AuthorizationError = require("../../../commons/exceptions/AuthorizationError");
const NotFoundError = require("../../../commons/exceptions/NotFoundError");
require('dotenv').config();

class UserRepositoryPostgres extends UserRepository {
  constructor(pool, idGenerator, moment) {
    super();
    this._pool = pool;
    this._idGenerator = idGenerator;
    this._moment = moment;
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
    const { email, password, name, role, phone, token } = registerUser;
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
    const date = this._moment().format('DD/MM/YYYY HH:mm:ss');

    const query = {
      text: 'INSERT INTO users VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)',
      values: [id, email, password, name, phone, '-', 'free', roleData, tokenParent, date, date]
    };

    return this._pool.query(query);
  }

  async editUser(userId, editUser) {
    const { name, phone, avatar } = editUser;
    const date = this._moment().format('DD/MM/YYYY HH:mm:ss');

    const query = {
      text: 'UPDATE users SET name = $1, phone = $2, avatar = $3, updated = $4 WHERE id = $5',
      values: [name, phone, avatar, date, userId]
    };

    await this._pool.query(query);
  }

  async changePassword(userId, changePassword) {
    const { newPassword } = changePassword;
    const date = this._moment().format('DD/MM/YYYY HH:mm:ss');

    const query = {
      text: 'UPDATE users SET password = $1, updated = $2 WHERE id = $3',
      values: [newPassword, date, userId]
    };

    await this._pool.query(query);
  }

  async getUserByEmail(email) {
    const query = {
      text: 'SELECT id, email, password, name, role, status, avatar FROM users WHERE email = $1',
      values: [email]
    };

    const result = await this._pool.query(query);
    if (result.rowCount) {
      return { ...result.rows[0] };
    } else {
      throw new AuthenticationError('email belum terdaftar');
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
    const date = this._moment().format('DD/MM/YYYY HH:mm:ss');

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


}

module.exports = UserRepositoryPostgres;