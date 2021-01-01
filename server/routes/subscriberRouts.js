const express = require('express')
const router = express.Router() 
const { check } = require("express-validator");
const {login , signup , verify } = require('../controller/userController');
const { register } = require('../controller/subscriberController');
const verifyMiddleware = require('../middleware/verifyMiddleware'); 
// router.post('/signup',[
//      check("name", "name should be at least 3 char").isLength({ min: 3 }),
//      check("email", "email is required").isEmail(),
//      check("password", "password should be at least 6 char").isLength({ min: 6 })
// ],signup)



// router.post('/login', 
// check("email", "email is required").isEmail(),
// check("password", "password field is required").isLength({ min: 1 }),login)


// router.post("/verify",verifyMiddleware,verify); 

router.post(
    '/register',
    [
        check("username", "username should not be empty."),
        check("email", "Email should not be empty.").isEmail(),
        check("password", "Weak password.").isStrongPassword(),
        check("confirm-password", "password did not match")
    ], register
);




module.exports = router