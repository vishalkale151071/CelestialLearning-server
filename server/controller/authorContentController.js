const { validationResult } = require('express-validator');
const { Course, Section, Content, Video } = require('../models/courseModel');
const asyncHandler = require('express-async-handler');
const { Author } = require("../models/authorModel");
const aws = require('aws-sdk')
const slug = require('slug')
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);
const M3U8FileParser = require('m3u8-file-parser');
const fs = require('fs');
const {uploadDirectory} = require('s3-lambo')

//url : author/create-course
exports.createContent = asyncHandler(async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        res.status(401);
        return res.json(
            {
                message: errors.array()[0].msg
            }
        )
    }
    const { title, description, category, suitableFor, platform, prerequisite } = req.body;


    const email = req.session.email;
    const author = await Author.findOne({ email });
    const _id = author._id;
    const course = new Course({
        author: _id,
        title: title,
        description: description,
        category: category,
        suitableFor: suitableFor,
        platform: platform,
        prerequisite: prerequisite,
        courseSlug: slug(title),
        status : "1"
    });
    try {

        const { _id } = await course.save();
        
        const s3 = new aws.S3();
        const params = { Bucket: process.env.BUCKET_NAME, Key: `${course.courseSlug}/`, ACL: 'public-read', Body: 'body does not matter' };
        s3.upload(params, (err, data) => {
            if (err) {
                console.log(err)
            }
            else {
                console.log(data);
            }
        })

        res.status(200);
        return res.json({
            message: "Course content data saved.",
            courseId: _id
        });
    }
    catch (err) {
        res.status(401);
        return res.json({
            message: `Error ${err}`,
        })

    }
});

//url:  author/create-section
exports.createSection = asyncHandler(async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        res.status(401);
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
        sectionSlug: `${course.courseSlug}_${slug(sectionName)}`,
    });
    try {
        const { _id } = await section.save();

        const sectionID = section._id;
        const s3 = new aws.S3();
        const params = { Bucket: process.env.BUCKET_NAME, Key: `${course.courseSlug}/${slug(section.sectionName)}/`, ACL: 'public-read', Body: 'body does not matter' };
        s3.upload(params, (err, data) => {
            if (err) {
                res.status(401);
                return res.json({
                    message: `Error ${err}`,
                })
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
            var statusField = course.status;
           
            if(statusField==4)
            {
                await Course.updateOne({ _id: courseId }, { content: content._id,status: "Complete" });
            }
            else
            {
                await Course.updateOne({ _id: courseId }, { content: content._id,status: String(Number(statusField)+1) });
            }
            
        }
       
        res.status(200);
        return res.json({
            message: "Course section data saved.",
            sectionId: `${_id}`
        });
    }
    catch (err) {
        res.status(401);
        return res.json({
            message: `Error ${err}`,
        })

    }

});

//url:  author/courses
exports.myCourses = asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        res.status(401);
        return res.json({
            message: errors.array()[0].msg
        });
    }

    const email = req.session.email;
    const author = await Author.findOne({ email });
    const completeCourses = await Course.find({ author: author._id,status:"Complete" });
    const incompleteCourses = await Course.find({ author: author._id,status: {$ne: "Complete"} });
    
    var flag1,flag2 = 0;
    const incompleteCourseData = [];
    const completeCourseData = [];
    if(completeCourses.length>0)
    {
        flag1 = 1;
        
        for (i = 0; i < completeCourses.length; i++) {
            completeCourseData.push({
                'courseThumbnail': `https://celestiallearning.s3.amazonaws.com/${completeCourses[i].courseSlug}/${completeCourses[i]._id}_thumbnail.${completeCourses[i].thumbnailExtension}`,
                'courseId': completeCourses[i]._id,
                'courseName': completeCourses[i].title,
                'category': completeCourses[i].category,
                'price': completeCourses[i].price
            });
        }
    }
    
    if(incompleteCourses.length>0)
    {
        flag2 = 1;
        
        for (i = 0; i < incompleteCourses.length; i++) {
            incompleteCourseData.push({
                'courseThumbnail': `https://celestiallearning.s3.amazonaws.com/${incompleteCourses[i].courseSlug}/${incompleteCourses[i]._id}_thumbnail.${incompleteCourses[i].thumbnailExtension}`,
                'courseId': incompleteCourses[i]._id,
                'courseName': incompleteCourses[i].title,
                'category': incompleteCourses[i].category,
                'price': incompleteCourses[i].price
            });
        }

        
    }

    if(flag1==1 || flag2==1)
    {
        res.status(200);
        return res.json({
            incompleteCourseData,
            completeCourseData
        })
    }
    else
    {
        res.status(401);
        return res.json({
            message : "No courses created..."
        })
    }
    
});

