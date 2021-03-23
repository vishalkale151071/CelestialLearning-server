const { validationResult } = require('express-validator');
const { Course, Section, Content } = require('../models/courseModel');
const asyncHandler = require('express-async-handler');
const {Subscriber, SubscribedCourses, Order, SubscriberProfile} = require('../models/subscriberModel');
const { Author, AuthorProfile } = require("../models/authorModel");
const shortid = require('shortid')
const Razorpay = require('razorpay')
const crypto = require('crypto');
const { LiveSession } = require('../models/liveSessionModel');

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

exports.meetingSubscriberView = asyncHandler(async(req,res) =>{

    const email = req.session.email;
    console.log(email)
    const subscriber = await Subscriber.findOne({email});
    const subscribedCourses = await SubscribedCourses.findOne({_id:subscriber.subscribedCourses});
    const data = []
    const courseIdArray = subscribedCourses.courseId
    
    async function iterate(item, index, array) {
        
        const course = await Course.findOne({_id:item})
        const liveSession = await LiveSession.findOne({courseName:course.title});
        //console.log(liveSession)
        if(liveSession)
        {
            data.push(liveSession)
        }
            
        if (index === array.length - 1) {
            if(liveSession)
            {
                data.push(liveSession)
            }
            console.log(data)
            console.log('The last iteration!');
        }
      }
      courseIdArray.forEach( 
          iterate
      );
    // for(i=0;i<subscribedCourses.courseId.length;i++)
    // {
    //      
        
    // }
    // console.log(data)
    // res.status(200)
    // return res.json({
    //     message : data
    // })
})

