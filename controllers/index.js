exports.getIndex = (req, res, next) => {
  res.render('index', { title: 'Project Management System' });
};
