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
      const { doctorId, userId, date, timeSlot } = req.body;
  
      // Check if the doctor exists
      const doctor = await Doctor.findById(doctorId);
      if (!doctor) return res.status(404).json({
         message: 'Doctor not found'
         });
  
      // Check if the slot is already booked
      const existingAppointment = await Appointment.findOne({ doctorId, date, timeSlot });
      if (existingAppointment) {
        return res.status(400).json({
             message: 'Time slot is already booked' 
            });
      }
  
      // Create new appointment
      const newAppointment = new Appointment({ 
        doctorId,
        userId,
        date, 
        timeSlot ,
        appointmentType
    });
      await newAppointment.save();
  
      res.status(200).json({
         message: 'Appointment booked successfully', 
         appointment: newAppointment
         });
    } catch (error) {
      res.status(500).json({
         message: 'Server error', 
         error });
    }
  };
  
module.exports={
    getDoctorSchedule,
    bookAppointment
}  