const Appointment = require("../models/appointment.model");
const Doctor=require("../models/doctorsModel");
  const User=require("../models/userModel")



  const getDoctorSchedule = async (req, res) => {
    try {
      const { doctorId, date } = req.query;
      const doctor = await Doctor.findById(doctorId);
      if (!doctor)
      return res.status(404).json({
     message: 'Doctor not found' 
    });

      // Define the day's availability
      const appointmentDate = new Date(date);
      const dayOfWeek = appointmentDate.toLocaleString('en-US', 
        { weekday: 'long' }
    );
      if (!doctor.availability.days.includes(dayOfWeek)) {
        return res.status(400).json({ 
            message: `Doctor is not available on ${dayOfWeek}`
         });
      }
      //  working hours 
      const startTime = new Date(`${date}T09:00:00`);
      const endTime = new Date(`${date}T17:00:00`);
      // Generate 30-minute time slots
      const timeSlots = [];
      let currentTime = startTime;
      while (currentTime < endTime) {
        const nextSlot = new Date(currentTime.getTime() + 30 * 60000); // Add 30 minutes
        timeSlots.push(
          `${currentTime.toLocaleTimeString([], 
          { hour: '2-digit', minute: '2-digit' })} - ${nextSlot.toLocaleTimeString([], 
            {
            hour: '2-digit', minute: '2-digit' 
            }
        )}`
        );
        currentTime = nextSlot;
      }
      // Fetch existing appointments for the doctor on the specified date
      const appointments = await Appointment.find({ doctorId, date });
      // Determine the status of each time slot
      const schedule = timeSlots.map((slot) => {
        const appointment = appointments.find((appt) => appt.timeSlot === slot);
        return {
          timeSlot: slot,
          status: appointment ? 'Booked' : 'Available',
          appointmentType: appointment ? appointment.appointmentType : null,
        };
      });
      res.status(200).json({ schedule });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  };

  // Book Appointment Controller
  const bookAppointment = async (req, res) => {
    try {
      const { doctorId } = req.params; // Doctor ID from request parameters
      const { userId, day, timeSlot, appointmentType } = req.body; // Appointment details from request body
  
      // Validate input
      if (!day || !timeSlot || !appointmentType) {
        return res.status(400).json({
          message: "Day, time slot, and appointment type are required.",
        });
      }
      // Validate day
      const validDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
      if (!validDays.includes(day)) {
        return res.status(400).json({ 
          message: "Invalid day provided."
         });
      }
      // Find the doctor
      const doctor = await Doctor.findById(doctorId);
      if (!doctor) {
        return res.status(404).json({
           message: "Doctor not found."
           });
      }
      // Check if the doctor has availability on the given day and appointmentType
      const availability = doctor.availability.find(
        (slot) => slot.day === day && (slot.appointmentType === appointmentType || slot.appointmentType === "both" )
      );
      if (!availability) {
        return res.status(400).json({
          message: `Doctor is not available on ${day} for ${appointmentType} appointments.`,
        });
      }
      // Check if the time slot is already booked by another user
      const existingAppointment = await Appointment.findOne({
        userId,
        day,
        timeSlot,
        appointmentType,
      });
      if (existingAppointment) {
        return res.status(400).json({
          message: "Time slot already booked by another user.",
          existingAppointment,
        });
      }
      // Create a new appointment
      const newAppointment = new Appointment({
        userId,
        doctorId,
        day,
        timeSlot,
        appointmentType,
      });
  
      await newAppointment.save();
  
      res.status(201).json({
        success: true,
        message: "Appointment booked successfully.",
        
      });
    } catch (error) {
      console.error("Error booking appointment:", error);
      res.status(500).json({ success: false, message: "Server error", error });
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