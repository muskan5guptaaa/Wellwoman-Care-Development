const Joi = require('joi');

const signUpUserSV = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
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

const updateProfileSV = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  phone: Joi.string().length(10).pattern(/^[0-9]+$/).required(),
  dateOfBirth: Joi.date().iso().required(),
});

  const forgetPasswordSV = Joi.object({
    email: Joi.string().email().required(),
  });
  
  
module.exports = { signUpUserSV,updateProfileSV,forgetPasswordSV,sendOtpSV};
