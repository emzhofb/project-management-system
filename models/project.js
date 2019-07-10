const pool = require('../util/database');

module.exports = class Project {
  constructor(name) {
    this.name = name;
  }

  save() {
    const sql = `INSERT INTO public.projects(name)
    VALUES ('${this.name}')`;

    return pool.query(sql);
  }

  find() {
    const sql = `SELECT * FROM public.projects`;

    return pool.query(sql);
  }
};
