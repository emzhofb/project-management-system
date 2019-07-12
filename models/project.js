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

  delete() {
    const sql = `DELETE FROM public.projects WHERE projectid = ${this.projectid}`;

    return pool.query(sql);
  }

  update() {
    const sql = `UPDATE public.projects
    SET projectname = '${this.projectname}'
    WHERE projectid = ${this.projectid}`;

    return pool.query(sql);
  }

  find() {
    const sql = `SELECT * FROM public.projects ORDER BY projectid`;

    return pool.query(sql);
  }

  findById() {
    const sql = `SELECT * FROM public.projects 
    WHERE projects.projectid = ${this.projectid}`;

    return pool.query(sql);
  }

  findByName() {
    const sql = `SELECT * FROM public.projects 
    WHERE projects.projectname = '${this.projectname}'`;

    return pool.query(sql);
  }
};
