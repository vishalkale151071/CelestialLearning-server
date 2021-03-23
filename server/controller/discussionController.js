const { validationResult } = require('express-validator');
const { Course, Section, Content } = require('../models/courseModel');
const asyncHandler = require('express-async-handler');
const {Subscriber} = require('../models/subscriberModel');
const { Author} = require("../models/authorModel");

const { Discussion } = require('../models/discussionForumModel');

exports.discussionForum = asyncHandler(async(req,res)=>{

    const {comment,courseName} = req.body;
    const email = req.session.email;
    const author = await Author.findOne({email});
    if(author)
    {
        const discussion = new Discussion({
            userId : author._id,
            comment,
            role : "Author",
            courseName,
            dateTimeStamp : Date()
        })
        await discussion.save();
    }
    else
    {
        const subscriber = await Subscriber.findOne({email})
        const discussion = new Discussion({
            userId : subscriber._id,
            comment,
            role : "Subscriber",
            courseName,
            dateTimeStamp : Date()
        })
        await discussion.save();
    }
    res.status(200);
    return res.json({
        message : "comment uploaded succesffully"
    })
})

exports.getDiscussionDetails = asyncHandler(async(req,res)=>{

    const {courseName} = req.body;
    const discussion = await Discussion.find({courseName});
    res.status(200);
    return res.json({
        discussion
    })
})

