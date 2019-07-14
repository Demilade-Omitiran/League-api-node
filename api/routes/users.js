const express = require('express');
const router = express.Router();
const UsersController = require('../controllers/Users');
const { authentication } = require('../../middleware');

router.post('/signup', UsersController.signUp);
router.post('/login', UsersController.login);
router.post('/logout', authentication, UsersController.logout);

module.exports = router;

