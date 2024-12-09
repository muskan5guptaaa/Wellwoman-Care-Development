const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const adminSchema = new mongoose.Schema({
  adminDocId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
  },
  name: {
    type: String,
  },
  phone: {
    type: String,
  },
  email: {
    type: String,
  },
  type: {
    type: String,
    enum: ["admin", "superadmin"],
  },
  role: {
    type: String,
  },
  password: {
    type: String,
  },
  
  avatar: {
    type: String,
  },
  address: {
    type: String,
  },
  resetToken: {
    type: String,
    trim: true,
  },
  resetTokenExpiry: {
    type: Date,
  },
});

adminSchema.methods.generateToken = function () {
  return jwt.sign(
    {
      _id: this.id,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

 

const Admin = mongoose.model("Admin", adminSchema);

module.exports = Admin;
