const Joi = require("joi");

exports.kycSchemaSV = Joi.object({
  fullName: Joi.string().required(),
  documentType: Joi.string().required(),
  documentNumber: Joi.string().required(),
  frontImage: Joi.string().uri().required(),
  backImage: Joi.string().uri().required(),
});

