const express = require('express');
const router = express.Router();

const controller = require('../controllers/projects');

/* GET home page. */
router.get('/', controller.getProjects);

module.exports = router;
