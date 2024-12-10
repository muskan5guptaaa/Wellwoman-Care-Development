const Admin=require("../models/adminModel");
const Token=require("../models/tokenmodel")
const Product = require('../models/productModel');

const jwt = require('jsonwebtoken');


const bcrypt = require("bcrypt");

const adminSignup = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: "Admin already exists",
      });
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new admin
    const admin = new Admin({
      name,
      email,
      password: hashedPassword,
    });

    await admin.save();

    res.status(201).json({
      success: true,
      message: "Admin registered successfully",
    });
  } catch (error) {
    console.error("Error registering admin:", error);
    res.status(500).json({
      success: false,
      message: "Error registering admin",
      error: error.message,
    });
  }
};


const adminLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if admin exists
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

           // Generate a token
           const token = jwt.sign(
            { 
              adminId: admin._id, 
              email: admin.email
           },
            process.env.ACCESS_TOKEN_SECRET,                 
            { 
              expiresIn: '1h'
           }                      
        );
    // Store token in the database
    await Token.create({
      token: token,
      objectDocId: admin._id,
      userType: "User",
      expired_at: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
    });

    res.status(200).json({
      success: true,
      adminDocId: admin._id,
      token: token,
      message: "Admin Logged in successfully",
    });
  } catch (error) {
    console.error("Error logging in admin:", error);
    res.status(500).json({
      success: false,
      message: "Error logging in admin",
      error: error.message,
    });
  }
};
const addMedicalProduct = async (req, res) => {
  const { name, description, price, stock, category, image } = req.body;

  try {
    const product = new Product({
      name,
      description,
      price,
      stock,
      category,
      image,
      createdBy: req.admin?._id // Optional chaining in case req.user is undefined
      
    });

    await product.save();

    res.status(201).json({
      success: true,
      message: "Medical product added successfully",
      data: product,
    });
  } catch (error) {
    console.error("Error adding medical product:", error);
    res.status(500).json({
      success: false,
      message: "Error adding medical product",
      error: error.message,
    });
  }
};

const updateMedicalProduct = async (req, res) => {
  const { id } = req.params; // Product ID from request params
  const updateData = req.body; // Updated product data from request body

  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true } // Return the updated document and validate the data
    );

    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: "Medical product not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Medical product updated successfully",
      data: updatedProduct,
    });
  } catch (error) {
    console.error("Error updating medical product:", error);
    res.status(500).json({
      success: false,
      message: "Error updating medical product",
      error: error.message,
    });
  }
};

const deleteMedicalProduct = async (req, res) => {
  const { id } = req.params; // Product ID from request params

  try {
    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) {
      return res.status(404).json({
        success: false,
        message: "Medical product not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Medical product deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting medical product:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting medical product",
      error: error.message,
    });
  }
};

const getProductDetails = async (req, res) => {
  const { productId } = req.params; // Product ID from the URL parameter

  try {
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product details retrieved successfully",
      data: product,
    });
  } catch (error) {
    console.error("Error fetching product details:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching product details",
      error: error.message,
    });
  }
};


const getAllProducts = async (req, res) => {
  const { search } = req.query; // Get search query from request URL (query parameter)

  try {
    // Build the search filter object
    let searchFilter = {};

    // If search query is provided, apply it to product name and category
    if (search) {
      const regex = new RegExp(search, 'i'); // Case-insensitive regex for searching
      searchFilter = {
        $or: [
          { name: { $regex: regex } }, // Search by product name
          { category: { $regex: regex } } // Search by category
        ]
      };
    }

    // Fetch all products with optional search filter
    const products = await Product.find(searchFilter).populate('createdBy', 'name email'); // Populate admin details

    // Check if no products are found
    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No products found matching the search criteria",
      });
    }

    // Respond with the products list and additional details like admin's name and email
    res.status(200).json({
      success: true,
      message: "Products retrieved successfully",
      data: products,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching products",
      error: error.message,
    });
  }
};


module.exports={
  adminSignup,
  adminLogin,
  addMedicalProduct,
  updateMedicalProduct,
  deleteMedicalProduct,
  getAllProducts,
  getProductDetails
}