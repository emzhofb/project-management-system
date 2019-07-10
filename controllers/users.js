const bcrypt = require('bcrypt');
const User = require('../models/user');

exports.getLogin = (req, res, next) => {
  res.render('auth/login', { title: 'Users Login' });
};

exports.postLogin = (req, res, next) => {
  const { email, password } = req.body;
  const user = new User(email, password);

  user
    .find()
    .then(result => {
      if (result.rows.length > 0) {
        const pass = result.rows[0].password;
        const checkPassword = bcrypt.compareSync(password, pass);
        // cek hashed password
        if (checkPassword) {
          req.session.user = {
            email: result.rows[0].email
          };
          // success login
          res.redirect('/');
        } else res.redirect('/users/login');
      } else res.redirect('/users/login');
    })
    .catch(err => console.log(err));
};

exports.getRegister = (req, res, next) => {
  res.render('auth/register', { title: 'Register' });
};

exports.postRegister = (req, res, next) => {
  const { email, password, firstname, lastname } = req.body;
  const user = new User(email, password, firstname, lastname);

  user
    .save()
    .then(() => res.redirect('/users/login'))
    .catch(err => console.log(err));
};
