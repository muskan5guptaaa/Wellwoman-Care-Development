const Doctor = require('../models/doctorsModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const OTP=require("../models/otpModel")
const Token = require("../models/tokenmodel");
const axios = require('axios');
const Rating=require("../models/ratingModel")
const {forgetPasswordDoctorSV,sendOtpSV} = require('../schemaValidator/doctorValidator');
const { generateOTP } = require('../utils/sendOtp');
const mongoose=require("mongoose")


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
        const { name, email, password,phone} = req.body;

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
const editDoctorProfile = async (req, res) => {
  try {
    if (req.body.name) {
      req.body.name = req.body.name
        .split(" ")
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join(" ");
    }

    const validateReqBody = await updateDoctorProfileSV.validateAsync(req.body); 
    const doctorId = req.doctorId;

    const updatedDoctor = await Doctor.findByIdAndUpdate(doctorId, validateReqBody, {
      new: true,
    });

    if (!updatedDoctor) {
      return res
        .status(404)
        .json({ success: false, message: "Doctor not found" });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      doctor: updatedDoctor,
    });
  } catch (err) {
    console.error(err);
    if (err.isJoi) {
      return res.status(400).json({
        success: false,
        message: err.details[0].message,
      });
    }
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};


const showDoctorProfile = async (req, res) => {
  try {
    const doctorId = req.doctorId;

    const doctor = await Doctor.aggregate([
      { $match: { _id: doctorId } },
      {
        $project: {
          name: 1,
          email: 1,
          phone: 1,
          avatar: { $ifNull: ["$avatar", ""] },
          specialization: { $ifNull: ["$specialization", ""] },
          experience: { $ifNull: ["$experience", ""] },
          consultationFee: { $ifNull: ["$consultationFee", ""] },
          address: { $ifNull: ["$address", ""] },
          city: { $ifNull: ["$city", ""] },
          pincode: { $ifNull: ["$pincode", ""] },
          state: { $ifNull: ["$state", ""] },
          country: { $ifNull: ["$country", ""] },
          gender: 1,
          latitude: { $ifNull: ["$latitude", ""] },
          longitude: { $ifNull: ["$longitude", ""] },
          isVerified: 1, 
        },
      },
    ]);

    if (doctor.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Doctor not found" });
    }

    res.status(200).json({
      success: true,
      data: doctor[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false, 
      message: "Internal Server Error" 
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
  const saveDoctorPersonalInfo = async (req, res) => {
    try {
      const { firstName, lastName, phone, dob, gender } = req.body;
  
      // Validate the inputs
      if (!firstName || !lastName || !phone || !dob || !gender) {
        return res.status(400).json({
          success: false,
          message: "All fields are required (First name, Last name, Phone, DOB, Gender)",
        });
      }
  
      // Assuming the doctor ID is available in the request (from authentication middleware)
      const { doctorId } = req.params;
  
      // Use aggregation to fetch the doctor's existing data (just for demonstration)
      const doctor = await Doctor.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(doctorId) } },  // Match the doctor by ID
        { 
          $project: {  // Return the existing doctor information
            firstName: 1,
            lastName: 1,
            phone: 1,
            dob: 1,
            gender: 1
          }
        }
      ]);
  
      if (!doctor || doctor.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Doctor not found",
        });
      }
  
      // Now update the doctor's information
      const updatedDoctor = await Doctor.findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(doctorId) }, 
        { 
          $set: {
            firstName: firstName,
            lastName: lastName,
            phone: phone,
            dob: new Date(dob), // Convert the DOB to Date format
            gender: gender
          }
        },
        { new: true } // Return the updated doctor document
      );
  
      return res.status(200).json({
        success: true,
        message: "Doctor's personal information updated successfully",
        doctor: {
          firstName: updatedDoctor.firstName,
          lastName: updatedDoctor.lastName,
          phone: updatedDoctor.phone,
          dob: updatedDoctor.dob,
          gender: updatedDoctor.gender,
        },
      });
  
    } catch (error) {
      console.error("Error saving doctor's personal information:", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  };
  
  
  
  const getAllDoctors = async (req, res) => {
    const filter = {};
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
          },
        },
        {
    $lookup:{
      from:"DoctorMembership",
      localField:"_id",
      foreignField:"doctorId",
      pipeline:[
        {$sort:{createdAt:-1}},
        {$limit:1},
        {$project:{status:1}},
      ],
      as:"memebershipDetails",
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
            },
            memebershipStatus:{
              $ifNull:[
                {$arrayElemAt:["$memebershipDetails.status",0]},
                "Not Found",
              ]
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

// Update Doctor's Availability and Specialization
const updateAvailabilityDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { days, startTime, endTime, appointmentType, specialization } = req.body;

    // Check if start time, end time, and appointment type are provided
    if (!startTime || !endTime || !appointmentType) {
      return res.status(400).json({ message: "Start time, end time, and appointment type are required." });
    }

    // Validate the provided days
    const validDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const isValidDays = days.every((day) => validDays.includes(day));
    if (!isValidDays) {
      return res.status(400).json({ message: "Invalid day(s) provided." });
    }

    // Function to generate time slots based on the start and end times
    const generateTimeSlots = (startTime, endTime) => {
      const slots = [];
      const start = new Date(`1970-01-01T${startTime}:00`);
      const end = new Date(`1970-01-01T${endTime}:00`);

      if (start >= end) {
        return slots;
      }

      let current = start;
      while (current < end) {
        const next = new Date(current.getTime() + 30 * 60000); // 30-minute intervals
        slots.push(`${current.toTimeString().slice(0, 5)}-${next.toTimeString().slice(0, 5)}`);
        current = next;
      }
      return slots;
    };

    // Create the availability object
    const availability = days.map((day) => ({
      day,
      timeSlots: generateTimeSlots(startTime, endTime),
      appointmentType,
    }));

    // Find the doctor by ID
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found." });
    }

    if (specialization) {
      doctor.specialization = specialization; 
    }

    doctor.availability = availability;
    
    await doctor.save();

    res.status(200).json({
      success: true,
      message: "Doctor availability and specialization updated successfully.",
      availability: doctor.availability,
      specialization: doctor.specialization, 
    });
  } catch (error) {
    console.error("Error updating doctor availability:", error);
    res.status(500).json({ success: false, message: "Server error", error });
  }
};