//url:  author/course/sections
exports.courseSections = asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        res.status(401);
        return res.json({
            message: errors.array()[0].msg
        });
    }

    const { title } = req.body;

    const course = await Course.findOne({ title: title });

    const content = await Content.findOne(course.content._id);

    const sections = content.section;

    const sectionData = []

    if(sections.length>0)
    {
        for (i = 0; i < sections.length; i++) {

            const sdata = await Section.findOne({ _id: sections[i] });

            const videos = sdata.video;


            if (videos.length == 0) {
                sectionData.push({
                    "sectionId": sdata._id,
                    "number": sdata.number,
                    "sectionName": sdata.sectionName,
                    "videoId": "NIL",
                    "videoName": "NIL"
                })
            }
            else {
                const videoData = []
                for (j = 0; j < videos.length; j++) {

                    const vdata = await Video.findOne({ _id: videos[j] });

                    var path = vdata.videoSlug;
                    path = path.split("_");
                    videoN = path[2].split(".");
                    const url = `https://celestiallearning.s3.amazonaws.com/${path[0]}/${path[1]}/${videoN[0]}.m3u8`;
                   
                    videoData.push({
                        "videoId": vdata._id,
                        "videoName": vdata.name,
                        "videoURL": url,
                    })

                }
                sectionData.push({
                    "sectionId": sdata._id,
                    "number": sdata.number,
                    "sectionName": sdata.sectionName,
                    "video": videoData,
                })
               
            }
        }

        res.status(200);
        return res.json({
            sectionData

        });
    }
    else
    {
        res.status(401);
        return res.json({
            message : "No section data available.."
        })
    }
});


//url:  author/add-video
exports.uploadVideo = asyncHandler(async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        res.status(401);
        return res.json({
            message: errors.array()[0].msg
        });
    }

    const obj = JSON.parse(JSON.stringify(req.body));

    const vedioName = obj.vedioName
    const sectionId = obj.sectionId
    
    let myVideo = req.file.originalname.split(".");
    const fileExtension = myVideo[myVideo.length - 1];

    const section = await Section.findOne({ _id: sectionId });
    const video = new Video({
        name: vedioName,
        videoSlug: `${section.sectionSlug}_${slug(vedioName)}.${fileExtension}`
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
    s3.upload(params, async(error, data) => {
        if (error) {
            res.status(401);
            return res.json({
                message: `Error while uploading`,
            })
        }
        else {
            const content = await Content.find().where('section').in([sectionId]).exec();
            const course = await Course.find().where('content').in([content[0]._id]).exec();
            var statusField = course[0].status;
            
            if(statusField=="4")
            {     
                await Course.updateOne({ _id: course[0]._id }, {status: "Complete" });
            }
            else
            {     
                await Course.updateOne({ _id: course[0]._id }, { status: String(Number(statusField)+1) });
            }
            const url = `https://celestiallearning.s3.amazonaws.com/${path[0]}/${path[1]}/${path[2]}`;
            console.log(url);
            encryptVideo(url,path[0],path[1],path[2])
            res.status(200);
            return res.json({
                message: `Video uploaded successfully`,
            })
        }
    })
});

//url:  author/uploadThumbnail
exports.thumbnailUpload = asyncHandler(async (req, res) => {

    const obj = JSON.parse(JSON.stringify(req.body));

    const courseId = obj.courseId;
    
    if (req.file) {
        let myCourseThumbnail = req.file.originalname.split(".");
        fileExtensionThumbnail = myCourseThumbnail[myCourseThumbnail.length - 1];
        const course = await Course.findOne({ _id: courseId });
        const s3 = new aws.S3();
        await Course.updateOne({ _id: courseId }, {
            thumbnailExtension: fileExtensionThumbnail,

        }),
            (err) => {
                res.status(401);
                return res.json({ err });
            }

        const param = { Bucket: process.env.BUCKET_NAME, Key: `${course.courseSlug}/${course._id}_thumbnail.${fileExtensionThumbnail}`, ACL: 'public-read', Body: req.file.buffer };
        s3.upload(param, async (err, data) => {
            if (err) {
                res.status(401);
                return res.json({ err });
            }
            else 
            {
                var statusField = course.status;
                if(statusField==4)
                {    
                    await Course.updateOne({ _id: courseId }, {status: "Complete" });
                }
                else
                {    
                    await Course.updateOne({ _id: courseId }, { status: Number(statusField)+1 });
                }
                    
                res.status(200);
                return res.json({
                    message: "Thumbnail uploaded successfully.",
                })
            }
        })
    }
})

//url : author/uploadPreview
exports.previewUpload = asyncHandler(async (req, res) => {

    const obj = JSON.parse(JSON.stringify(req.body));

    const courseId = obj.courseId;

    if (req.file) {

        let myCoursePreview = req.file.originalname.split(".");
        fileExtensionPreview = myCoursePreview[myCoursePreview.length - 1];
        const course = await Course.findOne({ _id: courseId });
        const s3 = new aws.S3();
        await Course.updateOne({ _id: courseId }, {

            previewExtension: fileExtensionPreview
        }),
            (err) => {
                res.status(401);
                return res.json({ err });
            }


        const previewParam = { Bucket: process.env.BUCKET_NAME, Key: `${course.courseSlug}/${course._id}_preview.${fileExtensionPreview}`, ACL: 'public-read', Body: req.file.buffer };
        s3.upload(previewParam, async(err, data) => {
            if (err) {
                res.status(401);
                return res.json({ err });
            }
            else 
            {
                var statusField = course.status;
                if(statusField==4)
                {    
                    await Course.updateOne({ _id: courseId }, {status: "Complete" });
                }
                else
                {    
                    await Course.updateOne({ _id: courseId }, { status: Number(statusField)+1 });
                }
                
                res.status(200);
                return res.json({
                    message: "Preview uploaded successfully.",
                })
            }
        })
    };
})

