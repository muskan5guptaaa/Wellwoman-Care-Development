const Appointment = require("../models/appointmentModel");
const Doctor=require("../models/doctorsModel");
  const User=require("../models/userModel")
  const mongoose = require('mongoose');
  const Razorpay = require("razorpay");
const crypto = require("crypto");


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
  
    // Test API Key
const razorpay = new Razorpay({
  key_id: "rzp_test_Pj0gCrLiWmvapz", 
  key_secret: "nBoX60Pp7uCTv5mJxPpkdfty", 
});
  
  // Book Online Appointment
  const bookOnlineAppointment = async (req, res) => {
    try {
      const { doctorId, userId, date, timeSlot, problemDescription, amount } = req.body;
  
      // Validate required fields
      if (!doctorId || !userId || !date || !timeSlot || !amount) {
        return res.status(400).json({
           message: "All fields are required for online appointments." 
        });
      }
  
      // Validate IDs
      if (!mongoose.Types.ObjectId.isValid(doctorId) || !mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({
           message: "Invalid doctor or user ID format."
         });
      }
  
      const dayOfWeek = new Date(date).toLocaleString("en-US", { weekday: "long" });
  
      // Find the doctor
      const doctor = await Doctor.findById(doctorId);
      if (!doctor) {
        return res.status(404).json({
         message: "Doctor not found."
       });
      }
  
      // Check doctor's availability for online appointments
      const availability = doctor.availability.find(
        (slot) => slot.day === dayOfWeek && slot.appointmentType === "online"
      );
  
      if (!availability) {
        return res.status(400).json({
         message: `Doctor is not available for online appointments on ${dayOfWeek}.` 
      });
      }
  
      // Validate the time slot
      if (!availability.timeSlots.includes(timeSlot)) {
        return res.status(400).json({
         message: `Invalid time slot for online appointments on ${dayOfWeek}.` 
      });
      }
  
      // Check if the time slot is already booked
      const existingAppointment = await Appointment.findOne({
        doctorId,
        date,
        timeSlot,
        appointmentType: "online",
        status: "Booked",
      });
      if (existingAppointment) {
        return res.status(400).json({
         message: "Time slot is already booked for online appointments." 
      });
      }
  
      // Create a Razorpay order
      const options = {
        amount: amount * 100, // Amount in paise
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
        payment_capture: 1, // Auto-capture payment

      };
  
      const order = await razorpay.orders.create(options);
  
      if (!order) {
        return res.status(500).json({ 
        success: false, 
        message: "Unable to create order. Please try again." 
      });
      }
  
      res.status(201).json({
        success: true,
        message: "Appointment Booked. Proceed to payment.",
        order,
      });
    } catch (error) {
      console.error("Error booking online appointment:", error);
      res.status(500).json({ 
      success: false,
     message: "Server error", 
     error 
    });
    }
  };
  
  const verifyPayment = async (req, res) => {
    try {
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        doctorId,
        userId,
        date,
        timeSlot,
        problemDescription,
      } = req.body;
  
      // Generate the server-side signature
      const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
      hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
      const generated_signature = hmac.digest("hex");
  
      console.log("Generated Signature:", generated_signature); // Log the generated signature
      console.log("Received Signature:", razorpay_signature);  // Log the received signature from Razorpay
  
      // Compare signatures
      if (generated_signature !== razorpay_signature) {
        return res.status(400).json({ 
          success: false, 
          message: "Payment verification failed. Signature mismatch.",
        });
      }
  
      // Payment is verified; book the appointment
      const newAppointment = new Appointment({
        doctorId,
        userId,
        date,
        timeSlot,
        appointmentType: "online",
        problemDescription,
        status: "Booked",
      });
  
      await newAppointment.save();
  
      res.status(201).json({
        success: true,
        message: "Payment successful. Appointment booked.",
        appointment: newAppointment,
      });
    } catch (error) {
      console.error("Error verifying payment and booking appointment:", error);
      res.status(500).json({ success: false, message: "Server error", error });
    }
  };
  
  const getOnlineAppointmentStatus = async (req, res) => {
    try {
      const { appointmentId } = req.params;
  
      // Validate appointment ID
      if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid appointment ID format." 
        });
      }
  
      // Fetch the appointment details
      const appointment = await Appointment.findById(appointmentId);
  
      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: "Appointment not found.",
        });
      }
  
      // Return the appointment status
      res.status(200).json({
        success: true,
        message: "Appointment status retrieved successfully.",
        appointmentStatus: appointment.status,
      });
    } catch (error) {
      console.error("Error fetching appointment status:", error);
      res.status(500).json({ success: false, message: "Server error", error });
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

  const getUpcomingAppointmentsForDoctor = async (req, res) => {
    try {
      const { doctorId } = req.params;
  
      // Validate the doctorId
      if (!mongoose.Types.ObjectId.isValid(doctorId)) {
        return res.status(400).json({ message: "Invalid doctor ID." });
      }
  
      // Get the current date and the date one week from now
      const currentDate = new Date();
      const oneWeekLater = new Date();
      oneWeekLater.setDate(currentDate.getDate() + 7);
  
      const appointments = await Appointment.aggregate([
       
        {
          $match: {
            doctorId: new mongoose.Types.ObjectId(doctorId),
            date: { $gte: currentDate, $lte: oneWeekLater },
            status: "Booked", 
          },
        },
  
        {
          $lookup: {
            from: "doctors", 
            localField: "doctorId",
            foreignField: "_id",
            as: "doctorDetails",
          },
        },
  
        {
          $project: {
            date: 1,
            timeSlot: 1,
            appointmentType: 1,
            problemDescription: 1,
            doctorDetails: { name: 1, specialization: 1 }, 
          },
        },
  
        // Sort by date and time slot
        {
          $sort: { date: 1, timeSlot: 1 },
        },
      ]);
  
      if (appointments.length === 0) {
        return res.status(200).json({ message: "No upcoming appointments found." });
      }
  
      res.status(200).json({
        success: true,
        message: "Upcoming appointments fetched successfully.",
        appointments,
      });
    } catch (error) {
      console.error("Error fetching upcoming appointments:", error);
      res.status(500).json({ success: false, message: "Server error", error });
    }
  };
  

// Cancel Appointment Controller
const cancelAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    // Validate if the appointmentId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return res.status(400).json({ message: "Invalid appointment ID format." });
    }

    // Find the appointment by ID
    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found." });
    }

    // Check if the appointment status is already 'Cancelled'
    if (appointment.status === "Cancelled") {
      return res.status(400).json({ message: "This appointment is already cancelled." });
    }

    // Check if the appointment is already completed or past, cannot cancel it
    const currentDate = new Date();
    const appointmentDate = new Date(appointment.date);
    if (appointmentDate < currentDate) {
      return res.status(400).json({ message: "Cannot cancel past appointments." });
    }

    // Update the appointment status to 'Cancelled'
    appointment.status = "Cancelled";
    await appointment.save();

    // Send success response
    res.status(200).json({
      success: true,
      message: "Appointment cancelled successfully.",
      appointment: appointment,
    });
  } catch (error) {
    console.error("Error canceling appointment:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error,
    });
  }
};


  
module.exports={
    getDoctorSchedule,
    bookOnlineAppointment,
    getAllAppointmentsForUser,
    cancelAppointment,
    getUpcomingAppointmentsForDoctor,
    verifyPayment,
    getOnlineAppointmentStatus
}  