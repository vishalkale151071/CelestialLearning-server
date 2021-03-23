const express = require('express')
const router = express.Router()
const { check } = require("express-validator");

const { isLoggedIn } = require('../middleware/isLoggedInmiddleware');
const { discussionForum, getDiscussionDetails } = require('../controller/discussionController');

router.post(
    '/discussionForum',isLoggedIn,[
        check('courseName',"it should exists").exists(),
        check('comment',"it should be present").exists()
    ],discussionForum
)

router.post(
    '/discussionDetails',isLoggedIn,[],getDiscussionDetails
)
module.exports = router