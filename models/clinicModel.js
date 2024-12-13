const { required } = require("joi");
const mongoose = require("mongoose");
const { Schema } = mongoose;

const clinicSchema = new Schema({
    name: {
       type: String,
     },
     doctors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' }],
     createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' }, // Reference to the doctor who created the clinic


      licenseNumber: { 
        type: String,
         },
  expiryDate: {
    type: Date, 
   },
  issuingAuthority: {
    type: String,
    enum: [
      'Medical Council of India',
      'State Medical Council',
      'National Medical Commission',
      'World Medical Association',
      'Other',
    ],
  },

    address: { 
      type: String, 
    },
    city:{
      type:String,
    },
    pincode: {
      type: String,
    },
    state: {
      type: String,
    },
    country: {
      type: String,
    },
    images:[String],
     specialization: {
       type: String, 
     },
       location: {
        type: { type: String, enum: ["Point"], },
        coordinates: { type: [Number],  },
      },
    
    });
    
    clinicSchema.index({ location: '2dsphere' }); //
    


const Clinic = mongoose.model("Clinic", clinicSchema);

module.exports = Clinic;
