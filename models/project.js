const pool = require('../util/database');

module.exports = class Project {
  constructor(projectname, projectid) {
    this.projectname = projectname;
    this.projectid = projectid;
  }

  save() {
    const sql = `INSERT INTO public.projects(projectname)
    VALUES ('${this.projectname}')`;

    return pool.query(sql);
  }

  find() {
    const sql = `SELECT * FROM public.projects`;

    return pool.query(sql);
  }

  findById() {
    const sql = `SELECT * FROM public.projects 
    WHERE projects.projectid = ${this.projectid}`;

    return pool.query(sql);
  }
};
