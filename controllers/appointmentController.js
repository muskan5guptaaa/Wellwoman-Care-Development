const Appointment = require("../models/appointmentModel");
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
      const { doctorId, userId, date, timeSlot, appointmentType,problemDescription } = req.body;
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
  
      // Process based on appointment type
      let meetingLink = null;
      let doctorAddress = null;
  
      if (appointmentType === "online") {
        // Generate or fetch a Zoom/Google Meet link
        meetingLink = `https://zoom.us/j/${Math.floor(Math.random() * 100000000)}`; // Example Zoom link
      } else if (appointmentType === "offline") {
        // Return doctor's address
        doctorAddress = doctor.address;
      }
  
      // Book the appointment
      const newAppointment = new Appointment({
        doctorId,
        userId,
        date,
        timeSlot,
        appointmentType,
        meetingLink,
        problemDescription
      });
  
      await newAppointment.save();
  
      // Respond with appointment details and additional information
      res.status(201).json({
        success: true,
        message: "Appointment booked successfully.",
        appointment: newAppointment,
        additionalInfo: {
          meetingLink: meetingLink || null,
          doctorAddress: doctorAddress || null,
        },
      });
    } catch (error) {
      console.error("Error booking appointment:", error);
      res.status(500).json({ message: "Server error", error });
    }
  };
  

  const getAllAppointmentsForUser = async (req, res) => {
    try {
      const { userId } = req.params;
  
      // Validate if doctorId is provided
      if (!userId) {
        return res.status(400).json({ message: "Doctor ID is required." });
      }
  
      // Check if the doctor exists
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
      // Respond with the appointments
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