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
    const userId = req.query.userId || req.body.userId;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid or missing User ID" });
    }

    const userProfile = await User.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(userId) } },
      {
        $project: {
          name: 1,
          email: 1,
          phone: 1,
          gender: 1,
          dateOfBirth: 1,
          address: 1,
          Diseases: 1,
          height: 1,
          weight: 1,
          medicalHistory: 1,
          healthMetrics: 1,
        },
      },
    ]);

    if (!userProfile || userProfile.length === 0) {
      return res.status(404).json({ message: "User profile not found" });
    }

    const profile = userProfile[0];
    const healthMetrics = profile.healthMetrics || {};

    res.status(200).json({
      profile: {
        ...profile,
        healthMetrics: {
          bloodPressure: healthMetrics.bloodPressure || "Data not available",
          heartRate: healthMetrics.heartRate || "Data not available",
          bodyTemperature: healthMetrics.bodyTemperature || "Data not available",
          bloodGlucose: healthMetrics.bloodGlucose || "Data not available",
        },
      },
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};


const addToCart = async (req, res) => {
  const { userId, productId, quantity } = req.body;

  if (!userId || !productId || !quantity) {
    return res.status(400).json({
      success: false,
      message: 'userId, productId, and quantity are required',
    });
  }

  try {
    let cart = await Cart.findOne({ userId });

    if (cart) {
      // Check if the product already exists in the cart
      const productIndex = cart.products.findIndex(
        (item) => item.productId.toString() === productId
      );

      if (productIndex > -1) {
        // If the product exists, update the quantity
        cart.products[productIndex].quantity += quantity;
      } else {
        // If the product does not exist, add it to the cart
        cart.products.push({ productId, quantity });
      }

      await cart.save();
    } else {
      // If no cart exists for the user, create a new one
      const newCart = new Cart({
        userId,
        products: [{ productId, quantity }],
      });
      await newCart.save();
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


const updateCart = async (req, res) => {
  const { productId, quantity } = req.body; 

  try {
    const userId = req.user._id; 

    // Find the cart item and update it
    let cartItem = await Cart.findOne({ userId, productId });

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: "Product not found in cart",
      });
    }

    if (quantity === 0) {
      // If quantity is 0, remove the product from the cart
      await Cart.deleteOne({ userId, productId });
    } else {
      // Update the quantity of the product in the cart
      cartItem.quantity = quantity;
      await cartItem.save();
    }

    res.status(200).json({
      success: true,
      message: "Cart updated successfully",
    });
  } catch (error) {
    console.error("Error updating cart:", error);
    res.status(500).json({
      success: false,
      message: "Error updating cart",
      error: error.message,
    });
  }
};
const searchProducts = async (req, res) => {
  try {
    const { keyword } = req.query; 

    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: "Search keyword is required",
      });
    }
    // Search for products that match the keyword in `name`, `description`, or `category`
    const products = await Product.find({
      $or: [
        { name: { $regex: keyword, $options: "i" } }, 
        { description: { $regex: keyword, $options: "i" } }, 
        { category: { $regex: keyword, $options: "i" } },
      ],
    });
    if (!products.length) {
      return res.status(404).json({
        success: false,
        message: "No products found matching your search criteria",
      });
    }
    res.status(200).json({
      success: true,
      message: "Products fetched successfully",
      totalResults: products.length,
      products,
    });
  } catch (error) {
    console.error("Error searching products:", error);
    res.status(500).json({
      success: false,
      message: "Error searching for products",
      error: error.message,
    });
  }
};


const removeFromCart = async (req, res) => {
  const { productId } = req.body;

  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    let userCart = req.user.cart || [];
    userCart = userCart.filter(item => item.productId !== productId);

    // Save the updated cart
    req.user.cart = userCart;
    await req.user.save();

    res.status(200).json({
      success: true,
      message: 'Product removed from cart',
      cart: userCart,
    });
  } catch (error) {
    console.error('Error removing product from cart:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing product from cart',
      error: error.message,
    });
  }
};

