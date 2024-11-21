const Joi = require("joi");

exports.bankDetailsSV = Joi.object({
  doctorId: Joi.string().required(),
  bankName: Joi.string().required(),
  accountHolderName: Joi.string().required(),
  accountNumber: Joi.string().required(),
  IFSCcode: Joi.string().required(),
  primary: Joi.boolean().required(),
});

exports.updateBankDetailsSV = Joi.object({
  doctorId: Joi.string().optional(),
  bankName: Joi.string().optional(),
  accountHolderName: Joi.string().optional(),
  accountNumber: Joi.string().optional(),
  IFSCcode: Joi.string().optional(),
  primary: Joi.boolean().optional(),
});
