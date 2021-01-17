const asyncHandler = require('express-async-handler');

exports.isLoggedIn = asyncHandler(async (req, res, next) => {
    if (req.session) {
        next();
    } else {
        res.status(401);
        res.json({
            message: "unauthorized"
        })
    }
});