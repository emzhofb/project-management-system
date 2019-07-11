const pool = require('../util/database');

module.exports = class Member {
  constructor(userid, projectid, roleid) {
    this.userid = userid;
    this.projectid = projectid;
    this.roleid = roleid;
  }

  findMember() {
    const sql = `SELECT firstname, lastname 
    FROM public.users 
    INNER JOIN public.members 
    ON members.userid = users.userid`;

    return pool.query(sql);
  }
};
