const Joi = require("joi");

exports.kycSchemaSV = Joi.object({
  doctorId: Joi.string().required(), // Assuming this is passed
  fullName: Joi.string().required(),
  documentType: Joi.string().required(),
  documentNumber: Joi.string().required(),
  licenseNumber: Joi.string().required(),  // Added this field
  licenseExpiryDate: Joi.date().required(), // Added this field
  frontImage: Joi.string().uri().required(),
  backImage: Joi.string().uri().required(),
});