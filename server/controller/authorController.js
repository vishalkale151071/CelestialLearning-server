const { Author } = require("../models/authorModel")
const asyncHandler = require('express-async-handler')
const { validationResult } = require("express-validator")
const sgMail = require('@sendgrid/mail')
const passwordStrength = require('check-password-strength')
const jwt = require('jsonwebtoken')
const { Admin } = require("../models/adminModel")
require('dotenv').config();
sgMail.setApiKey(process.env.SENDGRID_API)

//url: author/register
exports.register = asyncHandler(async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        res.status(401);
        return res.json({
            message: errors.array()[0].msg,
        })
    }

    const { username, email, password, confirm_password } = req.body;

    const emailExists = await Author.findOne({ email });
    const usernameExists = await Author.findOne({ username });

    if (password != confirm_password) {
        res.status(401);
        return res.json({
            message: "Password did not match",
        })
    }

    if (usernameExists) {
        res.status(401);
        return res.json({
            message: "Username is already taken.",
        })
    }

    if (emailExists) {
        res.status(401);
        return res.json({
            message: "This email is already used.",
        })

    }

    const strength = passwordStrength(password);

    if (strength.length > 72) {
        res.status(401);
        return res.json({
            message: "Password is too Long",
        })
    }

    const author = new Author({
        username: username,
        email: email,
        password: password,
    });

    const token = jwt.sign(
        {
            email
        },
        process.env.JWT_SECRET,
        {
            expiresIn: '1h'
        }
    )

    const emailData = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Account activation Link',
        html: `
                <h1>Please use the following Link to Activate your Account</h1>
            
                <p>${process.env.CLIENT_URL}/author/verify/${token}</p>
                <hr />
                <p>This Email Contains Sensitive Information</p>
                <p>${process.env.CLIENT_URL}</p>
              `
    };

    sgMail
        .send(emailData)
        .then(async sent => {
            try {
                await author.save();
                
                console.log("Author data saved.");
            }
            catch (err) {
                res.status(401)
                res.json({
                    message: "Error",
                })

            }
            return res.json({
                message: `Email has been sent to ${email}`
            });
        })
        .catch(error => {
            res.status(401)
            return res.json({
                message: "Error while sending activation link",
            })
        });
})

//url: author/verify
exports.verify = asyncHandler(async (req, res) => {
    const error = validationResult(req);

    if (!error.isEmpty()) {
        res.status(401)
        return res.json({
            message: "Token is missing",
        })
    }

    const { email } = jwt.decode(req.token);
    const author = await Author.findOne({ email });
    if (author) 
    {
        if (author.status == "Inactive") 
        {
            const admin = await Admin.findOne({email:"saumyasinhatest@gmail.com"});
            console.log(admin)
            if(admin.pendingAuthors.includes(author._id))
            {
                res.status(200)
                return res.json({
                    message :"You have already requested.It will take 24-48 hours to get approved."
                })
            }
            admin.pendingAuthors.push(author._id);
            await admin.save();
            // admin ko ek mail send karna hai. to notify ki author ne request ki hai.
            //ya phir bell notification use kar sakte hai.
            res.status(200)
            return res.json({
                message : "Your email address has been verified successfully. Your request has been sent to the admin. It will take 24-48 hours to get approved. Once approved you will get an email. Thank you for trusting us!!!"
            })
            
        }
        else {
            res.status(401)
            return res.json({
                message: "You have already activated your account.",
            })
        }
    }

    else {
        res.status(401)
        return res.json({
            message: "You have already activated your account.",
        })
    }
    
})


//url: author/login
exports.login = asyncHandler(async (req, res) => {
    const error = validationResult(req);
    if (!error.isEmpty()) {
        res.status(401)
        return res.json({
            message: "Invalid username",
        })

    }

    const { email, password } = req.body;

    const author = await Author.findOne({ email });

    if (!author) {
        res.status(401);
        return res.json({
            message: "You are not registered.",
        })

    }
    if (author && (await author.matchPassword(password))) {
        if (await author.status == "Active") {
            const token = jwt.sign(
                {
                    email
                },
                process.env.JWT_SECRET,
                {
                    expiresIn: '1h'
                }
            )
            req.session.email = email;
            req.session.token = token;
            res.status(200)
            return res.json({
                message: " You are logged in successfully.",
                "_id": await author.id,
            })
        }
        else {
            res.status(401)
            return res.json({
                message: "Please activate your account.",
            })
        }

    }
    else {
        res.status(401)
        return res.json({

            message: "Incorrect username or password.",
        })
    }
});

//url: author/forgetpassword
exports.forgetpassword = asyncHandler(async (req, res) => {
    const error = validationResult(req);
    if (!error.isEmpty()) {
        res.status(401)
        return res.json({
            message: "Valid Email id is required.",
        })

    }

    const { email } = req.body;

    const author = await Author.findOne({ email });
    if (!author) {
        res.status(401);
        return res.json({
            message: "Incorrect email id. Please enter registered email id.",
        })

    }
    else {
        req.session.forgetpasswordemail = email;
        const token = jwt.sign(
            {
                email
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '1h'
            }
        )
        const emailData = {
            from: process.env.EMAIL_FROM,
            to: email,
            subject: 'Password reset Link',
            html: `
                    <h1>Please use the following Link to reset your password</h1>
                    
                    <p>${process.env.CLIENT_URL}/author/forgetverify/${token}</p>
                    <hr />
                    <p>This Email Contains Sensitive Information</p>
                    <p>${process.env.CLIENT_URL}</p>
                  `
        };

        sgMail
            .send(emailData)
            .then(sent => {
                res.status(200)
                return res.json({
                    message: `Password reset link is sent to ${email}`
                });
            })
            .catch(error => {
                res.status(400)
                return res.json({
                    message: "Error while sending the email",
                })
            });
    }
});

//url: author/forgetpasswordverify
exports.forgetpasswordverify = asyncHandler(async (req, res) => {
    const error = validationResult(req);

    if (!error.isEmpty()) {
        res.status(401)
        return res.json({
            message: "Token is missing",
        })

    }
    res.status(200)
    return res.json({
        message: "Verified.",

    })
        
})

//url: author/updatepassword
exports.updatepassword = asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        res.status(401);
        return res.json({
            message: errors.array()[0].msg,
        })

    }

    const { new_password, confirm_password } = req.body

    if (new_password != confirm_password) {
        res.status(404);
        return res.json({
            message: "Passwords do not match.",
        })

    }
    const strength = passwordStrength(new_password);

    if (strength.length > 72) {
        res.status(401);
        return res.json({
            message: "Password is too Long",
        })

    }

    const email = req.session.forgetpasswordemail;

    Author.updateOne(
        { email: email },
        { password: new_password },
        (err) => {
            if (err) {
                res.status(401)
                return res.json({
                    message : "Error while updating."
                })
            }
            else {
                res.status(200)
                return res.json({
                    message: "Password changed",
                })
            }
        }
    )
})