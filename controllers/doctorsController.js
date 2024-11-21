const Doctor = require('../models/doctorsModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const OTP=require("../models/otpModel")
const Token = require("../models/tokenmodel");
const axios = require('axios');
const {forgetPasswordDoctorSV,sendOtpSV} = require('../schemaValidator/doctorValidator');
const { generateOTP } = require('../utils/sendOtp');


const sendOtpDoctor = async (req, res) => {
    try {
      if (req.body.email) {
        req.body.email = req.body.email.toLowerCase();
      }
      const validateReqBody = await sendOtpSV.validateAsync(req.body);
      const { otpType, phone, email } = validateReqBody;
      const otp = generateOTP();
  
      if (phone) {
        const otpPayload = {
          otpType,
          phone,
          otp,
          appType: "Doctor", 
        };
        const phoneEntry = await OTP.create(otpPayload);
        const response = await sendOtpViaSMS(phone, otp);
        return res.status(response.success ? 200 : 500).json(response);
      } else if (email) {
        const otpPayload = {
          otpType,
          email,
          otp,
          appType: "Doctor", 
        };
        const emailEntry = await OTP.create(otpPayload);
        const response = await sendOtpViaEmail(email, otp);
        return res.status(response.success ? 200 : 500).json(response);
      } else {
        return res.status(400).json({
          success: false,
          message: "Phone number or email is required.",
        });
      }
    } catch (err) {
      console.log("Error in sending OTP to doctor:", err);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  };
  

// Doctor signup
const signUpDoctor = async (req, res) => {
    try {
        const { name, email, password} = req.body;

        // Check if the email or phone already exists
        let existingDoctor = await Doctor.findOne({ email });
        if (existingDoctor) {
            return res.status(400).json({ success: false, message: "Email already registered." });
        }

        let existingPhone = await Doctor.findOne({ phone });
        if (existingPhone) {
            return res.status(400).json({ success: false, message: "Phone number already registered." });
        }
               // Validate availability
    if (!availability.days || !availability.timeSlots) {
      return res
        .status(400)
        .json({ message: "Availability must include both days and timeSlots." });
    }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new doctor
        const newDoctor = await Doctor.create({
            name,
            email,
            phone,
            address,
            password: hashedPassword,
            licenseNumber,
            availability,
            consultationFee
            
        });

        return res.status(201).json({ success: true, message: "Doctor registered successfully." });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ success: false, message: "Internal Server Error." });
    }
};


