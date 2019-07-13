const express = require('express');
const router = express.Router();
const UsersController = require('../controllers/Users');

router.post('/signup', UsersController.signUp);

module.exports = router;

