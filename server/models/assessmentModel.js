const mongoose = require('mongoose');

const questionSchema = mongoose.Schema({
    question: {
        type: String,
        required: true
    },
    questionType: {
        type: String,
        default: "single"
    },
    options: [
        {
            type: String
        }
    ],
    answer: [{
        type: String,
        required: true
    }],
},
    {
        versionKey: false
    });

const Question = new mongoose.model('Question', questionSchema);

const subscriberResultSchema = mongoose.Schema({
    subscriber : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subscriber',
        required: true
    },
    correctResponse : [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
    }],
    wrongResponse : [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
    }],
    marksScored : {
        type : Number,
        required : true,
        default : 0
    },
    percentage : {
        type : Number,
        required : true,
        default : 0
    }
});

const SubscriberResult = new mongoose.model('SubscriberResult',subscriberResultSchema)

const testSchema = mongoose.Schema({
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    section: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Section',
        required: true
    },
    questions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question'
    }],
    subscriberResult : [{
        type : mongoose.Schema.Types.ObjectId,
        ref : 'SubscriberResult'
    }]
    
},
    {
        versionKey: false
    });

const Test = new mongoose.model('Test', testSchema)

module.exports = { Question: Question, Test: Test, SubscriberResult: SubscriberResult}