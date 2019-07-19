const express = require('express');
const router = express.Router();

const { checkAuth } = require('../middleware/auth');
const controller = require('../controllers/index');

/* GET home page. */
router.get('/', checkAuth, controller.getIndex);

module.exports = router;
