const pool = require('../util/database');

module.exports = class Queries {
  constructor(columnid, columnname, columnmember) {
    this.columnid = columnid;
    this.columnname = columnname;
    this.columnmember = columnmember;
  }

  findQuery() {
    const sql = `SELECT * FROM public.queries`;

    return pool.query(sql);
  }

  updateQuery() {
    const sql = `UPDATE public.queries
      SET columnid='${this.columnid}',
      columnname='${this.columnname}',
      columnmember='${this.columnmember}'
      WHERE queryid=1`;

    return pool.query(sql);
  }
};
