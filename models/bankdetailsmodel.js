const mongoose = require("mongoose");

const bankDetailsSchema = new mongoose.Schema({
  doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
    },
  bankName: {
    type: String,
    required: true,
  },
  accountHolderName: {
    type: String,
    required: true,
  },
  accountNumber: {
    type: String,
    required: true,
    unique: true,
  },
  IFSCcode: {
    type: String,
    required: true,
  },
  branchName: {
    type: String,
    required: false,
  },
  primary: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const BankDetails = mongoose.model("BankDetails", bankDetailsSchema);
module.exports = BankDetails;
