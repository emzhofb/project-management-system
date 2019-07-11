const pool = require('../util/database');

module.exports = class Role {
  constructor(roleid, rolename) {
    this.roleid = roleid;
    this.rolename = rolename;
  }

  findRole() {
    const sql = `SELECT * FROM public.roles`;

    return pool.query(sql);
  }
};
