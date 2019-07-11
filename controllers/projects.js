const Project = require('../models/project');
const Member = require('../models/member');

exports.getProjects = (req, res, next) => {
  const project = new Project();
  const member = new Member();

  member
    .find()
    .then(members => {
      project
        .find()
        .then(projects => {
          res.render('projects/index', {
            title: 'Projects',
            projects: projects.rows,
            members: members.rows,
            path: '/projects'
          });
        })
        .catch(err => console.log(err));
    })
    .catch(err => console.log(err));
};
