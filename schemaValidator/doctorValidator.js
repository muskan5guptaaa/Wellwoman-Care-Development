const Joi = require('joi');


const forgetPasswordDoctorSV= Joi.object({
  email: Joi.string().email().required(),
});

module.exports = { forgetPasswordDoctorSV}
