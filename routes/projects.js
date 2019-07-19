const express = require('express');
const router = express.Router();

const { checkAuth } = require('../middleware/auth');
const controller = require('../controllers/projects');

/* GET home page. */
router.get('/', checkAuth, controller.getProjects);
router.get('/column', checkAuth, controller.getColumn);
router.get('/add', checkAuth, controller.getAddProject);
router.post('/add', controller.postAddProject);
router.get('/edit/:id', checkAuth, controller.getEditProject);
router.post('/edit/:id', controller.postEditProject);
router.get('/delete/:id', checkAuth, controller.getDeleteProject);
router.get('/overview/:id', checkAuth, controller.getDetailProject);
router.get('/members/:id', checkAuth, controller.getMemberProject);
router.get('/members/column/:id', checkAuth, controller.getPositionColumn);
router.get('/members/add/:id', checkAuth, controller.getAddMember);
router.post('/members/add/:id', controller.postAddMember);
router.get('/members/delete/:id/:firstname', checkAuth, controller.getDeleteMember);
router.get('/members/edit/:id/:firstname', checkAuth, controller.getEditMember);
router.post('/members/edit/:id/:firstname', controller.postEditMember);
router.get('/issues/:id', checkAuth, controller.getIssueProject);
router.get('/issues/add/:id', checkAuth, controller.getAddIssue);
router.post('/issues/add/:id', controller.postAddIssue);
router.get('/issues/column/:id', checkAuth, controller.getIssueColumn);
router.get('/issues/delete/:id/:issueid', checkAuth, controller.getDeleteIssue);
router.get('/issues/edit/:id/:issueid', checkAuth, controller.getEditIssue);
router.post('/issues/edit/:id/:issueid', controller.postEditIssue);
router.get('/activity/:id', checkAuth, controller.getActivity);

module.exports = router;