//url:  author/showVideo
exports.showVideo = asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        res.status(401);
        return res.json({
            message: errors.array()[0].msg
        });
    }
    const { videoId } = req.body;
    const video = await Video.findOne({ _id: videoId });
    if(video)
    {
        var path = video.videoSlug;
        path = path.split("_");

        res.status(200);
        return res.json({
            message: `https://celestiallearning.s3.amazonaws.com/${path[0]}/${path[1]}/${path[2]}`,
        })
    }
    else
    {
        res.status(401);
        return res.json({
            message : "No available video to show!"
        })
    }
    
})

async function encryptVideo(url,courseName,sectionName,videoName)
{
    let ts = Date.now();
    // encrypting video
    var infs = new ffmpeg
    await infs.addInput(url).outputOptions([
        '-map 0:0',
        '-map 0:1',
        '-map 0:0',
        '-map 0:1',
        '-s:v:0 2160x3840',
        '-c:v:0 libx264',
        '-b:v:0 2000k',
        '-s:v:1 960x540',
        '-c:v:1 libx264',
        '-b:v:1 365k',
        '-f hls',
        '-max_muxing_queue_size 1024',
        '-hls_time 10',
        '-hls_list_size 0',
        '-hls_segment_filename', 'v%v/fileSequence%d.ts'
    ]).output('./video.m3u8')
        .on('start', function (commandLine) {
            console.log('Spawned Ffmpeg with command: ' + commandLine);
        })
        .on('error', function (err, stdout, stderr) {
            console.log('An error occurred: ' + err.message, err, stderr);
        })
        .on('progress', function (progress) {
            console.log('Processing: ' + progress.percent + '% done')
        })
        .on('end', function (err, stdout, stderr) {  
                fs.rename('./v0',`./${ts}`,function(error,data){
                    if(error)
                    {
                        console.log(error)
                    }
                });
            const content = fs.readFileSync('./video.m3u8', { encoding: 'utf-8'});
            const reader = new M3U8FileParser();
            reader.read(content);
            const info = reader.getResult().segments; 
            var temp = `#EXTM3U\n#EXT-X-VERSION:${reader.getResult().version}\n#EXT-X-TARGETDURATION:${reader.getResult().targetDuration}\n#EXT-X-MEDIA-SEQUENCE:${reader.getResult().mediaSequence}\n`
            info.forEach((value,index,array)=>{
                value.url = `https://celestiallearning.s3.amazonaws.com/chunks/${ts}/fileSequence${index}.ts\n`
                console.log(value.inf.duration)
                temp = temp+ `#EXTINF:${value.inf.duration},\n${value.url}`
            })
            temp = temp + '#EXT-X-ENDLIST'
            fs.writeFile('./video.m3u8', temp, 'utf8', function (err) {
                                if (err) return console.log(err);
                            });
                            const s3 = new aws.S3({
                                credentials: {
                                    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                                    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
                                }
                            })
                             videoName = videoName.split(".")
                             //uploading m3u8 file
                             fs.readFile('./video.m3u8', async (err, data) => {
                                if (err) throw err;
                                const params = {
                                    Bucket: process.env.BUCKET_NAME, // pass your bucket name
                                    Key: `${courseName}/${sectionName}/${videoName[0]}.m3u8`, // file will be saved as testBucket/contacts.csv
                                    Body: data,
                                    ACL: 'public-read'
                                };
                                await s3.upload(params, function(s3Err, data) {
                                    if (s3Err) throw s3Err
                                    console.log(`File uploaded successfully at ${data.Location}`)
                                    
                                });
                             });
                            // upload all ts files
                            uploadDirectory({
                                path: `/home/saumya/Desktop/Celestial Learning/CelestialLearning-server/${ts}`,
                                params: {
                                  Bucket: process.env.BUCKET_NAME,
                                },
                                rootKey: `chunks/${ts}`
                              }); 
                                // deleting mp4 file from the directory.
                                var params = {
                                    Bucket: process.env.BUCKET_NAME,
                                    Key: `${courseName}/${sectionName}/${videoName[0]}.mp4`
                                };
                                 s3.deleteObject(params, function(err, data) 
                                {
                                    if (err) 
                                    console.log(err, err.stack);  // error
                                    else     
                                    console.log("deleted");                 // deleted
                                });        
        }).run        
}