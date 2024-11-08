const mongoose = require('mongoose');

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
      type: String,
      required: true
   },
   dateOfBirth: Date,
   gender: {
      type: String,
      enum: ['Male', 'Female', 'Other']
   },
   address: {
      street: String,
      city: String,
      state: String,
      postalCode: String
   },
   Diseses:{
      type:String
   },
   height:{
      type:Number
   },
   weight:{
      type:Number
   },
   medicalHistory: String,
   createdAt: {
      type: Date,
      default: Date.now
   },
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
              type: String, // URLs or file paths for test reports
          }
      ],
      prescriptions: [
          {
              type: String, // URLs or file paths for prescriptions
          }
      ],
  },
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
