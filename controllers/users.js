const bcrypt = require('bcrypt');
const User = require('../models/user');

exports.getLogin = (req, res, next) => {
  res.render('auth/login', { title: 'Users Login' });
};

exports.postLogin = (req, res, next) => {
  const { email, password } = req.body;
  const user = new User(email);

  user
    .find()
    .then(result => {
      if (result.rows.length > 0) {
        const pass = result.rows[0].password;
        const checkPassword = bcrypt.compareSync(password, pass);

        if (checkPassword) {
          req.session.user = {
            email: result.rows[0].email
          };

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

exports.getLogout = (req, res, next) => {
  req.session.destroy(err => {
    if (err) console.log(err);

    res.redirect('/');
  });
};

exports.getProfile = (req, res, next) => {
  const email = req.session.user.email;
  const user = new User(email);

  user
    .find()
    .then(result => {
      res.render('profile/index', {
        title: 'User Profile',
        user: result.rows[0]
      });
    })
    .catch(err => console.log(err));
};
