const express = require('express')
const router = express.Router()
const { check } = require("express-validator");
const multer = require('multer');
const {getCourses} = require('../controller/homeController');

router.post(
    '/getCourses',
    [
    ], getCourses
);

module.exports = router