// Doctor login controller
const loginDoctor = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input fields
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Check if the doctor exists in the database
        const doctor = await Doctor.findOne({ email });
        if (!doctor || !doctor.password) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Compare provided password with the hashed password in the database
        const isMatch = await bcrypt.compare(password, doctor.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate a JWT token for the authenticated doctor
        const token = jwt.sign(
            { doctorId: doctor._id, email: doctor.email },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '1h' }
        );

    

        // Store the generated token in the Token collection for session tracking
        await Token.create({
            token: token,
            objectDocId: doctor._id,
            expired_at: new Date(Date.now() + 60 * 60 * 1000)
        });
        // Return the token and doctor details
        return res.status(200).json({
            doctorId: doctor._id,
            success: true,
            message: 'Login successful',
            token: token
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

const forgetPasswordDoctor = async (req, res) => {
    try {
      // Validate the request body (assuming you have validation defined in `forgetPasswordSV`)
      const validateReqBody = await forgetPasswordDoctorSV.validateAsync(req.body);
      const { email } = validateReqBody;
  
      if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required' });
      }
  
      // Check if the doctor exists
      const doctor = await Doctor.findOne({ email });
      if (!doctor) {
        return res.status(404).json({ 
          success: false,
          message: 'Doctor not found' 
        });
      }
  
      // Generate a password reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
  
      doctor.resetToken = resetToken; 
      doctor.resetTokenExpiry = Date.now() + 3600000; // Token valid for 1 hour
      await doctor.save();
  
      // Create the reset link
      const resetLink = `https://your-frontend-url/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
    
      return res.status(200).json({
        success: true,
        message: 'Password reset link sent successfully',
        resetLink,
      });
  
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: 'Server error',
      });
    }
  };

  const changePasswordDoctor = async (req, res) => {
    try {
        const { email, currentPassword, newPassword } = req.body;
  
        // Validate that email and passwords are provided
        if (!email || !currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Email, current password, and new password are required',
            });
        }
  
        // Find the doctor by email
        const doctor = await Doctor.findOne({ email });
        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: 'Doctor not found',
            });
        }
  
        // Compare the current password with the stored hashed password
        const isMatch = await bcrypt.compare(currentPassword, doctor.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect',
            });
        }
  
        // Hash the new password and update the doctor's password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        doctor.password = hashedNewPassword;
        await doctor.save();
  
        return res.status(200).json({
            success: true,
            message: 'Password updated successfully',
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
  };
  

  const logoutDoctor = async (req, res) => {
    try {
      // Extract the token from the request (either from cookies or headers)
      const doctorId = req.userId;
      const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
  
      // If token is not found, return an error response
      if (!token) {
        return res.status(400).json({
          success: false,
          message: "No token provided"
        });
      }
  
      // Remove the token from the database (assuming you store tokens for each user type)
      await Token.findOneAndDelete({
        token,
        objectDocId: doctorId,
        userType: "Doctor",  // We assume the userType is "Doctor"
      });
  
      // Clear the token cookie
      res.clearCookie("token");
  
      return res.status(200).json({
        success: true,
        message: "Doctor logged out successfully",
      });
    } catch (err) {
      console.error("Error in doctor logout:", err);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  };
  
  const getAllDoctors = async (req, res) => {
    try {
      const {
        search,
        phone,
        name,
        email,
        startDate,
        endDate,
        page = 1,
        limit = 10,
        licenseNumber=1,
        sortBy = "name",
        sortOrder = 1,
      } = req.query;
  
      const filter = {};
  
      if (search) {
        const regex = new RegExp(search, "i");
        filter.$or = [
          { phone: { $regex: regex } },
          { name: { $regex: regex } },
          { email: { $regex: regex } },
        ];
      }
  
      if (startDate && endDate) {
        filter.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }
      const doctors = await Doctor.aggregate([
        { $match: filter },
        {
          $lookup: {
            from: "DoctorKyc",              
            localField: "_id",         
            foreignField: "doctorId",   
            pipeline: [
              {
                 $project: 
                 { status: 1 } 
                } 
            ],
            as: "kycDetails",        
          }
        },
        {
          $project: {
            _id: 1,
            name: 1,
            email: 1,
            phone: 1,
            specialty: 1,
            address: 1,
            city: 1,
            state: 1,
            licenseNumber:1,
            country: 1,
            pincode: 1,
            createdAt: 1,
            kycStatus: {
              $ifNull: [{ $arrayElemAt: ["$kycDetails.status", 0] }, "Not Found"]
            }
      
          },
        },
        { $sort: { [sortBy]: parseInt(sortOrder) } },
        {
          $facet: {
            data: [{ $skip: (page - 1) * limit }, { $limit: parseInt(limit) }],
            totalCount: [{ $count: "total" }],
          },
        },
      ]);
  
      const result = doctors[0] || {};
      const totalItems = result.totalCount?.[0]?.total || 0;
      const totalPages = totalItems > 0 ? Math.ceil(totalItems / limit) : 1;
  
      return res.status(200).json({
        success: true,
        data: result.data,
        page: parseInt(page),
        pages: totalPages,
        pageSize: parseInt(limit),
        total: totalItems,
      });
    } catch (error) {
      console.log("Error in fetching all doctors", error);
      console.log("Filter object:", filter);
      return res.status(500).json({
        success: false,
        message: error?.message,
      });
    }
  };

  const generateTimeSlots = (startTime, endTime) => {
    const slots = [];
    const start = new Date(`1970-01-01T${startTime}:00`);
    const end = new Date(`1970-01-01T${endTime}:00`);
  
    if (start >= end) {
      return slots;
    }
  
    let current = start;
    while (current < end) {
      const next = new Date(current.getTime() + 30 * 60000); // Add 30 minutes
      slots.push(`${current.toTimeString().slice(0, 5)}-${next.toTimeString().slice(0, 5)}`);
      current = next;
    }
    return slots;
  };
  
// Update Doctor's Availability
const updateAvailabilityDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params; // Doctor ID from request parameters
    const { days, startTime, endTime, appointmentType } = req.body; // Days, times, and appointment type from request body

    // Validate input
    if (!startTime || !endTime || !appointmentType) {
      return res
        .status(400)
        .json({ message: "Start time, end time, and appointment type are required." });
    }

    // Validate days
    const validDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const isValidDays = days.every((day) => validDays.includes(day));
    if (!isValidDays) {
      return res.status(400).json({ message: "Invalid day(s) provided." });
    }

    // Helper function to generate 30-minute time slots
    const generateTimeSlots = (startTime, endTime) => {
      const slots = [];
      const start = new Date(`1970-01-01T${startTime}:00`);
      const end = new Date(`1970-01-01T${endTime}:00`);

      if (start >= end) {
        return slots;
      }

      let current = start;
      while (current < end) {
        const next = new Date(current.getTime() + 30 * 60000); // Add 30 minutes
        slots.push(`${current.toTimeString().slice(0, 5)}-${next.toTimeString().slice(0, 5)}`);
        current = next;
      }
      return slots;
    };

    // Generate availability with time slots
    const availability = days.map((day) => ({
      day,
      timeSlots: generateTimeSlots(startTime, endTime),
      appointmentType,
    }));

    // Find the doctor and update their availability
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found." });
    }

    doctor.availability = availability;
    await doctor.save();

    res.status(200).json({
      success: true,
      message: "Doctor availability updated successfully.",
      availability: doctor.availability,
    });
  } catch (error) {
    console.error("Error updating doctor availability:", error);
    res.status(500).json({ success: false, message: "Server error", error });
  }
};


module.exports = {
    signUpDoctor,
    loginDoctor,
    forgetPasswordDoctor,
    changePasswordDoctor,
    getAllDoctors,
    sendOtpDoctor,
    logoutDoctor,
    updateAvailabilityDoctor,
    generateTimeSlots
};
