const express = require('express')
const router = express.Router() 
const { check } = require("express-validator");
const { register, verify } = require('../controller/subscriberController');


router.post(
    '/register',
    [
        check("username", "username should not be empty."),
        check("email", "Email should not be empty.").isEmail(),
        check("password", "Weak password.").isStrongPassword(),
        check("confirm-password", "password did not match")
    ], register
);

router.post(
    '/verify',
    [
        check("token", "Token is not present.")
    ],
    verify
);




module.exports = router