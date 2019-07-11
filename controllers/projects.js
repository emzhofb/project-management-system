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
              res.render('projects/index', {
                title: 'Projects',
                projects: projects.rows,
                members: members.rows,
                options: { idChecked, nameChecked, memberChecked },
                path: '/projects'
              });
            })
            .catch(err => console.log(err));
        })
        .catch(err => console.log(err));
    })
    .catch(err => console.log(err));
};

exports.getAddProject = (req, res, next) => {
  const member = new Member();

  member.findMember().then(members => {
    res.render('projects/add', {
      title: 'Add Project',
      members: members.rows,
      path: '/projects/add'
    });
  });
};

exports.getColumn = (req, res, next) => {
  const { idChecked, nameChecked, memberChecked } = req.query;
  const columnid = idChecked ? 'on' : 'off';
  const columnname = nameChecked ? 'on' : 'off';
  const columnmember = memberChecked ? 'on' : 'off';

  const queries = new Queries(columnid, columnname, columnmember);
  console.log(columnid, columnname, columnmember);

  queries
    .updateQuery()
    .then(query => {
      console.log(query.rows[0]);
      res.redirect('/projects');
    })
    .catch(err => console.log(err));
};
