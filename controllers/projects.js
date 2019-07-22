const moment = require('moment');
const User = require('../models/user');
const Role = require('../models/role');
const Member = require('../models/member');
const Queries = require('../models/query');
const Project = require('../models/project');
const MemberOptions = require('../models/memberoption');
const Activity = require('../models/activity');
const pool = require('../util/database');
const helpers = require('../helpers/function');

exports.getProjects = (req, res, next) => {
  const queries = new Queries();
  const member = new Member();
  const {
    idChecked,
    nameChecked,
    memberChecked,
    id,
    name,
    memberFilter
  } = req.query;
  const filterProject = [];
  let filter = false;

  if (idChecked && id)
    if (Number(id)) {
      filter = true;
      filterProject.push(`projects.projectid = ${Number(id)}`);
    }
  if (nameChecked && name) {
    filter = true;
    filterProject.push(`projects.projectname ILIKE '%${name}%'`);
  }
  if (memberChecked && memberFilter) {
    filter = true;
    filterProject.push(`users.firstname = '${memberFilter}'`);
  }

  queries
    .findQuery()
    .then(allQueries => {
      const idCheckedColumn = allQueries.rows[0].columnid;
      const nameCheckedColumn = allQueries.rows[0].columnname;
      const memberCheckedColumn = allQueries.rows[0].columnmember;

      member
        .findAllMembers()
        .then(members => {
          let sql = `SELECT DISTINCT count(*) FROM public.projects`;

          for (let i = 0; i < filterProject.length; i++) {
            if (filterProject[i] == `users.firstname = '${memberFilter}'`) {
              sql += ', public.users, public.members';
            }
          }

          if (filter) {
            sql += ` WHERE ${filterProject.join(' AND ')}`;
          }

          console.log(sql);

          const page = Number(req.query.page) || 1;
          const perPage = 3;

          pool
            .query(sql)
            .then(count => {
              const total = count.rows[0].count;
              const pages = Math.ceil(total / perPage);
              const offset = (page - 1) * perPage;
              const url =
                req.url == '/' ? '/projects/?page=1' : `/projects${req.url}`;

              sql = `SELECT DISTINCT * FROM public.projects`;
              for (let i = 0; i < filterProject.length; i++) {
                if (filterProject[i] == `users.firstname = '${memberFilter}'`) {
                  sql += ', public.users, public.members';
                }
              }
              if (filter) {
                sql += ` WHERE ${filterProject.join(' AND ')}`;
              }
              sql += ` ORDER BY projects.projectid LIMIT ${perPage} OFFSET ${offset}`;

              console.log(sql);

              pool
                .query(sql)
                .then(projects => {
                  let sqlMember = `SELECT * 
                  FROM public.users, public.members, public.projects
                  WHERE projects.projectid = members.projectid
                  AND members.userid = users.userid`;

                  pool
                    .query(sqlMember)
                    .then(result => {
                      res.render('projects/index', {
                        title: 'Projects',
                        projects: projects.rows,
                        members: members.rows,
                        projectmember: result.rows,
                        options: {
                          idCheckedColumn,
                          nameCheckedColumn,
                          memberCheckedColumn
                        },
                        path: '/projects',
                        query: req.query,
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
        })
        .catch(err => console.log(err));
    })
    .catch(err => console.log(err));
};

exports.getAddProject = (req, res, next) => {
  const member = new Member();

  member
    .findAllMembers()
    .then(members => {
      res.render('projects/add', {
        title: 'Add Project',
        members: members.rows,
        path: '/projects',
        privilage: req.session.user.isadmin
      });
    })
    .catch(err => console.log(err));
};

exports.postAddProject = (req, res, next) => {
  const userEmail = req.session.user.email;
  const userId = req.session.user.userid;
  const author = req.session.user.fullname;
  const { projectname, memberid } = req.body;
  const project = new Project(projectname);

  const thisDay = moment().format();
  const activity = new Activity(
    thisDay,
    'Add Project',
    `${userEmail} has added project, author: ${author}`,
    userId
  );

  activity
    .save()
    .then(() => {
      project
        .save()
        .then(() => {
          project
            .findByName()
            .then(projects => {
              const values = [];
              if (typeof memberid == 'object') {
                for (let i = 0; i < memberid.length; i++) {
                  values.push(
                    `(${Number(memberid[i])}, ${projects.rows[0].projectid}, 2)`
                  );
                }
              } else {
                values.push(
                  `(${Number(memberid)}, ${projects.rows[0].projectid}, 2)`
                );
              }
              const sql = `INSERT INTO public.members(userid, projectid, roleid)
                            VALUES ${values.join(',')}`;
              pool
                .query(sql)
                .then(() => res.redirect('/projects'))
                .catch(err => console.log(err));
            })
            .catch(err => console.log(err));
        })
        .catch(err => console.log(err));
    })
    .catch(err => console.log(err));
};

exports.getEditProject = (req, res, next) => {
  const project = new Project(undefined, Number(req.params.id));
  const member = new Member();

  project
    .findById()
    .then(project => {
      member
        .findAllMembers()
        .then(members => {
          member
            .projectMember()
            .then(projectmembers => {
              const name = [];
              for (let i = 0; i < projectmembers.rows.length; i++) {
                if (
                  projectmembers.rows[i].projectname ===
                  project.rows[0].projectname
                ) {
                  name.push(
                    projectmembers.rows[i].firstname +
                      ' ' +
                      projectmembers.rows[i].lastname
                  );
                }
              }

              res.render('projects/edit', {
                title: 'Edit Project',
                path: `/projects`,
                members: members.rows,
                projectname: project.rows[0].projectname,
                membername: name,
                helpers: helpers,
                privilage: req.session.user.isadmin
              });
            })
            .catch(err => console.log(err));
        })
        .catch(err => console.log(err));
    })
    .catch(err => console.log(err));
};

exports.postEditProject = (req, res, next) => {
  const userEmail = req.session.user.email;
  const userId = req.session.user.userid;
  const author = req.session.user.fullname;
  const { projectname, memberid } = req.body;
  const member = new Member(undefined, Number(req.params.id));

  const thisDay = moment().format();
  const activity = new Activity(
    thisDay,
    'Edit Project',
    `${userEmail} has edited project, author: ${author}`,
    userId
  );

  activity
    .save()
    .then(() => {
      member
        .delete()
        .then(() => {
          const project = new Project(projectname, Number(req.params.id));
          project
            .update()
            .then(() => {
              project
                .findByName()
                .then(projects => {
                  const values = [];
                  if (typeof memberid == 'object') {
                    for (let i = 0; i < memberid.length; i++) {
                      values.push(
                        `(${Number(memberid[i])}, ${
                          projects.rows[0].projectid
                        }, 2)`
                      );
                    }
                  } else {
                    values.push(
                      `(${Number(memberid)}, ${projects.rows[0].projectid}, 2)`
                    );
                  }
                  const sql = `INSERT INTO public.members(userid, projectid, roleid)
                          VALUES ${values.join(',')}`;
                  pool
                    .query(sql)
                    .then(() => res.redirect('/projects'))
                    .catch(err => console.log(err));
                })
                .catch(err => console.log(err));
            })
            .catch(err => console.log(err));
        })
        .catch(err => console.log(err));
    })
    .catch(err => console.log(err));
};

exports.getColumn = (req, res, next) => {
  const { idChecked, nameChecked, memberChecked } = req.query;
  const columnid = idChecked ? 'on' : 'off';
  const columnname = nameChecked ? 'on' : 'off';
  const columnmember = memberChecked ? 'on' : 'off';

  const queries = new Queries(columnid, columnname, columnmember);

  queries
    .updateQuery()
    .then(() => {
      res.redirect('/projects');
    })
    .catch(err => console.log(err));
};

exports.getDeleteProject = (req, res, next) => {
  const userEmail = req.session.user.email;
  const userId = req.session.user.userid;
  const author = req.session.user.fullname;
  const member = new Member(undefined, Number(req.params.id));

  const thisDay = moment().format();
  const activity = new Activity(
    thisDay,
    'Delete',
    `${userEmail} has deleted project, author: ${author}`,
    userId
  );

  activity
    .save()
    .then(() => {
      member
        .delete()
        .then(() => {
          const project = new Project(undefined, Number(req.params.id));
          project
            .delete()
            .then(() => res.redirect('/projects'))
            .catch(err => console.log(err));
        })
        .catch(err => console.log(err));
    })
    .catch(err => console.log(err));
};

exports.getDetailProject = (req, res, next) => {
  const projectId = req.params.id;
  const member = new Member(undefined, projectId);

  member
    .findMemberByProject()
    .then(members => {
      const countBug = `SELECT count(*) FROM public.issues 
      WHERE projectid = ${projectId} AND tracker = 'Bug'`;
      pool
        .query(countBug)
        .then(totalBug => {
          const countOpenBug = `SELECT count(*) FROM public.issues 
          WHERE projectid = ${projectId} AND tracker = 'Bug' AND status != 'Closed'`;

          pool
            .query(countOpenBug)
            .then(totalOpenBug => {
              const countFeature = `SELECT count(*) FROM public.issues 
              WHERE projectid = ${projectId} AND tracker = 'Feature'`;

              pool
                .query(countFeature)
                .then(totalFeature => {
                  const countOpenFeature = `SELECT count(*) FROM public.issues 
                  WHERE projectid = ${projectId} AND tracker = 'Feature' AND status != 'Closed'`;

                  pool
                    .query(countOpenFeature)
                    .then(totalOpenFeature => {
                      const countSupport = `SELECT count(*) FROM public.issues 
                    WHERE projectid = ${projectId} AND tracker = 'Support'`;

                      pool
                        .query(countSupport)
                        .then(totalSupport => {
                          const countOpenSupport = `SELECT count(*) FROM public.issues 
                        WHERE projectid = ${projectId} AND tracker = 'Support' AND status != 'Closed'`;

                          pool
                            .query(countOpenSupport)
                            .then(totalOpenSupport => {
                              res.render('projects/details/overview/overview', {
                                title: 'Overview',
                                path: '/projects',
                                pathAgain: '/overview',
                                id: projectId,
                                listMember: members.rows,
                                totalBug: totalBug.rows[0].count,
                                totalOpenBug: totalOpenBug.rows[0].count,
                                totalFeature: totalFeature.rows[0].count,
                                totalOpenFeature:
                                  totalOpenFeature.rows[0].count,
                                totalSupport: totalSupport.rows[0].count,
                                totalOpenSupport:
                                  totalOpenSupport.rows[0].count,
                                privilage: req.session.user.isadmin
                              });
                            })
                            .catch(err => console.log(err));
                        })
                        .catch(err => console.log(err));
                    })
                    .catch(err => console.log(err));
                })
                .catch(err => console.log(err));
            })
            .catch(err => console.log(err));
        })
        .catch(err => console.log(err));
    })
    .catch(err => console.log(err));
};

exports.getMemberProject = (req, res, next) => {
  const role = new Role();
  const memberOption = new MemberOptions();
  const projectId = req.params.id;
  const {
    idChecked,
    nameChecked,
    positionChecked,
    id,
    name,
    position
  } = req.query;

  const filterMember = [];
  let filter = false;

  if (idChecked && id) {
    if (Number(id)) {
      filter = true;
      filterMember.push(`members.memberid = ${Number(id)}`);
    }
  }
  if (nameChecked && name) {
    filter = true;
    filterMember.push(
      `CONCAT(users.firstname, ' ', users.lastname) ILIKE '%${name}%' `
    );
  }
  if (positionChecked && position) {
    filter = true;
    filterMember.push(`members.roleid = ${Number(position)}`);
  }

  role
    .findRole()
    .then(roles => {
      memberOption
        .findQuery()
        .then(allQueries => {
          const idCheckedColumn = allQueries.rows[0].columnid;
          const nameCheckedColumn = allQueries.rows[0].columnname;
          const positionCheckedColumn = allQueries.rows[0].columnposition;

          let countMember = `SELECT count(*) 
                    FROM public.users, public.members
                    WHERE members.projectid = ${projectId}
                    AND members.userid = users.userid`;

          if (filter) {
            countMember += ` AND ${filterMember.join(' AND ')}`;
          }

          pool
            .query(countMember)
            .then(count => {
              const page = Number(req.query.page) || 1;
              const perPage = 3;
              const total = count.rows[0].count;
              const pages = Math.ceil(total / perPage);
              const offset = (page - 1) * perPage;
              const url =
                req.url == `/members/${projectId}`
                  ? `/projects/members/${projectId}?page=1`
                  : `/projects${req.url}`;

              let findMember = `SELECT * 
                                FROM public.users, public.members
                                WHERE members.projectid = ${projectId}
                                AND members.userid = users.userid`;

              if (filter) {
                findMember += ` AND ${filterMember.join(' AND ')}`;
              }

              findMember += ` LIMIT ${perPage} OFFSET ${offset}`;

              pool
                .query(findMember)
                .then(members => {
                  res.render('projects/details/member/member', {
                    title: 'Members',
                    path: '/projects',
                    pathAgain: '/members',
                    members: members.rows,
                    options: {
                      idCheckedColumn,
                      nameCheckedColumn,
                      positionCheckedColumn
                    },
                    id: projectId,
                    query: req.query,
                    roles: roles.rows,
                    helpers: helpers,
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
    })
    .catch(err => console.log(err));
};

exports.getPositionColumn = (req, res, next) => {
  const { idChecked, nameChecked, positionChecked } = req.query;
  const columnid = idChecked ? 'on' : 'off';
  const columnname = nameChecked ? 'on' : 'off';
  const columnposition = positionChecked ? 'on' : 'off';
  const id = req.params.id;

  const memberoption = new MemberOptions(columnid, columnname, columnposition);

  memberoption
    .updateQuery()
    .then(() => {
      res.redirect(`/projects/members/${id}`);
    })
    .catch(err => console.log(err));
};

exports.getAddMember = (req, res, next) => {
  const id = req.params.id;
  const member = new Member(undefined, id);
  const role = new Role();

  member
    .findAllMembers()
    .then(members => {
      member
        .findMemberByProject()
        .then(exceptions => {
          const listMember = helpers.filterMember(members, exceptions);
          role
            .findRole()
            .then(roles => {
              res.render('projects/details/member/add', {
                title: 'Add Member',
                path: '/projects',
                pathAgain: '/members',
                id: id,
                members: listMember,
                roles: roles.rows,
                privilage: req.session.user.isadmin
              });
            })
            .catch(err => console.log(err));
        })
        .catch(err => console.log(err));
    })
    .catch(err => console.log(err));
};

exports.postAddMember = (req, res, next) => {
  const userEmail = req.session.user.email;
  const userId = req.session.user.userid;
  const author = req.session.user.fullname;

  const id = req.params.id;
  const { memberChoosed, roleChoosed } = req.body;

  const sql = `INSERT INTO public.members(userid, projectid, roleid)
    VALUES (${Number(memberChoosed)}, ${Number(id)}, ${Number(roleChoosed)})`;

  const thisDay = moment().format();
  const activity = new Activity(
    thisDay,
    'Add Member',
    `${userEmail} has added member, author: ${author}`,
    userId
  );

  activity
    .save()
    .then(() => {
      pool
        .query(sql)
        .then(() => {
          res.redirect(`/projects/members/${id}`);
        })
        .catch(err => console.log(err));
    })
    .catch(err => console.log(err));
};

exports.getDeleteMember = (req, res, next) => {
  const userEmail = req.session.user.email;
  const userId = req.session.user.userid;
  const author = req.session.user.fullname;
  const { firstname, id } = req.params;
  const user = new User(undefined, undefined, firstname);

  const thisDay = moment().format();
  const activity = new Activity(
    thisDay,
    'Delete Member',
    `${userEmail} has deleted member, author: ${author}`,
    userId
  );

  activity
    .save()
    .then(() => {
      user
        .findByName()
        .then(user => {
          const member = new Member(user.rows[0].userid, Number(id));

          member
            .deleteByUserid()
            .then(() => {
              res.redirect(`/projects/members/${id}`);
            })
            .catch(err => console.log(err));
        })
        .catch(err => console.log(err));
    })
    .catch(err => console.log(err));
};

exports.getEditMember = (req, res, next) => {
  const { firstname, id } = req.params;
  const role = new Role();
  const user = new User(undefined, undefined, firstname);

  user
    .findByNameAgain()
    .then(theuser => {
      const member = new Member(theuser.rows[0].userid, Number(id));
      member
        .findByUserid()
        .then(themember => {
          role
            .findRole()
            .then(roles => {
              res.render('projects/details/member/edit', {
                title: 'Edit Member',
                path: '/projects',
                pathAgain: '/members',
                id: id,
                member: theuser.rows,
                roles: roles.rows,
                roleid: themember.rows[0].roleid,
                privilage: req.session.user.isadmin
              });
            })
            .catch(err => console.log(err));
        })
        .catch(err => console.log(err));
    })
    .catch(err => console.log(err));
};

exports.postEditMember = (req, res, next) => {
  const userEmail = req.session.user.email;
  const userId = req.session.user.userid;
  const author = req.session.user.fullname;
  const { firstname, id } = req.params;
  const { roleChoosed } = req.body;
  const user = new User(undefined, undefined, firstname);

  const thisDay = moment().format();
  const activity = new Activity(
    thisDay,
    'Edit Member',
    `${userEmail} has edited member, author: ${author}`,
    userId
  );

  activity
    .save()
    .then(() => {
      user
        .findByName()
        .then(userid => {
          const member = new Member(
            userid.rows[0].userid,
            Number(id),
            Number(roleChoosed)
          );

          member
            .update()
            .then(() => res.redirect(`/projects/members/${id}`))
            .catch(err => console.log(err));
        })
        .catch(err => console.log(err));
    })
    .catch(err => console.log(err));
};

exports.getIssueProject = (req, res, next) => {
  const projectId = req.params.id;
  const {
    idFilter,
    subjectFilter,
    trackerFilter,
    id,
    subject,
    tracker
  } = req.query;

  const filterIssue = [];
  const fieldIssue = [];

  if (idFilter && id) {
    if (Number(id)) {
      filterIssue.push(Number(id));
      fieldIssue.push('issueid');
    }
  }
  if (subjectFilter && subject) {
    filterIssue.push(subject);
    fieldIssue.push('subject');
  }
  if (trackerFilter && tracker) {
    filterIssue.push(tracker);
    fieldIssue.push('tracker');
  }

  const column = `SELECT issueoptionid, idcolumn, 
  subjectcolumn, trackercolumn, descriptioncolumn, 
  statuscolumn, prioritycolumn, assigneecolumn, 
  startdatecolumn, duedatecolumn, estimatedtime, 
  donecolumn, authorcolumn
  FROM public.issueoptions`;

  pool
    .query(column)
    .then(columns => {
      const idcolumn = columns.rows[0].idcolumn;
      const subjectcolumn = columns.rows[0].subjectcolumn;
      const trackercolumn = columns.rows[0].trackercolumn;
      const descriptioncolumn = columns.rows[0].descriptioncolumn;
      const statuscolumn = columns.rows[0].statuscolumn;
      const prioritycolumn = columns.rows[0].prioritycolumn;
      const assigneecolumn = columns.rows[0].assigneecolumn;
      const startdatecolumn = columns.rows[0].startdatecolumn;
      const duedatecolumn = columns.rows[0].duedatecolumn;
      const estimatedtime = columns.rows[0].estimatedtime;
      const donecolumn = columns.rows[0].donecolumn;
      const authorcolumn = columns.rows[0].authorcolumn;

      let countIssue = `SELECT count(*) FROM public.issues 
      WHERE projectid = ${projectId}`;

      if (filterIssue.length > 0) {
        countIssue += ' AND';
        for (let i = 0; i < fieldIssue.length; i++) {
          if (typeof filterIssue[i] !== 'number') {
            countIssue += ` ${fieldIssue[i]} = '${filterIssue[i]}'`;
          } else {
            countIssue += ` ${fieldIssue[i]} = ${filterIssue[i]}`;
          }

          if (i !== fieldIssue.length - 1) countIssue += ' AND';
        }
      }

      pool
        .query(countIssue)
        .then(count => {
          const page = Number(req.query.page) || 1;
          const perPage = 3;
          const total = count.rows[0].count;
          const pages = Math.ceil(total / perPage);
          const offset = (page - 1) * perPage;
          const url =
            req.url == `/issues/${projectId}`
              ? `/projects/issues/${projectId}?page=1`
              : `/projects${req.url}`;

          let issue = `SELECT issueid, projectid, tracker, 
        subject, description, status, priority, assignee, 
        startdate, duedate, estimatedtime, done, files, 
        spenttime, targetversion, author, createddate, 
        updateddate, closeddate, parenttask
        FROM public.issues WHERE projectid = ${projectId}`;

          if (filterIssue.length > 0) {
            issue += ' AND';
            for (let i = 0; i < fieldIssue.length; i++) {
              if (typeof filterIssue[i] !== 'number') {
                issue += ` ${fieldIssue[i]} = '${filterIssue[i]}'`;
              } else {
                issue += ` ${fieldIssue[i]} = ${filterIssue[i]}`;
              }

              if (i !== fieldIssue.length - 1) issue += ' AND';
            }
          }

          issue += ` LIMIT ${perPage} OFFSET ${offset}`;

          pool
            .query(issue)
            .then(issues => {
              res.render('projects/details/issue/issue', {
                title: 'Issues',
                path: '/projects',
                pathAgain: '/issues',
                id: projectId,
                issues: issues.rows,
                query: req.query,
                current: page,
                pages,
                url,
                options: {
                  idcolumn,
                  subjectcolumn,
                  trackercolumn,
                  descriptioncolumn,
                  statuscolumn,
                  prioritycolumn,
                  assigneecolumn,
                  startdatecolumn,
                  duedatecolumn,
                  estimatedtime,
                  donecolumn,
                  authorcolumn
                },
                privilage: req.session.user.isadmin
              });
            })
            .catch(err => console.log(err));
        })
        .catch(err => console.log(err));
    })
    .catch(err => console.log(err));
};

exports.getAddIssue = (req, res, next) => {
  const projectId = req.params.id;
  const member = new Member(undefined, projectId);

  member
    .findMemberByProject()
    .then(members => {
      res.render('projects/details/issue/add', {
        title: 'Issues',
        path: '/projects',
        pathAgain: '/issues',
        id: projectId,
        members: members.rows,
        privilage: req.session.user.isadmin
      });
    })
    .catch(err => console.log(err));
};

exports.postAddIssue = (req, res, next) => {
  const userEmail = req.session.user.email;
  const userId = req.session.user.userid;
  const author = req.session.user.fullname;
  const projectId = req.params.id;
  const {
    tracker,
    subject,
    description,
    status,
    priority,
    assigne,
    startdate,
    duedate,
    estimatedtime,
    done
  } = req.body;
  let fileUpload = req.files.file;

  const thisDay = moment().format();
  const activity = new Activity(
    thisDay,
    'Add Issue',
    `${userEmail} has added issue, author: ${author}`,
    userId
  );

  activity
    .save()
    .then(() => {
      fileUpload.mv(`public/images/${fileUpload.name}`, err => {
        if (err) console.log(err);

        const assigneeSql = `SELECT userid
          FROM public.members
          WHERE memberid = ${assigne}`;

        pool
          .query(assigneeSql)
          .then(assigneId => {
            const sql = `INSERT INTO public.issues(
                projectid, tracker, subject, description, status, 
                priority, assignee, startdate, duedate, estimatedtime, 
                done, files)
                VALUES (${projectId}, '${tracker}', '${subject}', 
                '${description}', '${status}', '${priority}', 
                ${
                  assigneId.rows[0].userid
                }, '${startdate}', '${duedate}', ${estimatedtime}, 
                ${done}, '${fileUpload.name}')`;

            pool
              .query(sql)
              .then(() => {
                res.redirect(`/projects/issues/${projectId}`);
              })
              .catch(err => console.log(err));
          })
          .catch(err => console.log(err));
      });
    })
    .catch(err => console.log(err));
};

exports.getIssueColumn = (req, res, next) => {
  const {
    idChecked,
    trackerChecked,
    subjectChecked,
    descriptionChecked,
    statusChecked,
    priorityChecked,
    assigneeChecked,
    startdateChecked,
    duedateChecked,
    estimatedChecked,
    doneChecked,
    authorChecked
  } = req.query;
  const columnid = idChecked ? 'on' : 'off';
  const columntracker = trackerChecked ? 'on' : 'off';
  const columnsubject = subjectChecked ? 'on' : 'off';
  const columndescription = descriptionChecked ? 'on' : 'off';
  const columnstatus = statusChecked ? 'on' : 'off';
  const columnpriority = priorityChecked ? 'on' : 'off';
  const columnassignee = assigneeChecked ? 'on' : 'off';
  const columnstartdate = startdateChecked ? 'on' : 'off';
  const columnduedate = duedateChecked ? 'on' : 'off';
  const columnestimated = estimatedChecked ? 'on' : 'off';
  const columndone = doneChecked ? 'on' : 'off';
  const columnauthor = authorChecked ? 'on' : 'off';
  const id = req.params.id;

  const sql = `UPDATE public.issueoptions
  SET idcolumn='${columnid}', subjectcolumn='${columnsubject}', 
  trackercolumn='${columntracker}', descriptioncolumn='${columndescription}', 
  statuscolumn='${columnstatus}', prioritycolumn='${columnpriority}', 
  assigneecolumn='${columnassignee}', startdatecolumn='${columnstartdate}', 
  duedatecolumn='${columnduedate}', estimatedtime='${columnestimated}', 
  donecolumn='${columndone}', authorcolumn='${columnauthor}'
	WHERE issueoptionid = 1`;

  pool
    .query(sql)
    .then(() => {
      res.redirect(`/projects/issues/${id}`);
    })
    .catch(err => console.log(err));
};

exports.getDeleteIssue = (req, res, next) => {
  const userEmail = req.session.user.email;
  const userId = req.session.user.userid;
  const author = req.session.user.fullname;
  const issueid = req.params.issueid;
  const id = req.params.id;

  const sql = `DELETE FROM public.issues
  WHERE issueid = ${issueid}`;

  const thisDay = moment().format();
  const activity = new Activity(
    thisDay,
    'Delete Issue',
    `${userEmail} has deleted issue, author: ${author}`,
    userId
  );

  activity
    .save()
    .then(() => {
      pool
        .query(sql)
        .then(() => res.redirect(`/projects/issues/${id}`))
        .catch(err => console.log(err));
    })
    .catch(err => console.log(err));
};

exports.getEditIssue = (req, res, next) => {
  const issueid = req.params.issueid;
  const projectId = req.params.id;
  const sql = `SELECT * FROM public.issues, public.users 
  WHERE issueid = ${issueid}
  AND users.userid = author
  AND issues.projectid = ${projectId}`;

  pool
    .query(sql)
    .then(issue => {
      const memberSql = `SELECT *
      FROM public.members, public.users, public.projects
      WHERE users.userid = members.userid
      AND projects.projectid = members.projectid
      AND members.projectid = ${projectId}`;

      pool
        .query(memberSql)
        .then(members => {
          res.render('projects/details/issue/edit', {
            title: 'Issues',
            path: '/projects',
            pathAgain: '/issues',
            id: projectId,
            members: members.rows,
            issues: issue.rows[0],
            moment,
            privilage: req.session.user.isadmin
          });
        })
        .catch(err => console.log(err));
    })
    .catch(err => console.log(err));
};

exports.postEditIssue = (req, res, next) => {
  const userEmail = req.session.user.email;
  const userId = req.session.user.userid;
  const authorName = req.session.user.fullname;
  const projectId = req.params.id;
  const issueid = req.params.issueid;
  const {
    tracker,
    subject,
    description,
    status,
    priority,
    assigne,
    startdate,
    duedate,
    estimatedtime,
    done,
    spenttime,
    targetversion,
    author,
    createddate,
    updateddate,
    closeddate,
    parenttask
  } = req.body;
  let fileUpload = req.files.file;

  const thisDay = moment().format();
  const activity = new Activity(
    thisDay,
    'Edit Issue',
    `${userEmail} has edited issue, author: ${authorName}`,
    userId
  );

  activity
    .save()
    .then(() => {
      fileUpload.mv(`public/images/${fileUpload.name}`, err => {
        if (err) console.log(err);

        const assigneeSql = `SELECT userid
          FROM public.members
          WHERE memberid = ${assigne}`;

        pool
          .query(assigneeSql)
          .then(assigneId => {
            const authorSql = `SELECT userid
              FROM public.members
              WHERE memberid = ${author}`;

            pool
              .query(authorSql)
              .then(authorId => {
                const sql = `UPDATE public.issues
                    SET projectid=${projectId}, tracker='${tracker}', 
                    subject='${subject}', description='${description}', status='${status}', 
                    priority='${priority}', assignee=${
                  assigneId.rows[0].userid
                }, 
                    startdate='${startdate}', duedate='${duedate}', estimatedtime=${estimatedtime}, 
                    done=${done}, files='${
                  fileUpload.name
                }', spenttime=${spenttime}, 
                    targetversion='${targetversion}', author=${
                  authorId.rows[0].userid
                }, 
                    createddate='${createddate}', updateddate='${updateddate}', 
                    closeddate='${closeddate}', parenttask=${parenttask}
                    WHERE issueid=${issueid}`;

                pool
                  .query(sql)
                  .then(() => {
                    res.redirect(`/projects/issues/${projectId}`);
                  })
                  .catch(err => console.log(err));
              })
              .catch(err => console.log(err));
          })
          .catch(err => console.log(err));
      });
    })
    .catch(err => console.log(err));
};

exports.getActivity = (req, res, next) => {
  const projectId = req.params.id;
  const lastWeek = moment()
    .subtract(7, 'days')
    .format();
  const thisDay = moment().format();
  const sql = `SELECT * FROM public.activity
  WHERE time >= timestamp '${lastWeek}'
  AND time < timestamp '${thisDay}'`;

  pool
    .query(sql)
    .then(activities => {
      for (let i = 0; i < activities.rows.length; i++) {
        activities.rows[i].time = helpers.changeDate(activities.rows[i].time);
      }

      res.render('projects/details/activity/activity', {
        title: 'Activity',
        path: '/projects',
        pathAgain: '/activity',
        id: projectId,
        activities: activities.rows,
        lastWeek: helpers.displayDate(lastWeek),
        thisDay: helpers.displayDate(thisDay),
        helpers,
        moment,
        privilage: req.session.user.isadmin
      });
    })
    .catch(err => console.log(err));
};
