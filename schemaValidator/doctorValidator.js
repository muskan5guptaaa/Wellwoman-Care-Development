const Joi = require('joi');


const forgetPasswordDoctorSV= Joi.object({
  email: Joi.string().email().required(),
});

const sendOtpSV = Joi.object({
  otpType: Joi.string()
    .valid("forLogin")
    .required(),
  phone: Joi.string(),
  email: Joi.string().email(),
}).xor("phone", "email");


module.exports = { forgetPasswordDoctorSV,sendOtpSV}
