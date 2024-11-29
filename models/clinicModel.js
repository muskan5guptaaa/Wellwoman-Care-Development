const mongoose = require("mongoose");
const { Schema } = mongoose;

// Clinic Schema
const clinicSchema = new Schema({
    name: { type: String, required: true },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Doctor",
      },
    address: { type: String, required: true },
    specialization: { type: String, required: true },
    location: {
        type: { type: String, default: 'Point' }, // 'Point' type for GeoJSON
        coordinates: [Number], // [longitude, latitude]
      },
      // Other fields as necessary
    });
    
    clinicSchema.index({ location: '2dsphere' }); //
    

// Ensure the location field is indexed for geospatial queries
clinicSchema.index({ location: "2dsphere" });

const Clinic = mongoose.model("Clinic", clinicSchema);

module.exports = Clinic;
