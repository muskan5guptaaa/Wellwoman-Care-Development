
const Joi = require('joi');


const nearbyClinicsSV=Joi.object({
    name:Joi.string().required(),
    location: Joi.object({
        type: Joi.string().valid("Point").required(),
        coordinates: Joi.array()
          .items(Joi.number().required())
          .length(2)
          .required(),
          
      }).required(),
      address: Joi.string().required(),
      city: Joi.string().required(),
      pincode: Joi.string().required(),
      state: Joi.string().required(),
      country: Joi.string().required(),
      images: Joi.array().items(Joi.string().uri()).optional(),
      doctorId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(), // Ensure doctorId is a valid ObjectId



})
module.exports={nearbyClinicsSV}