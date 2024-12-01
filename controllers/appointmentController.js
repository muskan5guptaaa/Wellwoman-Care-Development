const Appointment = require("../models/appointment.model");
const Doctor=require("../models/doctorsModel");
  const User=require("../models/userModel")
  
  const getDoctorSchedule = async (req, res) => {
    try {
      const { doctorId, date } = req.query;
  
      const doctor = await Doctor.findById(doctorId);
      if (!doctor) {
        return res.status(404).json({ message: "Doctor not found." });
      }
  
      const dayOfWeek = new Date(date).toLocaleString("en-US", { weekday: "long" });
  
      const availability = doctor.availability.find((slot) => slot.day === dayOfWeek);
      if (!availability) {
        return res.status(400).json({ message: `Doctor is not available on ${dayOfWeek}.` });
      }
  
      const appointments = await Appointment.find({ doctorId, date });
      const schedule = availability.timeSlots.map((timeSlot) => {
        const isBooked = appointments.some((appt) => appt.timeSlot === timeSlot);
        return {
          timeSlot,
          status: isBooked ? "Booked" : "Available",
        };
      });
  
      res.status(200).json({ schedule });
    } catch (error) {
      console.error("Error fetching doctor schedule:", error);
      res.status(500).json({ message: "Server error", error });
    }
  };
  
  // Book Appointment Controller

  const bookAppointment = async (req, res) => {
    try {
      const { doctorId, userId, date, timeSlot, appointmentType } = req.body;
  
      // Validate inputs
      if (!doctorId || !userId || !date || !timeSlot || !appointmentType) {
        return res.status(400).json({ message: "All fields are required." });
      }
  
      // Convert date to the day of the week
      const dayOfWeek = new Date(date).toLocaleString("en-US", { weekday: "long" });
  
      // Check if the doctor exists
      const doctor = await Doctor.findById(doctorId);
      if (!doctor) {
        return res.status(404).json({ message: "Doctor not found." });
      }
  
      // Check if the doctor is available on the given day
      const availability = doctor.availability.find((slot) => slot.day === dayOfWeek);
      if (!availability) {
        return res.status(400).json({ message: `Doctor is not available on ${dayOfWeek}.` });
      }
  
      // Check if the provided time slot is valid
      if (!availability.timeSlots.includes(timeSlot)) {
        return res.status(400).json({ message: "Invalid or unavailable time slot." });
      }
  
      // Ensure the appointment type matches the doctor's availability
      if (availability.appointmentType !== "both" && availability.appointmentType !== appointmentType) {
        return res.status(400).json({
          message: `Doctor does not support ${appointmentType} appointments on ${dayOfWeek}.`,
        });
      }
  
      // Check if the time slot is already booked
      const existingAppointment = await Appointment.findOne({
        doctorId,
        date,
        timeSlot,
      });
      if (existingAppointment) {
        return res.status(400).json({ message: "Time slot is already booked." });
      }
  
      // Book the appointment
      const newAppointment = new Appointment({
        doctorId,
        userId,
        date,
        timeSlot,
        appointmentType,
      });
      await newAppointment.save();
  
      res.status(201).json({
        success: true,
        message: "Appointment booked successfully.",
        appointment: newAppointment,
      });
    } catch (error) {
      console.error("Error booking appointment:", error);
      res.status(500).json({ message: "Server error", error });
    }
  };
  
//for cancel appointment
  const cancelAppointment = async (req, res) => {
    try {
      const { appointmentId, userId } = req.body;
  
      // Check if the appointment exists
      const appointment = await Appointment.findById(appointmentId);
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }
  
      // Ensure the appointment belongs to the user
      if (appointment.userId.toString() !== userId) {
        return res.status(403).json({ message: "You are not authorized to cancel this appointment" });
      }
  
      // Delete the appointment
      await Appointment.findByIdAndDelete(appointmentId);
  
      res.status(200).json({
        success: true,
        message: "Appointment canceled successfully",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error", error });
    }
  };
  
module.exports={
    getDoctorSchedule,
    bookAppointment,
    cancelAppointment
}  