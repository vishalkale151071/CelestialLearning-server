const express = require('express')
const router = express.Router()
const { check } = require("express-validator");
const { subscriberVsCourse } = require('../controller/analysisController');

const { isLoggedIn } = require('../middleware/isLoggedInmiddleware');
router.post(
    '/subscriberVsCourse',isLoggedIn,
    [], subscriberVsCourse
);
module.exports = router