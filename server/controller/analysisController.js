const { Course, Section,Content} = require('../models/courseModel');
const asyncHandler = require('express-async-handler');
const {Subscriber, SubscribedCourses} = require('../models/subscriberModel') 
const {Author} = require('../models/authorModel')
const {Test,Question, SubscriberResult} = require('../models/assessmentModel');
//author side analysis
//url : analysis/subscriberVsCourse
exports.subscriberVsCourse = asyncHandler(async(req,res)=>{
    const email = "saumya.sinha38@gmail.com";
    const author = await Author.findOne({email});
    const course = await Course.find({author:author._id});
    console.log(course.length)
    const data = []
    data.push({
            
        name: 'Group A', value: 400} ,{
        name: 'Group B', value: 300} ,{
        name: 'Group C', value: 300}, { 
        name: 'Group D', value: 200} 
     
    )
    // for(i=0;i<course.length;i++)
    // {
    //     const subscribedCourses = await SubscribedCourses.find().where('courseId').in([course[i]._id]).exec();
    //     // data.push({
    //     //     "courseName" : course[i].title,
    //     //     "subscriberCount" : subscribedCourses.length 
    //     // })     
        
    // }
    return res.json({
        data
    });
})