const { validationResult } = require('express-validator');

const asyncHandler = require('express-async-handler');
const {CourseTrack} = require('../models/progressModel')
const {Subscriber} = require('../models/subscriberModel');
const { Course,Section,Video } = require('../models/courseModel');
const e = require('express');
const { json } = require('body-parser');

exports.videoProgress = asyncHandler(async(req,res)=>{
    const {duration, title, sectionName,videoId} = req.body;
    
    const email = req.session.email;
    // subscriber session identification 
    const subscriber = await Subscriber.findOne({email});
    
    const course = await Course.findOne({title});
    const section = await Section.findOne({sectionName})
    const video = await Video.findOne({_id:videoId})

    const progress = await CourseTrack.findOne({subscriberId:subscriber._id})
    const subscribedCourses = progress.courses
   
    var flag = false;
    var courseIndex=0;
    // checking whether that course is present or not
    // please optimise this for loop.
    for(i=0;i<subscribedCourses.length;i++)
    {
        if(JSON.stringify(subscribedCourses[i].courseId)==JSON.stringify(course._id))
        {
            flag = true
            courseIndex = i
            break
        }
    }
    // this block works when course is already there in the schema
    if(flag)
    {
        const sectionData = subscribedCourses[courseIndex].sections
        
        flag = false
        var sectionIndex=0
        // checking whether that section is present or not
        // please optimise this for loop.
        for(j=0;j<sectionData.length;j++)
        {
            if(JSON.stringify(sectionData[j].sectionId)==JSON.stringify(section._id))
            {
                flag = true
                sectionIndex = j
                    break
            }
        }
        // this block works when section is already there in the schema
        if(flag)
        {
            const videoData = subscribedCourses[courseIndex].sections[sectionIndex].videos;
            
            flag = false;
            var videoindex=0;
            // checking whether that video is present or not
            // please optimise this for loop.
            for(k=0;k<videoData.length;k++)
            {
                if(JSON.stringify(videoData[k].videoId)==JSON.stringify(videoId))
                {
                    flag = true
                    videoindex = k
                    break
                }
            }
            // this block works when video is already there in the schema
            if(flag)
            {
                //console.log(progress.courses[courseIndex].sections[sectionIndex].videos[videoindex]._id)
                const hgf = progress.courses[courseIndex].sections[sectionIndex].videos[videoindex]._id;
                // console.log(hgf)
                await CourseTrack.findOneAndUpdate({_id:hgf},{$set: {'timePlayed': 78}},function(err,doc){
                    
                    if(err)
                    console.log(err)
                    else
                    console.log(doc)
                })
            }
            // VIDEO NOT FOUND. THEN PUSH
            else
            {
            //console.log(progress.courses[courseIndex].sections[sectionIndex]);
                await progress.courses[courseIndex].sections[sectionIndex].videos.push({
                "videoId" : videoId,
                "videoName" : video.videoName,
                timePlayed : duration
                })
                await progress.save();
            }
            
        }
        // SECTION NO FOUND. THEN PUSH
        else
        {
        // console.log(progress.courses[courseIndex].sections);
            await progress.courses[courseIndex].sections.push({
            "sectionName" : section.sectionName,
            sectionId:section._id,
        })
        await progress.save();
        }   
    }
    // COURSE NOT FOUND. THEN PUSH
    else
    {
        await progress.courses.push({
            "courseName" : title,
            courseId : course._id,
        })
        await progress.save();
    }
   
    return res.json({
        progress
    })
})