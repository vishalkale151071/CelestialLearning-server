const asyncHandler = require('express-async-handler');
const { validationResult } = require("express-validator");

exports.init = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    console.log("req received");
    if (!errors.isEmpty()) {
        res.status(400);
        return res.json({
            message: errors.array()[0].msg
        });
    }

    const { user } = req.body;

    req.sessionStore.get(user, function (error, session) {
        if (session) {
            console.log("session Found.");
            session.plugin = "start"
            req.sessionStore.set(user, session, function (error) {
                if (error) {
                    console.log(error);
                    res.status(400);
                    return res.jsonp({
                        message: false
                    })
                }
            });
            res.status(201);
            return res.jsonp({
                message: true
            });
        } else {
            res.status(400);
            return res.jsonp({
                message: false
            })
        }
    });
});