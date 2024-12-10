const User = require('../models/userModel');
const { signUpUserSV,updateProfileSV,forgetPasswordSV} = require('../schemaValidator/userValidator');
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const axios = require('axios');
const OTP=require("../models/otpModel")
const Token = require("../models/tokenmodel"); 
const Cart =require("../models/cartModel")
const mongoose = require("mongoose");


//OTP send using phone or email
const { generateOtp, sendOtp } = require('../utils/sendOtp');
const Product = require('../models/productModel');
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
      const { email, password, name} = validateReqBody;
  
      // Check if the email and phone already exists
      let existingUser = await User.findOne({ email: email });
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
        
    // Generate a token for the user
    const token = user.generateToken();
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      secure: true,
    });

    const expired_at = new Date();
    expired_at.setDate(expired_at.getDate() + 30);
    await Token.create({
      objectDocId: user._id,
      token: token,
      expired_at,
    });


     // Use aggregation to find the user and provide default values
     const userDetails = await User.aggregate([
      { $match: { _id: user._id } },
      {
        $project: {
          address: { $ifNull: ["$address", ""] },
          city: { $ifNull: ["$city", ""] },
          pincode: { $ifNull: ["$pincode", ""] },
          state: { $ifNull: ["$state", ""] },
          country: { $ifNull: ["$country", ""] },
          email: 1,
          phone: 1,
          username: 1,
          name: 1,
          avatar: { $ifNull: ["$avatar", ""] },
          gender: 1,
        },
      },
    ]);
      
    res.status(200).json({
      success: true,
      userDocId: user._id,
      token: token,
      data: userDetails[0],
      message: "Logged in successfully",
    });
  } catch (err) {
    console.log(err);
    if (err.isJoi) {
      // Handle validation error
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
    await sendPasswordResetEmail(email, resetLink);


    return res.status(200).json({
      success: true,
      message: 'Password reset link sent successfully',
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

const addToCart = async (req, res) => {
  const { userId, productId, quantity } = req.body; // Get userId, productId, and quantity from the request body

  if (!userId || !productId || !quantity) {
    return res.status(400).json({
      success: false,
      message: 'userId, productId, and quantity are required',
    });
  }

  try {
    // Check if the product already exists in the cart for this user
    let cartItem = await Cart.findOne({ userId, productId });

    if (cartItem) {
      // If the product is already in the cart, update the quantity
      cartItem.quantity += quantity;
      await cartItem.save();
    } else {
      // If not in the cart, create a new cart item
      const newCartItem = new Cart({
        userId,
        productId,
        quantity,
      });
      await newCartItem.save();
    }

    res.status(200).json({
      success: true,
      message: 'Product added to cart successfully',
    });
  } catch (error) {
    console.error('Error adding product to cart:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding product to cart',
      error: error.message,
    });
  }
};


const getUserCart = async (req, res) => {
  try {
    const { userId } = req.params; // Get userId from the route parameter

    // Find the cart for the specific user
    const cart = await Cart.findOne({ userId }).populate('products.productId'); // Populate product details

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'No cart found for this user',
      });
    }

    // Calculate total number of products
    const totalProducts = cart.products.reduce((total, item) => total + item.quantity, 0);

    return res.status(200).json({
      success: true,
      message: 'Cart fetched successfully',
      userId: cart.userId,
      totalProducts,
      products: cart.products.map((item) => ({
        productId: item.productId._id,
        productName: item.productId.name,
        quantity: item.quantity,
        price: item.productId.price,
      })),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
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
    getUserProfile,
    addToCart,
    getUserCart
  }
