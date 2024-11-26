const Joi = require("joi");
const Rating = require("../models/Rating");  // Assuming you have a Rating model defined
const { createRatingSV } = require("../validationSchemas/ratingValidation");  // Import your Joi schema


const giveRating = async (req, res) => {
    const {
      doctorId,
      userDocId,
      customerName,
      customerProfiles,
      feedback,
      images,
      rating,
    } = req.body;
  
    try {
      // Check if the doctor exists
      const doctor = await Doctor.findById(doctorId);
      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: "Doctor not found",
        });
      }
  
      // Check if the user exists
      const user = await User.findById(userDocId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }
  
      // Create the new rating
      const newRating = new Rating({
        doctorId,
        userDocId,
        customerName,
        customerProfiles,
        feedback,
        images,
        rating,
        createdAt: new Date(),
      });
  
      // Save the rating to the database
      await newRating.save();
  
      res.status(201).json({
        success: true,
        message: "Rating submitted successfully",
        data: newRating,
      });
    } catch (error) {
      console.error("Error while submitting rating:", error);
      res.status(500).json({
        success: false,
        message: "Error while submitting rating",
        error: error.message,
      });
    }
  };
  
  


module.exports = {
  giveRating,
};
