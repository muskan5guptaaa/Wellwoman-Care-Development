const { required } = require("joi");
const mongoose = require("mongoose");

const doctorKycSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Doctor",
    required: true,
  },
  fullName: {
    type: String,
    required: true,
  },
  frontImage:{
    type:String,
    required:true
  },
  backImage:{
    type:String,
    required:true
  },
  licenseNumber: {
    type: String,
    required: true,
    unique: true,
  },
  licenseExpiryDate: {
    type: Date,
    required: true,
  },
 documentType: {
        type: String,
        enum: ["Passport", "Driver's License", "National ID", "Medical License"],
        required: true,
      },
 documentNumber: {
        type: String,
        required: true,
      },
 documentFileUrl: {
        type: String,
        required: true,
      },
  isKycVerified: {
    type: Boolean,
    default: false,
  },
  kycSubmissionDate: {
    type: Date,
    default: Date.now,
  },
  kycVerifiedDate: {
    type: Date,
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
  },
});

module.exports = mongoose.model("DoctorKyc", doctorKycSchema);
