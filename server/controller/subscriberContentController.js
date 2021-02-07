const { validationResult } = require('express-validator');
const { Course, Section, Content } = require('../models/courseModel');
const asyncHandler = require('express-async-handler');
const {Subscriber, SubscribedCourses, Order, SubscriberProfile} = require('../models/subscriberModel');
const { Author, AuthorProfile } = require("../models/authorModel");
const shortid = require('shortid')
const Razorpay = require('razorpay')
const crypto = require('crypto')

//url: susbcriber/courseHome
exports.courseHome = asyncHandler(async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        res.status(400);
        return res.json({
            message: errors.array()[0].msg
        });
    }
    const { courseTitle } = req.body;
    
    const course = await Course.findOne({ title: courseTitle });
    const content = await Content.findOne({ _id: course.content });
    const sectionsId = content.section;
    const sectionData = [];
    for (i = 0; i < sectionsId.length; i++) {
        const sectionsData = await Section.findOne({ _id: sectionsId[i] });
        sectionData.push({
            "sectionNumber": sectionsData.number,
            "sectionName": sectionsData.sectionName
        });
    }
    const author = await Author.findOne({ _id: course.author });
    const profile = await AuthorProfile.findOne({ _id: author.profile_id });
    res.status(200);
    return res.json({
        title: course.title,
        price: course.price,
        suitableFor: course.suitableFor,
        description: course.description,
        category: course.category,
        prerequisite: course.prerequisite,
        authorName: `${profile.firstName} ${profile.middleName} ${profile.lastName}`,
        sectionData,
        courseThumbnail: `https://celestiallearning.s3.amazonaws.com/${course.courseSlug}/${course._id}_thumbnail.${course.thumbnailExtension}`,
        coursePreview: `https://celestiallearning.s3.amazonaws.com/${course.courseSlug}/${course._id}_preview.${course.previewExtension}`
    })
})

//url : subscriber/payment
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

exports.verification = asyncHandler(async (req, res) => {
    const secret = '123456'
    
    const order = await Order.findOne({paymentId:req.body.payload.payment.entity.order_id});
    const shasum = crypto.createHmac('sha256', secret)
    shasum.update(JSON.stringify(req.body))
    const digest = shasum.digest('hex')

    //console.log(digest, req.headers['x-razorpay-signature'])
    
    
    if (digest === req.headers['x-razorpay-signature']) {
        
         const subscriber = await Subscriber.findOne({_id: order.subscriberId}); // susbcriber id
        
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
        console.log('request is legit')
        
    } else {
        
        console.log("request invalid")
    }
    res.json({ status: 'ok' })
})

// url: subscriber/myCourses
exports.myCourses  = asyncHandler(async(req,res)=>{

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        res.status(400);
        return res.json({
            message: errors.array()[0].msg
        });
    }

    const email = req.session.email;
    
    const subscriber = await Subscriber.findOne({ email });
   
    const subscriberCourses = await SubscribedCourses.findOne({_id:subscriber.subscribedCourses})
    if(subscriberCourses)
    {
        const courseData = [];
        for (i = 0; i < subscriberCourses.courseId.length; i++) {
            const courses = await Course.findOne({_id:subscriberCourses.courseId[i]})
            courseData.push({
                'courseThumbnail': `https://celestiallearning.s3.amazonaws.com/${courses.courseSlug}/${courses._id}_thumbnail.${courses.thumbnailExtension}`,
                'courseId': courses._id,
                'courseName': courses.title,
                'category': courses.category,
                'price': courses.price
            });
        }

        res.status(200);
        return res.json({
            // url: url,
            courseData
        })
    }
    else
    {
        res.status(404);
        return res.json({
            message : "No subscribed courses yet. "
        })
    }
    
})



