const { Course, Section,Content} = require('../models/courseModel');
const asyncHandler = require('express-async-handler');
const {Subscriber} = require('../models/subscriberModel') 
const {Author} = require('../models/authorModel')
const {Test,Question, SubscriberResult} = require('../models/assessmentModel');


//url : assessment/createQuiz
exports.createQuiz = asyncHandler(async(req,res)=>{

    const {courseName,sectionName, questions} = req.body;
    console.log(courseName,sectionName,questions)
    const course = await Course.findOne({title:courseName})
    const section = await Section.findOne({sectionName})
    const test = await Test.findOne({$and:[{course:course._id},{section:section._id}]})
    if(test)
    {
        res.status(404);
        return res.json({
            message : "A quiz is already uploaded"
        })
    }
    const newTest = new Test({
        course: course._id,
        section :section._id,
    });
    await newTest.save();
    for(i=0;i<questions.length;i++)
    {
        const q = new Question(questions[i]);
        await q.save();
        await newTest.questions.push(q._id);
    }
    await newTest.save();
    
    res.status(200);
    return res.json({
        message : "Successfully uploaded"    
    })   
})

//url : assessment/attemptTest
exports.testDetail = asyncHandler(async(req,res)=>{
    const {courseName,sectionName} = req.body;
    const course = await Course.findOne({title:courseName})
    const section = await Section.findOne({sectionName})
    const test = await Test.findOne({$and : [{section:section._id},{course:course._id}]});
    const email = req.session.email
    const author  = await Author.findOne({email});
    const testData = []
    for(i=0;i<test.questions.length;i++)
    {
        const question = await Question.findOne({_id:test.questions[i]})
        let q = {
            questionType : question.questionType,
            question : question.question,
            options : question.options,
            numOpt : question.numOpt
        };
        if(author)
        {    
                q["answers"] = question.answer
        }
        testData.push(q);    
    }
    return res.json({
        testData
    })
})

function arrayEquals(a, b) {
    return Array.isArray(a) &&
      Array.isArray(b) &&
      a.length === b.length &&
      a.every((val, index) => val === b[index]);
}
//url : while submitting response
exports.testResponse = asyncHandler(async(req,res)=>{
    const {courseName,sectionName,allAnswers} = req.body;
    const email = req.session.email;
    const subscriber = await Subscriber.findOne({email});
    const course = await Course.findOne({title:courseName})
    const section = await Section.findOne({sectionName})
    const test = await Test.findOne({$and:[{course:course._id},{section:section._id}]});
    const correctAnswer = []
    const wrongAnswer = []
    for(j=0;j<test.questions.length;j++)
    {
        const questions = await Question.findOne({_id: test.questions[j]});   
        var result = arrayEquals(questions.answer,allAnswers[j])
        if(result)
        {
            correctAnswer.push(test.questions[j]);
        }
        else
        {
            wrongAnswer.push(test.questions[j])
        }   
    }
    const percentage = (correctAnswer.length/(correctAnswer.length+wrongAnswer.length))*100;
    const newSubscriberResult = new SubscriberResult({
        subscriber : subscriber._id,
        correctResponse : correctAnswer,
        wrongResponse : wrongAnswer,
        marksScored : correctAnswer.length,
        percentage
    });
    await newSubscriberResult.save(); 
    console.log(newSubscriberResult._id);
    await test.subscriberResult.push(newSubscriberResult._id);
    await test.save();
    return res.json({
        newSubscriberResult
    })
})

exports.performanceAnalyser = asyncHandler(async(req,res)=>{
    const {courseName} = req.body;
    const email = req.session.email;
    const subscriber  = await Subscriber.findOne({email});
    console.log(subscriber._id)
    const course = await Course.findOne({title:courseName})
    console.log(course._id)
    const result = await Test.find({course:course._id})
    const analysisReport = []
    for(i=0;i<result.length;i++)
    {
        for(j=0;j<result[i].subscriberResult.length;j++)
        {
            const subscriberResult = await SubscriberResult.findOne({$and:[{_id:result[i].subscriberResult[j]},{subscriber:subscriber._id}]})
            const section = await Section.findOne({_id:result[i].section})
            analysisReport.push({
                "sectionName" : section.sectionName,
                "marks" : subscriberResult.marksScored,
                "percentage" : subscriberResult.percentage
            })
        }
    }
   return res.json({
       analysisReport
   })
})

exports.courseList = asyncHandler(async(req,res)=>{
    const email = req.session.email;
    const author = await Author.findOne({email});
    const course = await Course.find({author:author._id});
    const courseList = [];
    for(i=0;i<course.length;i++)
    {
        courseList.push(course[i].title)
        
    };
    courseList.sort(function (a, b) {
        return a.toLowerCase().localeCompare(b.toLowerCase());
    })
    res.status(200);
    return res.json(
        {
            courseList
        }
    )
})

exports.sectionList = asyncHandler(async(req,res)=>{
    const {courseName} = req.body;
    const course = await Course.findOne({title:courseName});
    const content = await Content.findOne({_id:course.content});
    const sectionList = []
    for(i=0;i<content.section.length;i++)
    {
        const section = await Section.findOne({_id:content.section[i]});
        sectionList.push(section.sectionName)
    }
    sectionList.sort(function (a, b) {
        return a.toLowerCase().localeCompare(b.toLowerCase());
    })
    res.status(200);
    return res.json({
        sectionList
    })
})