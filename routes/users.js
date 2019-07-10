const express = require('express');
const router = express.Router();

const controller = require('../controllers/users');

/* GET users listing. */
router.get('/login', controller.getLogin);
router.post('/login', controller.postLogin);
router.get('/register', controller.getRegister);
router.post('/register', controller.postRegister);

module.exports = router;
