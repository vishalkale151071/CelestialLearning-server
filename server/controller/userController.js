const User = require("../models/userModel")
const jwt = require("jsonwebtoken")
const asyncHandler = require('express-async-handler')
const generateToken = require('../utils/generateToken')
const { validationResult } = require("express-validator");
const sgMail = require('@sendgrid/mail'); 
sgMail.setApiKey('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');

// @desc    Post Email Sent
// @route   POST /api/users/signup
// @access  Public
exports.signup = asyncHandler(async (req, res) => {

     const errors = validationResult(req);
 
     if (!errors.isEmpty()) {
       res.status(422)
         throw new Error(errors.array()[0].msg)
     }
 
     const { name, email, password } = req.body
   
     const userExists = await User.findOne({ email })
   
     if (userExists) {
       res.status(400)
       throw new Error('User already exists')
     }
 
     const token = jwt.sign({
       name,
       email,
       password
     },
     process.env.JWT_ACCOUNT_ACTIVATION,
     {
       expiresIn: '5m'
     }
   );
 
     const emailData = {
       from: process.env.EMAIL_FROM,
       to: email,
       subject: 'Account activation Link',
       html: `
               <h1>Please use the following Link to Activate your Account</h1>
               <p>${process.env.CLIENT_URL}/user/verify/${token}</p>
               <hr />
               <p>This Email Contains Sensitive Information</p>
               <p>${process.env.CLIENT_URL}</p>
             `
     };
 
     sgMail
       .send(emailData)
       .then(sent => {
         return res.json({
           message: `Email has been sent to ${email}`
         });
       })
       .catch(error => {
         res.status(400)
         throw new Error(error)
       });
 
 })

 
 // @desc    Post Verify Email
 // @route   POST /api/users/verify
 // @access  Public
 exports.verify = asyncHandler(async (req, res) => {
 
     console.log("Body" , req.body)
     const { name, email, password } = req
         const user = await User.create({
           name,
           email,
           password,
         })
       
         if (user) {
           res.status(201).json({
             _id: user._id,
             name: user.name,
             email: user.email,
           })
         } else {
           res.status(400)
           throw new Error('Invalid user data')
         }
 })
 
 
// @desc    Post 
// @route   POST /api/users/login
// @access  Public

exports.login = asyncHandler(async (req, res) => {

     const errors = validationResult(req);
     const { email, password } = req.body;
   
     if (!errors.isEmpty()) {
       res.status(422)
       throw new Error(errors.array()[0].msg)
     }
    // console.log("Body : " , req.body)
     const user = await User.findOne({ email })
   
     if (!user) {
       res.status(404)
       throw new Error('User Not Registered')
     }
   
     if (user && (await user.matchPassword(password))) {
      
       res.json({
         _id: user._id,
         name: user.name,
         email: user.email,
         isStudent: user.isStudent,
         token: generateToken(user._id),
       })
       
     } else {
       res.status(401)
       throw new Error('Invalid email or password')
     }
   })