const getUserCart = async (req, res) => {
  try {
    const { userId } = req.params;

    const cartData = await Cart.aggregate([
      {
        $match: { userId: new mongoose.Types.ObjectId(userId) }, 
      },
      {
        $unwind: "$products",
      },
      {
        $lookup: {
          from: "products",
          localField: "products.productId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $unwind: {
          path: "$productDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: "$_id",
          userId: { $first: "$userId" },
          products: {
            $push: {
              productId: "$products.productId",
              name: "$productDetails.name",
              price: "$productDetails.price",
              quantity: "$products.quantity",
              total: { $multiply: ["$products.quantity", "$productDetails.price"] },
            },
          },
        },
      },
    ]);

    if (!cartData.length) {
      return res.status(404).json({
        success: false,
        message: 'No cart found for this user',
      });
    }

    const cart = cartData[0];
    const totalProducts = cart.products.length;
    const totalPrice = cart.products.reduce((sum, product) => sum + product.total, 0);

    return res.status(200).json({
      success: true,
      message: 'Cart fetched successfully',
      userId: cart.userId,
      totalProducts,
      totalPrice,
      products: cart.products,
    });
  } catch (err) {
    console.error('Error fetching cart:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


const saveProduct = async (req, res) => {
  try {
    const { userId, productId, action } = req.body;

    if (!userId || !productId || !action) {
      return res.status(400).json({
        success: false,
        message: "userId, productId, and action are required",
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
         success: false,
          message: "Product not found" 
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
       success: false,
       message: "User not found" 
    });
    }

    if (action === "add") {
      if (user.savedProducts.includes(productId)) {
        return res.status(400).json({ 
        success: false,
       message: "Product already saved"
     });
      }
      user.savedProducts.push(productId);
      await user.save();
      return res.status(200).json({
       success: true, 
       message: "Product added to saved list", 
       savedProducts: user.savedProducts 
    });
    } else if (action === "remove") {
      const index = user.savedProducts.indexOf(productId);
      if (index === -1) {
        return res.status(400).json({
         success: false,
         message: "Product not in saved list" 
         });
      }
      user.savedProducts.splice(index, 1);
      await user.save();
      return res.status(200).json({ 
      success: true, 
      message: "Product removed from saved list", 
      savedProducts: user.savedProducts 
    });
    } else {
      return res.status(400).json({
       success: false, 
       message: "Invalid action. Use 'add' or 'remove'." 
      });
    }
  } catch (error) {
    console.error("Error saving product:", error);
    return res.status(500).json({ 
    success: false,
   message: "Internal Server Error"
   });
  }
};


const getSavedProducts = async (req, res) => {
  try {
    const { userId } = req.query;
    const searchTerm = req.query.name;

    if (!userId) {
      return res.status(400).json({ success: false, message: "userId is required" });
    }

    const user = await User.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(userId) }, // Convert userId to ObjectId
      },
      {
        $lookup: {
          from: "products", // Ensure this matches the actual collection name
          localField: "savedProducts",
          foreignField: "_id",
          as: "savedProducts",
        },
      },
      {
        $unwind: { path: "$savedProducts", preserveNullAndEmptyArrays: true },
      },
      {
        $match: searchTerm ? { "savedProducts.name": { $regex: searchTerm, $options: "i" } } : {},
      },
      {
        $project: {
          _id: 1,
          "savedProducts._id": 1,
          "savedProducts.name": 1,
          "savedProducts.category": 1,
          "savedProducts.price": 1,
        },
      },
    ]);

    if (!user || user.length === 0) {
      return res.status(404).json({ success: false, 
      message: "User not found or no saved products"
   });
    }

    return res.status(200).json({
     success: true, 
     savedProducts: user.map((u) => u.savedProducts)
     });
  } catch (error) {
    console.error("Error fetching saved products:", error);
    return res.status(500).json({
       success: false,
        message: "Internal Server Error" });
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
    getUserCart,
    searchProducts,
    updateCart,
    removeFromCart,
    saveProduct,
    getSavedProducts
  }
