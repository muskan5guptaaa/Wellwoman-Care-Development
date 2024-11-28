const mongoose=require("mongoose");
const Profile=require("../models/doctorProfileModel")


// Create a hospital/clinic
const createHospital = async (req, res) => {
    try {
      const { name, address, contact, facilities, doctorIds } = req.body;
  
      // Validate input
      if (!name || !address || !contact) {
        return res.status(400).json({
          message: 'Name, address, and contact are required fields.',
        });
      }
  
      // Verify doctor IDs (optional: ensure doctors exist in the database)
      if (doctorIds && doctorIds.length > 0) {
        const validDoctors = await Doctor.find({ _id: { $in: doctorIds } });
        if (validDoctors.length !== doctorIds.length) {
          return res.status(400).json({
            message: 'Some doctor IDs are invalid.',
          });
        }
      }
  
      // Create a new hospital
      const newHospital = new Hospital({
        name,
        address,
        contact,
        facilities,
        doctors: doctorIds || [],
      });
  
      // Save hospital to the database
      await newHospital.save();
  
      res.status(201).json({
        success: true,
        message: 'Hospital created successfully.',
        hospital: newHospital,
      });
    } catch (error) {
      console.error('Error creating hospital:', error);
      res.status(500).json({ message: 'Server error', error });
    }
  };
  
  module.exports = { createHospital };
  