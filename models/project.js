const pool = require('../util/database');

module.exports = class Project {
  constructor(projectname) {
    this.projectname = projectname;
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
};
