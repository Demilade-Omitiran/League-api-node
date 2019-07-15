const express = require('express');
const router = express.Router();
const FixturesController = require('../controllers/Fixtures');
const { authentication, adminAuthorization } = require('../../middleware');

router.get('/', FixturesController.index);
router.post('/', authentication, adminAuthorization, FixturesController.create);
router.post('/generate_link/:id', authentication, adminAuthorization, FixturesController.generateLink);
router.get('/link/:id', FixturesController.getByLink);
router.get('/:id', authentication, FixturesController.show);
router.delete('/:id', authentication, adminAuthorization, FixturesController.delete);
router.patch('/:id', authentication, adminAuthorization, FixturesController.update);

module.exports = router;