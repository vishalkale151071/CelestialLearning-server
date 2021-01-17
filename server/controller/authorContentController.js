const { validationResult } = require('express-validator');
const { Course, Section, Content, Video } = require('../models/courseModel');
const asyncHandler = require('express-async-handler');
const { Author } = require("../models/authorModel");
const aws = require('aws-sdk')
const slug = require('slug')


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
        courseSlug: slug(title),
    });
    try {
        await course.save();
        const s3 = new aws.S3();

        const params = { Bucket: process.env.BUCKET_NAME, Key: `${course.courseSlug}/`, ACL: 'public-read', Body: 'body does not matter' };
        s3.upload(params, (err, data) => {
            if (err) {
                console.log(err)
            }
            else {
                console.log(data)
            }
        })
        res.status(200);
        return res.json({
            message: "Course content data saved."
        });
    }
    catch (err) {
        res.status(400);
        return res.json({
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
    const course = await Course.findOne({ _id: courseId });
    const section = new Section({
        number: number,
        sectionName: sectionName,
        sectionSlug: `${course.courseSlug}_${slug(sectionName)}`
    });
    try {
        await section.save();

        const sectionID = section._id;
        const s3 = new aws.S3();
        const params = { Bucket: process.env.BUCKET_NAME, Key: `${course.courseSlug}/${slug(section.sectionName)}/`, ACL: 'public-read', Body: 'body does not matter' };
        s3.upload(params, (err, data) => {
            if (err) {
                console.log(err)
            }
            else {
                console.log(data)
            }
        })

        if (course.content) {

            const content = await Content.findOne({ _id: course.content._id })

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
        res.status(400);
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

    res.status(200);
    return res.json({
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
    res.status(200);
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
    let myVideo = req.file.originalname.split(".");
    const fileExtension = myVideo[myVideo.length - 1];

    const section = await Section.findOne({ _id: sectionId });
    const video = new Video({
        name: videoName,
        videoSlug: `${section.sectionSlug}_${slug(videoName)}.${fileExtension}`
    })
    await video.save();

    await section.video.push(video._id);
    await section.save()

    const fileName = `${video.videoSlug}`;
    const path = fileName.split("_");

    const s3 = new aws.S3({
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        }
    })

    const params = {
        Bucket: process.env.BUCKET_NAME,
        Key: `${path[0]}/${path[1]}/${path[2]}`,
        Body: req.file.buffer,
        ACL: 'public-read'
    }
    s3.upload(params, (error, data) => {
        if (error) {
            res.status(500);
            return res.json({
                message: `Error while uploading`,
            })
        }
        else {
            res.status(200);
            return res.json({
                message: `successful`,
            })
        }
    })
});

exports.sectionVideos = asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        res.status(400);
        return res.json({
            message: errors.array()[0].msg
        });
    }
    const { sectionId } = req.body;
    const section = await Section.findOne({ _id: sectionId });
    const videos = section.video;
    const videoData = []
    for (i = 0; i < videos.length; i++) {
        const vData = await Video.findOne({ _id: videos[i] })
        videoData.push(vData);
    }
    res.status(200);
    return res.json({
        videoData,
    })
})

exports.showVideo = asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        res.status(400);
        return res.json({
            message: errors.array()[0].msg
        });
    }
    const { videoId } = req.body;
    const video = await Video.findOne({ _id: videoId });
    var path = video.videoSlug;
    path = path.split("_");
    const s3Client = new aws.S3({
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    });

    const downloadParams = {
        Bucket: process.env.BUCKET_NAME,
        Key: `${path[0]}/${path[1]}/${path[2]}`,
    };

    s3Client.getObject(downloadParams, function (err, data) {
        if (err) {
            res.status(400);
            return res.json({
                message: `error => ${err}`
            })
        }
        else {
            res.status(200);
            return res.json({
                message: `succsessful =>${data}`,
            })
        }
    })

})

