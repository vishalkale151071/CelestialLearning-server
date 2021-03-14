const { Course, Section} = require('../models/courseModel');
const asyncHandler = require('express-async-handler');
const {Subscriber} = require('../models/subscriberModel') 
const {Test,Question, SubscriberResult} = require('../models/assessmentModel');
const { subscribe } = require('../routes/assessmentRoutes');

//url : assessment/createQuiz
exports.createQuiz = asyncHandler(async(req,res)=>{

    const {courseName,sectionName, questions} = req.body;
    const course = await Course.findOne({title:courseName});
    const section = await Section.findOne({sectionName});

    const newTest = new Test({
        course: course._id,
        section :section._id,
    });
    await newTest.save();
    questions.forEach( async (question) => {
        const q = new Question(question);
        await q.save();
        await newTest.questions.push(q._id);
        await newTest.save();
    });
    
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
    const testData = []
    for(i=0;i<test.questions.length;i++)
    {
        const question = await Question.findOne({_id:test.questions[i]})
        testData.push({
            "questionType" : question.questionType,
            "question" : question.question,
            "options" : question.options,
            "answers" : question.answer
        });
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
            analysisReport.push({
                "marks" : subscriberResult.marksScored,
                "percentage" : subscriberResult.percentage
            })
        }
    }
   return res.json({
       analysisReport
   })
})