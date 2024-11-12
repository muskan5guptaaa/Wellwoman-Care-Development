const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Doctor",
    required: true,
  },
 
  date: {
    type: Date,
    required: true,
  },
  timeSlot: {
    type: String, 
    required: true,
  },
  status: {
    type: String,
    enum: ["Scheduled", "Completed", "Cancelled"],
    default: "Scheduled",
  },
  reason: {
    type: String,
    required: true,
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
