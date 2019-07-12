const bcrypt = require('bcrypt');
const pool = require('../util/database');

module.exports = class User {
  constructor(email, password, firstname, lastname, isfulltime, roleid) {
    this.email = email;
    this.password = password;
    this.firstname = firstname;
    this.lastname = lastname;
    this.isfulltime = isfulltime;
    this.roleid = roleid;
  }

  save() {
    const saltRounds = 5;
    const hashedPassword = bcrypt.hashSync(this.password, saltRounds);

    const sql = `INSERT INTO public.users(
      email, password, firstname, lastname, isfulltime, roleid)
      VALUES (
        '${this.email}', '${hashedPassword}', '${this.firstname}', 
        '${this.lastname}', ${this.isfulltime}, ${this.roleid}
      )`;

    return pool.query(sql);
  }

  find() {
    const sql = `SELECT * FROM public.users WHERE email = '${this.email}'`;
    return pool.query(sql);
  }

  update() {
    let sql;
    if (this.password !== undefined) {
      const saltRounds = 5;
      const hashedPassword = bcrypt.hashSync(this.password, saltRounds);

      sql = `UPDATE public.users
      SET password='${hashedPassword}', isfulltime=${this.isfulltime}, roleid=${
        this.roleid
      }
      WHERE email = '${this.email}'`;
    } else {
      sql = `UPDATE public.users
      SET isfulltime=${this.isfulltime}, roleid=${this.roleid}
      WHERE email = '${this.email}'`;
    }

    return pool.query(sql);
  }
};
