const pool = require('../util/database');

module.exports = class UserOptions {
  constructor(emailcolumn, namecolumn, typecolumn, rolecolumn, idcolumn) {
    this.emailcolumn = emailcolumn;
    this.namecolumn = namecolumn;
    this.typecolumn = typecolumn;
    this.rolecolumn = rolecolumn;
    this.idcolumn = idcolumn;
  }

  findQuery() {
    const sql = `SELECT * FROM public.useroptions`;

    return pool.query(sql);
  }

  updateQuery() {
    const sql = `UPDATE public.useroptions
      SET emailcolumn='${this.emailcolumn}',
      namecolumn='${this.namecolumn}',
      typecolumn='${this.typecolumn}',
      rolecolumn='${this.rolecolumn}',
      idcolumn='${this.idcolumn}'
      WHERE useroptionid=1`;

    return pool.query(sql);
  }
};
