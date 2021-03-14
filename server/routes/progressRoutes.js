const express = require('express')
const router = express.Router()
const { check } = require("express-validator");
const multer = require('multer');
const {videoProgress} = require('../controller/subscriberProgressController');

router.post(
    '/videoProgress',
    [
        
    ], videoProgress
);

module.exports = router