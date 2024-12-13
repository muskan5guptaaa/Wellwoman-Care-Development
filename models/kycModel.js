const { required } = require("joi");
const mongoose = require("mongoose");
const Doctor=require("../controllers/doctorsController")
const KYC =require("../controllers/kycController")

const doctorKycSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Doctor",
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
    unique: true,
  },
  licenseExpiryDate: {
    type: Date
  },
 documentType: {
        type: String,
        enum: ["Passport", "Driver's License", "Aadhar card","Pan Card", ],
        required: true,
      },
 documentNumber: {
        type: String,
        required: true,
      },
 documentFileUrl: {
        type: String
      },
  isKycVerified: {
    type: Boolean,
    default: true,
  },
  status: {
    type: String,
    enum: ["Pending", "Completed"],
  },
  kycSubmissionDate: {
    type: Date,
    default: Date.now,
  },
  kycVerifiedDate: {
    type: Date,
  },
});

module.exports = mongoose.model("DoctorKyc", doctorKycSchema);
