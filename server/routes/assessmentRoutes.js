const express = require('express')
const router = express.Router()

const {createQuiz,testDetail, testResponse, performanceAnalyser} = require('../controller/assessmentController');
const { isLoggedIn } = require('../middleware/isLoggedInmiddleware');

router.post(
    '/createQuiz',isLoggedIn,
    [], createQuiz
);

router.post(
    '/attemptTest',isLoggedIn,
    [], testDetail
)

router.post(
    '/submitTest',isLoggedIn,
    [], testResponse
)

router.post(
    '/performanceAnalysis',isLoggedIn,
    [],performanceAnalyser
)
module.exports = router