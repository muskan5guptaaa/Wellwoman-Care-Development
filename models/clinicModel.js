const { required } = require("joi");
const mongoose = require("mongoose");
const { Schema } = mongoose;

const clinicSchema = new Schema({
    name: {
       type: String,
        required: true },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Doctor",
        required:true,
      },
    address: { 
      type: String, 
      required: true 
    },
    city:{
      type:String,
      required:true
    },
    pincode: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    images:[String],
     specialization: {
       type: String, 
     },
       location: {
        type: { type: String, enum: ["Point"], required: true },
        coordinates: { type: [Number], required: true },
      },
    
    });
    
    clinicSchema.index({ location: '2dsphere' }); //
    


const Clinic = mongoose.model("Clinic", clinicSchema);

module.exports = Clinic;