//Top rated dr 
const getTopRatedDoctors = async (req, res) => {
  try {
    const { limit = 10 } = req.query; // Default limit to 10 if not provided

    const topRatedDoctors = await Rating.aggregate([
      {
        $group: {
          _id: "$doctorId", 
          averageRating: { $avg: "$rating" }, // Calculate average rating
          ratingCount: { $sum: 1 }, // Count the number of ratings
        },
      },
      {
        $lookup: {
          from: "doctors", 
          localField: "_id",
          foreignField: "_id",
          as: "doctorDetails",
        },
      },
      {
        $unwind: "$doctorDetails", 
      },
      {
        $project: {
          _id: 0,
          doctorId: "$_id",
          averageRating: 1,
          ratingCount: 1,
          "doctorDetails.name": 1,
          "doctorDetails.specialization": 1,
          "doctorDetails.experience": 1,
          "doctorDetails.clinicAddress": 1,
          "doctorDetails.city": 1,
          "doctorDetails.state": 1,
          "doctorDetails.country": 1,
        },
      },
      {
        $sort: { averageRating: -1, ratingCount: -1 }, // Sort by average rating and then by number of ratings
      },
      {
        $limit: parseInt(limit),
      },
    ]);

    if (topRatedDoctors.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No ratings available to determine top-rated doctors.",
      });
    }

    res.status(200).json({
      success: true,
      data: topRatedDoctors,
    });
  } catch (error) {
    console.error("Error fetching top-rated doctors:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};

const getDoctorDetails = async (req, res) => {
  try {
    const { doctorId } = req.query; 

    const doctor = await Doctor.findById(doctorId).select(
      "name specialization availability"
    );

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }
    const doctorDetails = {
      name: doctor.name,
      specialization: doctor.specialization,
      availability: doctor.availability.map((slot) => ({
      day: slot.day,
      timeSlots: slot.timeSlots,
      appointmentType: slot.appointmentType,
      })),
    };

    res.status(200).json({
      success: true,
      data: doctorDetails,
    });
  } catch (error) {
    console.error("Error fetching doctor details:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};




module.exports = {
    signUpDoctor,
    loginDoctor,
    forgetPasswordDoctor,
    changePasswordDoctor,
    editDoctorProfile,
    showDoctorProfile,
    getAllDoctors,
    sendOtpDoctor,
    logoutDoctor,
    updateAvailabilityDoctor,
    getTopRatedDoctors,
    getDoctorDetails,
    saveDoctorPersonalInfo
};
