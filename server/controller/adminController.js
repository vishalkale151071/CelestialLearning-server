const { Author } = require("../models/authorModel")
const asyncHandler = require('express-async-handler')
const { validationResult } = require("express-validator")
const sgMail = require('@sendgrid/mail')
const jwt = require('jsonwebtoken')
const { Admin } = require("../models/adminModel")
require('dotenv').config();
sgMail.setApiKey(process.env.SENDGRID_API)


exports.login = asyncHandler(async (req, res) => {
    const error = validationResult(req);
    if (!error.isEmpty()) {
        res.status(401)
        return res.json({
            message: "Invalid username",
        })

    }

    const { email, password } = req.body;
    console.log(email);
    console.log(password)
    const admin = await Admin.findOne({ email });
    console.log(admin)
    if (!admin) {
        res.status(401);
        return res.json({
            message: "You are not registered.",
        })

    }
    if (admin && (await admin.password == password)) {
        
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
                "_id": await admin.id,
            })
        
        

    }
    else {
        res.status(401)
        return res.json({

            message: "Incorrect username or password.",
        })
    }
});

exports.pendingRequest = asyncHandler(async(req,res)=>{

    const admin = await Admin.findOne({email:"saumyasinhatest@gmail.com"});
    res.status(200);
    return res.json({
        message :admin.pendingAuthors
    })

})

exports.setPaymentLimit = asyncHandler(async(req,res)=>{

    
    const {authorId,payment,status} = req.body;
    if(status=="Reject")
    {
        console.log("i am in if")
        const author = await Author.findOne({_id:authorId});
        const admin = await Admin.findOne({email:"saumyasinhatest@gmail.com"});
        admin.pendingAuthors.remove(authorId);
        await admin.save();
        admin.rejectedAuthors.push(authorId)
        await admin.save();
        const emailData = {
            from: process.env.EMAIL_FROM,
            to: author.email,
            subject: 'Request rejected',
            html: `
                    <h1>Sorry to inform you that your request has been rejected.</h1>
                    If you want any further assistance, kindly mail us at celestiallearning@gmail.com
                `
        };

        sgMail
            .send(emailData)
            .then(async sent => {
                try {
                
                    res.status(200);
                    return res.json({
                        message : "you have rejected the request"
                    })
                }
                    catch (err) {
                        res.status(401)
                        console.log("error");
                        res.json({
                            message: "Error",
                        })

                    }
                }).catch(error => {
                    res.status(401)
                    return res.json({
                        message: "Error while sending confirmation",
                    })
                });

    }
    else if(status=="Accept")
    {
        const author = await Author.findOne({_id:authorId});
        var tempPass = Math.floor(100000 + Math.random() * 900000)
        await Author.update({_id:authorId},{paymentPercentage:payment,tempPassword :tempPass});
        const admin = await Admin.findOne({email:"saumyasinhatest@gmail.com"});
        admin.pendingAuthors.remove(authorId);
        await admin.save();
        admin.approvedAuthors.push(authorId)
        await admin.save();
        const emailData = {
            from: process.env.EMAIL_FROM,
            to: author.email,
            subject: 'Request approval',
            html: `
                    <h1>Congratulations!! Your account is verified. You are just one step away.</h1>

                    Please follow below steps to kick start the journey.<br>
                    Step 1 : Click this link. <p>${process.env.CLIENT_URL}/author/otpverify/${authorId}</p><br>
                    Step 2 : Enter ${tempPass} in the given field.<br>
                    Step 3 : Click submit and login with your username and password.<br>
                    
                    *Note: Complete this procedure within 24 hours.<br>
                    <hr />
                    <p>This Email Contains Sensitive Information</p>
                    <p>${process.env.CLIENT_URL}</p>
                `
        };

        sgMail
            .send(emailData)
            .then(async sent => {
                try {
                
                    res.status(200);
                    return res.json({
                        message : "you have approved"
                    })
                }
                    catch (err) {
                        res.status(401)
                        console.log("error");
                        res.json({
                            message: "Error",
                        })

                    }
                }).catch(error => {
                    res.status(401)
                    return res.json({
                        message: "Error while sending confirmation",
                    })
                });

    }
    

})

exports.verifyOTP = asyncHandler(async(req,res)=>{

    const {authorId,otp} = req.body;
    const author = await Author.findOne({_id:authorId});
    if(otp==author.tempPassword)
    {
        await Author.update({_id:authorId},{status:"Active",$unset:{tempPassword: ""}});
        res.status(200)
        return res.json({
            message : "Verified"
        })
    }
    else
    {
        res.status(401)
        return res.json({
            message : "Wrong OTP. Try once again"
        })
    }

})