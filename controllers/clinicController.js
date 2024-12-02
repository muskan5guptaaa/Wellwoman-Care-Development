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
      doctorId, // Associate the clinic with the doctor
    });

    // Return success response
    return res.status(201).json({
      success: true,
      message: "Clinic created successfully.",
      data: newClinic,
    });
  } catch (err) {
    console.error(err);
    // Handle validation errors specifically
    if (err.isJoi) {
      return res.status(400).json({ success: false, message: err.details[0].message });
    }
    return res.status(500).json({ success: false, message: "Internal Server Error." });
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
      const { latitude, longitude, radiusInKm } = req.query;

      if (!latitude || !longitude || !radiusInKm) {
        return res.status(400).json({
          success: false,
          message: "Latitude, longitude, and radius are required."
        });
      }
  
      // Use geospatial query for nearby clinics
      const clinics = await Clinic.aggregate([
        {
          $geoNear: {
            near: {
              type: "Point",
              coordinates: [parseFloat(longitude), parseFloat(latitude)]
            },
            distanceField: "distance",
            maxDistance: radiusInKm * 1000,
            spherical: true,
          },
        },
        {
          $lookup: {
            from: "doctors",  // Ensure this matches the correct collection name
            localField: "doctorId", // Ensure `doctorId` is an ObjectId in the Clinic schema
            foreignField: "_id",  // Match by ObjectId in the doctors collection
            as: "doctorDetails",
          },
        },
        {
          $lookup: {
            from: "ratings",
            localField: "_id",
            foreignField: "doctorId",
            as: "ratingDetails",
          },
        },
        {
          $addFields: {
            averageRating: {
              $avg: "$ratingDetails.rating",
            },
            ratingCount: {
              $size: "$ratingDetails",
            },
          },
        },
        {
          $project: {
            name: 1,
            address: 1,
            specialization: 1,
            distance: 1,
            doctorDetails: { name: 1, consultationFee: 1 },
            location: { $first: "$location" },
            address: { $first: "$address" },
            city: { $first: "$city" },
            pincode: { $first: "$pincode" },
            state: { $first: "$state" },
            country: { $first: "$country" },
            rooms: { $first: "$rooms" },
            images: { $first: "$images" },
            thumbnail: { $first: "$thumbnail" },
          },
        },
      ]);
  
      return res.status(200).json({
        success: true,
        data: clinics
      });
  
    } catch (err) {
      console.log(err);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error."
      });
    }
  };
    module.exports = {
       createClinic,
    getNearbyClinics,
    getClinicById
    
   };
  