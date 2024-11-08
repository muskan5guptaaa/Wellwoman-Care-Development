const Joi = require("joi");

exports.kycSchemaSV = Joi.object({
  nameOnDocument: Joi.string().required(),
  documentType: Joi.string().required(),
  documentNumber: Joi.string().required(),
  frontImage: Joi.string().uri().required(),
  backImage: Joi.string().uri().required(),
});

exports.verifyKycSchemaSV = Joi.object({
  kycDocId: Joi.string().required(),
  isVerified: Joi.boolean().required(),
    then: Joi.required(),
    otherwise: Joi.optional().allow(null),
  })

