const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  name: {
     type: String,
     },
  email: {
     type: String,
     },
  phone: {
     type: String,
   
     },
    password:{
      type: String, 
     unique: true
     },
     fees:{
      type: String, 

     },
    availability: [
      {
        day: { type: String, required: true },
        timeSlots: [{ type: String, required: true }],
        _id: false,
        appointmentType: { type: String, enum: ["online", "offline", "both"], default: "both" },

      },
    ],
    address: {
      state: { type: String },
      localGovernment: { type: String },
      detailedAddress: { type: String},
      houseNumber: { type: String},
      landmark: { type: String }, 
      pincode: { type: String},
      city: { type: String},
      country: { type: String},
    },
    proofOfAddress: {
      type: String, 
      required: false,
    },
  
  specialization: {
     type: String
    },
  licenseNumber: {
     type: String,  
     unique: true 
    },
  gender: { 
    type: String ,
    enum: ['Male', 'Female', 'Other']
    },
  qualification: { 
    type: String 
    },
  isKycVerified: {
    type: Boolean,
    default: false,
  },
  isMembership:{
      type:Boolean,
      default:false,
  },
  latitude: {
    type: String,
  },
  longitude: {
    type: String,
  },
  clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic' },

  experience: { 
    type: Number,
     default: 0
  },
  profileImage: { 
    type: String 
 },

consultationFee: { 
  type: Number 
},
resetToken: {
  type: String 
 }, 
resetTokenExpiry: { 
 type: Date 
},
isAvailable: {
     type: Boolean, 
     default: true 
},
  createdAt: {
     type: Date, 
     default: Date.now 
    },
  updatedAt: {
     type: Date,
     default: Date.now
     }
});

doctorSchema.methods.generateToken = function () {
  return jwt.sign(
    {
      _id: this.id,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};



const Doctor = mongoose.model('Doctor', doctorSchema);
module.exports = Doctor;
