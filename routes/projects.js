const express = require('express');
const router = express.Router();

const controller = require('../controllers/projects');

/* GET home page. */
router.get('/', controller.getProjects);
router.get('/column', controller.getColumn);
router.get('/add', controller.getAddProject);
router.post('/add', controller.postAddProject);
router.get('/edit/:id', controller.getEditProject);
router.post('/edit/:id', controller.postEditProject);
router.get('/delete/:id', controller.getDeleteProject);

module.exports = router;
