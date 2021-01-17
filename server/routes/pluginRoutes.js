const express = require('express');
const { init } = require('../controller/pluginController');
const router = express.Router();
const { check } = require('express-validator')

router.post(
    '/init',
    [
    ],
    init
)

module.exports = router;