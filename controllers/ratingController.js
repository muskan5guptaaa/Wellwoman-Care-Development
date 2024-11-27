const Joi = require("joi");
const Rating = require("../models/ratingModel");  // Assuming you have a Rating model defined
const User = require('../models/userModel');
const mongoose = require("mongoose");
const Doctor = require('../models/doctorsModel');

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
  
  const getRatings=async(req,res)=>{
    try{
           const {doctorId}=req.query;
           if(!doctorId){
            return res.status(400)
            .json({message:"Doctor ID is required."})
           }

    // Find ratings by doctorId
    const ratings = await Rating.find({
  doctorId: doctorId,
      })
        .populate("userDocId", "name email") // Optionally populate user details
        .exec();
  
      return res.status(200).json({
        success: true,
        data: ratings,
      });
    } catch (error) {
      console.error("Error fetching ratings:", error);
      res.status(500).json({
        success: false,
        message: "Server error. Please try again later.",
      });
    }
  };
  

  const updateRating = async (req, res) => {
    try {
      const { ratingId } = req.params;
      const updates = req.body;
  
      // Validate required fields
      if (!mongoose.Types.ObjectId.isValid(ratingId)) {
        return res.status(400).json({ message: "Invalid Rating ID." });
      }
  
      // Find and update rating
      const updatedRating = await Rating.findByIdAndUpdate(
        ratingId,
        { $set: updates },
        { new: true, runValidators: true }
      );
  
      if (!updatedRating) {
        return res.status(404).json({ message: "Rating not found." });
      }
  
      return res.status(200).json({
        success: true,
        data: updatedRating,
      });
    } catch (error) {
      console.error("Error updating rating:", error);
      res.status(500).json({
        success: false,
        message: "Server error. Please try again later.",
      });
    }
  };

  const deleteRating=async(req,res)=>{
    try{
    const{ratingId}=req.params;

if(!mongoose.Types.ObjectId.isValid(ratingId)){
    return res.status(400).json({message:"Invalid Rating Id"})
}

const deleteRating=await Rating.findById(ratingId);
if(!deleteRating){
    return res.status(404).json({message:"Rating Not Found"})
}
return res.status(200).json({
success:true,
message:"Rating deleted successfully"
    })
    }catch(error){
        console.error("Error deleting rating:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
    }
  

module.exports = {
  giveRating,
  getRatings,
  updateRating,
  deleteRating
};
