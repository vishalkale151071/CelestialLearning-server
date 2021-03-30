const express = require('express')
const router = express.Router()
const { check } = require("express-validator");
const { login, pendingRequest, setPaymentLimit, verifyOTP } = require('../controller/adminController');

router.post(
    '/login',
    [], login
);
router.post(
    '/pendingRequest',[],pendingRequest
)
router.post(
    '/reviewRequest',[],setPaymentLimit
)
router.post(
    '/otpverify',[],verifyOTP
)
module.exports = router