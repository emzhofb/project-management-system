const Project = require('../models/project');

exports.getProjects = (req, res, next) => {
  const project = new Project();

  project.find().then(result => {
    res.render('projects/index', { title: 'Projects', projects: result.rows });
  });
};
