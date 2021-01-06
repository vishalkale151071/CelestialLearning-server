const { SubscriberProfile } = require('../models/subscriberModel');
const { Subscriber } = require('../models/subscriberModel')
const asyncHandler = require('express-async-handler')
const { validationResult } = require("express-validator")
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
require('dotenv').config();
const sgMail = require('@sendgrid/mail')

exports.profile = asyncHandler(async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        res.status(401);
        return res.json({
            "msg": errors.array()[0].msg,
        })
    }

    const email = req.session.email;
    console.log(email);
    const subscriber = await Subscriber.findOne({ email });
    if (subscriber) {
        const _id = (subscriber.profile_id);
        const profiledata = await SubscriberProfile.findOne({ _id: _id });
        if (profiledata) {
            res.json(
                profiledata,
            );
        }
        else {
            res.json({
                message: "Profile not added.",
            })
        }
    }
    else {
        res.json({
            message: "Incorrect user details.",
        })
    }


});

exports.update = asyncHandler(async (req, res) => {

    const { firstName, middleName, lastName, phNum, linkedInURL, twitterURL, higherEducation, areaOfInterest } = req.body;
    const email = req.session.email;

    const subscriber = await Subscriber.findOne({ email });
    const _id = subscriber.profile_id;
    const profile = await SubscriberProfile.findOne({ _id });
    const filter = { _id: await profile._id }
    const update = { firstName: firstName, middleName: middleName, lastName: lastName, phNum: phNum, linkedInURL: linkedInURL, twitterURL: twitterURL, higherEducation: higherEducation, areaOfInterest: areaOfInterest }
    await SubscriberProfile.findOneAndUpdate(filter, update,
        {
            useFindAndModify: false,
            new: true
        },
    )
    return res.json({
        "message": "profile updated successfully"
    })


});

exports.emailChange = asyncHandler(async (req, res) => {

    const { new_email } = req.body;
    const token = jwt.sign(
        {
            new_email
        },
        process.env.JWT_SECRET,
        {
            expiresIn: '1h'
        }
    )
    const emailData = {
        from: process.env.EMAIL_FROM,
        to: new_email,
        subject: 'Email reset Link',
        html: `
                    <h1>Please use the following Link to reset your email address</h1>
                    
                    <p>${process.env.CLIENT_URL}/subscriber/verify/${token}</p>
                    <hr />
                    <p>This Email Contains Sensitive Information</p>
                    <p>${process.env.CLIENT_URL}</p>
                  `
    };

    sgMail
        .send(emailData)
        .then(sent => {
            return res.json({
                message: `Email has been sent to ${new_email} ${token}`
            });
        })
        .catch(error => {
            res.status(400)
            throw new Error(error)
        });
})

exports.verify1 = asyncHandler(async (req, res) => {
    const error = validationResult(req);

    if (!error.isEmpty()) {
        res.status(401)
        return res.json({
            "msg": "Token is missing",
        })
    }

    const token = req.headers.authorization.split(' ')[1];
    console.log(token);
    jwt.verify(token, process.env.JWT_SECRET, async (err) => {
        if (err) {
            res.status(401)
            return res.json({
                "msg": "Token expires or invalid",
            })
        }
        else {
            const { new_email } = jwt.decode(token);
            console.log(new_email);
            const email = req.session.email;
            console.log(email);
            const subscriber = await Subscriber.findOne({ email });
            if (subscriber) {

                const filter = { email: email }
                const update = { email: new_email }

                Subscriber.findOneAndUpdate(filter, update,
                    {
                        useFindAndModify: false,
                        new: true
                    },
                )
                req.session.email = new_email;
                return res.json({
                    "msg": "your email has been updated."
                })
            }
            else {
                return res.json({
                    "msg": "no such user.",
                })
            }
        }
    })
});