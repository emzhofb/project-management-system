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

  delete() {
    const sql = `DELETE FROM public.members 
    WHERE projectid = ${this.projectid}`;

    return pool.query(sql);
  }

  deleteByUserid() {
    const sql = `DELETE FROM public.members 
    WHERE userid = ${this.userid}
    AND projectid = ${this.projectid}`;

    return pool.query(sql);
  }

  findByUserid() {
    const sql = `SELECT * FROM public.members 
    WHERE userid = ${this.userid}
    AND projectid = ${this.projectid}`;

    return pool.query(sql);
  }

  findAllMembers() {
    const sql = `SELECT users.userid, firstname, lastname 
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

  findMemberByProject() {
    const sql = `SELECT firstname, lastname, members.roleid 
    FROM public.users, public.members
    WHERE members.projectid = ${this.projectid}
    AND members.userid = users.userid`;

    return pool.query(sql);
  }
};
