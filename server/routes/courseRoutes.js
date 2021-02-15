const express = require('express')
const router = express.Router()
const { check } = require("express-validator");
const multer = require('multer');
const {courseDetails} = require('../controller/courseController');

router.post(
    '/details',
    [
        check("courseId", "course ID is required.")
    ], courseDetails
);

module.exports = router