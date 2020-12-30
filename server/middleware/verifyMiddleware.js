const asyncHandler = require('express-async-handler')
const jwt = require("jsonwebtoken")

const verifyMiddleware = asyncHandler(async (req, res,next) => {
    const { token } = req.body;
    
    if (token) {
      jwt.verify(token,process.env.JWT_ACCOUNT_ACTIVATION,(err) => {
        if (err) {
          res.status(401)
          throw new Error('Link Expired Try again')
        } else {
          const { name, email, password } = jwt.decode(token);
          req.name = name,
          req.email = email,
          req.password = password 
          next()
        }
      });
    } else {
      res.status(404)
      throw new Error("Link Expired")
    }
  })
  module.exports = verifyMiddleware