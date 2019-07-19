const pool = require('../util/database');

module.exports = class Activity {
  constructor(time, title, description, author) {
    this.time = time;
    this.title = title;
    this.description = description;
    this.author = author;
  }

  save() {
    const sql = `INSERT INTO public.activity(
      "time", title, description, author)
      VALUES ('${this.time}', '${this.title}', 
      '${this.description}', ${this.author})`;

    return pool.query(sql);
  }
};
