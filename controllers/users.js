const moment = require('moment');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const Role = require('../models/role');
const Activity = require('../models/activity');
const helpers = require('../helpers/function');
const pool = require('../util/database');

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
            `${req.session.user.email} has logged in, author: ${
              req.session.user.fullname
            }`,
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
      res.render('auth/register', {
        title: 'Register',
        roles: roles.rows,
        path: '/users'
      });
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
    .then(() => res.redirect('/users'))
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
      const thisDay = moment().format();
      const activity = new Activity(
        thisDay,
        'Edit Profile',
        `${email} has edited his profile, author: ${author}`,
        userId
      );

      activity
        .save()
        .then(() => {
          res.redirect('/projects');
        })
        .catch(err => console.log(err));
    })
    .catch(err => console.log(err));
};

exports.getUser = (req, res, next) => {
  const user = new User();

  user
    .findAll()
    .then(users => {
      res.render('user/list', {
        title: 'Users',
        path: '/users',
        users: users.rows,
        query: req.query,
        helpers
      });
    })
    .catch(err => console.log(err));
};

exports.getEditUser = (req, res, next) => {
  const { id } = req.params;
  const user = new User();
  const role = new Role();

  role
    .findRole()
    .then(roles => {
      user
        .findById(id)
        .then(theUser => {
          res.render('user/edit', {
            title: 'Edit User',
            path: '/users',
            theUser: theUser.rows[0],
            roles: roles.rows,
            query: req.query,
            helpers,
            userid: id
          });
        })
        .catch(err => console.log(err));
    })
    .catch(err => console.log(err));
};

exports.postEditUser = (req, res, next) => {
  const { id } = req.params;
  const { email, password, firstname, lastname, roleid } = req.body;
  const isfulltime = req.body.isfulltime == 'true' ? true : false;

  let sql;
  if (password) {
    const saltRounds = 5;
    const hashedPassword = bcrypt.hashSync(password, saltRounds);

    sql = `UPDATE public.users
      SET email='${email}', password='${hashedPassword}', 
      isfulltime=${isfulltime}, roleid=${roleid}, 
      firstname='${firstname}', lastname='${lastname}'
      WHERE userid = ${id}`;
  } else {
    sql = `UPDATE public.users
      SET email='${email}', isfulltime=${isfulltime}, roleid=${roleid}, 
      firstname='${firstname}', lastname='${lastname}'
      WHERE userid = ${id}`;
  }

  pool
    .query(sql)
    .then(() => res.redirect('/users'))
    .catch(err => console.log(err));
};

exports.getDeleteUser = (req, res, next) => {
  const { id } = req.params;
  const sql = `DELETE FROM public.users
	WHERE userid=${id}`;

  pool
    .query(sql)
    .then(() => res.redirect('/users'))
    .catch(err => console.log(err));
};
