const express = require('express');
const router = express.Router();

const { checkAuth } = require('../middleware/auth');
const controller = require('../controllers/users');

/* GET users listing. */
router.get('/', checkAuth, controller.getUser);
router.get('/edit/:id', checkAuth, controller.getEditUser);
router.post('/edit/:id', controller.postEditUser);
router.get('/delete/:id', checkAuth, controller.getDeleteUser);
router.get('/column', controller.getUserColumn);
router.get('/login', controller.getLogin);
router.post('/login', controller.postLogin);
router.get('/register', checkAuth, controller.getRegister);
router.post('/register', controller.postRegister);
router.get('/logout', controller.getLogout);
router.get('/profile', checkAuth, controller.getProfile);
router.post('/profile', controller.postProfile);
router.get('/forgotpassword', controller.getForgotPassword);
router.post('/forgotpassword', controller.postForgotPassword);
router.get('/resetpassword/:email', controller.getResetPassword);
router.post('/resetpassword/:email', controller.postResetPassword);

module.exports = router;
