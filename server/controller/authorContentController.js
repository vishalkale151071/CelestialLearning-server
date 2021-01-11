const { validationResult } = require('express-validator');
const { Course, Section, Content, Video } = require('../models/courseModel');
const asyncHandler = require('express-async-handler');
const { Author } = require("../models/authorModel");

exports.createContent = asyncHandler(async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        res.status(400);
        return res.json(
            {
                message: errors.array()[0].msg
            }
        )
    }
    const { title, description, price, suitableFor, platform, prerequisite } = req.body;
    const email = req.session.email;
    const author = await Author.findOne({ email });
    const _id = author._id;
    const course = new Course({
        author: _id,
        title: title,
        description: description,
        price: price,
        suitableFor: suitableFor,
        platform: platform,
        prerequisite: prerequisite,
    });
    console.log(course);
    try {
        await course.save();
        res.status(200);
        //req.session.courseId =
        res.json({
            message: "Course content data saved."
        });
    }
    catch (err) {
        res.json({
            message: `Error ${err}`,
        })

    }
});

exports.createSection = asyncHandler(async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        res.status(400);
        return res.json(
            {
                message: errors.array()[0].msg
            }
        )
    }
    const { number, sectionName, courseId } = req.body;

    const section = new Section({
        number: number,
        sectionName: sectionName,
    });
    try {
        await section.save();

        const sectionID = section._id;
        const course = await Course.findOne({ _id: courseId });

        if (course.content) {
            console.log(course)
            const content = await Content.findOne({ _id: course.content._id })
            console.log(content)
            await content.section.push(sectionID);
            await content.save()
        } else {
            const content = new Content();
            await content.section.push(sectionID);
            await content.save()
            await Course.updateOne({ _id: courseId }, { content: content._id });
        }

        res.status(200);
        return res.json({
            message: "Course section data saved."
        });
    }
    catch (err) {
        return res.json({
            message: `Error ${err}`,
        })

    }
});

exports.myCourses = asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        res.status(400);
        return res.json({
            message: errors.array()[0].msg
        });
    }

    const email = req.session.email;
    const author = await Author.findOne({ email });
    const courses = await Course.find({ author: author._id });

    res.json({
        data: courses
    })
});

exports.courseSections = asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        res.status(400);
        return res.json({
            message: errors.array()[0].msg
        });
    }

    const { courseId } = req.body;

    const course = await Course.findOne({ _id: courseId });

    const content = await Content.findOne(course.content._id);

    const sections = content.section;

    const sectionData = []

    for (i = 0; i < sections.length; i++) {
        const sdata = await Section.findOne({ _id: sections[i] });
        sectionData.push(sdata);
    }
    return res.json({
        sections: sectionData
    });
});

exports.uploadVideo = asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        res.status(400);
        return res.json({
            message: errors.array()[0].msg
        });
    }

    const { videoName, sectionId } = req.body;

    const video = new Video({
        name: videoName,
    });
    await video.save();

    const section = await Section.findOne({ _id: sectionId });
    console.log(section)
    await section.video.push(video._id);
    await section.save()

    res.status(200);
    return res.json({
        message: "video is added."
    });

});