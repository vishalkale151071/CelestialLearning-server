const { validationResult } = require('express-validator');
const { Course, Section, Content } = require('../models/courseModel');
const asyncHandler = require('express-async-handler');
const {Subscriber, SubscribedCourses, Order, SubscriberProfile} = require('../models/subscriberModel');
const { Author, AuthorProfile } = require("../models/authorModel");
const shortid = require('shortid')
const Razorpay = require('razorpay')
const crypto = require('crypto')
const {CourseTrack} = require("../models/progressModel")
const sgMail = require('@sendgrid/mail')
require('dotenv').config();
sgMail.setApiKey(process.env.SENDGRID_API)

//url: /payment/process
exports.payment = asyncHandler(async (req, res) => {

    const email = req.session.email;
    const subscriber = await Subscriber.findOne({email});
    const subscriberProfile = await SubscriberProfile.findOne({_id:subscriber.profile_id})
    
    const razorpay = new Razorpay({
        key_id: process.env.key_id,
        key_secret: process.env.key_secret
    })
    
    const payment_capture = 1
    const { price, courseTitle } = req.body;
    const currency = 'INR'
    
    
    const course = await Course.findOne({title: courseTitle});
    const options = {
        amount: price * 100,
        currency,
        receipt: shortid.generate(),
        payment_capture
    }

    try {
        
        const response = await razorpay.orders.create(options)
        
        const order = new Order(
            {
                courseId:course._id,
                price,
                paymentId : response.id,
                subscriberId : subscriber._id,
                status : response.status
            }
        );
        await order.save();
        
        res.json({
            id: response.id,
            currency: response.currency,
            price: response.amount,
            name : `${subscriberProfile.firstName} ${subscriberProfile.middleName} ${subscriberProfile.lastName}`,
            contact : subscriberProfile.phNum,
            email
        })
    } catch (error) {
        console.log(error)
    }
})

//url: /payment/verification
exports.verification = asyncHandler(async (req, res) => {
    const secret = '123456'
    
    const order = await Order.findOne({paymentId:req.body.payload.payment.entity.order_id});
    console.log(order);
    const shasum = crypto.createHmac('sha256', secret)
    shasum.update(JSON.stringify(req.body))
    const digest = shasum.digest('hex')

    //console.log(digest, req.headers['x-razorpay-signature'])
    
    
    if (digest === req.headers['x-razorpay-signature']) {
        
         const subscriber = await Subscriber.findOne({_id: order.subscriberId}); // susbcriber id
         const course = await Course.findOne({_id:order.courseId})
         if (subscriber.subscribedCourses) {
            
             const subscribedCourses = await SubscribedCourses.findOne({ _id: subscriber.subscribedCourses })
            
             await subscribedCourses.courseId.push(order.courseId); // course id
             await subscribedCourses.save()
             await Order.update({_id:order._id},{status:req.body.payload.payment.entity.status})
         } else {
            
            const subscribedCourses = new SubscribedCourses();
            await subscribedCourses.courseId.push(order.courseId); //course id
            await subscribedCourses.save()
            await Subscriber.update({ _id: order.subscriberId }, {subscribedCourses : subscribedCourses._id });
            await Order.update({_id:order._id},{status:req.body.payload.payment.entity.status}) // subscribed course id
          }
          const courseTrack = new CourseTrack({

            subscriberId : subscriber._id,
            courseCompleted : false,
            
            
         })
         const {_id  } = await courseTrack.save();
         console.log(subscriber.email);
         console.log(course.title)

         const emailData = {
            from: process.env.EMAIL_FROM,
            to: subscriber.email,
            subject: 'Thank you for choosing us',
            html: `
                    <h3>Congratulations!! You have successsfully subscribed your course "<b>${course.title}</b>"</h3>
                   
                    Happy Learning!
                  
                  `
        };
        sgMail
        .send(emailData)
        .then(async sent => {
            try {
                
                
                console.log("susbcription mail sent");
            }
            catch (err) {
                res.status(401)
                console.log("eroro");
                res.json({
                    message: "Error",
                })

            }
            return res.json({
                message: `Email has been sent to ${subscriber.email}`
            });
        })
        .catch(error => {
            res.status(401)
            return res.json({
                message: "Error while sending activation link",
            })
        });
        console.log('request is legit')
        
    } else {
        
        console.log("request invalid")
    }
    
})