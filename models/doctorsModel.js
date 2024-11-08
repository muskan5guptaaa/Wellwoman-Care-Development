const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  name: {
     type: String,
     required: true
     },
  email: {
     type: String,
      required: true, 
      unique: true
     },
  phone: {
     type: String,
      required: true
    },
    password:{
      type: String, 
      required: true,
     unique: true
    },
  specialization: {
     type: String
    },
  licenseNumber: {
     type: String, 
     required: true, 
     unique: true 
    },
  gender: { 
    type: String 
},
  qualification: { 
    type: String 
},
isKycVerified: {
    type: Boolean,
    default: false,
  },
  experience: { 
    type: Number,
     default: 0
     },
 
  profileImage: { 
    type: String 
},
  address: {
     type: String
     },
  city: {
  type: String
     },
  state: {
   type: String
    },
  country: { 
  type: String
 },
  pincode: { 
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
  ratings: [{ 
    rating: Number, 
    review: String,
    UserId: { type: mongoose.Schema.Types.ObjectId, 
     ref: 'User' } }],
     user: [{ 
    type: mongoose.Schema.Types.ObjectId,
     ref: 'User' }],
  createdAt: {
     type: Date, 
     default: Date.now 
    },
  updatedAt: {
     type: Date,
     default: Date.now
     }
});

doctorSchema.methods.generateToken = function() {
  return jwt.sign(
      { id: this._id, role: this.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
  );
};


const Doctor = mongoose.model('Doctor', doctorSchema);
module.exports = Doctor;
