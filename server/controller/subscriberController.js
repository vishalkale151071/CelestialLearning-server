
const User = require("../models/userModel")
const asyncHandler = require('express-async-handler')
const { validationResult } = require("express-validator")
const sgMail = require('@sendgrid/mail')
const passwordStrength = require('check-password-strength')
const jwt = require('jsonwebtoken')
const e = require("express")
require('dotenv').config();
sgMail.setApiKey(process.env.SENDGRID_API)

exports.register = asyncHandler(async (req, res) => {
    
    const errors = validationResult(req);

    if(!errors.isEmpty()){
        res.status(401);
        throw new Error(errors.array()[0].msg);
    }

    const { username, email, password, confirm_password } = req.body;

    const emailExists = await User.findOne({email});
    const usernameExists = await User.findOne({username});

    if(password != confirm_password){
        res.status(401);
        throw new Error("Password did not match");
    }

    if(usernameExists){
        res.status(401);
        throw new Error("Username is already taken.");
    }

    if(emailExists){
        res.status(401);
        throw new Error("This email is already used.");
    }

    const strength = passwordStrength(password);
    
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

    const token = jwt.sign(
        {
        email
        },
        process.env.JWT_ACCOUNT_ACTIVATION,
        {
            expiresIn: '1h'
        }
    )

    try{
        await user.save();
        res.status(200);
        console.log("User data saved.");
    }catch(err){
        console.log(err);
    }
    /*
    const emailData = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Account activation Link',
        html: `
                <h1>Please use the following Link to Activate your Account</h1>
                <p>Please use the following pin to activate the account <b>${pin}</b> </p>
                <p>${process.env.CLIENT_URL}/user/verify?token=${token}</p>
                <hr />
                <p>This Email Contains Sensitive Information</p>
                <p>${process.env.CLIENT_URL}</p>
              `
      };

      sgMail
       .send(emailData)
       .then(sent => {
         return res.json({
           message: `Email has been sent to ${email} ${token}`
         });
       })
       .catch(error => {
         res.status(400)
         throw new Error(error)
       });
       */
      return res.json({
          "token" : token
      })
})

exports.verify = asyncHandler(async (req, res) => {
    const error = validationResult(req);

    if(!error.isEmpty())
    {
        res.status(401)
        throw new Error("Token is missing")
    }

    const { token } = req.body

    jwt.verify(token, process.env.JWT_ACCOUNT_ACTIVATION, (err) => {
        if(err){
            res.status(401)
            throw new Error("Token expires or invalid")
        }else{
            const { email } = jwt.decode(token);
            const filter = {email: email}
            const update = {status: "Active"}
            
            User.findOneAndUpdate(filter,update,
                {
                    useFindAndModify: false,
                    new: true
                },
                (err, doc) => {
                    if(err){
                        console.log(err)
                        res.json({
                            msg: "Uregisterd token." 
                        })
                    }
                    else{
                        if(doc){
                            res.json({ msg: "User Activated." })
                        }
                        else{
                                res.json({ msg: "Unregistred Token." })
                        }
                    }
                }
            )

        }
    })
})