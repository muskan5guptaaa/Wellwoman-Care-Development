const Doctor = require('../models/doctorsModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Token = require('../models/tokenmodel')
const crypto = require('crypto');

const {forgetPasswordDoctorSV} = require('../schemaValidator/doctorValidator');

// Doctor signup
const signUpDoctor = async (req, res) => {
    try {
        const { name, email, phone, password,licenseNumber } = req.body;

        // Check if the email or phone already exists
        let existingDoctor = await Doctor.findOne({ email });
        if (existingDoctor) {
            return res.status(400).json({ success: false, message: "Email already registered." });
        }

        let existingPhone = await Doctor.findOne({ phone });
        if (existingPhone) {
            return res.status(400).json({ success: false, message: "Phone number already registered." });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new doctor
        const newDoctor = await Doctor.create({
            name,
            email,
            phone,
            password: hashedPassword,
            licenseNumber
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

        // Store token in the database
    await Token.create({
      token: token,
      objectDocId: user._id,
      userType: "User",
      deviceType: deviceType,
      expired_at: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
    });

    // Check if the token was saved
    const savedToken = await Token.findOne({ token: token });
    if (!savedToken) {
      return res.status(500).json({
        success: false,
        message: "Token not saved in database",
      });
    }

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
  
      // Save the token and expiry time in the doctor's record
      doctor.resetToken = resetToken; // Ensure `resetToken` exists in your Doctor schema.
      doctor.resetTokenExpiry = Date.now() + 3600000; // Token valid for 1 hour
      await doctor.save();
  
      // Create the reset link
      const resetLink = `https://your-frontend-url/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
  
      // Optional: send reset link via email or SMS here using Nodemailer or Twilio
  
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
  
  const getAllDoctors = async (req, res) => {
    try {
      const {
        phone,
        name,
        email,
        startDate,
        endDate,
        page = 1,
        limit = 10,
        sortBy = "name",
        sortOrder = 1,
      } = req.query;
  
      const filter = {};
  
      if (phone) {
        filter.phone = { $regex: phone, $options: "i" };
      }
      if (name) {
        filter.name = { $regex: name, $options: "i" };
      }
      if (email) {
        filter.email = { $regex: email, $options: "i" };
      }
  
      if (startDate && endDate) {
        filter.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }
  
      const doctors = await Doctor.aggregate([
        {
          $match: filter,
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
            country: 1,
            pincode: 1,
            createdAt: 1,
          },
        },
        {
          $sort: { [sortBy]: parseInt(sortOrder) },
        },
        {
          $facet: {
            data: [{ $skip: (page - 1) * limit }, { $limit: parseInt(limit) }],
            totalCount: [{ $count: "total" }],
          },
        },
      ]);
  
      const result = doctors[0] || {};
      const totalItems = result.totalCount.length > 0 ? result.totalCount[0].total : 0;
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
      return res.status(500).json({
        success: false,
        message: error?.message,
      });
    }
  };
  
module.exports = {
    signUpDoctor,
    loginDoctor,
    forgetPasswordDoctor,
    changePasswordDoctor,
    getAllDoctors
  
  
};
