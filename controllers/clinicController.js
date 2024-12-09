const mongoose=require("mongoose");
const Clinic=require("../models/clinicModel")
const Doctor=require("../models/doctorsModel")
const Rating = require("../models/ratingModel");
const {nearbyClinicsSV} = require('../schemaValidator/clinicValidator');
const User = require("../models/userModel");


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

  const deleteClinic = async (req, res) => {
    const { id } = req.params;
    try {
      const clinic = await Clinic.findByIdAndDelete(id);
      if (!clinic) {
        return res.status(404).json({ success: false, message: "Clinic not found." });
      }
      return res.status(200).json({
        success: true,
        message: "Clinic deleted successfully.",
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error.",
      });
    }
  };
  const getAllClinics = async (req, res) => {
    try {
      const {
        name,
        city,
        doctorName,
        startDate,
        endDate,
        page = 1,
        limit = 10,
        sortBy = "name",
        sortOrder = 1,
      } = req.query;
  
      const filter = {};


      // Apply filters
      if (name) {
        filter.name = { $regex: name, $options: "i" }; // Case-insensitive search
      }
      if (city) {
        filter.city = { $regex: city, $options: "i" };
      }
      if (startDate && endDate) {
        filter.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }
  
      // Lookup for doctor name if provided
      if (doctorName) {
        const doctors = await Doctor.find(
          { name: { $regex: name, $options: "i" } },
          "_id"
        );
        const doctorIds = doctors.map((doc) => doc._id);
        filter.doctorId = { $in: doctorIds};
      }
  
      // Aggregate query for clinics
      const clinics = await Clinic.aggregate([
        {
          $match: filter,
        },
        {
          $lookup: {
            from: "doctors",
            localField: "doctorId",
            foreignField: "_id",
            as: "doctor",
          },
        },
        {
          $unwind: {
            path: "$doctor",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            name: 1,
            city: 1,
            state: 1,
            country: 1,
            address: 1,
            pincode: 1,
            createdAt: 1,
            doctorName: "$doctor.name",
            specialization: "$doctor.specialization",
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
  
      const result = clinics[0] || {};
      const totalItems =
        result.totalCount.length > 0 ? result.totalCount[0].total : 0;
      const totalPages = totalItems > 0 ? Math.ceil(totalItems / limit) : 1;
  
      // Send response
      return res.status(200).json({
        success: true,
        data: result.data,
        page: parseInt(page),
        pages: totalPages,
        pageSize: parseInt(limit),
        total: totalItems,
      });
    } catch (error) {
      console.error("Error in fetching all clinics", error);
      return res.status(500).json({
        success: false,
        message: error?.message || "Internal Server Error",
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
const addClinicRating = async (req, res) => {
  try {
    const { clinicId, rating, comment } = req.body;

    // Validate input
    if (!clinicId || !rating) {
      return res.status(400).json({
        success: false,
        message: "Clinic ID and rating are required.",
      });
    }
    // Fetch the clinic
    const clinic = await Clinic.findById(clinicId);
    if (!clinic) {
      return res.status(404).json({
        success: false,
        message: "Clinic not found.",
      });
    }
    // Create a new rating
    const newRating = await Rating.create({
      clinicId: clinic._id, 
      userId: req.user ? req.user._id : null, 
      rating,
      comment,
    });

    return res.status(201).json({
      success: true,
      message: "Rating added successfully.",
      data: newRating,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};

const getClinicRatings = async (req, res) => {
  try {
    const { clinicId } = req.params;

    // Validate the clinic exists
    const clinicExists = await Clinic.findById(clinicId);
    if (!clinicExists) {
      return res.status(404).json({
        success: false,
        message: "Clinic not found.",
      });
    }

    // Fetch ratings for the clinic
    const ratings = await Rating.find({ clinicId })
      .populate("userId", "name email") 
      .sort({ createdAt: -1 }); 

    return res.status(200).json({
      success: true,
      message: "Ratings retrieved successfully.",
      data: ratings,
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
    getClinicById,   
    addClinicRating ,
    getClinicRatings,
    getAllClinics,
    deleteClinic
   };
  