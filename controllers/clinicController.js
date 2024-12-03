const mongoose=require("mongoose");
const Clinic=require("../models/clinicModel")
const Doctor=require("../models/doctorsModel")
const Rating = require("../models/ratingModel");
const {nearbyClinicsSV} = require('../schemaValidator/clinicValidator');


// Create a hospital/clinic
const createClinic = async (req, res) => {
  try {
    // Validate the request body using Joi schema
    const validatedData = await nearbyClinicsSV.validateAsync(req.body);

    const { name, location, address, city, pincode, state, country, images, doctorId } = validatedData;
    // Check if the doctor exists
    const doctorExists = await Doctor.findById(doctorId);
    if (!doctorExists) {
      return res.status(404).json({ success: false, message: "Doctor not found." });
    }
    // Create the clinic in the database
    const newClinic = await Clinic.create({
      name,
      location,
      address,
      city,
      pincode,
      state,
      country,
      images: images || [],
      doctorId, 
    });
await newClinic.save();
    // Return success response
    return res.status(201).json({
      success: true,
      message: "Clinic created successfully.",
      data: newClinic,
    });
  } catch (err) {
    console.error(err);
    if (err.isJoi) {
      return res.status(400).json({
         success: false,
          message: err.details[0].message 
      });
    }
    return res.status(500).json({
       success: false,
       message: "Internal Server Error."
     });
  }
};


const getClinicById = async (req, res) => {
    try {
      const Clinic = await Clinic.findById(req.params.id);
  
      if (!clinic) {
        return res.status(404).json({
          success: false,
          message: "Clinic not found",
        });
      }
  
      return res.status(200).json({
        success: true,
        data: businessProfile,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve business profile",
        error: error.message,
      });
    }
  };


  const getNearbyClinics = async (req, res) => {
  try {
    const { latitude, longitude, maxDistance = 5000 } = req.query; // Default max distance = 5000 meters (5 km)

    // Validate inputs
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required.",
      });
    }

    // Find clinics near the given coordinates
    const nearbyClinics = await Clinic.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          $maxDistance: parseInt(maxDistance, 10), // Maximum distance in meters
        },
      },
    }).populate("doctorId", "name email specialization"); 

    return res.status(200).json({
      success: true,
      message: "Nearby clinics retrieved successfully.",
      data: nearbyClinics,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};


      module.exports = {
       createClinic,
    getNearbyClinics,
    getClinicById
    
   };
  