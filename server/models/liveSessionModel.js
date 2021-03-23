const mongoose = require('mongoose')

const liveSchema = mongoose.Schema({
    meetingId : {
        type : String,
    },
    password : {
        type : String,
    },
    meetingName : {
        type : String
    },
    author : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'Author'
    },
    courseName : {
        type :String
    },
    dateOfConduction : {
        type :Date
    },
    
}, {
    versionKey: false,
}
)

const LiveSession = new mongoose.model('LiveSession',liveSchema)

module.exports = {LiveSession:LiveSession}