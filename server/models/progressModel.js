const mongoose = require('mongoose');

const courseTrackSchema = mongoose.Schema({
    subscriberId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'Subscriber'
    },
    courses: [
        {
            courseId : {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Course'
            },
            courseName: {
               type : String,
            },
            sections: [
                {
                    sectionName : {
                        type :String
                    },
                    sectionId : {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: 'Section'
                    },
                    videos : [
                        {
                            videoName: {
                                type : String 
                            },
                            videoId : {
                                type: mongoose.Schema.Types.ObjectId,
                                ref: 'Video'
                            },
                            timePlayed: {
                                type : Number
                            },
                            last_ts: {
                                type : Date
                            },
                            totalViews : {
                                type : Number,
                                default : 0
                            },
                            totalTime : {
                                type : Number,
                                default : 0
                            },
                        }
                    ]
                }
            ],
            last_video: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Video'
            },
            sectionCompleted: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Section'
            }
        }
    ],
    lastSection: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Section'
    },
    courseCompleted: {
        type : Boolean
    }
},{
    versionKey : false
})
const CourseTrack = new mongoose.model('CourseTrack',courseTrackSchema );

module.exports = {CourseTrack}