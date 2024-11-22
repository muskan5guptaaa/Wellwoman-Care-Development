const User = require('../models/userModel');
const { signUpUserSV,updateProfileSV,forgetPasswordSV} = require('../schemaValidator/userValidator');
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const axios = require('axios');
const OTP=require("../models/otpModel")
const Token = require("../models/tokenmodel"); 
const mongoose = require("mongoose");


//OTP send using phone or email
const { generateOtp, sendOtp } = require('../utils/sendOtp');
const sendOtpUser = async (req, res) => {
    try {
        const { otpType, phone, email } = req.body;

        if (!otpType || (!phone && !email)) {
            return res.status(400).json({
                success: false,
                message: "otpType and either phone or email are required.",
            });
        }

        const otp = generateOtp();

        // Create OTP payload
        const otpPayload = {
            otpType,
            otp,
            appType: "User",
            ...(phone ? { phone } : { email })
        };

        // Save OTP entry in the database
        await OTP.create(otpPayload);

        // Send OTP via helper function
        const response = await sendOtp(otpPayload);

        // Return response based on sendOtp result
        return res.status(response.success ? 200 : 500).json(response);

    } catch (err) {
        console.error("Error in sendOtpUser:", err);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};




//For signup
const signUpUser = async (req, res) => {
    try {
      // Validate request body using a schema validator
      const validateReqBody = await signUpUserSV.validateAsync(req.body);
      const { email, password, name ,phone} = validateReqBody;
  
      // Check if the email and phone already exists
      let existingUser = await User.findOne({ email: email, phone: phone });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email or Phone already registered with Us.",
        });
      }
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
      // Create a new user
      const newUser = await User.create({
        name,
        email,
        password: hashedPassword,
        username: email.split("@")[0], 
        phone: phone
       
      });
      return res.status(201).json({
        success: true,
        message: "User registered successfully",
      });
    } catch (err) {
      console.log(err);
      if (err.isJoi) {
        return res.status(400).json({
          success: false,
          message: err.details[0].message,
        });
      }
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  };

  //for Login with email
  const loginUser = async (req, res) => {
    try {
        const { email, password} = req.body;

        // Check if the user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Compare passwords
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate a token
        const token = jwt.sign(
            { 
              userId: user._id, 
              email: user.email
           },
            process.env.ACCESS_TOKEN_SECRET,                 
            { 
              expiresIn: '1h'
           }                      
        );
    // Store token in the database
    await Token.create({
      token: token,
      objectDocId: user._id,
      userType: "User",
      expired_at: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
    });

    // Check if the token was saved
    const savedToken = await Token.findOne({ token: token });
    if (!savedToken) {
      return res.status(500).json({
        success: false,
        message: "Token not saved in database",
      });
    }
        // If login is successful, return the token
        return res.status(200).json({
          userDocId: user._id,
            success: true,
            message: 'Login successful',
            token: token
        });

    } catch (err) {
        console.log(err);
        return res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

    //Generate new password
const changePassword = async (req, res) => {
  try {
      const { email, currentPassword, newPassword } = req.body;

      // Validate that email and passwords are provided
      if (!email || !currentPassword || !newPassword) {
          return res.status(400).json({
              success: false,
              message: 'Email, current password, and new password are required',
          });
      }
      // Find the user by email
      const user = await User.findOne({ email });
      if (!user) {
          return res.status(404).json({
              success: false,
              message: 'User not found',
          });
      }
      // Compare the current password with the stored hashed password
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
          return res.status(400).json({
              success: false,
              message: 'Current password is incorrect',
          });
      }

      // Hash the new password and update the user's password
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedNewPassword;
      await user.save();

      return res.status(200).json({
          success: true,
          message: 'Password updated successfully',
      });
  } catch (err) {
      console.error(err);
      return res.status(500).json({
          success: false,
          message: 'Server error',
      });
  }
};

//Forget password with email
const forgetPassword = async (req, res) => {
  try {
    const validateReqBody = await forgetPasswordSV.validateAsync(req.body);
    const { email } = validateReqBody;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Generate a password reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetToken = resetToken; 
    user.resetTokenExpiry = Date.now() + 3600000; // Token valid for 1 hour
    await user.save();

    // Create the reset link
    const resetLink = `https://your-frontend-url/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;


    return res.status(200).json({
      success: true,
      message: 'Password reset link sent successfully',
      resetLink, // You can also send this for testing purposes, but be cautious about exposing sensitive information.
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

//User edit profile
const editProfile = async (req, res) => {
  try {
    const validateReqBody = await updateProfileSV.validateAsync(req.body);
    const userId = req.userId;

    // Find and update the user profile
    const updatedUser = await User.findByIdAndUpdate(userId, validateReqBody, {
      new: true,
    });

    if (!updatedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error(err);
    if (err.isJoi) {
      return res.status(400).json({
        success: false,
        message: err.details[0].message,
      });
    }
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

//For Reset password with
const resetPassword = async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;

    // Find user by email and token
    const user = await User.findOne({
      email,
      resetToken: token,
      resetTokenExpiry:
       {
         $gt: Date.now()
         }, 
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password and clear the reset token and expiry
    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const logout = async (req, res) => {
  try {
    const userId = req.userId;
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

    // Remove the token from the database
    await Token.findOneAndDelete({
      token,
      objectDocId: userId,
      userType: "User",
    });

    // Clear the token cookie
    res.clearCookie("token");
    res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

//To get all users
const getAllUsers = async (req, res) => {
  try {
    const {
      search,
      phone,
      name,
      email,
      startDate,
      endDate,
      page = 1,
      limit = 10,
      sortBy = "name",
      sortOrder = 1,
    } = req.query;

    const filter = {};

    // Handle search filter
    if (search) {
      const regex = new RegExp(search, "i");
      filter.$or = [
        { phone: { $regex: regex } },
        { name: { $regex: regex } },
        { email: { $regex: regex } },
      ];
    }

    // Handle date range filter
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const users = await User.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: "UserKyc", // Assuming KYC details are in a collection called 'UserKyc'
          localField: "_id",
          foreignField: "userId",
          pipeline: [
            {
              $project: {
                status: 1,
              },
            },
          ],
          as: "kycDetails",
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          phone: 1,
          address: 1,
          city: 1,
          state: 1,
          country: 1,
          pincode: 1,
          createdAt: 1,
          kycStatus: {
            $ifNull: [{ $arrayElemAt: ["$kycDetails.status", 0] }, "Not Found"],
          },
        },
      },
      { $sort: { [sortBy]: parseInt(sortOrder) } },
      {
        $facet: {
          data: [{ $skip: (page - 1) * limit }, { $limit: parseInt(limit) }],
          totalCount: [{ $count: "total" }],
        },
      },
    ]);

    const result = users[0] || {};
    const totalItems = result.totalCount?.[0]?.total || 0;
    const totalPages = totalItems > 0 ? Math.ceil(totalItems / limit) : 1;

    return res.status(200).json({
      success: true,
      data: result.data,
      page: parseInt(page),
      pages: totalPages,
      pageSize: parseInt(limit),
      total: totalItems,
    });
  } catch (error) {
    console.log("Error in fetching all users", error);
    console.log("Filter object:", filter);
    return res.status(500).json({
      success: false,
      message: error?.message,
    });
  }
};


const getUserProfile = async (req, res) => {
  try {
      const userId = req.user._id;

      // Aggregation pipeline to fetch user profile
      const userProfile = await User.aggregate([
          { $match: { _id: userId } }, 
          {
              $project: {
                  name: 1,
                  email: 1,
                  phone: 1,
                  gender: 1,
                  dateOfBirth: 1,
                  address: 1,
                  Diseases:1,
                  height:1,
                  weight:1,
                  medicalHistory: 1,
                  healthMetrics: 1, 
              }
          }
      ]);

      if (!userProfile || userProfile.length === 0) {
          return res.status(404).json({ message: "User profile not found" });
      }

      const profile = userProfile[0];
      if (profile.healthMetrics) {
          const { bloodPressure, heartRate, bodyTemperature, bloodGlucose } = profile.healthMetrics;

          // Check if these health metrics are available and return them
          return res.status(200).json({
              profile: {
                  ...profile,
                  healthMetrics: {
                      bloodPressure: bloodPressure || 'Data not available',
                      heartRate: heartRate || 'Data not available',
                      bodyTemperature: bodyTemperature || 'Data not available',
                      bloodGlucose: bloodGlucose || 'Data not available',
                  }
              }
          });
      }

      res.status(200).json({ profile: userProfile[0] });

  } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ message: "Server error" });
  }
};

 module.exports={
    signUpUser,
    loginUser,
    changePassword,
    forgetPassword,
    editProfile,
    resetPassword,
    logout,
    getAllUsers,
    sendOtpUser,
    getUserProfile
  }
