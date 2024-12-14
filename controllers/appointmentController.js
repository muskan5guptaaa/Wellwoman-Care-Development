const Appointment = require("../models/appointmentModel");
const Doctor=require("../models/doctorsModel");
  const User=require("../models/userModel")
  const mongoose = require('mongoose');
 

  const getDoctorSchedule = async (req, res) => {
    try {
      const { doctorId, date } = req.query;
  
      if (!mongoose.Types.ObjectId.isValid(doctorId)) {
        return res.status(400).json({ message: "Invalid doctor ID format." });
      }
  
      const doctor = await Doctor.findById(doctorId).select("availability");
      if (!doctor) {
        return res.status(404).json({ message: "Doctor not found." });
      }
  
      const dayOfWeek = date
        ? new Date(date).toLocaleString("en-US", { weekday: "long" })
        : null;
  
      const schedule = dayOfWeek
        ? doctor.availability.filter((slot) => slot.day === dayOfWeek)
        : doctor.availability;
  
      const bookedAppointments = await Appointment.find({
        doctorId,
        ...(date && { date }), 
      }).select("date timeSlot");
  
      const formattedSchedule = schedule.map((slot) => {
        const bookedSlots = bookedAppointments
          .filter((appointment) => appointment.date.toISOString().split("T")[0] === date)
          .map((appointment) => appointment.timeSlot);
  
        return {
          day: slot.day,
          timeSlots: slot.timeSlots.map((time) => ({
            time,
            status: bookedSlots.includes(time) ? "Booked" : "Available",
          })),
          appointmentType: slot.appointmentType,
        };
      });
  
      res.status(200).json({
        success: true,
        message: "Doctor schedule retrieved successfully.",
        schedule: formattedSchedule,
      });
    } catch (error) {
      console.error("Error fetching doctor schedule:", error);
      res.status(500).json({ message: "Server error", error });
    }
  };
  
  
  
  // Book Appointment Controller
  const bookAppointment = async (req, res) => {
    try {
      const { doctorId, userId, date, timeSlot, appointmentType, problemDescription } = req.body;
  
      if (!doctorId || !userId || !date || !timeSlot || !appointmentType) {
        return res.status(400).json({ message: "All fields are required." });
      }
  
      // Validate doctor ID and user ID format
      if (!mongoose.Types.ObjectId.isValid(doctorId) || !mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ 
          message: "Invalid doctor or user ID format."
         });
      }
  
      const dayOfWeek = new Date(date).toLocaleString("en-US", { weekday: "long" });
  
      const doctor = await Doctor.findById(doctorId);
      if (!doctor) {
        return res.status(404).json({ message: "Doctor not found." });
      }
  
      // Check  doctor is available on the given day
      const availability = doctor.availability.find((slot) => slot.day === dayOfWeek);
      if (!availability) {
        return res.status(400).json({ message: `Doctor is not available on ${dayOfWeek}.` });
      }
  
      // Ensure the appointment type matches the doctor's availability
      if (availability.appointmentType !== "both" && availability.appointmentType !== appointmentType) {
        return res.status(400).json({
          message: `Doctor does not support ${appointmentType} appointments on ${dayOfWeek}.`,
        });
      }
  
      if (!availability.timeSlots.includes(timeSlot)) {
        return res.status(400).json({ 
          message: `Invalid time slot for ${dayOfWeek}.` 
        });
      }
  
      const existingAppointment = await Appointment.findOne({
        doctorId,
        date,
        timeSlot,
        appointmentType,
        status: "Booked",
      });
      if (existingAppointment) {
        return res.status(400).json({
           message: "Time slot is already booked."
           });
      }
  
      // Book the appointment
      const newAppointment = new Appointment({
        doctorId,
        userId,
        date,
        timeSlot,
        appointmentType,
        problemDescription,
        status: "Booked", 
      });
  
      await newAppointment.save();
  
      res.status(201).json({
        success: true,
        message: "Appointment booked successfully.",
        appointment: newAppointment,
      });
    } catch (error) {
      console.error("Error booking appointment:", error);
      res.status(500).json({ 
        message: "Server error", error 
      });
    }
  };
  
  const getAllAppointmentsForUser = async (req, res) => {
    try {
      const { userId } = req.params;
  
      if (!userId) {
        return res.status(400).json({ message: "Doctor ID is required." });
      }
  
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "Doctor not found." });
      }
      // Fetch all appointments for the doctor
      const appointments = await Appointment.find({ userId })
        .populate("doctorId", "name email phone specialization") 
        .sort({ date: 1, timeSlot: 1 }); 
  
      if (appointments.length === 0) {
        return res.status(200).json({ message: "No appointments found for this doctor." });
      }
      res.status(200).json({
        success: true,
        message: "Appointments fetched successfully.",
        appointments,
      });
    } catch (error) {
      console.error("Error fetching appointments:", error);
      res.status(500).json({ message: "Server error", error });
    }
  };

  
//for cancel appointment



  
module.exports={
    getDoctorSchedule,
    bookAppointment,
    getAllAppointmentsForUser
}  