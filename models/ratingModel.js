const mongoose = require("mongoose");

const RatingSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Doctor",
  },
  userDocId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  clinicId:{
     type:mongoose.Schema.Types.ObjectId,
     ref:"Clinic"
  },
  customerName: {
    type: String,
  },
  customerProfiles: {
    type: String,
  },
  feedback: {
    type: String,
  },
  images: [String],
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Rating", RatingSchema); // Correct Export
