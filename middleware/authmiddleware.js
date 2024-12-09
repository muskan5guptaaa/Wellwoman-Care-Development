const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const Token = require("../models/tokenmodel");

exports.isUserAuth = async (req, res, next) => {
  try {
    // Get the token from the request headers or cookies
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET); // Use the JWT_SECRET for Patient tokens

    // Find the patient based on the decoded token
    const user = await User.findById(decoded._id);
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    // Find the token in the database
    const tokenDoc = await Token.findOne({
      token: token,
      userDocId: decoded._id,
      userType: "User",
    });

    if (!tokenDoc) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    // Check if the token is expired
    const now = new Date();
    if (now > new Date(tokenDoc.expired_at)) {
      return res.status(401).json({ success: false, message: "Token has expired" });
    }

    // Attach patient to the request object
    req.userId = user._id;
    next();
  } catch (err) {
    console.error(err);
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};
