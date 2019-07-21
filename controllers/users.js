const nodemailer = require('nodemailer');
const sendgrid = require('nodemailer-sendgrid-transport');
const moment = require('moment');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const Role = require('../models/role');
const Activity = require('../models/activity');
const UserOption = require('../models/useroption');
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
            fullname: result.rows[0].firstname + ' ' + result.rows[0].lastname,
            isadmin: result.rows[0].isadmin
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
            path: '/users/profile',
            privilage: req.session.user.isadmin
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
  const userOption = new UserOption();
  const {
    idChecked,
    id,
    emailChecked,
    email,
    nameChecked,
    name,
    typeChecked,
    type,
    roleChecked,
    role
  } = req.query;

  const filterUser = [];
  let filter = false;

  if (idChecked && id) {
    if (Number(id)) {
      filter = true;
      filterUser.push(`users.userid = ${Number(id)}`);
    }
  }
  if (emailChecked && email) {
    filter = true;
    filterUser.push(`users.email = '${email}'`);
  }
  if (nameChecked && name) {
    filter = true;
    filterUser.push(
      `CONCAT(users.firstname, ' ', users.lastname) ILIKE '%${name}%'`
    );
  }
  if (typeChecked && type) {
    filter = true;
    const newType = type == 'true' ? true : false;
    filterUser.push(`users.isfulltime = '${newType}'`);
  }
  if (roleChecked && role) {
    if (Number(role)) {
      filter = true;
      filterUser.push(`users.roleid = ${Number(role)}`);
    }
  }

  let countUser = `SELECT count(*) FROM public.users`;

  if (filter) {
    countUser += ` WHERE ${filterUser.join(' AND ')}`;
  }

  userOption
    .findQuery()
    .then(allQueries => {
      const emailCheckedColumn = allQueries.rows[0].emailcolumn;
      const nameCheckedColumn = allQueries.rows[0].namecolumn;
      const typeCheckedColumn = allQueries.rows[0].typecolumn;
      const roleCheckedColumn = allQueries.rows[0].rolecolumn;
      const idCheckedColumn = allQueries.rows[0].idcolumn;

      pool
        .query(countUser)
        .then(count => {
          const page = Number(req.query.page) || 1;
          const perPage = 3;
          const total = count.rows[0].count;
          const pages = Math.ceil(total / perPage);
          const offset = (page - 1) * perPage;
          const url = req.url == `/` ? `/users/?page=1` : `/users${req.url}`;

          let userSql = `SELECT * FROM public.users`;

          if (filter) {
            userSql += ` WHERE ${filterUser.join(' AND ')}`;
          }

          userSql += ` ORDER BY userid LIMIT ${perPage} OFFSET ${offset}`;

          pool
            .query(userSql)
            .then(users => {
              res.render('user/list', {
                title: 'Users',
                path: '/users',
                users: users.rows,
                query: req.query,
                options: {
                  emailCheckedColumn,
                  nameCheckedColumn,
                  typeCheckedColumn,
                  roleCheckedColumn,
                  idCheckedColumn
                },
                helpers,
                current: page,
                pages,
                url,
                privilage: req.session.user.isadmin
              });
            })
            .catch(err => console.log(err));
        })
        .catch(err => console.log(err));
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
            userid: id,
            privilage: req.session.user.isadmin
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

exports.getUserColumn = (req, res, next) => {
  const {
    idChecked,
    emailChecked,
    nameChecked,
    typeChecked,
    roleChecked
  } = req.query;

  const columnid = idChecked ? 'on' : 'off';
  const columnemail = emailChecked ? 'on' : 'off';
  const columnname = nameChecked ? 'on' : 'off';
  const columntype = typeChecked ? 'on' : 'off';
  const columnrole = roleChecked ? 'on' : 'off';

  const useroption = new UserOption(
    columnemail,
    columnname,
    columntype,
    columnrole,
    columnid
  );

  useroption
    .updateQuery()
    .then(() => res.redirect('/users'))
    .catch(err => console.log(err));
};

exports.getForgotPassword = (req, res, next) => {
  res.render('auth/forgotpassword', { title: 'Change Password' });
};

exports.postForgotPassword = (req, res, next) => {
  const transporter = nodemailer.createTransport(
    sendgrid({
      auth: {
        api_key:
          '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'
      }
    })
  );

  const { email } = req.body;

  transporter
    .sendMail({
      to: email,
      from: 'bashocode@gmail.com',
      subject: 'Change your password',
      html: `<h1>Hi, to change your password.</h1>
    <br />
    <a href="http://localhost:3000/users/resetpassword/${email}">click here!</a>`
    })
    .then(() => res.render('auth/checkemail', { title: 'email' }))
    .catch(err => console.log(err));
};

exports.getResetPassword = (req, res, next) => {
  const { email } = req.params;
  const user = new User(email);

  user
    .find()
    .then(() =>
      res.render('auth/resetpassword', {
        title: 'Reset Password',
        email: email
      })
    )
    .catch(err => console.log(err));
};

exports.postResetPassword = (req, res, next) => {
  const { email } = req.params;
  const { password } = req.body;
  const user = new User();

  user
    .changePassword(email, password)
    .then(() => res.redirect('/users/login'))
    .catch(err => console.log(err));
};
