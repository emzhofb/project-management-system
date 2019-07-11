const pool = require('../util/database');

module.exports = class Member {
  constructor(userid, projectid, roleid) {
    this.userid = userid;
    this.projectid = projectid;
    this.roleid = roleid;
  }

  save() {
    const sql = `INSERT INTO public.members(userid, projectid, roleid)
    VALUES (${this.userid}, ${this.projectid}, ${this.role})`;

    return pool.query(sql);
  }

  findAllMembers() {
    const sql = `SELECT firstname, lastname 
    FROM public.users ORDER BY userid`;

    return pool.query(sql);
  }

  findMember() {
    const sql = `SELECT users.userid, firstname, lastname 
    FROM public.users 
    INNER JOIN public.members 
    ON members.userid = users.userid`;

    return pool.query(sql);
  }

  projectMember() {
    const sql = `SELECT firstname, lastname, projectname 
    FROM public.users, public.members, public.projects
    WHERE projects.projectid = members.projectid
    AND members.userid = users.userid`;

    return pool.query(sql);
  }
};
