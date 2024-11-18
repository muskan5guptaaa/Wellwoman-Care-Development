const Appointment = require("../models/appointment.model");
const Doctor=require("../models/doctorsModel");
  
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
      const { doctorId, date, timeSlot, userId, appointmentType } = req.body;
  
      // Validate doctor
      const doctor = await Doctor.findById(doctorId);
      if (!doctor) {
        return res.status(404).json({ message: "Doctor not found" });
      }
  
      // Ensure availability is an array of objects with days and timeSlots
      if (!Array.isArray(doctor.availability)) {
        return res.status(400).json({ message: "Doctor availability is not properly defined" });
      }
  
      // Validate the selected day
      const appointmentDate = new Date(date);
      const dayOfWeek = appointmentDate.toLocaleString("en-US", { weekday: "long" });
  
      // Find the availability for the selected day
      const availability = doctor.availability.find((availability) => availability.day === dayOfWeek);
      if (!availability) {
        return res.status(400).json({ message: `Doctor is not available on ${dayOfWeek}` });
      }
  
      // Check if the timeSlot is available for the selected day
      if (!availability.timeSlots.includes(timeSlot)) {
        return res.status(400).json({ message: `Doctor is not available at ${timeSlot} on ${dayOfWeek}` });
      }
  
      // Check if the time slot is already booked
      const existingAppointment = await Appointment.findOne({ doctorId, date, timeSlot });
      if (existingAppointment) {
        return res.status(400).json({ message: "Time slot is already booked" });
      }
  
      // Create a new appointment
      const appointment = new Appointment({
        doctorId,
        userId,
        date,
        timeSlot,
        appointmentType,
      });
      await appointment.save();
  
      res.status(201).json({
        message: "Appointment booked successfully",
        appointment,
      });
    } catch (error) {
      console.error(error);
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