const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const Token = require("../models/tokenmodel");

exports.isUserAuth = async (req, res, next) => {
  try {
    // Check if token is provided in the authorization header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token is required.',
      });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // Check if the token exists in the database
    const tokenInDB = await Token.findOne({
      token: token,
      objectDocId: decoded.userId,
      userType: 'User',
    });

    if (!tokenInDB) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token or token expired.',
      });
    }

    // Check if the user exists in the database
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Attach user data to the request object for use in other routes
    req.user = user;
    req.userId = decoded.userId;  // Optional: if you want to use userId directly

    next();  // Proceed to the next middleware/route handler
  } catch (err) {
    console.error(err);
    return res.status(401).json({
      success: false,
      message: 'Authentication failed. Please try again.',
    });
  }
};

