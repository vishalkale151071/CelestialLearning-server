const express = require('express')
const router = express.Router()
const { check } = require("express-validator");
const multer = require('multer');
const {payment,verification} = require('../controller/paymentController');
const { isLoggedIn } = require('../middleware/isLoggedInmiddleware');

router.post(
    '/process',isLoggedIn,
    [], payment
);

router.post(
    '/verification',
    [],verification
);

module.exports = router