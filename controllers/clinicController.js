const mongoose=require("mongoose");
const Clinic=require("../models/clinicModel")
const Doctor=require("../models/doctorsModel")
// Create a hospital/clinic
const createClinic = async (req, res) => {
  try {
      const { clinicName, clinicAddress, specialization, doctorId, rating } = req.body;
      // Validate the required fields
      if (!clinicName || !clinicAddress || !specialization || !doctorId) {
          return res.status(400).json({ success: false, message: "All fields are required." });
      }
      // Check if the doctor exists
      const doctorExists = await Doctor.findById(doctorId);
      if (!doctorExists) {
          return res.status(404).json({ success: false, message: "Doctor not found." });
      }
      // Create the clinic
      const newClinic = await Clinic.create({
          name: clinicName,
          address: clinicAddress,
          specialization,
          doctorId,
          rating: rating || 0, // Default rating is 0 if not provided
      });
      return res.status(201).json({
          success: true,
          message: "Clinic created successfully.",
          data: newClinic,
      });
  } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

const getNearbyClinics = async (req, res) => {
  try {
      const { latitude, longitude, radiusInKm } = req.query;
      if (!latitude || !longitude || !radiusInKm) {
          return res.status(400).json({ success: false, message: "Latitude, longitude, and radius are required." });
      }

      // Use geospatial query for nearby clinics
      const clinics = await Clinic.aggregate([
          {
              $geoNear: {
                  near: { type: "Point", coordinates: [parseFloat(longitude), parseFloat(latitude)] },
                  distanceField: "distance",
                  maxDistance: radiusInKm * 1000,
                  spherical: true,
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
            $lookup: {
              from: "ratings",
              localField: "_id",
              foreignField: "businessProfileDocId",
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

      return res.status(200).json({ success: true, data: clinics });
  } catch (err) {
      console.log(err);
      return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

  
  module.exports = { createClinic,
    getNearbyClinics
    
   };
  