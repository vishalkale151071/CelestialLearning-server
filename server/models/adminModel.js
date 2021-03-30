const mongoose = require('mongoose');

const adminSchema = mongoose.Schema({

    name : {
        type : String
    },
    username: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    pendingAuthors : [{
        type : mongoose.Schema.Types.ObjectId,
        ref : 'Author'
    }],
    rejectedAuthors : [{
        type : mongoose.Schema.Types.ObjectId,
        ref : 'Author'
    }],
    approvedAuthors : [{
        type : mongoose.Schema.Types.ObjectId,
        ref : 'Author'
    }]
},
{
    versionKey : false
})

const Admin = new mongoose.model('Admin',adminSchema)

module.exports = {Admin:Admin}