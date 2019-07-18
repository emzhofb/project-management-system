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
                                totalOpenSupport: totalOpenSupport.rows[0].count
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
  const fieldMember = [];

  if (idChecked && id) {
    if (Number(id)) {
      filterMember.push(Number(id));
      fieldMember.push('memberid');
    }
  }
  if (positionChecked && position) {
    filterMember.push(Number(position));
    fieldMember.push('roleid');
  }
  if (nameChecked && name) {
    const firstname = name.split(' ');
    filterMember.push(firstname[0]);
    fieldMember.push('userid');
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

          const member = new Member(undefined, projectId);
          member
            .countMemberByProject()
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

              member
                .findMemberByProjectAndOffset(perPage, offset)
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
              res.render('projects/details/member/edit', {
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

      let countIssue = `SELECT count(*) FROM public.issues WHERE projectid = ${projectId}`;

      if (filterIssue.length > 0) {
        countIssue += ` WHERE`;
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
                }
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
        members: members.rows
      });
    })
    .catch(err => console.log(err));
};

exports.postAddIssue = (req, res, next) => {
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
  const issueid = req.params.issueid;
  const id = req.params.id;

  const sql = `DELETE FROM public.issues
  WHERE issueid = ${issueid}`;

  pool
    .query(sql)
    .then(() => res.redirect(`/projects/issues/${id}`))
    .catch(err => console.log(err));
};

exports.getEditIssue = (req, res, next) => {
  const issueid = req.params.issueid;
  const projectId = req.params.id;
  const member = new Member(undefined, projectId);
  const sql = `SELECT * FROM public.issues WHERE issueid = ${issueid}`;

  pool
    .query(sql)
    .then(issue => {
      member
        .findMemberByProject()
        .then(members => {
          res.render('projects/details/issue/edit', {
            title: 'Issues',
            path: '/projects',
            pathAgain: '/issues',
            id: projectId,
            members: members.rows,
            issues: issue.rows[0]
          });
        })
        .catch(err => console.log(err));
    })
    .catch(err => console.log(err));
};

exports.postEditIssue = (req, res, next) => {
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
              priority='${priority}', assignee=${assigneId.rows[0].userid}, 
              startdate='${startdate}', duedate='${duedate}', estimatedtime=${estimatedtime}, 
              done=${done}, files='${fileUpload.name}', spenttime=${spenttime}, 
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
};
