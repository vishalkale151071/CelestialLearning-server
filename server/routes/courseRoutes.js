const express = require('express')
const router = express.Router()
const { check } = require("express-validator");

const {courseDetails, acceptFeedback} = require('../controller/courseController');
const { isLoggedIn } = require('../middleware/isLoggedInmiddleware');

router.post(
    '/details',
    [
        check("courseId", "course ID is required.")
    ], courseDetails
);

router.post(
    '/feedback',isLoggedIn,[],acceptFeedback
)
module.exports = router