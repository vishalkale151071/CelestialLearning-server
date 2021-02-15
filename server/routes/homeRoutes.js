const express = require('express')
const router = express.Router()
const { check } = require("express-validator");
const multer = require('multer');
const {getCourses,search} = require('../controller/homeController');

router.post(
    '/getCourses',
    [
    ], getCourses
);

router.get(
    '/search',[],search
)
module.exports = router