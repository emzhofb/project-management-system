const pool = require('../util/database');

module.exports = class MemberOptions {
  constructor(columnid, columnname, columnposition) {
    this.columnid = columnid;
    this.columnname = columnname;
    this.columnposition = columnposition;
  }

  findQuery() {
    const sql = `SELECT * FROM public.memberoptions`;

    return pool.query(sql);
  }

  updateQuery() {
    const sql = `UPDATE public.memberoptions
      SET columnid='${this.columnid}',
      columnname='${this.columnname}',
      columnmember='${this.columnposition}'
      WHERE queryid=1`;

    return pool.query(sql);
  }
};
