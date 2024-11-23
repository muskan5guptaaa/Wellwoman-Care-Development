const { required } = require("joi");
const mongoose=require("mongoose");
const membershipController=require("../controllers/doctorMembershipController")
const Doctor=require("../controllers/doctorsController")
const docmembershipSchema = new mongoose.Schema({
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    transactionId: {
      type: String,
      default: "",
    },
    paidAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      default: "Pending",
    },
    createdAt: {
      type: Date,
      default: Date.now, 
    },
  });
  const Membership = mongoose.model('DoctorMembership', docmembershipSchema);

  module.exports = Membership;
