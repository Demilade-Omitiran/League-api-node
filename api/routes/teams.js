const express = require('express');
const router = express.Router();
const TeamsController = require('../controllers/Teams');
const { authentication, adminAuthorization } = require('../../middleware');

router.get('/search', TeamsController.search);
router.post('/', authentication, adminAuthorization, TeamsController.create);
router.delete('/:id', authentication, adminAuthorization, TeamsController.delete);
router.patch('/:id', authentication, adminAuthorization, TeamsController.update);
router.get('/', authentication, TeamsController.index);
router.get('/:id', authentication, TeamsController.show);

module.exports = router;