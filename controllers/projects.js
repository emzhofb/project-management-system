const User = require('../models/user');
const Role = require('../models/role');
const Member = require('../models/member');
const Queries = require('../models/query');
const Project = require('../models/project');
const MemberOptions = require('../models/memberoption');
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
  const fieldProject = [];

  if (idChecked && id)
    if (Number(id)) {
      filterProject.push(Number(id));
      fieldProject.push('projectid');
    }
  if (nameChecked && name) {
    filterProject.push(name);
    fieldProject.push('projectname');
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
          let sql = `SELECT count(*) FROM public.projects`;
          if (filterProject.length > 0) {
            sql += ` WHERE`;
            for (let i = 0; i < fieldProject.length; i++) {
              sql += ` ${fieldProject[i]} = '${filterProject[i]}'`;
              if (i !== fieldProject.length - 1) sql += ` AND`;
            }
          }
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

              sql = `SELECT * FROM public.projects`;
              if (filterProject.length > 0) {
                sql += ` WHERE`;
                for (let i = 0; i < fieldProject.length; i++) {
                  sql += ` ${fieldProject[i]} = '${filterProject[i]}'`;
                  if (i !== fieldProject.length - 1) sql += ` AND`;
                }
              }
              sql += ` ORDER BY projectid`;
              sql += ` LIMIT ${perPage} OFFSET ${offset}`;

              pool
                .query(sql)
                .then(projects => {
                  let sqlMember = `SELECT firstname, lastname, projectname 
                                FROM public.users, public.members, public.projects
                                WHERE projects.projectid = members.projectid
                                AND members.userid = users.userid`;
                  const filterMember = [];

                  if (memberChecked && memberFilter) {
                    filterMember.push(`'${memberFilter}'`);
                  }
                  if (filterMember.length > 0) {
                    sqlMember += ` AND users.firstname = ${filterMember[0]}`;
                  }
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
                        url
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
        path: '/projects'
      });
    })
    .catch(err => console.log(err));
};

exports.postAddProject = (req, res, next) => {
  const { projectname, memberid } = req.body;
  const project = new Project(projectname);

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
                title: 'Edit Product',
                path: `/projects/edit/${req.params.id}`,
                members: members.rows,
                projectname: project.rows[0].projectname,
                membername: name,
                helpers: helpers
              });
            })
            .catch(err => console.log(err));
        })
        .catch(err => console.log(err));
    })
    .catch(err => console.log(err));
};

exports.postEditProject = (req, res, next) => {
  const { projectname, memberid } = req.body;
  const member = new Member(undefined, Number(req.params.id));

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
  const member = new Member(undefined, Number(req.params.id));

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
};

exports.getDetailProject = (req, res, next) => {
  const projectId = req.params.id;
  const member = new Member(undefined, projectId);

  member
    .findMemberByProject()
    .then(members => {
      res.render('projects/details/overview', {
        title: 'Overview',
        path: '/projects',
        pathAgain: '/overview',
        id: projectId,
        listMember: members.rows
      });
    })
    .catch(err => console.log(err));
};

exports.getMemberProject = (req, res, next) => {
  const role = new Role();
  const memberOption = new MemberOptions();
  const projectId = req.params.id;

  role
    .findRole()
    .then(roles => {
      memberOption
        .findQuery()
        .then(allQueries => {
          const idCheckedColumn = allQueries.rows[0].columnid;
          const nameCheckedColumn = allQueries.rows[0].columnname;
          const positionCheckedColumn = allQueries.rows[0].columnposition;

          const member = new Member(undefined, projectId);
          member
            .findMemberByProject()
            .then(id => {
              const index = [];
              for (let i = 0; i < id.rows.length; i++) {
                index.push(i+1);
              }
              member
                .countMemberByProject()
                .then(count => {
                  const page = Number(req.query.page) || 1;
                  const perPage = 1;
                  const total = count.rows[0].count;
                  const pages = Math.ceil(total / perPage);
                  const offset = (page - 1) * perPage;
                  const url =
                    req.url == `/members/${projectId}`
                      ? `/projects/members/${projectId}?page=1`
                      : `/projects${req.url}`;

                  member
                    .findMemberByProjectAndOffset(perPage, offset)
                    .then(members => {
                      res.render('projects/details/member', {
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
                        index,
                        pages,
                        url
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
              res.render('projects/details/add', {
                title: 'Add Member',
                path: '/projects',
                pathAgain: '/members',
                id: id,
                members: listMember,
                roles: roles.rows
              });
            })
            .catch(err => console.log(err));
        })
        .catch(err => console.log(err));
    })
    .catch(err => console.log(err));
};

exports.postAddMember = (req, res, next) => {
  const id = req.params.id;
  const { memberChoosed, roleChoosed } = req.body;

  const sql = `INSERT INTO public.members(userid, projectid, roleid)
    VALUES (${Number(memberChoosed)}, ${Number(id)}, ${Number(roleChoosed)})`;

  pool
    .query(sql)
    .then(() => {
      res.redirect(`/projects/members/${id}`);
    })
    .catch(err => console.log(err));
};

exports.getDeleteMember = (req, res, next) => {
  const { firstname, id } = req.params;
  const user = new User(undefined, undefined, firstname);

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
              res.render('projects/details/edit', {
                title: 'Edit Member',
                path: '/projects',
                pathAgain: '/members',
                id: id,
                member: theuser.rows,
                roles: roles.rows,
                roleid: themember.rows[0].roleid
              });
            })
            .catch(err => console.log(err));
        })
        .catch(err => console.log(err));
    })
    .catch(err => console.log(err));
};

exports.postEditMember = (req, res, next) => {
  const { firstname, id } = req.params;
  const { roleChoosed } = req.body;
  const user = new User(undefined, undefined, firstname);

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
};
