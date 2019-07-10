const bcrypt = require('bcrypt');
const pool = require('../util/database');

module.exports = class User {
  constructor(email, password, firstname, lastname) {
    this.email = email;
    this.password = password;
    this.firstname = firstname;
    this.lastname = lastname;
  }

  save() {
    const saltRounds = 5;
    const hashedPassword = bcrypt.hashSync(this.password, saltRounds);

    const sql = `INSERT INTO public.users(
      email, password, firstname, lastname)
      VALUES (
        '${this.email}', '${hashedPassword}', '${this.firstname}', '${this.lastname}'
      )`;
    
    return pool.query(sql);
  }

  find() {
    const sql = `SELECT * FROM public.users WHERE email = '${this.email}'`;
    return pool.query(sql);
  }
}
