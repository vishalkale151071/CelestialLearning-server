const asyncHandler = require('express-async-handler');

exports.isLoggedIn = asyncHandler(async (req, res, next) => {
    if (req.session.email) {
        next();
    } else {
        res.status(401);
        return res.json({
            message: "session expired"
        })
    }
});