const moment = require('moment');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const Role = require('../models/role');
const Activity = require('../models/activity');

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
            email: result.rows[0].email,
            userid: result.rows[0].userid,
            fullname: result.rows[0].firstname + ' ' + result.rows[0].lastname
          };

          const thisDay = moment().format();
          const activity = new Activity(
            thisDay,
            'Login',
            `${req.session.user.email} has logged in, author: ${req.session.user.fullname}`,
            req.session.user.userid
          );

          activity
            .save()
            .then(() => {
              res.redirect('/');
            })
            .catch(err => console.log(err));
        } else res.redirect('/users/login');
      } else res.redirect('/users/login');
    })
    .catch(err => console.log(err));
};

exports.getRegister = (req, res, next) => {
  const role = new Role();

  role
    .findRole()
    .then(roles => {
      res.render('auth/register', { title: 'Register', roles: roles.rows });
    })
    .catch(err => console.log(err));
};

exports.postRegister = (req, res, next) => {
  const { email, password, firstname, lastname, roleid } = req.body;
  const isfulltime = req.body.isfulltime == 'true' ? true : false;
  const user = new User(
    email,
    password,
    firstname,
    lastname,
    isfulltime,
    Number(roleid)
  );

  user
    .save()
    .then(() => res.redirect('/users/login'))
    .catch(err => console.log(err));
};

exports.getLogout = (req, res, next) => {
  const userEmail = req.session.user.email;
  const userId = req.session.user.userid;
  const author = req.session.user.fullname;
  req.session.destroy(err => {
    if (err) console.log(err);

    const thisDay = moment().format();
    const activity = new Activity(
      thisDay,
      'Logout',
      `${userEmail} has logged out, author: ${author}`,
      userId
    );

    activity
      .save()
      .then(() => {
        res.redirect('/');
      })
      .catch(err => console.log(err));
  });
};

exports.getProfile = (req, res, next) => {
  const email = req.session.user.email;
  const user = new User(email);
  const role = new Role();

  role
    .findRole()
    .then(roles => {
      user
        .find()
        .then(users => {
          res.render('profile/index', {
            title: 'User Profile',
            user: users.rows[0],
            roles: roles.rows,
            path: '/users/profile'
          });
        })
        .catch(err => console.log(err));
    })
    .catch(err => console.log(err));
};

exports.postProfile = (req, res, next) => {
  const email = req.session.user.email;
  const userId = req.session.user.userid;
  const author = req.session.user.fullname;
  let { password, roleid, isfulltime } = req.body;

  if (password == '') password = undefined;
  if (isfulltime == 'on') isfulltime = true;
  if (isfulltime == undefined) isfulltime = false;

  const user = new User(email, password, '', '', isfulltime, Number(roleid));

  user
    .update()
    .then(() => {
      const activity = new Activity(
        thisDay,
        'Edit Profile',
        `${userEmail} has edited his profile, author: ${author}`,
        userId
      );

      activity
      .save()
      .then(() => {
        res.redirect('/projects')
      })
      .catch(err => console.log(err));
    })
    .catch(err => console.log(err));
};
