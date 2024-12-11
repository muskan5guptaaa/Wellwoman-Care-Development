const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema(
   {
   name: {
      type: String,
      required: true
   },
   email: {
      type: String,
      required: true,
      unique: true
   },
   password: {
      type: String,
      required: true
   },
   phone: {
      type: String
      },
   dateOfBirth: Date,
   gender: {
      type: String,
      enum: ['Male', 'Female', 'Other']
   },
   address: {
      type: String,
      required: false,
    },
    city: {
      type: String,
      required: false
    },
    pincode: {
      type: String,
      required: false,
    },
    state: {
      type: String,
      required: false,
    },
    country: {
      type: String,
      required: false,
    },
   diseses:{
      type:String
   },
   height:{
      type:Number
   },
   weight:{
      type:Number
   },
   medicalHistory: String,
   resetToken: {
       type: String 
      }, 
   resetTokenExpiry: { 
      type: Date 
   },  
   healthData: {
      bloodPressure: {
          type: String,
      },
      heartRate: {
          type: Number,
      },
      bodyTemperature: {
          type: Number,
      },
      bloodGlucose: {
          type: Number,
      },
      testReports: [
          {
              type: String, 
          }
      ],
      prescriptions: [
          {
              type: String, 
          } 
      ],
  },
  savedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],

  createdAt: {
      type: Date,
      default: Date.now,
  },
  updatedAt: {
    type: Date, 
    default: Date.now 
   } 
},{timestamps:true});

userSchema.methods.generateToken = function () {
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



const User = mongoose.model('User', userSchema);

module.exports = User;
