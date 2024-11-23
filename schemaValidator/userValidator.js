const Joi = require('joi');

const signUpUserSV = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    phone: Joi.string().required()
});

const sendOtpSV = Joi.object({
  otpType: Joi.string()
    .valid("forLogin")
    .required(),
  phone: Joi.string(),
  email: Joi.string().email(),
}).xor("phone", "email");

exports.forgetPasswordSV = Joi.object({
  email: Joi.string().email().required(),
});

const  updateProfileSV = Joi.object({
    name: Joi.string().optional(),
    avatar: Joi.string().uri().optional(),
    gender: Joi.string().valid("male", "female", "other").optional(),
    address: Joi.string().optional(),
    city: Joi.string().optional(),
    pincode: Joi.string()
      .pattern(/^[0-9]{5,10}$/)
      .optional(),
    state: Joi.string().optional(),
    country: Joi.string().optional(),
  });

  const forgetPasswordSV = Joi.object({
    email: Joi.string().email().required(),
  });
  
  
module.exports = { signUpUserSV,updateProfileSV,forgetPasswordSV,sendOtpSV};
