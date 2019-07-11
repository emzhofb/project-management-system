const Project = require('../models/project');
const Member = require('../models/member');
const Queries = require('../models/query');

exports.getProjects = (req, res, next) => {
  const project = new Project();
  const member = new Member();
  const queries = new Queries();

  queries
    .findQuery()
    .then(allQueries => {
      const idChecked = allQueries.rows[0].columnid;
      const nameChecked = allQueries.rows[0].columnname;
      const memberChecked = allQueries.rows[0].columnmember;
      member
        .findMember()
        .then(members => {
          project
            .find()
            .then(projects => {
              member
                .projectMember()
                .then(result => {
                  res.render('projects/index', {
                    title: 'Projects',
                    projects: projects.rows,
                    members: members.rows,
                    projectmember: result.rows,
                    options: { idChecked, nameChecked, memberChecked },
                    path: '/projects'
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

exports.getAddProject = (req, res, next) => {
  const member = new Member();

  member
    .findMember()
    .then(members => {
      res.render('projects/add', {
        title: 'Add Project',
        members: members.rows,
        path: '/projects/add'
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
        .find()
        .then(projects => {
          for (let i = 0; i < projects.rows.length; i++) {
            if (projects.rows[i].projectname === projectname) {
              const member = new Member(
                Number(memberid),
                Number(projects.rows[i].projectid),
                2
              );
              member
                .save()
                .then(() => res.redirect('/projects'))
                .catch(err => console.log(err));
            }
          }
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
          res.render('projects/edit', {
            title: 'Edit Product',
            path: `/projects/edit/${req.params.id}`,
            members: members.rows,
            projectname: project.rows[0].projectname
          });
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
