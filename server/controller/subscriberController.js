
const User = require("../models/userModel")
const jwt = require("jsonwebtoken")
const asyncHandler = require('express-async-handler')
const generateToken = require('../utils/generateToken')
const { validationResult } = require("express-validator");
const sgMail = require('@sendgrid/mail'); 
sgMail.setApiKey('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');
const passwordStrength = require('check-password-strength');

exports.register = asyncHandler(async (req, res) => {
    
    const errors = validationResult(req);

    if(!errors.isEmpty()){
        res.status(401);
        throw new Error(errors.array()[0].msg);
    }

    const { username, email, password, confirm_password } = req.body;

    const emailExists = await User.findOne({email});
    const usernameExists = await User.findOne({username});

    if(emailExists){
        res.status(401);
        throw new Error("This email is already used.");
    }

    if(usernameExists){
        res.status(401);
        throw new Error("Username is already taken.");
    }

    const strength = passwordStrength(password);
    console.log(strength.value);

    if(password != confirm_password){
        res.status(401);
        throw new Error("Password did not match");
    }
    
    if(strength.length > 72){
        res.status(401);
        throw new Error("Password is too Long");
    }

    if(strength.value != "Strong"){
        res.status(401);
        throw new Error("Weak Password")
    }

    const user = new User({
        username: username,
        email: email,
        password: password,
        role: "Subscriber",
    });

    try{
        await user.save();
        res.status(200);
        res.send("User data saved.");
    }catch(err){
        console.log(err);
    }

})