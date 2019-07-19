const express = require('express');
const router = express.Router();

const { checkAuth } = require('../middleware/auth');
const controller = require('../controllers/index');

/* GET home page. */
router.get('/', controller.getIndex);

module.exports = router;
