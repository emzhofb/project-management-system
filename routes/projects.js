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
router.get('/overview/:id', controller.getDetailProject);
router.get('/members/:id', controller.getMemberProject);
router.get('/members/column/:id', controller.getPositionColumn);
router.get('/members/add/:id', controller.getAddMember);
router.post('/members/add/:id', controller.postAddMember);

module.exports = router;
