const { validationResult } = require('express-validator');
const { Course, Section } = require('../models/courseModel');
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
            message: "Error",
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
    const { number, sectionName } = req.body;

    const section = new Section({
        number: number,
        sectionName: sectionName,
    });
    console.log(section);
    try {
        await section.save();
        res.status(200);
        res.json({
            message: "Course section data saved."
        });
    }
    catch (err) {
        res.json({
            message: "Error",
        })

    }
});