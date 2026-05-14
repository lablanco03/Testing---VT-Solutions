const express = require('express');
const { getRates, convertPrice } = require('../controllers/externalController');

const router = express.Router();

router.get('/rates', getRates);
router.get('/convert', convertPrice);

module.exports = router;
