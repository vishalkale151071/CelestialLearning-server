const mongoose = require('mongoose');

const discusionSchema = mongoose.Schema({
    userId : {
        type :  mongoose.Schema.Types.ObjectId
    },
    role : {
        type :String
    },
    comment : {
        type : String
    },
    courseName : {
        type : String
    },
    dateTimeStamp : {
        type : Date
    }
},
{
    versionKey : false})

const Discussion = new mongoose.model('Discussion',discusionSchema)

module.exports = {Discussion:Discussion}
