const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  otpType: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: "5m",
  },
  
});

const OTP = mongoose.model("OTP", otpSchema);

module.exports = OTP;