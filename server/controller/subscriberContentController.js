const { validationResult } = require('express-validator');
const { Course, Section, Content } = require('../models/courseModel');
const asyncHandler = require('express-async-handler');
const { Author, AuthorProfile } = require("../models/authorModel");

//url: susbcriber/courseHome
exports.courseHome = asyncHandler(async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        res.status(400);
        return res.json({
            message: errors.array()[0].msg
        });
    }
    const { courseId } = req.body;
    const course = await Course.findOne({ _id: courseId });
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
