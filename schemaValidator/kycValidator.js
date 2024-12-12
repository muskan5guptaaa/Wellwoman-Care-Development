const Joi = require("joi");

exports.kycSchemaSV = Joi.object({
  doctorId: Joi.string().required(), // Assuming this is passed
  fullName: Joi.string().required(),
  documentType: Joi.string().required(),
  frontImage: Joi.string().uri().required(),
  backImage: Joi.string().uri().required(),
});