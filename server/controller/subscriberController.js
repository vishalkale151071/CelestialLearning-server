const { Subscriber } = require("../models/subscriberModel")
const { SubscriberProfile } = require("../models/subscriberModel")
const asyncHandler = require('express-async-handler')
const { validationResult } = require("express-validator")
const sgMail = require('@sendgrid/mail')
const passwordStrength = require('check-password-strength')
const jwt = require('jsonwebtoken')
const e = require("express")
const { token } = require("morgan")
const cookie = require('cookie-signature')
require('dotenv').config();
sgMail.setApiKey(process.env.SENDGRID_API)

//url: subscriber/register
exports.register = asyncHandler(async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        res.status(401);
        return res.json({
            message: errors.array()[0].msg,
        })
    }
    const { username, email, password, confirm_password } = req.body;

    const emailExists = await Subscriber.findOne({ email });
    const usernameExists = await Subscriber.findOne({ username });

    if (password != confirm_password) {
        res.status(404);
        return res.json({
            message: "Password did not match",
        })
    }

    if (usernameExists) {
        res.status(404);
        return res.json({
            message: "Username is already taken.",
        })
    }

    if (emailExists) {
        res.status(404);
        return res.json({
            message: "You are already registered.",
        })

    }

    const strength = passwordStrength(password);

    if (strength.length > 72) {
        res.status(401);
        return res.json({
            message: "Password is too Long",
        })
    }

    const user = new Subscriber({
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
            
                <p>${process.env.CLIENT_URL}/subscriber/verify/${token}</p>
                <hr />
                <p>This Email Contains Sensitive Information</p>
                <p>${process.env.CLIENT_URL}</p>
              `
    };

    sgMail
        .send(emailData)
        .then(async sent => {
            try {
                await user.save();
                res.status(200);
                console.log("User data saved.");
            }
            catch (err) {
                res.json({
                    message: "Error",
                })

            }
            res.status(200);
            return res.json({
                message: `Email has been sent to ${email}`
            });
        })
        .catch(error => {
            res.status(400)
            return res.json({
                message: "Error while sending activation link",
                error: error
            })
        });
})

//url: subscriber/verify
exports.verify = asyncHandler(async (req, res) => {

    const error = validationResult(req)
    if (!error.isEmpty()) {
        res.status(401)

        return res.json({
            message: "Token is missing",
        })
    }

    const { email } = jwt.decode(req.token);
    const subscriber = await Subscriber.findOne({ email });
    if (subscriber) {
        if (subscriber.status == "Inactive") {
            const filter = { email: email }
            const update = { status: "Active" }

            Subscriber.findOneAndUpdate(filter, update,
                {
                    useFindAndModify: false,
                    new: true
                },
                async (err, doc) => {
                    if (err) {

                        return res.json({
                            message: "Unregistered token."
                        })
                    }
                    else {
                        if (doc) {

                            return res.json({ message: "Subscriber Activated." })
                        }
                        else {
                            return res.json({ message: "Unregistered Token." })
                        }
                    }
                }
            )
        }
        else {
            res.status(404)
            return res.json({
                message: "You have already activated your account.",
            })
        }
    }
    else {
        return res.json({
            message: "This email does not exist",
        })
    }
}

);

//url: subscriber/login
exports.login = asyncHandler(async (req, res) => {
    const error = validationResult(req);
    if (!error.isEmpty()) {
        res.status(401)
        return res.json({
            message: "Access denied",
        })

    }

    const { email, password } = req.body;

    const user = await Subscriber.findOne({ email });

    if (!user) {
        res.status(404);
        return res.json({
            message: "You are not registered.",
        })

    }
    if (user && (await user.matchPassword(password))) {
        if (await user.status == "Active") {
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
            const ck = cookie.sign(req.sessionID, '12345');
            res.status(200);
            return res.json({
                message: " You are logged in successfully.",
                target: ck,
            })
        }
        else {
            res.status(404)
            return res.json({
                message: "Please activate your account.",
            })
        }

    }
    else {
        res.status(404)
        return res.json({
            message: "Incorrect username or password.",
        })
    }
});

//url: subscriber/forgetpassword
exports.forgetpassword = asyncHandler(async (req, res) => {
    const error = validationResult(req);
    if (!error.isEmpty()) {
        res.status(401)
        return res.json({
            message: "Valid Email id is required.",
        })

    }

    const { email } = req.body;

    const user = await Subscriber.findOne({ email });
    if (!user) {
        res.status(404);
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
                    
                    <p>${process.env.CLIENT_URL}/subscriber/forgetverify/${token}</p>
                    <hr />
                    <p>This Email Contains Sensitive Information</p>
                    <p>${process.env.CLIENT_URL}</p>
                  `
        };

        sgMail
            .send(emailData)
            .then(sent => {
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

//url: subscriber/forgetpasswordverify
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

//url: subscriber/updatepassword
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

    Subscriber.updateOne(
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