const express = require('express');
const router = express.Router();

const { checkAuth } = require('../middleware/auth');
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
router.get('/members/delete/:id/:firstname', controller.getDeleteMember);
router.get('/members/edit/:id/:firstname', controller.getEditMember);
router.post('/members/edit/:id/:firstname', controller.postEditMember);
router.get('/issues/:id', controller.getIssueProject);
router.get('/issues/add/:id', controller.getAddIssue);
router.post('/issues/add/:id', controller.postAddIssue);
router.get('/issues/column/:id', controller.getIssueColumn);
router.get('/issues/delete/:id/:issueid', controller.getDeleteIssue);
router.get('/issues/edit/:id/:issueid', controller.getEditIssue);
router.post('/issues/edit/:id/:issueid', controller.postEditIssue);
router.get('/activity/:id', controller.getActivity);

module.exports = router;
