const Joi = require("joi");

const giveRatingSV = Joi.object({
  businessProfileDocId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.pattern.base": "Invalid Business Profile ID.",
      "any.required": "Business Profile ID is required.",
    }),
  userDocId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.pattern.base": "Invalid User ID.",
      "any.required": "User ID is required.",
    }),
  feedback: Joi.string().optional(),
  images: Joi.array().items(Joi.string().uri()).optional(),
  rating: Joi.number().min(1).max(5).required().messages({
    "number.min": "Rating must be at least 1.",
    "number.max": "Rating can be at most 5.",
    "any.required": "Rating is required.",
  }),
});

module.exports = { giveRatingSV };
