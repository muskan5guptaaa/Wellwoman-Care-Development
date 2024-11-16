const { required } = require("joi");
const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Doctor",
    required: true,
  },
  userId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User",
    required:true,
  },
  date: {
    type: Date,
    required: true,
  },
availability: {
  days: {
      type: [String],
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      required: true
  },
},
  timeSlot: {
    type: String, 
    required: true,
  },
  status: {
    type: String,
    enum: ["Available", "Booked", "Not Available"],
    default: "Available",
  },
  appointmentType: {
    type: String,
    enum: ["Online", "Offline"], // Validate
    required: true
  },
  consultationFee: {
    type: Number,
    required: true,
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

appointmentSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Appointment = mongoose.model("Appointment", appointmentSchema);
module.exports = Appointment;
