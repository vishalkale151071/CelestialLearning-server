const express = require('express')
const router = express.Router()
const { check } = require("express-validator");
const {createQuiz,testDetail, testResponse, performanceAnalyser,courseList,sectionList} = require('../controller/assessmentController');
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

router.get(
    '/courseList',isLoggedIn,
    [],courseList
)
router.get(
    '/sectionList' ,isLoggedIn,
    [
        check("courseName","Course Name should be provided").exists()
    ],sectionList
)
module.exports = router